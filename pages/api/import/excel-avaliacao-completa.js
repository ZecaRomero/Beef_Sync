/**
 * POST /api/import/excel-avaliacao-completa
 * Lê um arquivo Excel com múltiplas abas e importa tudo de uma vez.
 *
 * Abas suportadas (detectadas pelo nome):
 *   PROCRIAR  → Puberdade
 *   DGT       → Carcaça
 *   GENEPLUS  → IQGg Básico + Pt IQGg Básico
 *   ANCP      → MGTe + TOP_MGTe + demais DEPs
 *   PMGZ      → DEP/DECA por trait (PN-Edg, PD-Edg, etc.)
 */

import formidable from 'formidable'
import ExcelJS from 'exceljs'
import fs from 'fs'
import { query } from '../../../lib/database'

export const config = { api: { bodyParser: false } }

// ── helpers ───────────────────────────────────────────────────────────────────
function cellVal(cell) {
  if (!cell) return null
  const v = cell.result !== undefined && cell.result !== null ? cell.result : cell.value
  if (v === null || v === undefined) return null
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map(t => t.text).join('').trim()
    if (v.text) return String(v.text).trim()
    if (v.result !== undefined) return v.result
    return null
  }
  return v
}

function toStr(v) {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' || s === '[object Object]' ? null : s
}

function toNum(v) {
  if (v == null || v === '' || v === '-') return null
  const s = String(v).replace(',', '.').trim()
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function parseSerieRg(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  const m = s.match(/^([A-Za-z]+)\s+(\d+)$/)
  if (m) return { serie: m[1].toUpperCase(), rg: m[2] }
  const m2 = s.match(/^([A-Za-z]+)-(\d+)$/)
  if (m2) return { serie: m2[1].toUpperCase(), rg: m2[2] }
  return null
}

// Retorna todas as linhas como arrays (1-indexed, valores brutos)
function sheetToRows(ws) {
  const rows = []
  ws.eachRow({ includeEmpty: false }, (row) => rows.push(row.values))
  return rows
}

// Encontra o índice da linha (0-based) que contém "SERIE E RG" na primeira coluna
function findHeaderRow(rows, maxSearch = 6) {
  for (let i = 0; i < Math.min(rows.length, maxSearch); i++) {
    const col1 = toStr(cellVal({ value: rows[i][1] })) || ''
    if (col1.toUpperCase().includes('SERIE') || col1.toUpperCase().includes('RG')) return i
  }
  return 0
}

// Acha o índice (1-based) da coluna cujo header contém algum dos candidatos
function findCol(headerRow, ...candidates) {
  for (let i = 1; i < headerRow.length; i++) {
    const v = toStr(cellVal({ value: headerRow[i] })) || ''
    const up = v.toUpperCase().replace(/[^A-Z0-9]/g, '')
    for (const c of candidates) {
      const cu = c.toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (up.includes(cu)) return i
    }
  }
  return -1
}

// ── PROCRIAR – Puberdade ──────────────────────────────────────────────────────
function parsePuberdade(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]
  const iClasse = findCol(hdr, 'CLASSE')
  const iIdade  = findCol(hdr, 'IDADE')
  const iPct    = findCol(hdr, 'MEDIA', '%MEDIA')
  const iGrupo  = findCol(hdr, 'GRUPO')
  const iClassif= findCol(hdr, 'CLASSIF')

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    result.push({
      ...srg,
      pub_classe:    toStr(cellVal({ value: r[iClasse] })),
      pub_idade:     toNum(cellVal({ value: r[iIdade] })),
      pub_pct_media: toNum(cellVal({ value: r[iPct] })),
      pub_grupo:     toStr(cellVal({ value: r[iGrupo] })),
      pub_classif:   toNum(cellVal({ value: r[iClassif] })),
    })
  }
  return result
}

