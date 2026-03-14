#!/usr/bin/env node

/**
 * Script para corrigir datas inconsistentes em localizacoes_animais.
 * Quando data_saida < data_entrada (erro de importa√ß√£o), define data_saida = NULL
 * para indicar que o animal ainda est√° no piquete.
 *
 * Uso: node scripts/corrigir-datas-localizacoes.js [--dry-run] [--execute]
 * --dry-run: apenas lista o que seria alterado (padr√£o)
 * --execute: executa a corre√ß√£o no banco
 */

require('dotenv').config()
const { query } = require('../lib/database')

async function corrigirDatasInconsistentes(dryRun = true) {
  console.log('‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê')
  console.log('  CORRE√‚Ä°√∆íO DE DATAS INCONSISTENTES - localizacoes_animais')
  console.log('‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê\n')

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
      console.log('‚≈ì‚Ä¶ Nenhum registro com datas inconsistentes encontrado.')
      return
    }

    console.log(`≈∏‚Äú‚Äπ Encontrados ${registros.length} registro(s) com data_saida < data_entrada\n`)

    if (dryRun) {
      console.log('‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Registros que seriam corrigidos (amostra dos 20 primeiros) ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨\n')
      registros.slice(0, 20).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.serie}-${r.rg} | ${r.piquete}`)
        console.log(`      Entrada: ${r.data_entrada} | Sa√≠da: ${r.data_saida} ‚‚Ä†‚Äô ser√° NULL`)
      })
      if (registros.length > 20) {
        console.log(`   ... e mais ${registros.length - 20} registro(s)`)
      }
      console.log('\n‚‚ÄûπÔ∏è  Modo --dry-run: nenhuma altera√ß√£o foi feita.')
      console.log('   Execute com --execute para aplicar a corre√ß√£o.\n')
      return
    }

    // Executar corre√ß√£o
    const ids = registros.map(r => r.id)
    await query(`
      UPDATE localizacoes_animais
      SET data_saida = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1)
    `, [ids])

    console.log(`‚≈ì‚Ä¶ ${registros.length} registro(s) corrigido(s) com sucesso!`)
    console.log('   data_saida definida como NULL (animal considerado no piquete).\n')

  } catch (error) {
    console.error('‚ù≈í Erro:', error.message)
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
