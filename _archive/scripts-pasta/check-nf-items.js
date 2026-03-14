const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

async function checkNFItems() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando itens das notas fiscais...')
    
    // Buscar todas as notas fiscais
    const nfsResult = await client.query(`
      SELECT numero_nf, tipo, itens, created_at 
      FROM notas_fiscais 
      ORDER BY created_at DESC
    `)
    
    console.log(`📄 Total de notas fiscais: ${nfsResult.rows.length}`)
    console.log('\n📋 Detalhes das notas fiscais:')
    
    nfsResult.rows.forEach((nf, index) => {
      console.log(`${index + 1}. NF: ${nf.numero_nf} (${nf.tipo})`)
      console.log(`   Criada em: ${nf.created_at}`)
      
      try {
        // Tentar parsear como JSON primeiro, depois como objeto direto
        let itens
        if (typeof nf.itens === 'string') {
          itens = JSON.parse(nf.itens || '[]')
        } else {
          itens = nf.itens || []
        }
        
        console.log(`   Itens (${itens.length}):`)
        
        itens.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. ${item.tatuagem || 'Sem tatuagem'}`)
          console.log(`        Raça: ${item.raca || 'Não informada'}`)
          console.log(`        Sexo: ${item.sexo || 'Não informado'}`)
          console.log(`        Peso: ${item.peso || 0} kg`)
          console.log(`        Valor: R$ ${item.valorUnitario || 0}`)
        })
      } catch (error) {
        console.log(`   Erro ao processar itens: ${error.message}`)
      }
      
      console.log('')
    })
    
    // Verificar se há animais nas NFs que não estão na tabela de animais
    console.log('🔍 Verificando sincronização NF → Animais...')
    
    const animaisResult = await client.query('SELECT serie, rg FROM animais')
    const animaisExistentes = new Set(animaisResult.rows.map(a => `${a.serie}-${a.rg}`))
    
    let animaisNaoSincronizados = []
    
    nfsResult.rows.forEach(nf => {
      try {
        // Tentar parsear como JSON primeiro, depois como objeto direto
        let itens
        if (typeof nf.itens === 'string') {
          itens = JSON.parse(nf.itens || '[]')
        } else {
          itens = nf.itens || []
        }
        
        itens.forEach(item => {
          const tatuagem = item.tatuagem
          if (tatuagem && !animaisExistentes.has(tatuagem)) {
            animaisNaoSincronizados.push({
              tatuagem,
              raca: item.raca,
              nf: nf.numero_nf
            })
          }
        })
      } catch (error) {
        console.log(`Erro ao processar NF ${nf.numero_nf}: ${error.message}`)
      }
    })
    
    if (animaisNaoSincronizados.length > 0) {
      console.log(`⚠️ ${animaisNaoSincronizados.length} animais nas NFs não estão na tabela de animais:`)
      animaisNaoSincronizados.forEach(animal => {
        console.log(`   - ${animal.tatuagem} (${animal.raca}) - NF: ${animal.nf}`)
      })
    } else {
      console.log('✅ Todos os animais das NFs estão sincronizados com a tabela de animais')
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkNFItems()
    .then(() => {
      console.log('🎉 Verificação concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro na verificação:', error)
      process.exit(1)
    })
}

module.exports = checkNFItems
