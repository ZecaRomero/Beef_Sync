/**
 * Script para identificar e corrigir receptoras duplicadas no Beef-Sync
 * 
 * Problema: A mesma receptora pode existir com IDs diferentes devido a variações
 * na série (ex: "M" vs "M9775" para RG 9775). O formato correto é serie=letras, rg=número.
 * 
 * Uso: node scripts/corrigir-receptoras-duplicadas.js [--dry-run] [--execute]
 * --dry-run: apenas lista as duplicatas encontradas (padrão)
 * --execute: executa a correção (merge e exclusão)
 */

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
})

// Normaliza serie: remove dígitos do final (M9775 -> M, M -> M)
function normalizarSerie(serie) {
  if (!serie || typeof serie !== 'string') return ''
  return serie.replace(/\d+$/, '').replace(/\s+/g, ' ').trim() || serie
}

// Extrai RG normalizado para agrupamento
function rgNormalizado(rg) {
  return (rg || '').toString().trim()
}

async function encontrarDuplicatas() {
  const client = await pool.connect()
  try {
    // Buscar todas as receptoras (colunas básicas - data_te/data_dg podem não existir em animais)
    const receptoras = await client.query(`
      SELECT id, nome, serie, rg, raca, situacao, data_chegada, fornecedor, created_at
      FROM animais 
      WHERE raca ILIKE '%receptora%'
      ORDER BY rg, id
    `)

    // Agrupar por (serie_normalizada, rg) - mesmos identificam mesma receptora
    // Incluir também animais com serie que contém o RG (ex: M9775+9775 = duplicata de M+9775)
    const grupos = new Map()
    for (const a of receptoras.rows) {
      const serieNorm = normalizarSerie(a.serie)
      const rgNorm = rgNormalizado(a.rg)
      const chave = `${serieNorm}|${rgNorm}`.toLowerCase()
      if (!grupos.has(chave)) grupos.set(chave, [])
      grupos.get(chave).push(a)
    }

    // Também buscar possíveis duplicatas: mesmo RG com serie diferente (ex: Mestiça que é receptora)
    const rgsReceptoras = new Set(receptoras.rows.map(a => rgNormalizado(a.rg)))
    if (rgsReceptoras.size > 0) {
      const suspeitos = await client.query(`
        SELECT id, nome, serie, rg, raca, situacao, data_chegada, fornecedor, created_at
        FROM animais 
        WHERE rg = ANY($1) 
        ORDER BY rg, id
      `, [Array.from(rgsReceptoras)])

      for (const a of suspeitos.rows) {
        const serieNorm = normalizarSerie(a.serie)
        const rgNorm = rgNormalizado(a.rg)
        const chave = `${serieNorm}|${rgNorm}`.toLowerCase()
        if (!grupos.has(chave)) grupos.set(chave, [])
        const grupo = grupos.get(chave)
        if (!grupo.find(x => x.id === a.id)) grupo.push(a)
      }
    }

    // Filtrar apenas grupos com duplicatas
    const duplicatas = []
    for (const [chave, animais] of grupos) {
      if (animais.length > 1) {
        duplicatas.push({ chave, animais })
      }
    }
    return duplicatas
  } finally {
    client.release()
  }
}

// Escolhe o animal canônico (manter): preferir serie no formato correto (só letras),
// depois o que tem mais dados relacionados (inseminações, TE, etc.)
async function escolherCanonico(client, animais) {
  const scores = await Promise.all(animais.map(async (a) => {
    let s = 0
    const serieTemSoLetras = /^[A-Za-z\s]+$/.test((a.serie || '').trim())
    if (serieTemSoLetras) s += 100  // preferir formato correto (M, não M9775)
    if (a.data_chegada) s += 20
    if (a.fornecedor) s += 10
    if (a.raca?.toLowerCase().includes('receptora')) s += 5
    // Contar registros relacionados - preferir o que tem mais dados
    const [ins, te, custos] = await Promise.all([
      client.query('SELECT COUNT(*) as c FROM inseminacoes WHERE animal_id = $1', [a.id]),
      client.query('SELECT COUNT(*) as c FROM transferencias_embrioes WHERE receptora_id = $1', [a.id]),
      client.query('SELECT COUNT(*) as c FROM custos WHERE animal_id = $1', [a.id])
    ])
    s += (parseInt(ins.rows[0]?.c || 0) * 30)
    s += (parseInt(te.rows[0]?.c || 0) * 40)
    s += (parseInt(custos.rows[0]?.c || 0) * 5)
    s -= a.id * 0.0001  // desempate: preferir menor ID
    return { animal: a, score: s }
  }))
  return scores.sort((x, y) => y.score - x.score)[0].animal
}

