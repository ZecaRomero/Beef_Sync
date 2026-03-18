require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function check() {
  try {
    const result = await pool.query(
      `SELECT 
        serie, rg, iqg, pt_iqg,
        gp_pn_kg, gp_pn_acc, gp_pn_pt,
        gp_p120_kg_em, gp_p120_acc, gp_p120_pt,
        gp_p2_kg, gp_aol_cm2, gp_mar_pct
      FROM animais 
      WHERE serie = $1 AND rg = $2`,
      ['CJCJ', '16681']
    )
    console.log('Dados GENEPLUS do animal CJCJ 16681:')
    console.log(JSON.stringify(result.rows[0], null, 2))
  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    await pool.end()
  }
}

check()
