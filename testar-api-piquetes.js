const { query } = require('./lib/database')

async function testarAPI() {
  try {
    console.log('Testando API de animais por piquete...\n')
    
    // Simular a query da API
    const r = await query(`
      SELECT
        COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete,
        COALESCE(l.data_entrada, a.data_entrada_piquete, a.created_at)::date as data_entrada,
        a.id as animal_id,
        a.serie, a.rg, a.nome as animal_nome,
        a.sexo, a.data_nascimento, a.raca,
        a.pai, a.avo_materno, a.abczg as iabcz, a.deca
      FROM animais a
      LEFT JOIN LATERAL (
        SELECT l2.piquete, l2.data_entrada FROM localizacoes_animais l2
        WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
        ORDER BY l2.data_entrada DESC LIMIT 1
      ) l ON TRUE
      WHERE a.situacao = 'Ativo'
        AND COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) IS NOT NULL
        AND TRIM(COALESCE(l.piquete, a.piquete_atual, a.pasto_atual)) != ''
      ORDER BY piquete, a.serie, a.rg
      LIMIT 10
    `)
    
    console.log(`Encontrados ${r.rows.length} animais`)
    console.log('\nPrimeiros animais:')
    r.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.serie} ${row.rg} - ${row.piquete} - ${row.sexo}`)
    })
    
  } catch (error) {
    console.error('Erro:', error.message)
    console.error(error.stack)
  } finally {
    process.exit()
  }
}

testarAPI()
