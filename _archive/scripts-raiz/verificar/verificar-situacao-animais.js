const {query} = require('./lib/database')

async function verificar() {
  // Verificar situação dos 25 animais do PIQUETE 1
  const result = await query(`
    SELECT serie, rg, situacao, piquete_atual
    FROM animais 
    WHERE piquete_atual = 'PIQUETE 1'
    ORDER BY serie, rg
  `)
  
  console.log(`📊 Animais no PIQUETE 1: ${result.rows.length}`)
  console.log('\nSituação dos animais:')
  
  const porSituacao = {}
  result.rows.forEach(a => {
    const sit = a.situacao || '(null)'
    porSituacao[sit] = (porSituacao[sit] || 0) + 1
  })
  
  Object.entries(porSituacao).forEach(([sit, count]) => {
    console.log(`   ${sit}: ${count} animais`)
  })
  
  // Mostrar alguns exemplos
  console.log('\nExemplos:')
  result.rows.slice(0, 5).forEach(a => {
    console.log(`   ${a.serie} ${a.rg} - Situação: ${a.situacao || '(null)'}`)
  })
  
  // Verificar quantos seriam retornados pela query da API
  const apiResult = await query(`
    SELECT COUNT(*) as total
    FROM animais a
    LEFT JOIN LATERAL (
      SELECT l2.piquete FROM localizacoes_animais l2
      WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
      ORDER BY l2.data_entrada DESC LIMIT 1
    ) l ON TRUE
    WHERE a.situacao = 'Ativo'
      AND COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) IS NOT NULL
      AND TRIM(COALESCE(l.piquete, a.piquete_atual, a.pasto_atual)) != ''
  `)
  
  console.log(`\n🔍 Total que a API retornaria (situacao = 'Ativo'): ${apiResult.rows[0].total}`)
  
  process.exit(0)
}

verificar()
