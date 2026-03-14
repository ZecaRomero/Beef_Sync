const { query } = require('../lib/database')
require('dotenv').config()

async function listarTodasDoadorasFIV() {
  try {
    console.log('🔍 Listando todas as doadoras com coletas FIV...\n')
    
    // Buscar todas as coletas FIV agrupadas por doadora
    const coletas = await query(`
      SELECT 
        cf.id,
        cf.doadora_nome,
        cf.doadora_id,
        cf.data_fiv,
        cf.data_transferencia,
        cf.quantidade_oocitos,
        a.serie,
        a.rg,
        a.nome as animal_nome
      FROM coleta_fiv cf
      LEFT JOIN animais a ON cf.doadora_id = a.id
      ORDER BY 
        COALESCE(cf.doadora_nome, a.serie || ' ' || a.rg, a.nome) ASC,
        cf.data_fiv ASC
    `)
    
    console.log(`📊 Total de coletas FIV: ${coletas.rows.length}\n`)
    
    // Agrupar por doadora
    const coletasPorDoadora = {}
    coletas.rows.forEach(coleta => {
      const key = coleta.doadora_nome || 
                  (coleta.serie && coleta.rg ? `${coleta.serie} ${coleta.rg}` : null) ||
                  coleta.animal_nome ||
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
    
    console.log(`📋 Total de doadoras únicas: ${Object.keys(coletasPorDoadora).length}\n`)
    console.log('─'.repeat(120))
    console.log('📊 RESUMO POR DOADORA:\n')
    
    // Listar cada doadora com suas coletas
    Object.keys(coletasPorDoadora).sort().forEach((key, index) => {
      const doadora = coletasPorDoadora[key]
      console.log(`\n${index + 1}. ${doadora.nome}${doadora.serie && doadora.rg ? ` (${doadora.serie} ${doadora.rg})` : ''}`)
      console.log(`   Total de coletas: ${doadora.coletas.length}`)
      
      doadora.coletas.forEach((coleta, idx) => {
        const dataFIV = new Date(coleta.data_fiv)
        const dataTransf = coleta.data_transferencia ? new Date(coleta.data_transferencia) : null
        const ano = dataFIV.getFullYear()
        const mes = dataFIV.getMonth() + 1
        const dia = dataFIV.getDate()
        
        // Marcar datas suspeitas
        let suspeita = ''
        if (ano < 2020 || ano > 2030) {
          suspeita = ' ⚠️ DATA SUSPEITA'
        } else if (ano === 2027 || ano === 2028 || ano === 2029) {
          suspeita = ' ⚠️ DATA FUTURA'
        }
        
        console.log(`   ${idx + 1}. ID ${coleta.id} | Data FIV: ${dataFIV.toLocaleDateString('pt-BR')} (${ano}/${String(mes).padStart(2, '0')}/${String(dia).padStart(2, '0')})${suspeita} | Oócitos: ${coleta.quantidade_oocitos || 0}`)
        if (dataTransf) {
          console.log(`      Data Transf: ${dataTransf.toLocaleDateString('pt-BR')}`)
        }
      })
    })
    
    console.log('\n' + '─'.repeat(120))
    
    // Estatísticas
    const doadorasComDatasSuspeitas = Object.keys(coletasPorDoadora).filter(key => {
      return coletasPorDoadora[key].coletas.some(coleta => {
        const ano = new Date(coleta.data_fiv).getFullYear()
        return ano < 2020 || ano > 2030
      })
    })
    
    if (doadorasComDatasSuspeitas.length > 0) {
      console.log(`\n⚠️  ${doadorasComDatasSuspeitas.length} doadoras com datas suspeitas (fora do intervalo 2020-2030):`)
      doadorasComDatasSuspeitas.forEach(key => {
        console.log(`   - ${key}`)
      })
    } else {
      console.log('\n✅ Nenhuma doadora com datas fora do intervalo razoável (2020-2030)')
    }
    
    // Doadoras com mais coletas
    const doadorasMaisColetas = Object.keys(coletasPorDoadora)
      .map(key => ({
        nome: coletasPorDoadora[key].nome,
        total: coletasPorDoadora[key].coletas.length
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
    
    console.log('\n📊 Top 10 doadoras com mais coletas:')
    doadorasMaisColetas.forEach((doadora, index) => {
      console.log(`   ${index + 1}. ${doadora.nome}: ${doadora.total} coletas`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao listar doadoras:', error)
    throw error
  }
}

// Executar
listarTodasDoadorasFIV()
  .then(() => {
    console.log('\n✅ Listagem concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
