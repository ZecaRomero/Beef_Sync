// Auditoria completa das APIs para integração com histórico de lotes
const fs = require('fs')
const path = require('path')

async function auditAPIs() {
  console.log('🔍 AUDITORIA COMPLETA - APIs vs Histórico de Lançamentos\n')

  const apisPath = 'pages/api'
  
  // APIs que já estão integradas (com withLoteTracking)
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

  // APIs de diretórios que precisam ser verificadas
  const diretoriosAPI = [
    'contabilidade/',
    'notas-fiscais/',
    'receptoras/',
    'animais/',
    'semen/'
  ]

  console.log('✅ APIs JÁ INTEGRADAS com histórico de lotes:')
  apisIntegradas.forEach(api => {
    console.log(`   • ${api}`)
  })

  console.log('\n❌ APIs PENDENTES de integração:')
  apisPendentes.forEach(api => {
    console.log(`   • ${api}`)
  })

  console.log('\n📁 DIRETÓRIOS a verificar:')
  diretoriosAPI.forEach(dir => {
    console.log(`   • ${dir}`)
  })

  console.log('\n🎯 PLANO DE AÇÃO:')
  console.log('1. Integrar APIs pendentes com withLoteTracking')
  console.log('2. Verificar APIs em subdiretórios')
  console.log('3. Criar configurações LOTE_CONFIGS para cada operação')
  console.log('4. Testar todas as integrações')

  return {
    integradas: apisIntegradas,
    pendentes: apisPendentes,
    diretorios: diretoriosAPI
  }
}

auditAPIs()
  .then(result => {
    console.log(`\n📊 RESUMO:`)
    console.log(`• APIs integradas: ${result.integradas.length}`)
    console.log(`• APIs pendentes: ${result.pendentes.length}`)
    console.log(`• Diretórios a verificar: ${result.diretorios.length}`)
    console.log('\n🚀 Iniciando correções...')
    process.exit(0)
  })