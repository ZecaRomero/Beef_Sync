/**
 * Script para verificar por que "Jata" nÃ£o encontra JATAUBA (CJCJ 17037)
 * Execute: node scripts/verificar-busca-jatauba.js
 */
const { query } = require('../lib/database')

async function main() {
  console.log('ðÅ¸â€�� Verificando dados para busca "Jata" -> JATAUBA (CJCJ 17037)\n')

  // 1. Animal em animais
  const animal = await query(
    `SELECT id, serie, rg, nome FROM animais WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '17037'`
  )
  console.log('1. Animal em animais (CJCJ 17037):')
  if (animal.rows.length > 0) {
    console.log('   âÅ“â€¦ Encontrado:', animal.rows[0])
    const nome = animal.rows[0].nome || ''
    console.log('   Nome contÃ©m "JATA"?', nome.toUpperCase().includes('JATA'))
  } else {
    console.log('   â�Å’ NÃÆ’O encontrado')
  }

  // 2. GestaÃ§Ãµes com receptora CJCJ 17037
  const gest = await query(
    `SELECT id, receptora_serie, receptora_rg, receptora_nome FROM gestacoes 
     WHERE UPPER(TRIM(COALESCE(receptora_nome,''))) LIKE '%JATA%'
     LIMIT 5`
  )
  console.log('\n2. GestaÃ§Ãµes com receptora_nome contendo "JATA":')
  if (gest.rows.length > 0) {
    gest.rows.forEach((g, i) => console.log(`   ${i + 1}.`, g))
  } else {
    console.log('   â�Å’ Nenhuma gestaÃ§Ã£o com receptora_nome contendo "JATA"')
  }

  // 3. GestaÃ§Ãµes para CJCJ 17037 especificamente
  const gestCjcj = await query(
    `SELECT id, receptora_serie, receptora_rg, receptora_nome FROM gestacoes 
     WHERE receptora_serie ILIKE 'CJCJ' AND (receptora_rg::text = '17037' OR TRIM(receptora_rg::text) = '17037')
     LIMIT 5`
  )
  console.log('\n3. GestaÃ§Ãµes com receptora CJCJ 17037:')
  if (gestCjcj.rows.length > 0) {
    gestCjcj.rows.forEach((g, i) => console.log(`   ${i + 1}.`, g))
  } else {
    console.log('   â�Å’ Nenhuma')
  }

  console.log('\nâÅ“â€¦ VerificaÃ§Ã£o concluÃ­da.')
  process.exit(0)
}

main().catch((e) => {
  console.error('Erro:', e)
  process.exit(1)
})