// ── DGT – Carcaça ─────────────────────────────────────────────────────────────
function parseCarcaca(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]
  const iAol   = findCol(hdr, 'AOL')
  const iAol100= findCol(hdr, 'AOL100', 'AOL / 100', 'AOL/100')
  const iRatio = findCol(hdr, 'RATIO')
  const iMar   = findCol(hdr, 'MAR')
  const iEgs   = findCol(hdr, 'EGS')
  const iEgs100= findCol(hdr, 'EGS100', 'EGS / 100', 'EGS/100')
  const iPic   = findCol(hdr, 'PICANHA')

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    result.push({
      ...srg,
      carc_aol:       toNum(cellVal({ value: r[iAol] })),
      carc_aol_100kg: toNum(cellVal({ value: r[iAol100] })),
      carc_ratio:     toNum(cellVal({ value: r[iRatio] })),
      carc_mar:       toNum(cellVal({ value: r[iMar] })),
      carc_egs:       toNum(cellVal({ value: r[iEgs] })),
      carc_egs_100kg: toNum(cellVal({ value: r[iEgs100] })),
      carc_picanha:   toNum(cellVal({ value: r[iPic] })),
    })
  }
  return result
}

// ── GENEPLUS – IQGg Básico + Pt IQGg Básico ──────────────────────────────────
// Header está na linha 3 (row index 2): SERIE E RG | IQGg Básico | Pt IQGg Básico | Dep | Acc | Pt | ...
function parseGeneplus(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]

  // col 2 = IQGg Básico, col 3 = Pt IQGg Básico (posições fixas nesta planilha)
  // Mas também tentamos encontrar por nome
  let iIQG = findCol(hdr, 'IQGG BASICO', 'IQGg BASICO', 'IQGG B', 'BASICO')
  let iPt  = findCol(hdr, 'PT IQGG', 'PT IQGg', 'PT IQG')
  // fallback posição fixa se não achou por nome
  if (iIQG < 0) iIQG = 2
  if (iPt  < 0) iPt  = 3

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    const iqg = toNum(cellVal({ value: r[iIQG] }))
    const pt  = toNum(cellVal({ value: r[iPt] }))
    if (iqg == null && pt == null) continue
    result.push({
      ...srg,
      iqg:    iqg != null ? String(iqg) : null,
      pt_iqg: pt  != null ? String(pt)  : null,
    })
  }
  return result
}

// ── ANCP – MGTe, TOP_MGTe e DEPs secundários ─────────────────────────────────
// Header na linha 1: SERIE E RG | MGTe | TOP_MGTe | D3P | DIPP | TOP_DIPP | ...
function parseAncp(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]

  const iMGTe   = findCol(hdr, 'MGTE', 'MGTe')
  const iTOP    = findCol(hdr, 'TOP_MGTE', 'TOPMGTE')
  const iD3P    = findCol(hdr, 'D3P')
  const iDIPP   = findCol(hdr, 'DIPP')
  const iDPE365 = findCol(hdr, 'DPE365')
  const iDPN    = findCol(hdr, 'DPN')
  const iDSTAY  = findCol(hdr, 'DSTAY')
  const iMP120  = findCol(hdr, 'MP120')
  const iMP210  = findCol(hdr, 'MP210')
  const iDP450  = findCol(hdr, 'DP450')
  const iDAOL   = findCol(hdr, 'DAOL')
  const iDACAB  = findCol(hdr, 'DACAB')
  const iMAR    = findCol(hdr, 'MAR')

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    const mgte = toNum(cellVal({ value: r[iMGTe] }))
    const top  = toNum(cellVal({ value: r[iTOP] }))
    if (mgte == null) continue
    result.push({
      ...srg,
      mgte:     mgte != null ? String(mgte) : null,
      top:      top  != null ? String(top)  : null,
      // DEPs ANCP adicionais (armazenados em colunas genéricas futuras)
      ancp_d3p:    toNum(cellVal({ value: r[iD3P] })),
      ancp_dipp:   toNum(cellVal({ value: r[iDIPP] })),
      ancp_dpe365: toNum(cellVal({ value: r[iDPE365] })),
      ancp_dpn:    toNum(cellVal({ value: r[iDPN] })),
      ancp_dstay:  toNum(cellVal({ value: r[iDSTAY] })),
      ancp_mp120:  toNum(cellVal({ value: r[iMP120] })),
      ancp_mp210:  toNum(cellVal({ value: r[iMP210] })),
      ancp_dp450:  toNum(cellVal({ value: r[iDP450] })),
      ancp_daol:   toNum(cellVal({ value: r[iDAOL] })),
      ancp_dacab:  toNum(cellVal({ value: r[iDACAB] })),
      ancp_mar:    toNum(cellVal({ value: r[iMAR] })),
    })
  }
  return result
}

