/**
 * Script para inserir os 3 exames andrológicos Inapto (16/02) e reagendamentos (18/03).
 * Machos: 16337, 16338, 16193 - deram Inapto em 16/02, refazer em 30 dias (18/03).
 *
 * Uso: node scripts/inserir-exames-andrologicos-inaptos-16fev.js
 */
require('dotenv').config()
const { query, pool } = require('../lib/database')

const DATA_EXAME_INAPTO = '2026-02-16' // 16/02
const DATA_REAGENDAMENTO = '2026-03-18' // 30 dias depois
// RGs dos machos que deram Inapto em 16/02 (não são IDs de animal)
const RGS_INAPTOS = ['16337', '16338', '16193']

async function main() {
  console.log('\n=== INSERINDO EXAMES ANDROL�“GICOS INAPTOS (16/02) E REAGENDAMENTOS (18/03) ===\n')
  console.log(`RGs dos machos: ${RGS_INAPTOS.join(', ')}`)
  console.log(`Data exame Inapto: ${DATA_EXAME_INAPTO}`)
  console.log(`Data refazer (30 dias): ${DATA_REAGENDAMENTO}\n`)

  const client = await pool.connect()
  try {
    // 1. Buscar dados dos animais por RG
    const animaisRes = await client.query(
      `SELECT id, serie, rg, nome FROM animais 
       WHERE CAST(rg AS TEXT) = ANY($1::text[])`,
      [RGS_INAPTOS]
    )

    const animaisMap = new Map(animaisRes.rows.map(a => [String(a.rg), a]))
    const rgsFaltando = RGS_INAPTOS.filter(rg => !animaisMap.has(rg))

    if (animaisRes.rows.length > 0) {
      console.log(`�œ… ${animaisRes.rows.length} animal(is) encontrado(s) no cadastro:`)
      animaisRes.rows.forEach(a => {
        console.log(`   - RG ${a.rg}: ${a.serie || ''}-${a.rg} (${a.nome || 'sem nome'})`)
      })
    }
    if (rgsFaltando.length > 0) {
      console.log(`�š�️ RGs sem animal cadastrado (será inserido exame mesmo assim): ${rgsFaltando.join(', ')}`)
    }
    console.log('')

    // Processar todos os RGs (com ou sem animal cadastrado)
    for (const rg of RGS_INAPTOS) {
      const animal = animaisMap.get(rg)
      const touro = animal ? `${animal.serie || ''}-${animal.rg}`.replace(/^-|-$/g, '') || `RG-${rg}` : `RG-${rg}`
      const rgStr = String(rg).trim()

      // Verificar se já existe exame para este animal nesta data
      const existeRes = await client.query(
        `SELECT id FROM exames_andrologicos 
         WHERE rg = $1 AND data_exame = $2 AND resultado = 'Inapto'
         LIMIT 1`,
        [rgStr, DATA_EXAME_INAPTO]
      )

      if (existeRes.rows.length > 0) {
        console.log(`⏭️ Exame Inapto já existe para ${touro} em ${DATA_EXAME_INAPTO} (ID: ${existeRes.rows[0].id})`)
        continue
      }

      // Inserir exame Inapto
      const insertRes = await client.query(
        `INSERT INTO exames_andrologicos 
         (touro, rg, data_exame, resultado, observacoes, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, touro, rg, data_exame, resultado`,
        [touro, rgStr, DATA_EXAME_INAPTO, 'Inapto', 'Inapto em 16/02 - refazer em 30 dias (18/03)', 'Ativo']
      )

      const exameInapto = insertRes.rows[0]
      console.log(`�œ… Exame Inapto inserido: ${touro} (ID: ${exameInapto.id})`)

      // Criar reagendamento (exame Pendente para 18/03)
      const reagendamentoRes = await client.query(
        `INSERT INTO exames_andrologicos 
         (touro, rg, data_exame, resultado, observacoes, reagendado, exame_origem_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, data_exame`,
        [
          touro,
          rgStr,
          DATA_REAGENDAMENTO,
          'Pendente',
          `Reagendamento automático. Exame anterior Inapto em ${DATA_EXAME_INAPTO}.`,
          true,
          exameInapto.id,
          'Ativo'
        ]
      )

      const reagendamento = reagendamentoRes.rows[0]
      console.log(`   �†’ Reagendamento criado para ${DATA_REAGENDAMENTO} (ID: ${reagendamento.id})`)

      // Atualizar exame original com status Reagendado e data_reagendamento
      await client.query(
        `UPDATE exames_andrologicos 
         SET status = 'Reagendado', data_reagendamento = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [DATA_REAGENDAMENTO, exameInapto.id]
      )

      console.log(`   �†’ Exame original atualizado (status: Reagendado)\n`)
    }

    console.log('�œ… Concluído! Os eventos aparecerão na agenda (Calendário Reprodutivo).')
  } catch (err) {
    console.error('�Œ Erro:', err.message)
    throw err
  } finally {
    client.release()
    process.exit(0)
  }
}

main()
