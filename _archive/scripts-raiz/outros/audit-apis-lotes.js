// Auditoria completa das APIs para integra√ß√£o com hist√≥rico de lotes
const fs = require('fs')
const path = require('path')

async function auditAPIs() {
  console.log('≈∏‚Äùç AUDITORIA COMPLETA - APIs vs Hist√≥rico de Lan√ßamentos\n')

  const apisPath = 'pages/api'
  
  // APIs que j√° est√£o integradas (com withLoteTracking)
  const apisIntegradas = [
    'animals.js',
    'births.js', 
    'custos.js',
    'deaths.js',
    'gestacoes.js',
    'nitrogenio.js',
    'protocolos.js',
    'semen.js'
  ]

  // APIs que precisam ser integradas
  const apisPendentes = [
    'nascimentos.js',
    'mortes.js', 
    'medicamentos.js',
    'transferencias-embrioes.js',
    'boletim-contabil.js',
    'locais.js',
    'batch-move-animals.js',
    'servicos.js'
  ]

  // APIs de diret√≥rios que precisam ser verificadas
  const diretoriosAPI = [
    'contabilidade/',
    'notas-fiscais/',
    'receptoras/',
    'animais/',
    'semen/'
  ]

  console.log('‚≈ì‚Ä¶ APIs J√Å INTEGRADAS com hist√≥rico de lotes:')
  apisIntegradas.forEach(api => {
    console.log(`   ‚‚Ç¨¢ ${api}`)
  })

  console.log('\n‚ù≈í APIs PENDENTES de integra√ß√£o:')
  apisPendentes.forEach(api => {
    console.log(`   ‚‚Ç¨¢ ${api}`)
  })

  console.log('\n≈∏‚ÄúÅ DIRET√‚ÄúRIOS a verificar:')
  diretoriosAPI.forEach(dir => {
    console.log(`   ‚‚Ç¨¢ ${dir}`)
  })

  console.log('\n≈∏≈ΩØ PLANO DE A√‚Ä°√∆íO:')
  console.log('1. Integrar APIs pendentes com withLoteTracking')
  console.log('2. Verificar APIs em subdiret√≥rios')
  console.log('3. Criar configura√ß√µes LOTE_CONFIGS para cada opera√ß√£o')
  console.log('4. Testar todas as integra√ß√µes')

  return {
    integradas: apisIntegradas,
    pendentes: apisPendentes,
    diretorios: diretoriosAPI
  }
}

auditAPIs()
  .then(result => {
    console.log(`\n≈∏‚Äú≈† RESUMO:`)
    console.log(`‚‚Ç¨¢ APIs integradas: ${result.integradas.length}`)
    console.log(`‚‚Ç¨¢ APIs pendentes: ${result.pendentes.length}`)
    console.log(`‚‚Ç¨¢ Diret√≥rios a verificar: ${result.diretorios.length}`)
    console.log('\n≈∏≈°‚Ç¨ Iniciando corre√ß√µes...')
    process.exit(0)
  })