const { query, pool } = require('../lib/database')
require('dotenv').config()

async function verificarNF239Local() {
  const client = await pool.connect()
  
  try {
    console.log('≈∏‚Äùç Verificando localidade dos itens da NF 239...\n')
    
    // Buscar itens da NF 239
    const result = await client.query(`
      SELECT 
        id,
        dados_item
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = (SELECT id FROM notas_fiscais WHERE numero_nf = '239' LIMIT 1)
    `)
    
    console.log(`≈∏‚Äú≈† Total de itens encontrados: ${result.rows.length}\n`)
    
    for (const item of result.rows) {
      let dados = {}
      try {
        dados = typeof item.dados_item === 'string' ? JSON.parse(item.dados_item) : item.dados_item
      } catch (e) {
        console.log(`‚≈°†Ô∏è Erro ao parsear item ${item.id}:`, e.message)
        continue
      }
      
      console.log(`Item ID: ${item.id}`)
      console.log(`  Local: ${dados.local || 'N√∆íO DEFINIDO'}`)
      console.log(`  Sexo: ${dados.sexo || 'N/A'}`)
      console.log(`  Era: ${dados.era || 'N/A'}`)
      console.log(`  Quantidade: ${dados.quantidade || 1}`)
      console.log('')
    }
    
    // Verificar se precisa atualizar
    const itensSemLocal = result.rows.filter(row => {
      try {
        const dados = typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
        return !dados.local || !dados.local.toLowerCase().includes('pardinho')
      } catch {
        return true
      }
    })
    
    if (itensSemLocal.length > 0) {
      console.log(`‚≈°†Ô∏è ${itensSemLocal.length} itens sem localidade "Pardinho" definida`)
      console.log('≈∏‚Äô° √‚Ä∞ necess√°rio atualizar os itens para incluir local = "Pardinho"')
    } else {
      console.log('‚≈ì‚Ä¶ Todos os itens t√™m localidade "Pardinho" definida')
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error)
    throw error
  } finally {
    client.release()
  }
}

verificarNF239Local()
  .then(() => {
    console.log('\n‚≈ì‚Ä¶ Verifica√ß√£o conclu√≠da')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n‚ù≈í Erro fatal:', error)
    process.exit(1)
  })
