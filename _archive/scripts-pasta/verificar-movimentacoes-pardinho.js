const { query, pool } = require('../lib/database')
require('dotenv').config()

async function verificarMovimentacoesPardinho() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando movimentações de Pardinho...\n')
    
    // Buscar todas as movimentações de entrada com localidade Pardinho
    const result = await client.query(`
      SELECT 
        mc.id,
        mc.data_movimento,
        mc.tipo,
        mc.subtipo,
        mc.localidade,
        mc.descricao,
        mc.dados_extras,
        a.id as animal_id,
        a.sexo,
        a.meses,
        a.serie,
        a.rg
      FROM movimentacoes_contabeis mc
      LEFT JOIN animais a ON mc.animal_id = a.id
      WHERE mc.tipo = 'entrada'
        AND COALESCE(mc.localidade, '') ILIKE '%pardinho%'
      ORDER BY mc.data_movimento DESC
      LIMIT 100
    `)
    
    console.log(`📊 Total de movimentações encontradas: ${result.rows.length}\n`)
    
    // Contar por sexo e idade
    const femeas36Mais = result.rows.filter(r => {
      const sexo = (r.sexo || '').toLowerCase()
      const meses = r.meses || 0
      let era = ''
      try {
        if (r.dados_extras) {
          const extras = typeof r.dados_extras === 'string' ? JSON.parse(r.dados_extras) : r.dados_extras
          era = (extras.era || '').toString()
        }
      } catch (e) {}
      return (sexo.includes('f') || sexo.includes('fêmea')) && 
             (meses >= 36 || era.includes('36') || era.includes('+36'))
    })
    
    console.log(`👩 Fêmeas +36 meses encontradas: ${femeas36Mais.length}`)
    if (femeas36Mais.length > 0) {
      console.log('\nDetalhes das fêmeas +36 meses:')
      femeas36Mais.slice(0, 20).forEach((r, i) => {
        console.log(`  ${i+1}. ${r.serie || ''}${r.rg || ''} - ${r.sexo} - ${r.meses || r.era} meses - ${r.data_movimento}`)
      })
    }
    
    // Contar total de animais
    const totalAnimais = result.rows.length
    console.log(`\n📈 Total de animais em movimentações: ${totalAnimais}`)
    
    // Verificar últimas 5 movimentações
    console.log('\n📋 Últimas 5 movimentações:')
    result.rows.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i+1}. ${r.data_movimento} - ${r.descricao} - Localidade: ${r.localidade}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    client.release()
  }
}

verificarMovimentacoesPardinho()
  .then(() => {
    console.log('\n✅ Verificação concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
