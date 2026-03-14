const { query } = require('../lib/database')
require('dotenv').config()

async function analisarPadraoErros() {
  try {
    console.log('�Ÿ”� Analisando padrões de erros nas datas FIV...\n')
    
    // Buscar todas as coletas FIV agrupadas por doadora
    const coletas = await query(`
      SELECT 
        cf.id,
        cf.doadora_nome,
        cf.doadora_id,
        cf.data_fiv,
        cf.data_transferencia,
        cf.quantidade_oocitos,
        cf.created_at,
        a.serie,
        a.rg
      FROM coleta_fiv cf
      LEFT JOIN animais a ON cf.doadora_id = a.id
      ORDER BY cf.doadora_nome, cf.data_fiv ASC
    `)
    
    console.log(`�Ÿ“Š Total de coletas FIV: ${coletas.rows.length}\n`)
    
    // Agrupar por doadora
    const coletasPorDoadora = {}
    coletas.rows.forEach(coleta => {
      const key = coleta.doadora_nome || 
                  (coleta.serie && coleta.rg ? `${coleta.serie} ${coleta.rg}` : null) ||
                  `ID_${coleta.doadora_id}`
      
      if (!coletasPorDoadora[key]) {
        coletasPorDoadora[key] = {
          nome: key,
          serie: coleta.serie,
          rg: coleta.rg,
          coletas: []
        }
      }
      coletasPorDoadora[key].coletas.push(coleta)
    })
    
    // Analisar padrões
    const doadorasComProblemas = []
    
    Object.keys(coletasPorDoadora).forEach(key => {
      const doadora = coletasPorDoadora[key]
      const coletas = doadora.coletas
      
      if (coletas.length < 2) return // Pular doadoras com apenas 1 coleta
      
      // Verificar se as datas estão em ordem cronológica
      const datas = coletas.map(c => new Date(c.data_fiv))
      const datasOrdenadas = [...datas].sort((a, b) => a - b)
      
      // Verificar se há datas muito espaçadas (mais de 1 ano entre coletas consecutivas)
      let temProblema = false
      const problemas = []
      
      for (let i = 1; i < datasOrdenadas.length; i++) {
        const diff = datasOrdenadas[i] - datasOrdenadas[i - 1]
        const diffDias = diff / (1000 * 60 * 60 * 24)
        
        // Se há mais de 400 dias entre coletas consecutivas, pode ser um problema
        if (diffDias > 400) {
          temProblema = true
          problemas.push(`Gap de ${Math.round(diffDias)} dias entre coletas`)
        }
      }
      
      // Verificar se há datas em 2027 (já corrigidas, mas pode haver outras)
      const temData2027 = datas.some(d => d.getFullYear() === 2027)
      
      // Verificar se há datas muito antigas (antes de 2020)
      const temDataAntiga = datas.some(d => d.getFullYear() < 2020)
      
      // Verificar se há datas muito futuras (depois de 2027)
      const temDataFutura = datas.some(d => d.getFullYear() > 2027)
      
      if (temProblema || temData2027 || temDataAntiga || temDataFutura) {
        doadorasComProblemas.push({
          doadora: doadora.nome,
          serie: doadora.serie,
          rg: doadora.rg,
          totalColetas: coletas.length,
          problemas: problemas,
          temData2027,
          temDataAntiga,
          temDataFutura,
          datas: coletas.map(c => ({
            id: c.id,
            data: new Date(c.data_fiv).toLocaleDateString('pt-BR'),
            ano: new Date(c.data_fiv).getFullYear()
          }))
        })
      }
    })
    
    console.log(`�š�️  Doadoras com possíveis problemas: ${doadorasComProblemas.length}\n`)
    
    if (doadorasComProblemas.length > 0) {
      console.log('�Ÿ“‹ Doadoras que precisam de verificação:')
      console.log('�”€'.repeat(120))
      
      doadorasComProblemas.slice(0, 20).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.doadora}${item.serie && item.rg ? ` (${item.serie} ${item.rg})` : ''}`)
        console.log(`   Total de coletas: ${item.totalColetas}`)
        if (item.temData2027) console.log(`   �š�️  Tem datas em 2027`)
        if (item.temDataAntiga) console.log(`   �š�️  Tem datas antes de 2020`)
        if (item.temDataFutura) console.log(`   �š�️  Tem datas depois de 2027`)
        if (item.problemas.length > 0) {
          console.log(`   �š�️  Problemas: ${item.problemas.join(', ')}`)
        }
        console.log(`   Datas: ${item.datas.map(d => `${d.data} (${d.ano})`).join(', ')}`)
      })
      
      if (doadorasComProblemas.length > 20) {
        console.log(`\n... e mais ${doadorasComProblemas.length - 20} doadoras`)
      }
    } else {
      console.log('�œ… Nenhuma doadora com problemas aparentes encontrada')
    }
    
    // Estatísticas gerais
    console.log('\n' + '='.repeat(120))
    console.log('�Ÿ“Š ESTATÍSTICAS GERAIS:')
    console.log(`   Total de doadoras: ${Object.keys(coletasPorDoadora).length}`)
    console.log(`   Total de coletas: ${coletas.rows.length}`)
    console.log(`   Doadoras com problemas: ${doadorasComProblemas.length}`)
    
    const coletas2027 = coletas.rows.filter(c => new Date(c.data_fiv).getFullYear() === 2027).length
    const coletasAntigas = coletas.rows.filter(c => new Date(c.data_fiv).getFullYear() < 2020).length
    const coletasFuturas = coletas.rows.filter(c => new Date(c.data_fiv).getFullYear() > 2027).length
    
    console.log(`   Coletas em 2027: ${coletas2027}`)
    console.log(`   Coletas antes de 2020: ${coletasAntigas}`)
    console.log(`   Coletas depois de 2027: ${coletasFuturas}`)
    console.log('='.repeat(120))
    
  } catch (error) {
    console.error('�Œ Erro:', error)
    throw error
  }
}

analisarPadraoErros()
  .then(() => {
    console.log('\n�œ… Análise concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n�Œ Erro fatal:', error)
    process.exit(1)
  })
