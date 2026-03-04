/**
 * Testa a importação de Situação ABCZ via API
 * Uso: node scripts/test-import-situacao-abcz.js
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'

async function testarImportacao() {
  console.log('🧪 Testando importação de Situação ABCZ...\n')

  // Teste 1: JSON (colar texto - formato Série, RGN, Status)
  const dadosTeste = [
    { serie: 'CJCJ', rg: '16974', situacaoAbcz: 'Ok para RGN' },
    { serie: 'CJCB', rg: '2', situacaoAbcz: 'Ok para RGN' },
  ]

  try {
    const res = await fetch(`${API_URL}/api/import/excel-genetica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dadosTeste }),
    })

    const json = await res.json()

    if (res.ok) {
      console.log('✅ Importação concluída com sucesso!')
      console.log(`   Animais atualizados: ${json.resultados?.animaisAtualizados ?? 0}`)
      if (json.resultados?.naoEncontrados?.length > 0) {
        console.log(`   Não encontrados: ${json.resultados.naoEncontrados.length}`)
        json.resultados.naoEncontrados.slice(0, 3).forEach((n) => console.log(`      - ${n.serie} ${n.rg}`))
      }
      if (json.resultados?.ignoradosInativos?.length > 0) {
        console.log(`   Ignorados (inativos): ${json.resultados.ignoradosInativos.length}`)
      }
    } else {
      console.log('❌ Erro na importação:', json.error || json.details)
    }
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message)
    console.log('\n💡 Certifique-se de que o servidor está rodando: npm run dev')
  }
}

testarImportacao()