// ── PMGZ – DEP/DECA/P% por trait ─────────────────────────────────────────────
// Linha 1: categorias (CRESCIMENTO, REPRODUTIVAS, CARCAÇA)
// Linha 2: traits (PN-Edg, PD-Edg, PA-Edg, PS-Edg, IPPg, STAYg, PE-365g, AOLg, ACABg, MARg)
// Linha 3: SERIE E RG | DEP | DECA | P% | DEP | DECA | P% | ...
// → combina linhas 2+3 para montar mapa de colunas
function parsePmgz(ws) {
  const rows = sheetToRows(ws)
  // linha header real = row com "SERIE E RG"
  const hi = findHeaderRow(rows)
  if (hi < 1) return [] // precisa de pelo menos linha de traits antes

  const traitRow  = rows[hi - 1] // linha 2: nomes dos traits
  const headerRow = rows[hi]     // linha 3: DEP | DECA | P%

  // Montar mapa col → {trait, tipo}
  let lastTrait = ''
  const colMap = {}
  for (let i = 2; i < headerRow.length; i++) {
    const trait = toStr(cellVal({ value: traitRow[i] })) || lastTrait
    if (trait) lastTrait = trait
    const tipo = toStr(cellVal({ value: headerRow[i] })) || ''
    colMap[i] = { trait: trait.replace(/[^A-Za-z0-9]/g, '').toLowerCase(), tipo: tipo.toUpperCase().replace(/[^A-Z0-9]/g, '') }
  }

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    const obj = { ...srg }
    for (const [col, { trait, tipo }] of Object.entries(colMap)) {
      if (!trait || !tipo) continue
      const val = toNum(cellVal({ value: r[parseInt(col)] }))
      if (val != null) obj[`pmgz_${trait}_${tipo.toLowerCase()}`] = val
    }
    result.push(obj)
  }
  return result
}

// ── detectar tipo da aba ──────────────────────────────────────────────────────
function detectTipo(name) {
  const n = name.toUpperCase().trim()
  if (n.includes('PROCRIAR') || n.includes('PUBERD')) return 'puberdade'
  if (n.includes('DGT') || n.includes('CARCAC')) return 'carcaca'
  if (n.includes('GENEPLUS')) return 'geneplus'
  if (n.includes('ANCP')) return 'ancp'
  if (n.includes('PMGZ')) return 'pmgz'
  return null
}

