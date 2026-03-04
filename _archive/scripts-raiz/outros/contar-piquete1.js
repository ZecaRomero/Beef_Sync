const {query} = require('./lib/database')

async function contar() {
  const result = await query(`
    SELECT COUNT(*) as total 
    FROM animais 
    WHERE piquete_atual = 'PIQUETE 1'
  `)
  
  console.log('✅ Total de animais no PIQUETE 1:', result.rows[0].total)
  
  // Verificar localizações ativas
  const locResult = await query(`
    SELECT COUNT(DISTINCT animal_id) as total
    FROM localizacoes_animais
    WHERE piquete = 'PIQUETE 1'
    AND data_saida IS NULL
  `)
  
  console.log('📍 Total de localizações ativas no PIQUETE 1:', locResult.rows[0].total)
  
  process.exit(0)
}

contar()
