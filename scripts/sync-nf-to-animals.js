const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

async function syncNFToAnimals() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Sincronizando animais das notas fiscais para a tabela de animais...')
    
    // Buscar todas as notas fiscais
    const nfsResult = await client.query(`
      SELECT numero_nf, tipo, itens, data_compra, fornecedor, valor_total 
      FROM notas_fiscais 
      WHERE tipo = 'entrada'
      ORDER BY created_at DESC
    `)
    
    console.log(`📄 Encontradas ${nfsResult.rows.length} notas fiscais de entrada`)
    
    // Buscar animais existentes
    const animaisResult = await client.query('SELECT serie, rg FROM animais')
    const animaisExistentes = new Set(animaisResult.rows.map(a => `${a.serie}-${a.rg}`))
    
    let animaisCriados = 0
    
    for (const nf of nfsResult.rows) {
      try {
        // Processar itens da NF
        let itens
        if (typeof nf.itens === 'string') {
          itens = JSON.parse(nf.itens || '[]')
        } else {
          itens = nf.itens || []
        }
        
        for (const item of itens) {
          const tatuagem = item.tatuagem
          if (!tatuagem) continue
          
          // Verificar se animal já existe
          if (animaisExistentes.has(tatuagem)) {
            console.log(`⚠️ Animal ${tatuagem} já existe`)
            continue
          }
          
          // Extrair série e RG da tatuagem
          let serie, rg
          
          if (tatuagem.includes('-')) {
            // Formato: SERIE-RG
            const partes = tatuagem.split('-')
            serie = partes[0]
            rg = partes.slice(1).join('-')
          } else if (tatuagem.includes(' ')) {
            // Formato: SERIE RG (ex: TOURO 001, BOI 002)
            const partes = tatuagem.split(' ')
            serie = partes[0]
            rg = partes.slice(1).join(' ')
          } else {
            console.log(`⚠️ Formato de tatuagem inválido: ${tatuagem}`)
            continue
          }
          
          // Calcular idade em meses baseada na era
          const meses = calcularMesesDaEra(item.era)
          
          // Criar animal
          const animalData = {
            serie: serie,
            rg: rg,
            sexo: item.sexo === 'macho' ? 'Macho' : 'Fêmea',
            raca: item.raca || 'Não informada',
            data_nascimento: nf.data_compra || new Date().toISOString().split('T')[0],
            peso: parseFloat(item.peso) || 0,
            meses: meses,
            situacao: 'Ativo',
            custo_total: parseFloat(item.valorUnitario) || 0,
            observacoes: `Animal criado automaticamente da NF ${nf.numero_nf}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          await client.query(`
            INSERT INTO animais (
              serie, rg, sexo, raca, data_nascimento, peso, meses, situacao,
              custo_total, observacoes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            animalData.serie, animalData.rg, animalData.sexo, animalData.raca,
            animalData.data_nascimento, animalData.peso, animalData.meses, animalData.situacao,
            animalData.custo_total, animalData.observacoes, animalData.created_at, animalData.updated_at
          ])
          
          animaisCriados++
          animaisExistentes.add(tatuagem) // Adicionar ao set para evitar duplicatas
          console.log(`✅ Animal criado: ${tatuagem} (${item.raca})`)
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar NF ${nf.numero_nf}:`, error.message)
      }
    }
    
    console.log(`\n🎉 Sincronização concluída! ${animaisCriados} animais criados.`)
    
    // Verificar resultado final
    const animaisFinal = await client.query('SELECT COUNT(*) as total FROM animais')
    const racasFinal = await client.query(`
      SELECT raca, COUNT(*) as total 
      FROM animais 
      GROUP BY raca 
      ORDER BY total DESC
    `)
    
    console.log('\n📊 Resultado final:')
    console.log(`🐄 Total de animais: ${animaisFinal.rows[0].total}`)
    console.log('📈 Distribuição por raça:')
    racasFinal.rows.forEach(raca => {
      console.log(`   ${raca.raca}: ${raca.total} animais`)
    })
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    throw error
  } finally {
    client.release()
  }
}

function calcularMesesDaEra(era) {
  if (!era) return 12 // Padrão
  
  // IMPORTANTE: Verificar faixas específicas ANTES de verificar valores isolados
  const eraLower = String(era).toLowerCase().trim()
  if (eraLower.includes('24/36') || eraLower.includes('24-36')) {
    return 30 // Idade média da faixa 24/36 meses
  }
  
  const eraMap = {
    '0/3': 1.5,
    '4/8': 6,
    '9/12': 10.5,
    '13/24': 18.5,
    '25/36': 30.5,
    '+36': 48
  }
  
  return eraMap[era] || 12
}

// Executar se chamado diretamente
if (require.main === module) {
  syncNFToAnimals()
    .then(() => {
      console.log('🎉 Sincronização concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro na sincronização:', error)
      process.exit(1)
    })
}

module.exports = syncNFToAnimals
