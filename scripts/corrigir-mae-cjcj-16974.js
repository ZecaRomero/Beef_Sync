#!/usr/bin/env node
/**
 * Corrige o vínculo da mãe do CJCJ 16974 (1º no iABCZ).
 * Mãe correta: Mosca, CJCJ 15959 (serie_mae=CJCJ, rg_mae=15959)
 * 
 * Uso: node scripts/corrigir-mae-cjcj-16974.js
 */
require('dotenv').config()
const { query } = require('../lib/database')

async function main() {
  try {
    // Verificar se CJCJ 16974 existe e qual a mãe atual
    const atual = await query(
      `SELECT id, serie, rg, nome, mae, serie_mae, rg_mae 
       FROM animais 
       WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg) = '16974'`
    )
    if (!atual.rows?.length) {
      console.log('❌ Animal CJCJ 16974 não encontrado.')
      process.exit(1)
    }
    const animal = atual.rows[0]
    console.log('Animal encontrado:', animal.serie, animal.rg, '- Mãe atual:', animal.mae, '| serie_mae:', animal.serie_mae, '| rg_mae:', animal.rg_mae)

    // Atualizar para mãe correta: Mosca, CJCJ 15959
    const r = await query(
      `UPDATE animais 
       SET serie_mae = 'CJCJ', rg_mae = '15959', mae = 'Mosca, CJCJ 15959'
       WHERE id = $1
       RETURNING id, serie, rg, mae, serie_mae, rg_mae`,
      [animal.id]
    )
    console.log('✅ Atualizado:', r.rows[0])
    process.exit(0)
  } catch (e) {
    console.error('Erro:', e.message)
    process.exit(1)
  }
}

main()
