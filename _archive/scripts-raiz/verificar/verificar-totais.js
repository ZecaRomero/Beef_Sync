const {query} = require('./lib/database')

async function verificar() {
  // Total geral de animais
  const totalGeral = await query('SELECT COUNT(*) as total FROM animais')
  console.log('≈∏‚Äú≈† Total GERAL de animais no sistema:', totalGeral.rows[0].total)
  
  // Por piquete
  const porPiquete = await query(`
    SELECT piquete_atual, COUNT(*) as total 
    FROM animais 
    WHERE piquete_atual IS NOT NULL
    GROUP BY piquete_atual 
    ORDER BY total DESC
  `)
  
  console.log('\n≈∏‚Äúç Animais por piquete:')
  porPiquete.rows.forEach(r => {
    console.log(`   ${r.piquete_atual}: ${r.total} animais`)
  })
  
  // Sem piquete
  const semPiquete = await query('SELECT COUNT(*) as total FROM animais WHERE piquete_atual IS NULL')
  console.log(`   (Sem piquete): ${semPiquete.rows[0].total} animais`)
  
  // Machos e f√™meas
  const porSexo = await query(`
    SELECT sexo, COUNT(*) as total 
    FROM animais 
    GROUP BY sexo
  `)
  
  console.log('\n≈∏‚Äò• Por sexo:')
  porSexo.rows.forEach(r => {
    console.log(`   ${r.sexo || '(n√£o informado)'}: ${r.total}`)
  })
  
  process.exit(0)
}

verificar()
