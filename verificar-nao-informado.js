const {query} = require('./lib/database')

async function verificar() {
  // Buscar animais sem piquete ou com piquete inválido
  const result = await query(`
    SELECT a.id, a.serie, a.rg, a.sexo, a.situacao,
           COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete
    FROM animais a
    LEFT JOIN LATERAL (
      SELECT l2.piquete FROM localizacoes_animais l2
      WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
      ORDER BY l2.data_entrada DESC LIMIT 1
    ) l ON TRUE
    WHERE a.situacao = 'Ativo'
      AND (
        COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) IS NULL
        OR TRIM(COALESCE(l.piquete, a.piquete_atual, a.pasto_atual)) = ''
      )
    ORDER BY a.serie, a.rg
  `)
  
  console.log(`📊 Total de animais "Não informado": ${result.rows.length}`)
  console.log('\nLista de animais sem piquete:')
  
  result.rows.forEach((a, idx) => {
    console.log(`${idx + 1}. ${a.serie} ${a.rg} - Sexo: ${a.sexo || '?'} - Piquete: ${a.piquete || '(null)'}`)
  })
  
  process.exit(0)
}

verificar()
