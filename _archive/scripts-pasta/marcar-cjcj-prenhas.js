/**
 * Marca como Prenha a última IA de cada fêmea CJCJ.
 * Para cada animal CJCJ fêmea com inseminações, a IA mais recente �†’ Prenha, as demais �†’ Vazia.
 *
 * Uso: node scripts/marcar-cjcj-prenhas.js
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/database')

async function executar() {
  console.log('�Ÿ”� Marcando fêmeas CJCJ como prenhas (última IA)\n')

  try {
    const cols = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' AND column_name IN ('resultado_dg', 'status_gestacao')
    `)
    const temResultadoDg = cols.rows?.some(r => r.column_name === 'resultado_dg')
    const temStatusGestacao = cols.rows?.some(r => r.column_name === 'status_gestacao')
    if (!temResultadoDg && !temStatusGestacao) {
      console.log('   Adicionando colunas resultado_dg e status_gestacao...')
      if (!temResultadoDg) await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS resultado_dg VARCHAR(50)')
      if (!temStatusGestacao) await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS status_gestacao VARCHAR(20)')
    }
    const setPrenha = temResultadoDg ? "resultado_dg = 'Prenha', " : ''
    const setVazia = temResultadoDg ? "resultado_dg = 'Vazia', " : ''

    // Fêmeas CJCJ com inseminações
    const femeas = await query(`
      SELECT DISTINCT a.id, a.serie, a.rg, a.nome
      FROM animais a
      JOIN inseminacoes i ON i.animal_id = a.id
      WHERE UPPER(TRIM(COALESCE(a.serie,''))) = 'CJCJ'
        AND (UPPER(TRIM(COALESCE(a.sexo,''))) LIKE 'F%' OR a.sexo = 'Fêmea' OR a.sexo = 'F')
        AND a.situacao = 'Ativo'
      ORDER BY a.rg
    `)

    if (femeas.rows.length === 0) {
      console.log('   �š�️ Nenhuma fêmea CJCJ com inseminações encontrada.')
      process.exit(0)
    }

    console.log(`   �Ÿ“‹ ${femeas.rows.length} fêmea(s) CJCJ com IA encontrada(s)\n`)

    let atualizados = 0
    const atualizadas = []
    for (const animal of femeas.rows) {
      const ins = await query(`
        SELECT id, data_ia, resultado_dg, status_gestacao
        FROM inseminacoes
        WHERE animal_id = $1
        ORDER BY data_ia DESC NULLS LAST
      `, [animal.id])

      if (ins.rows.length === 0) continue

      const ultima = ins.rows[0]
      const demais = ins.rows.slice(1)

      await query(
        `UPDATE inseminacoes SET ${setPrenha}status_gestacao = 'Prenha', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [ultima.id]
      )
      atualizadas.push(animal.nome || `CJCJ ${animal.rg}`)
      atualizados++

      for (const ia of demais) {
        await query(
          `UPDATE inseminacoes SET ${setVazia}status_gestacao = 'Vazia', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [ia.id]
        )
        atualizados++
      }
    }

    console.log(`\n   �œ… ${atualizadas.length} fêmea(s) marcada(s) como prenha(s):`)
    atualizadas.slice(0, 20).forEach(n => console.log(`      - ${n}`))
    if (atualizadas.length > 20) console.log(`      ... e mais ${atualizadas.length - 20}`)
    console.log(`\n   �Ÿ“‹ ${atualizados} registro(s) atualizado(s).`)
    console.log('\n   �Ÿ’� Recarregue o mobile para ver todas as fêmeas prenhas.')
  } catch (err) {
    console.error('�Œ Erro:', err.message)
    process.exit(1)
  }
  process.exit(0)
}

executar()
