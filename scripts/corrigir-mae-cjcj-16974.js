#!/usr/bin/env node
/**
 * Corrige o vÃ­nculo da mÃ£e do CJCJ 16974 (1Âº no iABCZ).
 * MÃ£e correta: Mosca, CJCJ 15959 (serie_mae=CJCJ, rg_mae=15959)
 * 
 * Uso: node scripts/corrigir-mae-cjcj-16974.js
 */
require('dotenv').config()
const { query } = require('../lib/database')

async function main() {
  try {
    // Verificar se CJCJ 16974 existe e qual a mÃ£e atual
    const atual = await query(
      `SELECT id, serie, rg, nome, mae, serie_mae, rg_mae 
       FROM animais 
       WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg) = '16974'`
    )
    if (!atual.rows?.length) {
      console.log('â�Å’ Animal CJCJ 16974 nÃ£o encontrado.')
      process.exit(1)
    }
    const animal = atual.rows[0]
    console.log('Animal encontrado:', animal.serie, animal.rg, '- MÃ£e atual:', animal.mae, '| serie_mae:', animal.serie_mae, '| rg_mae:', animal.rg_mae)

    // Atualizar para mÃ£e correta: Mosca, CJCJ 15959
    const r = await query(
      `UPDATE animais 
       SET serie_mae = 'CJCJ', rg_mae = '15959', mae = 'Mosca, CJCJ 15959'
       WHERE id = $1
       RETURNING id, serie, rg, mae, serie_mae, rg_mae`,
      [animal.id]
    )
    console.log('âÅ“â€¦ Atualizado:', r.rows[0])
    process.exit(0)
  } catch (e) {
    console.error('Erro:', e.message)
    process.exit(1)
  }
}

main()
