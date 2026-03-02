const {query} = require('./lib/database')

async function verificar() {
  const result = await query(`
    SELECT id, serie, rg, piquete_atual, data_entrada_piquete 
    FROM animais 
    WHERE serie = 'EAO' AND rg = '6684'
  `)
  
  if (result.rows.length > 0) {
    const a = result.rows[0]
    console.log('✅ Animal EAO 6684 encontrado:')
    console.log('   ID:', a.id)
    console.log('   Piquete atual:', a.piquete_atual || '(sem piquete)')
    console.log('   Data entrada:', a.data_entrada_piquete || '(sem data)')
  } else {
    console.log('❌ Animal não encontrado')
  }
  
  // Verificar localizações
  const locResult = await query(`
    SELECT COUNT(*) as total 
    FROM localizacoes_animais 
    WHERE animal_id = 106
  `)
  
  console.log('\n📍 Total de localizações registradas:', locResult.rows[0].total)
  
  process.exit(0)
}

verificar()
