const {query} = require('./lib/database')

async function verificar() {
  // Total geral de animais
  const totalGeral = await query('SELECT COUNT(*) as total FROM animais')
  console.log('📊 Total GERAL de animais no sistema:', totalGeral.rows[0].total)
  
  // Por piquete
  const porPiquete = await query(`
    SELECT piquete_atual, COUNT(*) as total 
    FROM animais 
    WHERE piquete_atual IS NOT NULL
    GROUP BY piquete_atual 
    ORDER BY total DESC
  `)
  
  console.log('\n📍 Animais por piquete:')
  porPiquete.rows.forEach(r => {
    console.log(`   ${r.piquete_atual}: ${r.total} animais`)
  })
  
  // Sem piquete
  const semPiquete = await query('SELECT COUNT(*) as total FROM animais WHERE piquete_atual IS NULL')
  console.log(`   (Sem piquete): ${semPiquete.rows[0].total} animais`)
  
  // Machos e fêmeas
  const porSexo = await query(`
    SELECT sexo, COUNT(*) as total 
    FROM animais 
    GROUP BY sexo
  `)
  
  console.log('\n👥 Por sexo:')
  porSexo.rows.forEach(r => {
    console.log(`   ${r.sexo || '(não informado)'}: ${r.total}`)
  })
  
  process.exit(0)
}

verificar()
