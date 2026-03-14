const { query } = require('../lib/database')
require('dotenv').config()

async function verificarCJCJ16546() {
  try {
    console.log('�Ÿ”� Verificando coletas FIV para CJCJ 16546...\n')
    
    const coletas = await query(`
      SELECT 
        cf.id,
        cf.doadora_nome,
        cf.data_fiv,
        cf.data_transferencia,
        cf.quantidade_oocitos,
        cf.touro,
        cf.laboratorio,
        cf.veterinario,
        cf.created_at
      FROM coleta_fiv cf
      WHERE cf.doadora_nome ILIKE '%CJCJ%16546%'
         OR cf.doadora_id IN (
           SELECT id FROM animais WHERE serie = 'CJCJ' AND rg = '16546'
         )
      ORDER BY cf.data_fiv ASC
    `)
    
    console.log(`�Ÿ“Š Total de coletas encontradas: ${coletas.rows.length}\n`)
    
    if (coletas.rows.length === 0) {
      console.log('�Œ Nenhuma coleta encontrada para CJCJ 16546')
      return
    }
    
    console.log('�Ÿ“‹ Coletas atuais no banco:')
    coletas.rows.forEach((coleta, index) => {
      const dataFIV = new Date(coleta.data_fiv)
      const dataTransf = coleta.data_transferencia ? new Date(coleta.data_transferencia) : null
      console.log(`${index + 1}. ID: ${coleta.id} | Data FIV: ${dataFIV.toLocaleDateString('pt-BR')} | Data Transf: ${dataTransf ? dataTransf.toLocaleDateString('pt-BR') : 'N/A'} | Oócitos: ${coleta.quantidade_oocitos || 0}`)
    })
    
    console.log('\n�Ÿ“‹ Datas corretas (conforme planilha Excel):')
    const datasCorretas = [
      '18/06/2025',
      '23/07/2025',
      '25/08/2025',
      '23/09/2025',
      '22/10/2025',
      '19/11/2025',
      '11/12/2025',
      '15/01/2026'
    ]
    datasCorretas.forEach((data, index) => {
      console.log(`${index + 1}. ${data}`)
    })
    
  } catch (error) {
    console.error('�Œ Erro:', error)
    throw error
  }
}

verificarCJCJ16546()
  .then(() => {
    console.log('\n�œ… Verificação concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n�Œ Erro fatal:', error)
    process.exit(1)
  })