const TABELAS_ANIMAL_ID = [
  'custos',
  'localizacoes_animais',
  'inseminacoes',
  'mortes',
  'servicos',
  'protocolos_aplicados',
  'ciclos_reprodutivos',
  'historia_ocorrencias',
]

const TABELAS_RECEPTORA_ID = ['transferencias_embrioes']
const TABELAS_DOADORA_ID = ['transferencias_embrioes', 'coleta_fiv']

async function migrarReferencias(client, idAntigo, idNovo) {
  let total = 0
  for (const tabela of TABELAS_ANIMAL_ID) {
    try {
      const r = await client.query(
        `UPDATE ${tabela} SET animal_id = $1 WHERE animal_id = $2`,
        [idNovo, idAntigo]
      )
      total += r.rowCount
    } catch (e) {
      // Tabela pode não existir ou não ter a coluna
      if (!e.message?.includes('does not exist')) console.warn(`  ${tabela}:`, e.message)
    }
  }
  for (const tabela of TABELAS_RECEPTORA_ID) {
    try {
      const r = await client.query(
        `UPDATE ${tabela} SET receptora_id = $1 WHERE receptora_id = $2`,
        [idNovo, idAntigo]
      )
      total += r.rowCount
    } catch (e) {
      if (!e.message?.includes('does not exist')) console.warn(`  ${tabela} receptora:`, e.message)
    }
  }
  // movimentacoes_contabeis
  try {
    const r = await client.query(
      `UPDATE movimentacoes_contabeis SET animal_id = $1 WHERE animal_id = $2`,
      [idNovo, idAntigo]
    )
    total += r.rowCount
  } catch (e) {
    if (!e.message?.includes('does not exist')) console.warn('  movimentacoes_contabeis:', e.message)
  }
  return total
}

async function executarCorrecao(duplicatas, dryRun = true) {
  const client = await pool.connect()
  let corrigidos = 0
  let removidos = 0

  try {
    for (const { chave, animais } of duplicatas) {
      const canonico = await escolherCanonico(client, animais)
      const paraRemover = animais.filter(a => a.id !== canonico.id)

      console.log(`\n�Ÿ“‹ Grupo: ${chave}`)
      console.log(`   �œ… Manter: ID ${canonico.id} - ${canonico.nome} (${canonico.serie} ${canonico.rg})`)

      for (const dup of paraRemover) {
        console.log(`   �Œ Remover: ID ${dup.id} - ${dup.nome} (${dup.serie} ${dup.rg})`)

        if (!dryRun) {
          const migrados = await migrarReferencias(client, dup.id, canonico.id)
          if (migrados > 0) console.log(`      �†’ ${migrados} referências migradas para ID ${canonico.id}`)

          await client.query(`DELETE FROM animais WHERE id = $1`, [dup.id])
          removidos++
        }
      }

      // Atualizar serie/nome do canônico se estiver incorreto
      const serieCorreta = normalizarSerie(canonico.serie)
      const nomeCorreto = `${serieCorreta} ${canonico.rg}`.trim()
      if (canonico.serie !== serieCorreta || canonico.nome !== nomeCorreto) {
        if (!dryRun) {
          await client.query(
            `UPDATE animais SET serie = $1, nome = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [serieCorreta, nomeCorreto, canonico.id]
          )
          console.log(`   �Ÿ“� Corrigido nome/série do canônico para: ${nomeCorreto}`)
        } else {
          console.log(`   �Ÿ“� Seria corrigido nome/série para: ${nomeCorreto}`)
        }
        corrigidos++
      }
    }
  } finally {
    client.release()
  }

  return { corrigidos, removidos }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  console.log('�Ÿ”� Beef-Sync - Correção de Receptoras Duplicadas')
  console.log(dryRun ? '   Modo: DRY-RUN (use --execute para aplicar)\n' : '   Modo: EXECU�‡�ƒO\n')

  const duplicatas = await encontrarDuplicatas()
  console.log(`�Ÿ“Š Encontradas ${duplicatas.length} grupos de receptoras duplicadas\n`)

  if (duplicatas.length === 0) {
    console.log('�œ… Nenhuma duplicata encontrada.')
    await pool.end()
    return
  }

  const { corrigidos, removidos } = await executarCorrecao(duplicatas, dryRun)

  console.log('\n' + '='.repeat(50))
  if (dryRun) {
    console.log('�Ÿ“Œ Resumo (DRY-RUN):')
    console.log(`   - ${duplicatas.length} grupos de duplicatas`)
    console.log('   Execute com --execute para aplicar as correções.')
  } else {
    console.log('�œ… Correção concluída:')
    console.log(`   - ${removidos} duplicatas removidas`)
    console.log(`   - ${corrigidos} registros canônicos ajustados`)
  }
  await pool.end()
}

main().catch(err => {
  console.error('�Œ Erro:', err)
  process.exit(1)
})
