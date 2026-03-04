#!/usr/bin/env node

/**
 * Script para limpar piquetes/locais inválidos do banco de dados.
 * Remove nomes de touros (NACION 15397, NERO DO MORRO, etc.) que foram
 * incorretamente cadastrados como piquetes.
 *
 * Uso: node scripts/limpar-piquetes-invalidos.js [--dry-run] [--execute]
 * --dry-run: apenas lista o que seria alterado (padrão)
 * --execute: executa a limpeza no banco
 */

require('dotenv').config()
const { query } = require('../lib/database')

// Mesma lógica da whitelist em localizacao.js
function ehPiqueteOuProjetoValido(nome) {
  if (!nome || typeof nome !== 'string') return false
  const n = nome.trim()
  if (!n || /^(VAZIO|NÃO INFORMADO|NAO INFORMADO|-)$/i.test(n)) return false
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
    console.log('🔍 Buscando piquetes/locais inválidos...\n')

    const invalidos = await listarPiquetesInvalidos()

    if (invalidos.length === 0) {
      console.log('✅ Nenhum piquete inválido encontrado. Banco já está limpo!')
      return
    }

    console.log(`📋 Encontrados ${invalidos.length} piquete(s)/local(is) inválido(s):`)
    invalidos.sort().forEach((nome, i) => console.log(`   ${i + 1}. ${nome}`))
    console.log('')

    if (dryRun) {
      console.log('ℹ️  Modo --dry-run: nenhuma alteração foi feita.')
      console.log('   Execute com --execute para aplicar a limpeza.')
      return
    }

    console.log('🧹 Executando limpeza...\n')

    const valorPadrao = 'Não informado'

    // 0. Converter abreviações PIQ X -> PIQUETE X (preservar dados)
    const piqMatch = invalidos.filter(n => /^PIQ\s+\d+$/i.test(n))
    const invalidosParaLimpar = invalidos.filter(n => !/^PIQ\s+\d+$/i.test(n))
    if (piqMatch.length > 0) {
      for (const abrev of piqMatch) {
        const correto = abrev.replace(/^PIQ\s+/i, 'PIQUETE ')
        await query(`
          UPDATE localizacoes_animais SET piquete = $1, updated_at = CURRENT_TIMESTAMP WHERE piquete = $2
        `, [correto, abrev])
      }
      console.log(`   ✓ PIQ X → PIQUETE X: ${piqMatch.length} conversão(ões)`)
    }

    // 1. Atualizar localizacoes_animais
    const locCount = invalidosParaLimpar.length > 0 ? await query(`
      UPDATE localizacoes_animais
      SET piquete = $1, updated_at = CURRENT_TIMESTAMP
      WHERE piquete = ANY($2) AND piquete IS NOT NULL
    `, [valorPadrao, invalidosParaLimpar]) : { rowCount: 0 }
    const locAfetados = locCount.rowCount || 0
    console.log(`   ✓ localizacoes_animais: ${locAfetados} registro(s) atualizado(s)`)

    // 2. Desativar em piquetes
    try {
      const piqCount = invalidosParaLimpar.length > 0 ? await query(`
        UPDATE piquetes
        SET ativo = false, updated_at = NOW()
        WHERE nome = ANY($1) AND ativo = true
      `, [invalidosParaLimpar]) : { rowCount: 0 }
      console.log(`   ✓ piquetes: ${piqCount.rowCount || 0} registro(s) desativado(s)`)
    } catch (e) {
      if (e.message?.includes('does not exist')) {
        console.log('   ○ piquetes: tabela não existe')
      } else throw e
    }

    // 3. Desativar em locais_disponiveis
    try {
      const locDispCount = invalidosParaLimpar.length > 0 ? await query(`
        UPDATE locais_disponiveis
        SET ativo = false, updated_at = CURRENT_TIMESTAMP
        WHERE nome = ANY($1) AND ativo = true
      `, [invalidosParaLimpar]) : { rowCount: 0 }
      console.log(`   ✓ locais_disponiveis: ${locDispCount.rowCount || 0} registro(s) desativado(s)`)
    } catch (e) {
      if (e.message?.includes('does not exist')) {
        console.log('   ○ locais_disponiveis: tabela não existe')
      } else throw e
    }

    console.log('\n✅ Limpeza concluída com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute')
  const dryRun = !execute

  console.log('═══════════════════════════════════════════════════════')
  console.log('  Limpeza de Piquetes/Locais Inválidos - Beef-Sync')
  console.log('═══════════════════════════════════════════════════════\n')

  await executarLimpeza(dryRun)
}

main()
