#!/usr/bin/env node

/**
 * Script para verificar se todos os animais estão nos locais corretos.
 * Detecta: piquetes inválidos, nomes de touros como localização, inconsistências.
 *
 * Uso: node scripts/verificar-localizacoes-animais.js
 */

require('dotenv').config()
const { query } = require('../lib/database')

function ehLocalizacaoValida(loc) {
  if (!loc || typeof loc !== 'string') return false
  const n = loc.trim()
  if (!n || /^(VAZIO|NÃO INFORMADO|NAO INFORMADO|-)$/i.test(n)) return false
  if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return true
  if (/^PROJETO\s+[\dA-Za-z\-]+$/i.test(n)) return true
  if (/^CONFINA$/i.test(n)) return true
  if (/^PIQ\s+\d+$/i.test(n)) return true
  if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return true
  return false
}

async function verificarLocalizacoes() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  VERIFICAÇÃO DE LOCALIZAÇÕES DOS ANIMAIS - Beef-Sync')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const problemas = []
  const ok = []

  try {
    // 1. Buscar todos os animais com suas localizações (prioriza data_saida IS NULL, senão mais recente)
    const animais = await query(`
      WITH loc_atual AS (
        SELECT DISTINCT ON (animal_id) animal_id, piquete, data_entrada, data_saida
        FROM localizacoes_animais
        WHERE data_saida IS NULL
        ORDER BY animal_id, data_entrada DESC
      ),
      loc_recente AS (
        SELECT DISTINCT ON (animal_id) animal_id, piquete, data_entrada, data_saida
        FROM localizacoes_animais
        ORDER BY animal_id, data_entrada DESC
      )
      SELECT a.id, a.serie, a.rg, a.nome, a.pai, a.piquete_atual, a.pasto_atual,
             COALESCE(la.piquete, lr.piquete) as loc_piquete
      FROM animais a
      LEFT JOIN loc_atual la ON la.animal_id = a.id
      LEFT JOIN loc_recente lr ON lr.animal_id = a.id AND la.animal_id IS NULL
      WHERE a.situacao = 'Ativo'
      ORDER BY a.serie, a.rg
    `)

    console.log(`📊 Total de animais ativos: ${animais.rows.length}\n`)

    for (const a of animais.rows) {
      const ident = `${a.serie}-${a.rg}`
      const locAtual = a.loc_piquete || a.piquete_atual || a.pasto_atual || null
      const fonte = a.loc_piquete ? 'localizacoes_animais' : (a.piquete_atual ? 'piquete_atual' : 'pasto_atual')

      if (!locAtual || !locAtual.trim()) {
        problemas.push({ animal: ident, nome: a.nome, problema: 'Sem localização', fonte: '-' })
        continue
      }

      const locTrim = locAtual.trim()

      // Local inválido (nome de touro, etc.)
      if (!ehLocalizacaoValida(locTrim)) {
        const provavelPai = a.pai && locTrim.toUpperCase().includes(String(a.pai).toUpperCase().slice(0, 10))
        problemas.push({
          animal: ident,
          nome: a.nome,
          problema: 'Local inválido (provavelmente nome de touro)',
          local: locTrim,
          fonte,
          pai: a.pai || '-',
          provavelPai: provavelPai ? 'SIM' : 'não'
        })
        continue
      }

      // Localização igual ao nome do pai (erro comum)
      if (a.pai && locTrim.toUpperCase() === String(a.pai).toUpperCase()) {
        problemas.push({
          animal: ident,
          nome: a.nome,
          problema: 'Local = nome do pai (erro de cadastro)',
          local: locTrim,
          fonte
        })
        continue
      }

      ok.push({ animal: ident, local: locTrim, fonte })
    }

    // 2. Listar piquetes distintos usados
    const piquetesUsados = await query(`
      SELECT DISTINCT piquete FROM localizacoes_animais
      WHERE piquete IS NOT NULL AND TRIM(piquete) != ''
      UNION
      SELECT DISTINCT piquete_atual FROM animais
      WHERE piquete_atual IS NOT NULL AND TRIM(piquete_atual) != ''
    `)

    const invalidos = piquetesUsados.rows.filter(r => !ehLocalizacaoValida(r.piquete))

    // 3. Relatório
    console.log('─── RESUMO ─────────────────────────────────────────────────\n')
    console.log(`✅ Animais com localização OK: ${ok.length}`)
    console.log(`⚠️  Animais com problemas: ${problemas.length}`)
    console.log(`📋 Piquetes inválidos no banco: ${invalidos.length}`)

    if (problemas.length > 0) {
      console.log('\n─── ANIMAIS COM PROBLEMAS ─────────────────────────────────\n')
      problemas.forEach((p, i) => {
        console.log(`${i + 1}. ${p.animal} ${p.nome ? `(${p.nome})` : ''}`)
        console.log(`   Problema: ${p.problema}`)
        if (p.local) console.log(`   Local atual: "${p.local}"`)
        console.log(`   Fonte: ${p.fonte}`)
        if (p.pai && p.provavelPai === 'SIM') console.log(`   ⚠️ Pai do animal: ${p.pai}`)
        console.log('')
      })
    }

    if (invalidos.length > 0) {
      console.log('\n─── PIQUETES INVÁLIDOS (nomes de touros, etc.) ─────────────\n')
      invalidos.forEach((p, i) => console.log(`   ${i + 1}. "${p.piquete}"`))
      console.log('\n   Execute: node scripts/limpar-piquetes-invalidos.js --dry-run')
      console.log('   Para corrigir: node scripts/limpar-piquetes-invalidos.js --execute\n')
    }

    // 4. Datas inconsistentes (data_saida < data_entrada)
    const datasInconsistentes = await query(`
      SELECT l.id, a.serie, a.rg, l.piquete, l.data_entrada, l.data_saida
      FROM localizacoes_animais l
      JOIN animais a ON a.id = l.animal_id
      WHERE l.data_saida IS NOT NULL 
        AND l.data_entrada IS NOT NULL 
        AND l.data_saida < l.data_entrada
      ORDER BY a.serie, a.rg
    `)

    if (datasInconsistentes.rows.length > 0) {
      console.log('\n─── DATAS INCONSISTENTES (saída antes da entrada) ──────────\n')
      datasInconsistentes.rows.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.serie}-${r.rg} | ${r.piquete} | Entrada: ${r.data_entrada} | Saída: ${r.data_saida}`)
      })
      console.log('\n   Esses registros são tratados como ativos pelo app (correção anterior).')
      console.log('   Para corrigir no banco: UPDATE localizacoes_animais SET data_saida = NULL WHERE id IN (...)\n')
    }

    console.log('═══════════════════════════════════════════════════════════════')
    console.log(problemas.length === 0 && invalidos.length === 0
      ? '  ✅ Verificação concluída: todos os animais estão em locais válidos!'
      : '  ⚠️  Verificação concluída: revise os itens acima.')
    console.log('═══════════════════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

verificarLocalizacoes()
