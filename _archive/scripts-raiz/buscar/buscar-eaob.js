const {query} = require('./lib/database')

async function buscar() {
  const result = await query(`
    SELECT id, serie, rg 
    FROM animais 
    WHERE rg LIKE '%6684%' OR serie LIKE '%EAOB%' 
    ORDER BY serie, rg
  `)
  
  console.log('Animais parecidos com EAOB 6684:')
  if (result.rows.length === 0) {
    console.log('�Œ Nenhum encontrado')
    console.log('\n�Ÿ’� O animal EAOB 6684 não existe no banco de dados.')
    console.log('   Você precisa cadastrá-lo primeiro antes de importar a localização.')
  } else {
    result.rows.forEach(a => console.log(`  �œ… ${a.serie} ${a.rg} (ID: ${a.id})`))
  }
  
  process.exit(0)
}

buscar()
