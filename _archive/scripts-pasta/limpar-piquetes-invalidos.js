#!/usr/bin/env node

/**
 * Script para limpar piquetes/locais inv√°lidos do banco de dados.
 * Remove nomes de touros (NACION 15397, NERO DO MORRO, etc.) que foram
 * incorretamente cadastrados como piquetes.
 *
 * Uso: node scripts/limpar-piquetes-invalidos.js [--dry-run] [--execute]
 * --dry-run: apenas lista o que seria alterado (padr√£o)
 * --execute: executa a limpeza no banco
 */

require('dotenv').config()
const { query } = require('../lib/database')

// Mesma l√≥gica da whitelist em localizacao.js
function ehPiqueteOuProjetoValido(nome) {
  if (!nome || typeof nome !== 'string') return false
  const n = nome.trim()
  if (!n || /^(VAZIO|N√∆íO INFORMADO|NAO INFORMADO|-)$/i.test(n)) return false
  if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return true
  if (/^PROJETO\s+[\dA-Za-z\-]+$/i.test(n)) return true
  if (/^CONFINA$/i.test(n)) return true
  if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return true
  return false
}

async function listarPiquetesInvalidos() {
  const invalidos = new Set()

  // 1. Da tabela localizacoes_animais
  const locRes = await query(`
    SELECT DISTINCT piquete FROM localizacoes_animais
    WHERE piquete IS NOT NULL AND TRIM(piquete) != ''
  `)
  locRes.rows.forEach(r => {
    if (!ehPiqueteOuProjetoValido(r.piquete)) invalidos.add(r.piquete)
  })

  // 2. Da tabela piquetes
  try {
    const piqRes = await query(`
      SELECT DISTINCT nome FROM piquetes
      WHERE ativo = true AND nome IS NOT NULL AND TRIM(nome) != ''
    `)
    piqRes.rows.forEach(r => {
      if (!ehPiqueteOuProjetoValido(r.nome)) invalidos.add(r.nome)
    })
  } catch (e) {
    if (!e.message?.includes('does not exist')) throw e
  }

  // 3. Da tabela locais_disponiveis
  try {
    const locDispRes = await query(`
      SELECT DISTINCT nome FROM locais_disponiveis
      WHERE ativo = true AND nome IS NOT NULL AND TRIM(nome) != ''
    `)
    locDispRes.rows.forEach(r => {
      if (!ehPiqueteOuProjetoValido(r.nome)) invalidos.add(r.nome)
    })
  } catch (e) {
    if (!e.message?.includes('does not exist')) throw e
  }

  return Array.from(invalidos)
}

async function executarLimpeza(dryRun = true) {
  try {
    console.log('≈∏‚Äùç Buscando piquetes/locais inv√°lidos...\n')

    const invalidos = await listarPiquetesInvalidos()

    if (invalidos.length === 0) {
      console.log('‚≈ì‚Ä¶ Nenhum piquete inv√°lido encontrado. Banco j√° est√° limpo!')
      return
    }

    console.log(`≈∏‚Äú‚Äπ Encontrados ${invalidos.length} piquete(s)/local(is) inv√°lido(s):`)
    invalidos.sort().forEach((nome, i) => console.log(`   ${i + 1}. ${nome}`))
    console.log('')

    if (dryRun) {
      console.log('‚‚ÄûπÔ∏è  Modo --dry-run: nenhuma altera√ß√£o foi feita.')
      console.log('   Execute com --execute para aplicar a limpeza.')
      return
    }

    console.log('≈∏ßπ Executando limpeza...\n')

    const valorPadrao = 'N√£o informado'

    // 0. Converter abrevia√ß√µes PIQ X -> PIQUETE X (preservar dados)
    const piqMatch = invalidos.filter(n => /^PIQ\s+\d+$/i.test(n))
    const invalidosParaLimpar = invalidos.filter(n => !/^PIQ\s+\d+$/i.test(n))
    if (piqMatch.length > 0) {
      for (const abrev of piqMatch) {
        const correto = abrev.replace(/^PIQ\s+/i, 'PIQUETE ')
        await query(`
          UPDATE localizacoes_animais SET piquete = $1, updated_at = CURRENT_TIMESTAMP WHERE piquete = $2
        `, [correto, abrev])
      }
      console.log(`   ‚≈ì‚Äú PIQ X ‚‚Ä†‚Äô PIQUETE X: ${piqMatch.length} convers√£o(√µes)`)
    }

    // 1. Atualizar localizacoes_animais
    const locCount = invalidosParaLimpar.length > 0 ? await query(`
      UPDATE localizacoes_animais
      SET piquete = $1, updated_at = CURRENT_TIMESTAMP
      WHERE piquete = ANY($2) AND piquete IS NOT NULL
    `, [valorPadrao, invalidosParaLimpar]) : { rowCount: 0 }
    const locAfetados = locCount.rowCount || 0
    console.log(`   ‚≈ì‚Äú localizacoes_animais: ${locAfetados} registro(s) atualizado(s)`)

    // 2. Desativar em piquetes
    try {
      const piqCount = invalidosParaLimpar.length > 0 ? await query(`
        UPDATE piquetes
        SET ativo = false, updated_at = NOW()
        WHERE nome = ANY($1) AND ativo = true
      `, [invalidosParaLimpar]) : { rowCount: 0 }
      console.log(`   ‚≈ì‚Äú piquetes: ${piqCount.rowCount || 0} registro(s) desativado(s)`)
    } catch (e) {
      if (e.message?.includes('does not exist')) {
        console.log('   ‚‚Äî‚Äπ piquetes: tabela n√£o existe')
      } else throw e
    }

    // 3. Desativar em locais_disponiveis
    try {
      const locDispCount = invalidosParaLimpar.length > 0 ? await query(`
        UPDATE locais_disponiveis
        SET ativo = false, updated_at = CURRENT_TIMESTAMP
        WHERE nome = ANY($1) AND ativo = true
      `, [invalidosParaLimpar]) : { rowCount: 0 }
      console.log(`   ‚≈ì‚Äú locais_disponiveis: ${locDispCount.rowCount || 0} registro(s) desativado(s)`)
    } catch (e) {
      if (e.message?.includes('does not exist')) {
        console.log('   ‚‚Äî‚Äπ locais_disponiveis: tabela n√£o existe')
      } else throw e
    }

    console.log('\n‚≈ì‚Ä¶ Limpeza conclu√≠da com sucesso!')
  } catch (error) {
    console.error('\n‚ù≈í Erro:', error.message)
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute')
  const dryRun = !execute

  console.log('‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê')
  console.log('  Limpeza de Piquetes/Locais Inv√°lidos - Beef-Sync')
  console.log('‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê\n')

  await executarLimpeza(dryRun)
}

main()
