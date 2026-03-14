#!/usr/bin/env node

/**
 * Script para corrigir datas inconsistentes em localizacoes_animais.
 * Quando data_saida < data_entrada (erro de importação), define data_saida = NULL
 * para indicar que o animal ainda está no piquete.
 *
 * Uso: node scripts/corrigir-datas-localizacoes.js [--dry-run] [--execute]
 * --dry-run: apenas lista o que seria alterado (padrão)
 * --execute: executa a correção no banco
 */

require('dotenv').config()
const { query } = require('../lib/database')

async function corrigirDatasInconsistentes(dryRun = true) {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  CORREÇÃO DE DATAS INCONSISTENTES - localizacoes_animais')
  console.log('═══════════════════════════════════════════════════════════════\n')

  try {
    // Buscar registros com data_saida < data_entrada
    const result = await query(`
      SELECT l.id, l.animal_id, l.piquete, l.data_entrada, l.data_saida,
             a.serie, a.rg
      FROM localizacoes_animais l
      JOIN animais a ON a.id = l.animal_id
      WHERE l.data_saida IS NOT NULL 
        AND l.data_entrada IS NOT NULL 
        AND l.data_saida < l.data_entrada
      ORDER BY a.serie, a.rg
    `)

    const registros = result.rows

    if (registros.length === 0) {
      console.log('✅ Nenhum registro com datas inconsistentes encontrado.')
      return
    }

    console.log(`📋 Encontrados ${registros.length} registro(s) com data_saida < data_entrada\n`)

    if (dryRun) {
      console.log('─── Registros que seriam corrigidos (amostra dos 20 primeiros) ───\n')
      registros.slice(0, 20).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.serie}-${r.rg} | ${r.piquete}`)
        console.log(`      Entrada: ${r.data_entrada} | Saída: ${r.data_saida} → será NULL`)
      })
      if (registros.length > 20) {
        console.log(`   ... e mais ${registros.length - 20} registro(s)`)
      }
      console.log('\nℹ️  Modo --dry-run: nenhuma alteração foi feita.')
      console.log('   Execute com --execute para aplicar a correção.\n')
      return
    }

    // Executar correção
    const ids = registros.map(r => r.id)
    await query(`
      UPDATE localizacoes_animais
      SET data_saida = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1)
    `, [ids])

    console.log(`✅ ${registros.length} registro(s) corrigido(s) com sucesso!`)
    console.log('   data_saida definida como NULL (animal considerado no piquete).\n')

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute')
  const dryRun = !execute

  await corrigirDatasInconsistentes(dryRun)
}

main()
