/**
 * Adiciona coluna valida e corrige IAs: mantém apenas a mais recente por animal como válida.
 * Executar: node scripts/adicionar-valida-inseminacoes.js
 */
const { query } = require('../lib/database')

async function run() {
  console.log('Adicionando coluna valida em inseminacoes...')
  await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS valida BOOLEAN DEFAULT true').catch(() => {})

  console.log('Buscando animais com múltiplas IAs...')
  const animais = await query(`
    SELECT animal_id, COUNT(*) as total
    FROM inseminacoes
    GROUP BY animal_id
    HAVING COUNT(*) > 1
  `)

  console.log(`${animais.rows.length} animais com múltiplas IAs encontrados.`)

  for (const row of animais.rows) {
    const { animal_id } = row
    const ias = await query(`
      SELECT id, data_ia, created_at, status_gestacao, resultado_dg
      FROM inseminacoes
      WHERE animal_id = $1
      ORDER BY data_ia DESC, created_at DESC
    `, [animal_id])

    if (ias.rows.length < 2) continue

    const maisRecente = ias.rows[0]
    const anteriores = ias.rows.slice(1)

    for (const ia of anteriores) {
      await query(`
        UPDATE inseminacoes 
        SET valida = false, status_gestacao = 'Vazia', 
            resultado_dg = COALESCE(NULLIF(TRIM(resultado_dg), ''), 'Vazia'),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [ia.id])
      console.log(`  IA ${ia.id} (animal ${animal_id}) → inválida (anterior)`)
    }
    await query(`UPDATE inseminacoes SET valida = true WHERE id = $1`, [maisRecente.id])
    console.log(`  IA ${maisRecente.id} (animal ${animal_id}) → válida (mais recente)`)
  }

  console.log('Concluído.')
  process.exit(0)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
