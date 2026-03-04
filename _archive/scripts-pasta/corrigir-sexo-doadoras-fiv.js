const { query, pool } = require('../lib/database')
require('dotenv').config()

async function corrigirSexoDoadorasFIV() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando animais com coletas FIV cadastrados como macho...\n')
    
    // Buscar todos os animais únicos que têm coletas FIV
    const animaisComFIV = await query(`
      SELECT DISTINCT 
        a.id,
        a.serie,
        a.rg,
        a.nome,
        a.sexo,
        COUNT(cf.id) as total_coletas
      FROM animais a
      INNER JOIN coleta_fiv cf ON (
        cf.doadora_id = a.id 
        OR (cf.doadora_id IS NULL AND cf.doadora_nome ILIKE '%' || COALESCE(a.serie, '') || '%' || COALESCE(CAST(a.rg AS TEXT), '') || '%')
        OR (cf.doadora_id IS NULL AND cf.doadora_nome ILIKE '%' || COALESCE(CAST(a.rg AS TEXT), '') || '%')
      )
      GROUP BY a.id, a.serie, a.rg, a.nome, a.sexo
      ORDER BY a.serie, a.rg
    `)
    
    console.log(`📊 Total de animais com coletas FIV encontrados: ${animaisComFIV.rows.length}\n`)
    
    // Filtrar apenas os que estão como macho
    const machosComFIV = animaisComFIV.rows.filter(animal => {
      const sexo = String(animal.sexo || '').trim().toLowerCase()
      return sexo === 'macho' || sexo === 'm' || sexo.startsWith('m')
    })
    
    console.log(`⚠️  Animais com coletas FIV cadastrados como MACHO: ${machosComFIV.length}\n`)
    
    if (machosComFIV.length === 0) {
      console.log('✅ Nenhum animal precisa ser corrigido!')
      return
    }
    
    // Mostrar lista dos animais que serão corrigidos
    console.log('📋 Animais que serão corrigidos:')
    console.log('─'.repeat(80))
    machosComFIV.forEach((animal, index) => {
      console.log(`${index + 1}. ID: ${animal.id} | ${animal.serie || 'N/A'} ${animal.rg || 'N/A'} | Nome: ${animal.nome || 'N/A'} | Sexo atual: ${animal.sexo} | Coletas: ${animal.total_coletas}`)
    })
    console.log('─'.repeat(80))
    console.log()
    
    // Perguntar confirmação (em ambiente de produção, você pode querer adicionar uma flag --yes)
    const args = process.argv.slice(2)
    const autoConfirm = args.includes('--yes') || args.includes('-y')
    
    if (!autoConfirm) {
      console.log('⚠️  Para executar a correção, execute novamente com --yes ou -y')
      console.log('   Exemplo: node scripts/corrigir-sexo-doadoras-fiv.js --yes\n')
      return
    }
    
    // Corrigir cada animal
    console.log('🔧 Iniciando correção...\n')
    let corrigidos = 0
    let erros = 0
    
    await client.query('BEGIN')
    
    try {
      for (const animal of machosComFIV) {
        try {
          const result = await query(
            `UPDATE animais 
             SET sexo = 'Fêmea', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, serie, rg, nome, sexo`,
            [animal.id]
          )
          
          if (result.rows.length > 0) {
            const atualizado = result.rows[0]
            console.log(`✅ Corrigido: ID ${atualizado.id} | ${atualizado.serie || 'N/A'} ${atualizado.rg || 'N/A'} | ${atualizado.nome || 'N/A'} → ${atualizado.sexo}`)
            corrigidos++
          } else {
            console.log(`⚠️  Animal ID ${animal.id} não encontrado para atualização`)
            erros++
          }
        } catch (error) {
          console.error(`❌ Erro ao corrigir animal ID ${animal.id}:`, error.message)
          erros++
        }
      }
      
      await client.query('COMMIT')
      console.log('\n' + '='.repeat(80))
      console.log(`✅ Correção concluída!`)
      console.log(`   Corrigidos: ${corrigidos}`)
      console.log(`   Erros: ${erros}`)
      console.log('='.repeat(80))
      
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('\n❌ Erro durante a correção. Rollback executado.')
      throw error
    }
    
    // Verificar novamente após correção
    console.log('\n🔍 Verificando novamente após correção...\n')
    const verificacao = await query(`
      SELECT DISTINCT 
        a.id,
        a.serie,
        a.rg,
        a.nome,
        a.sexo,
        COUNT(cf.id) as total_coletas
      FROM animais a
      INNER JOIN coleta_fiv cf ON (
        cf.doadora_id = a.id 
        OR (cf.doadora_id IS NULL AND cf.doadora_nome ILIKE '%' || COALESCE(a.serie, '') || '%' || COALESCE(CAST(a.rg AS TEXT), '') || '%')
        OR (cf.doadora_id IS NULL AND cf.doadora_nome ILIKE '%' || COALESCE(CAST(a.rg AS TEXT), '') || '%')
      )
      WHERE a.sexo ILIKE 'M%' OR a.sexo = 'M'
      GROUP BY a.id, a.serie, a.rg, a.nome, a.sexo
    `)
    
    if (verificacao.rows.length === 0) {
      console.log('✅ Todos os animais com coletas FIV estão agora cadastrados como FÊMEA!')
    } else {
      console.log(`⚠️  Ainda existem ${verificacao.rows.length} animais com coletas FIV cadastrados como macho:`)
      verificacao.rows.forEach(animal => {
        console.log(`   - ID: ${animal.id} | ${animal.serie || 'N/A'} ${animal.rg || 'N/A'} | ${animal.nome || 'N/A'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar correção:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar
corrigirSexoDoadorasFIV()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
