require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Pool } = require('pg')
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: parseInt(process.env.DB_PORT)||5432, database: process.env.DB_NAME||'beef_sync', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'', ssl: false })

async function run() {
  const r = await pool.query(`
    SELECT serie, rg, iqg, pt_iqg,
      gp_pn_dep, gp_pn_pt, gp_p120_dep, gp_p120_pt, gp_pd_dep, gp_pd_pt,
      gp_ps_dep, gp_ps_pt, gp_stay_dep, gp_stay_pt, gp_pes_dep, gp_pes_pt,
      gp_ipp_dep, gp_ipp_pt, gp_pp30_dep, gp_pp30_pt, gp_rd_dep, gp_rd_acc,
      mgte, "top",
      ancp_d3p, ancp_dipp, ancp_top_dipp, ancp_dpe365, ancp_top_dpe365,
      ancp_dpn, ancp_top_dpn, ancp_dstay, ancp_top_dstay,
      ancp_mp120, ancp_top_mp120, ancp_mp210, ancp_top_mp210,
      ancp_dp450, ancp_top_dp450, ancp_daol, ancp_dacab, ancp_top_dacab,
      pub_classe, pub_grupo, pub_classif,
      carc_aol, carc_mar, carc_egs, carc_picanha,
      pmgz_pn_dep, pmgz_pd_dep, pmgz_pa_dep
    FROM animais WHERE serie='CJCJ' AND rg='16141' LIMIT 1
  `)
  console.log(JSON.stringify(r.rows[0], null, 2))
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