// ── gravar no banco ───────────────────────────────────────────────────────────
async function upsertRows(tipo, data, stats) {
  for (const row of data) {
    try {
      const found = await query(
        `SELECT id FROM animais WHERE UPPER(serie) = $1 AND rg = $2 LIMIT 1`,
        [row.serie.toUpperCase(), row.rg]
      )
      if (!found.rows.length) { stats.naoEncontrados.push(`${row.serie} ${row.rg}`); continue }
      const id = found.rows[0].id

      if (tipo === 'puberdade') {
        await query(
          `UPDATE animais SET pub_classe=$1, pub_idade=$2, pub_pct_media=$3, pub_grupo=$4, pub_classif=$5, updated_at=NOW() WHERE id=$6`,
          [row.pub_classe, row.pub_idade, row.pub_pct_media, row.pub_grupo, row.pub_classif, id]
        )
      } else if (tipo === 'carcaca') {
        await query(
          `UPDATE animais SET carc_aol=$1, carc_aol_100kg=$2, carc_ratio=$3, carc_mar=$4, carc_egs=$5, carc_egs_100kg=$6, carc_picanha=$7, updated_at=NOW() WHERE id=$8`,
          [row.carc_aol, row.carc_aol_100kg, row.carc_ratio, row.carc_mar, row.carc_egs, row.carc_egs_100kg, row.carc_picanha, id]
        )
      } else if (tipo === 'geneplus') {
        const sets = []; const vals = []; let idx = 1
        if (row.iqg    != null) { sets.push(`iqg=$${idx++}`);    vals.push(row.iqg) }
        if (row.pt_iqg != null) { sets.push(`pt_iqg=$${idx++}`); vals.push(row.pt_iqg) }
        if (!sets.length) continue
        vals.push(id)
        await query(`UPDATE animais SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${idx}`, vals)
      } else if (tipo === 'ancp') {
        const sets = []; const vals = []; let idx = 1
        if (row.mgte != null) { sets.push(`mgte=$${idx++}`);  vals.push(row.mgte) }
        if (row.top  != null) { sets.push(`"top"=$${idx++}`); vals.push(row.top) }
        if (!sets.length) continue
        vals.push(id)
        await query(`UPDATE animais SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${idx}`, vals)
      } else if (tipo === 'pmgz') {
        // PMGZ: por enquanto só salva campos que já existem (mgte, abczg, deca, iqg, pt_iqg)
        const sets = []; const vals = []; let idx = 1
        // Procura campos mapeados para colunas existentes
        const mgte  = row.pmgz_mgte_dep  ?? row.pmgz_mgted_dep
        const abczg = row.pmgz_iabczg_dep ?? row.pmgz_abczg_dep
        const deca  = row.pmgz_deca_dep   ?? row.pmgz_decae_dep
        const iqg   = row.pmgz_iqgg_dep   ?? row.pmgz_iqg_dep
        const pt    = row.pmgz_ptiqgg_dep ?? row.pmgz_ptiqg_dep
        if (mgte  != null) { sets.push(`mgte=$${idx++}`);   vals.push(String(mgte)) }
        if (abczg != null) { sets.push(`abczg=$${idx++}`);  vals.push(String(abczg)) }
        if (deca  != null) { sets.push(`deca=$${idx++}`);   vals.push(String(deca)) }
        if (iqg   != null) { sets.push(`iqg=$${idx++}`);    vals.push(String(iqg)) }
        if (pt    != null) { sets.push(`pt_iqg=$${idx++}`); vals.push(String(pt)) }
        if (!sets.length) continue
        vals.push(id)
        await query(`UPDATE animais SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${idx}`, vals)
      }

      stats.atualizados++
    } catch (e) {
      stats.erros.push({ id: `${row.serie} ${row.rg}`, erro: e.message })
    }
  }
}

// ── handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const form = formidable({ maxFileSize: 50 * 1024 * 1024 })
  let files
  try {
    ;[, files] = await form.parse(req)
  } catch (e) {
    return res.status(400).json({ error: 'Erro ao receber arquivo: ' + e.message })
  }

  const file = Array.isArray(files.file) ? files.file[0] : files.file
  if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' })

  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.readFile(file.filepath)
  } catch (e) {
    return res.status(400).json({ error: 'Erro ao ler Excel: ' + e.message })
  } finally {
    try { fs.unlinkSync(file.filepath) } catch (_) {}
  }

  const stats = { atualizados: 0, naoEncontrados: [], erros: [], abas: [] }

  for (const ws of wb.worksheets) {
    const tipo = detectTipo(ws.name)
    if (!tipo) { stats.abas.push({ nome: ws.name, tipo: 'ignorada', registros: 0, atualizados: 0 }); continue }

    let dados = []
    try {
      if (tipo === 'puberdade') dados = parsePuberdade(ws)
      else if (tipo === 'carcaca') dados = parseCarcaca(ws)
      else if (tipo === 'geneplus') dados = parseGeneplus(ws)
      else if (tipo === 'ancp') dados = parseAncp(ws)
      else if (tipo === 'pmgz') dados = parsePmgz(ws)
    } catch (e) {
      stats.abas.push({ nome: ws.name, tipo, registros: 0, atualizados: 0, erro: e.message })
      continue
    }

    const antes = stats.atualizados
    await upsertRows(tipo, dados, stats)
    stats.abas.push({ nome: ws.name, tipo, registros: dados.length, atualizados: stats.atualizados - antes })
  }

  return res.status(200).json({
    success: true,
    message: `${stats.atualizados} animal(is) atualizado(s) em ${stats.abas.filter(a => a.tipo !== 'ignorada').length} aba(s).`,
    abas: stats.abas,
    naoEncontrados: stats.naoEncontrados.length,
    erros: stats.erros.length,
    exemplosNaoEncontrados: stats.naoEncontrados.slice(0, 10),
    exemplosErros: stats.erros.slice(0, 5),
  })
}
