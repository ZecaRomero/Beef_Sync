const { query } = require('./lib/database')

async function testarPiquetes() {
  try {
    console.log('Testando animais por piquete...\n')
    
    const r = await query(`
      SELECT 
        piquete,
        COUNT(*) as total
      FROM (
        SELECT 
          COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete
        FROM animais a
        LEFT JOIN LATERAL (
          SELECT l2.piquete FROM localizacoes_animais l2
          WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
          ORDER BY l2.data_entrada DESC LIMIT 1
        ) l ON TRUE
        WHERE a.situacao = 'Ativo'
          AND COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) IS NOT NULL
          AND TRIM(COALESCE(l.piquete, a.piquete_atual, a.pasto_atual)) != ''
      ) sub
      GROUP BY piquete
      ORDER BY piquete
    `)
    
    console.log('Animais por piquete:')
    r.rows.forEach(row => {
      console.log(`  ${row.piquete}: ${row.total} animais`)
    })
    
    console.log(`\nTotal de piquetes: ${r.rows.length}`)
    console.log(`Total de animais: ${r.rows.reduce((sum, row) => sum + parseInt(row.total), 0)}`)
    
  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    process.exit()
  }
}

testarPiquetes()
