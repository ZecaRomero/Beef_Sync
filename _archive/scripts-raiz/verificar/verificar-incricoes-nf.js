require('dotenv').config()
const { query } = require('./lib/database')

async function verificarIncricoes() {
  try {
    console.log('�Ÿ”� Verificando incrições das Notas Fiscais...\n')
    
    // Buscar todas as NFs
    const result = await query(`
      SELECT 
        id, 
        numero_nf, 
        tipo, 
        incricao, 
        fornecedor,
        destino,
        data_compra,
        data
      FROM notas_fiscais
      ORDER BY data_compra DESC, data DESC
      LIMIT 50
    `)
    
    console.log(`�Ÿ“‹ Total de NFs encontradas: ${result.rows.length}\n`)
    
    const semIncricao = []
    const incricaoInvalida = []
    const incricaoValida = []
    
    result.rows.forEach(nf => {
      const incricao = nf.incricao || ''
      const incricaoUpper = incricao.toUpperCase()
      const valida = incricaoUpper === 'SANT ANNA' || incricaoUpper === 'PARDINHO'
      
      if (!incricao) {
        semIncricao.push(nf)
      } else if (!valida) {
        incricaoInvalida.push(nf)
      } else {
        incricaoValida.push(nf)
      }
    })
    
    console.log('�Ÿ“Š Resumo:')
    console.log(`  �œ… Com incrição válida: ${incricaoValida.length}`)
    console.log(`  �š�️  Sem incrição: ${semIncricao.length}`)
    console.log(`  �Œ Com incrição inválida: ${incricaoInvalida.length}\n`)
    
    if (semIncricao.length > 0) {
      console.log('�š�️  NFs SEM INCRI�‡�ƒO:')
      semIncricao.slice(0, 10).forEach(nf => {
        console.log(`  - NF ${nf.numero_nf} (${nf.tipo}) - ${nf.fornecedor || nf.destino || 'Sem fornecedor/destino'}`)
      })
      if (semIncricao.length > 10) {
        console.log(`  ... e mais ${semIncricao.length - 10} NFs\n`)
      } else {
        console.log('')
      }
    }
    
    if (incricaoInvalida.length > 0) {
      console.log('�Œ NFs COM INCRI�‡�ƒO INVÁLIDA:')
      incricaoInvalida.slice(0, 10).forEach(nf => {
        console.log(`  - NF ${nf.numero_nf} (${nf.tipo}) - Incrição: "${nf.incricao}"`)
      })
      if (incricaoInvalida.length > 10) {
        console.log(`  ... e mais ${incricaoInvalida.length - 10} NFs\n`)
      } else {
        console.log('')
      }
    }
    
    console.log('\n�Ÿ’� Sugestão:')
    console.log('Execute o script "corrigir-incricoes-nf.js" para corrigir automaticamente as incrições')
    
  } catch (error) {
    console.error('�Œ Erro:', error)
  } finally {
    process.exit(0)
  }
}

verificarIncricoes()
