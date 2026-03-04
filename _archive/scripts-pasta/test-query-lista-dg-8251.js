const { query } = require('../lib/database')

async function run() {
  const letraNorm = 'M'
  const numeroNorm = '8251'
  const numeroNormSemZero = '8251'
  const tatuagemBusca = 'M8251'
  const tatuagemSemEspacos = 'M8251'
  const sql = `
    SELECT id, serie, rg, nome, data_dg, veterinario_dg, resultado_dg, observacoes_dg
    FROM animais
    WHERE (
      (TRIM(COALESCE(serie, '')) = $1 AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3))
      OR ($1 = '' AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3))
      OR REPLACE(LOWER(COALESCE(serie, '')), ' ', '') = REPLACE(LOWER($1 || $2), ' ', '')
      OR TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3
      OR tatuagem = $4
      OR REPLACE(COALESCE(tatuagem, ''), ' ', '') = $5
      OR (tatuagem IS NOT NULL AND REPLACE(LOWER(tatuagem), ' ', '') = $6)
    ORDER BY data_dg DESC NULLS LAST, id DESC
    LIMIT 1
  `
  const res = await query(sql, [letraNorm, numeroNorm, numeroNormSemZero, tatuagemBusca, tatuagemSemEspacos, tatuagemSemEspacos.toLowerCase()])
  console.log('Rows:', res.rows)
}

run().catch(e => { console.error('Erro:', e.message) })
