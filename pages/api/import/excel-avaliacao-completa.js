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

import ExcelJS from 'exceljs'
import formidable from 'formidable'
import fs from 'fs'
import { query } from '../../../lib/database'
// lib/database.js é CommonJS; evitar named import de createTables.
const { createTables } = require('../../../lib/database')

export const config = { api: { bodyParser: false }, maxDuration: 300 }

// Observação: maxDuration evita timeout durante alterações de schema.

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
  
  // Ex: "CJCJ 16974" ou "CJCJ   16974"
  const m = s.match(/^([A-Za-z]+)\s+(\d+)$/)
  if (m) return { serie: m[1].toUpperCase(), rg: m[2] }
  
  // Ex: "CJCJ-16974"
  const m2 = s.match(/^([A-Za-z]+)-(\d+)$/)
  if (m2) return { serie: m2[1].toUpperCase(), rg: m2[2] }
  
  // Ex: "CJCJ16974" (sem espaço)
  const m3 = s.match(/^([A-Za-z]+)(\d+)$/)
  if (m3) return { serie: m3[1].toUpperCase(), rg: m3[2] }
  
  // Se for só número (sem série), vamos retornar a série como null para tentar fallback se necessário,
  // ou no caso do import, se a série é obrigatória, talvez não passe. Mas vamos extrair o RG.
  const m4 = s.match(/^(\d+)$/)
  if (m4) return { serie: '', rg: m4[1] }

  // Ex: "LIRA SANT ANNA 16179" (nome + RG no final)
  // Extrai o RG pelos dígitos finais para permitir fallback de busca só por RG.
  const m5 = s.match(/(\d+)\s*$/)
  if (m5) return { serie: '', rg: m5[1] }

  return null
}

// Retorna todas as linhas como arrays (1-indexed, valores brutos)
function sheetToRows(ws) {
  const rows = []
  ws.eachRow({ includeEmpty: false }, (row) => rows.push(row.values))
  return rows
}

// Encontra o índice da linha (0-based) que contém "SERIE E RG" na primeira coluna
function findHeaderRow(rows, maxSearch = 20) {
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

// ── GENEPLUS – Todas as colunas (38 colunas) ─────────────────────────────────
// Header linha 1: SERIE E RG | IQGg Básico | Pt IQGg Básico | PN(Kg) | Acc | Pt | P120(Kg)EM | Acc | Pt | ...
function parseGeneplus(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]

  // Mapeamento de colunas (posição fixa baseada no Excel)
  // Coluna A = 1 (SERIE E RG)
  // Coluna B = 2 (IQGg Básico)
  // Coluna C = 3 (Pt IQGg Básico)
  // E assim por diante...
  
  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    
    const iqg = toNum(cellVal({ value: r[2] }))  // IQGg Básico
    const pt_iqg = toNum(cellVal({ value: r[3] }))  // Pt IQGg Básico
    
    // Se não tem nem IQG nem Pt IQG, pula
    if (iqg == null && pt_iqg == null) continue
    
    result.push({
      ...srg,
      iqg: iqg != null ? String(iqg) : null,
      pt_iqg: pt_iqg != null ? String(pt_iqg) : null,
      // PN (Kg) - colunas C, D, E
      gp_pn_kg: toNum(cellVal({ value: r[4] })),
      gp_pn_acc: toNum(cellVal({ value: r[5] })),
      gp_pn_pt: toNum(cellVal({ value: r[6] })),
      // P120 (Kg) EM - colunas F, G, H
      gp_p120_kg_em: toNum(cellVal({ value: r[7] })),
      gp_p120_acc: toNum(cellVal({ value: r[8] })),
      gp_p120_pt: toNum(cellVal({ value: r[9] })),
      // P2 (Kg) - colunas I, J, K
      gp_p2_kg: toNum(cellVal({ value: r[10] })),
      gp_p2_acc: toNum(cellVal({ value: r[11] })),
      gp_p2_pt: toNum(cellVal({ value: r[12] })),
      // P5 (Kg) - colunas L, M, N
      gp_p5_kg: toNum(cellVal({ value: r[13] })),
      gp_p5_acc: toNum(cellVal({ value: r[14] })),
      gp_p5_pt: toNum(cellVal({ value: r[15] })),
      // HP/STAY (%) - colunas O, P, Q
      gp_hp_stay_pct: toNum(cellVal({ value: r[16] })),
      gp_hp_stay_acc: toNum(cellVal({ value: r[17] })),
      gp_hp_stay_pt: toNum(cellVal({ value: r[18] })),
      // IPP (0,1 em) - colunas R, S, T
      gp_ipp_01em: toNum(cellVal({ value: r[19] })),
      gp_ipp_acc: toNum(cellVal({ value: r[20] })),
      gp_ipp_pt: toNum(cellVal({ value: r[21] })),
      // IPP (dias) - colunas U, V, W
      gp_ipp_dias: toNum(cellVal({ value: r[22] })),
      gp_ipp_dias_acc: toNum(cellVal({ value: r[23] })),
      gp_ipp_dias_pt: toNum(cellVal({ value: r[24] })),
      // PFP30 (%) - colunas X, Y, Z
      gp_pfp30_pct: toNum(cellVal({ value: r[25] })),
      gp_pfp30_acc: toNum(cellVal({ value: r[26] })),
      gp_pfp30_pt: toNum(cellVal({ value: r[27] })),
      // RD (%) - colunas AA, AB, AC
      gp_rd_pct: toNum(cellVal({ value: r[28] })),
      gp_rd_acc: toNum(cellVal({ value: r[29] })),
      gp_rd_pt: toNum(cellVal({ value: r[30] })),
      // AOL (cm²) - colunas AD, AE, AF
      gp_aol_cm2: toNum(cellVal({ value: r[31] })),
      gp_aol_acc: toNum(cellVal({ value: r[32] })),
      gp_aol_pt: toNum(cellVal({ value: r[33] })),
      // EGS (0,1 mm) - colunas AG, AH, AI
      gp_egs_01mm: toNum(cellVal({ value: r[34] })),
      gp_egs_acc: toNum(cellVal({ value: r[35] })),
      gp_egs_pt: toNum(cellVal({ value: r[36] })),
      // MAR (%) - colunas AJ, AK, AL
      gp_mar_pct: toNum(cellVal({ value: r[37] })),
      gp_mar_acc: toNum(cellVal({ value: r[38] })),
      gp_mar_pt: toNum(cellVal({ value: r[39] })),
    })
  }
  return result
}

// ── ANCP – MGTe, TOP_MGTe e DEPs secundários ─────────────────────────────────
// Header na linha 1: SERIE E RG | MGTe | TOP_MGTe | D3P | TOP | DIPP | TOP | ...
function parseAncp(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]

  const iMGTe   = findCol(hdr, 'MGTE', 'MGTe')
  const iTOP    = findCol(hdr, 'TOP_MGTE', 'TOPMGTE', 'TOP')
  const iD3P    = findCol(hdr, 'D3P')
  const iTOP_D3P = findCol(hdr, 'TOP_D3P', 'TOPD3P')
  const iDIPP   = findCol(hdr, 'DIPP')
  const iTOP_DIPP = findCol(hdr, 'TOP_DIPP', 'TOPDIPP')
  const iDPE365 = findCol(hdr, 'DPE365')
  const iTOP_DPE365 = findCol(hdr, 'TOP_DPE365', 'TOPDPE365')
  const iDPN    = findCol(hdr, 'DPN')
  const iTOP_DPN = findCol(hdr, 'TOP_DPN', 'TOPDPN')
  const iDSTAY  = findCol(hdr, 'DSTAY')
  const iTOP_DSTAY = findCol(hdr, 'TOP_DSTAY', 'TOPDSTAY')
  const iMP120  = findCol(hdr, 'MP120')
  const iTOP_MP120 = findCol(hdr, 'TOP_MP120', 'TOPMP120')
  const iMP210  = findCol(hdr, 'MP210')
  const iTOP_MP210 = findCol(hdr, 'TOP_MP210', 'TOPMP210')
  const iDP450  = findCol(hdr, 'DP450')
  const iTOP_DP450 = findCol(hdr, 'TOP_DP450', 'TOPDP450')
  const iDAOL   = findCol(hdr, 'DAOL')
  const iTOP_DAOL = findCol(hdr, 'TOP_DAOL', 'TOPDAOL')
  const iDACAB  = findCol(hdr, 'DACAB')
  const iTOP_DACAB = findCol(hdr, 'TOP_DACAB', 'TOPDACAB')
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
      // DEPs ANCP adicionais
      ancp_d3p:    toNum(cellVal({ value: r[iD3P] })),
      ancp_top_d3p: toNum(cellVal({ value: r[iTOP_D3P] })),
      ancp_dipp:   toNum(cellVal({ value: r[iDIPP] })),
      ancp_top_dipp: toNum(cellVal({ value: r[iTOP_DIPP] })),
      ancp_dpe365: toNum(cellVal({ value: r[iDPE365] })),
      ancp_top_dpe365: toNum(cellVal({ value: r[iTOP_DPE365] })),
      ancp_dpn:    toNum(cellVal({ value: r[iDPN] })),
      ancp_top_dpn: toNum(cellVal({ value: r[iTOP_DPN] })),
      ancp_dstay:  toNum(cellVal({ value: r[iDSTAY] })),
      ancp_top_dstay: toNum(cellVal({ value: r[iTOP_DSTAY] })),
      ancp_mp120:  toNum(cellVal({ value: r[iMP120] })),
      ancp_top_mp120: toNum(cellVal({ value: r[iTOP_MP120] })),
      ancp_mp210:  toNum(cellVal({ value: r[iMP210] })),
      ancp_top_mp210: toNum(cellVal({ value: r[iTOP_MP210] })),
      ancp_dp450:  toNum(cellVal({ value: r[iDP450] })),
      ancp_top_dp450: toNum(cellVal({ value: r[iTOP_DP450] })),
      ancp_daol:   toNum(cellVal({ value: r[iDAOL] })),
      ancp_top_daol: toNum(cellVal({ value: r[iTOP_DAOL] })),
      ancp_dacab:  toNum(cellVal({ value: r[iDACAB] })),
      ancp_top_dacab: toNum(cellVal({ value: r[iTOP_DACAB] })),
      ancp_mar:    toNum(cellVal({ value: r[iMAR] })),
    })
  }
  return result
}

// Mapa: nome do trait no Excel → prefixo da coluna no banco
const PMGZ_TRAIT_MAP = {
  'PN-Edg': 'pn',
  'PD-Edg': 'pd',
  'PA-Edg': 'pa',
  'PS-Edg': 'ps',
  'IPPg':   'ipp',
  'STAYg':  'stay',
  'PE-365g':'pe365',
  'AOLg':   'aol',
  'ACABg':  'acab',
  'MARg':   'mar',
}

// ── PMGZ – DEP/DECA/P% por trait ─────────────────────────────────────────────
// Linha 1: categorias (CRESCIMENTO, REPRODUTIVAS, CARCAÇA)
// Linha 2: traits (PN-Edg, PD-Edg, PA-Edg, PS-Edg, IPPg, STAYg, PE-365g, AOLg, ACABg, MARg)
// Linha 3: SERIE E RG | DEP | DECA | P% | DEP | DECA | P% | ...
function parsePmgz(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  if (hi < 1) return []

  const traitRow  = rows[hi - 1] // linha 2: nomes dos traits
  const headerRow = rows[hi]     // linha 3: DEP | DECA | P%

  // Monta mapa col → coluna no banco (ex: 'pmgz_pn_dep')
  const colMap = {}
  let lastTrait = ''
  for (let i = 2; i < headerRow.length; i++) {
    const traitRaw = toStr(cellVal({ value: traitRow[i] }))
    if (traitRaw) lastTrait = traitRaw
    const prefix = PMGZ_TRAIT_MAP[lastTrait]
    if (!prefix) continue
    const tipo = toStr(cellVal({ value: headerRow[i] })) || ''
    const tipoUp = tipo.toUpperCase().replace(/\s+/g, '')
    if      (tipoUp === 'DEP')  colMap[i] = `pmgz_${prefix}_dep`
    else if (tipoUp === 'DECA') colMap[i] = `pmgz_${prefix}_deca`
    else if (tipoUp === 'P%')   colMap[i] = `pmgz_${prefix}_pct`
  }

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    const obj = { ...srg }
    for (const [col, colName] of Object.entries(colMap)) {
      const val = toNum(cellVal({ value: r[parseInt(col)] }))
      if (val != null) obj[colName] = val
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
      let found
      const serieStr = (row.serie || '').toUpperCase().trim()
      const rgStr = String(row.rg).trim()

      if (serieStr) {
        // Busca flexível por série e RG (ignorando zeros à esquerda no RG)
        found = await query(
          `SELECT id FROM animais 
           WHERE UPPER(TRIM(serie)) = $1 
             AND (TRIM(rg::text) = $2 OR TRIM(LEADING '0' FROM rg::text) = TRIM(LEADING '0' FROM $2)) 
           LIMIT 1`,
          [serieStr, rgStr]
        )
      } else {
        // Se só tem RG (sem série), tenta encontrar o animal se houver apenas 1 com esse RG
        found = await query(
          `SELECT id FROM animais 
           WHERE TRIM(rg::text) = $1 OR TRIM(LEADING '0' FROM rg::text) = TRIM(LEADING '0' FROM $1)
           LIMIT 2`,
          [rgStr]
        )
        // Só aceita se encontrar exatamente 1 animal (para evitar ambiguidade entre séries diferentes)
        if (found.rows.length !== 1) {
          found = { rows: [] }
        }
      }

      if (!found.rows.length) { 
        stats.naoEncontrados.push(`${row.serie || ''} ${row.rg}`.trim()); 
        continue 
      }
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
        if (row.iqg != null) { sets.push(`iqg=$${idx++}`); vals.push(row.iqg) }
        if (row.pt_iqg != null) { sets.push(`pt_iqg=$${idx++}`); vals.push(row.pt_iqg) }
        if (row.gp_pn_kg != null) { sets.push(`gp_pn_kg=$${idx++}`); vals.push(row.gp_pn_kg) }
        if (row.gp_pn_acc != null) { sets.push(`gp_pn_acc=$${idx++}`); vals.push(row.gp_pn_acc) }
        if (row.gp_pn_pt != null) { sets.push(`gp_pn_pt=$${idx++}`); vals.push(row.gp_pn_pt) }
        if (row.gp_p120_kg_em != null) { sets.push(`gp_p120_kg_em=$${idx++}`); vals.push(row.gp_p120_kg_em) }
        if (row.gp_p120_acc != null) { sets.push(`gp_p120_acc=$${idx++}`); vals.push(row.gp_p120_acc) }
        if (row.gp_p120_pt != null) { sets.push(`gp_p120_pt=$${idx++}`); vals.push(row.gp_p120_pt) }
        if (row.gp_p2_kg != null) { sets.push(`gp_p2_kg=$${idx++}`); vals.push(row.gp_p2_kg) }
        if (row.gp_p2_acc != null) { sets.push(`gp_p2_acc=$${idx++}`); vals.push(row.gp_p2_acc) }
        if (row.gp_p2_pt != null) { sets.push(`gp_p2_pt=$${idx++}`); vals.push(row.gp_p2_pt) }
        if (row.gp_p5_kg != null) { sets.push(`gp_p5_kg=$${idx++}`); vals.push(row.gp_p5_kg) }
        if (row.gp_p5_acc != null) { sets.push(`gp_p5_acc=$${idx++}`); vals.push(row.gp_p5_acc) }
        if (row.gp_p5_pt != null) { sets.push(`gp_p5_pt=$${idx++}`); vals.push(row.gp_p5_pt) }
        if (row.gp_hp_stay_pct != null) { sets.push(`gp_hp_stay_pct=$${idx++}`); vals.push(row.gp_hp_stay_pct) }
        if (row.gp_hp_stay_acc != null) { sets.push(`gp_hp_stay_acc=$${idx++}`); vals.push(row.gp_hp_stay_acc) }
        if (row.gp_hp_stay_pt != null) { sets.push(`gp_hp_stay_pt=$${idx++}`); vals.push(row.gp_hp_stay_pt) }
        if (row.gp_ipp_01em != null) { sets.push(`gp_ipp_01em=$${idx++}`); vals.push(row.gp_ipp_01em) }
        if (row.gp_ipp_acc != null) { sets.push(`gp_ipp_acc=$${idx++}`); vals.push(row.gp_ipp_acc) }
        if (row.gp_ipp_pt != null) { sets.push(`gp_ipp_pt=$${idx++}`); vals.push(row.gp_ipp_pt) }
        if (row.gp_ipp_dias != null) { sets.push(`gp_ipp_dias=$${idx++}`); vals.push(row.gp_ipp_dias) }
        if (row.gp_ipp_dias_acc != null) { sets.push(`gp_ipp_dias_acc=$${idx++}`); vals.push(row.gp_ipp_dias_acc) }
        if (row.gp_ipp_dias_pt != null) { sets.push(`gp_ipp_dias_pt=$${idx++}`); vals.push(row.gp_ipp_dias_pt) }
        if (row.gp_pfp30_pct != null) { sets.push(`gp_pfp30_pct=$${idx++}`); vals.push(row.gp_pfp30_pct) }
        if (row.gp_pfp30_acc != null) { sets.push(`gp_pfp30_acc=$${idx++}`); vals.push(row.gp_pfp30_acc) }
        if (row.gp_pfp30_pt != null) { sets.push(`gp_pfp30_pt=$${idx++}`); vals.push(row.gp_pfp30_pt) }
        if (row.gp_rd_pct != null) { sets.push(`gp_rd_pct=$${idx++}`); vals.push(row.gp_rd_pct) }
        if (row.gp_rd_acc != null) { sets.push(`gp_rd_acc=$${idx++}`); vals.push(row.gp_rd_acc) }
        if (row.gp_rd_pt != null) { sets.push(`gp_rd_pt=$${idx++}`); vals.push(row.gp_rd_pt) }
        if (row.gp_aol_cm2 != null) { sets.push(`gp_aol_cm2=$${idx++}`); vals.push(row.gp_aol_cm2) }
        if (row.gp_aol_acc != null) { sets.push(`gp_aol_acc=$${idx++}`); vals.push(row.gp_aol_acc) }
        if (row.gp_aol_pt != null) { sets.push(`gp_aol_pt=$${idx++}`); vals.push(row.gp_aol_pt) }
        if (row.gp_egs_01mm != null) { sets.push(`gp_egs_01mm=$${idx++}`); vals.push(row.gp_egs_01mm) }
        if (row.gp_egs_acc != null) { sets.push(`gp_egs_acc=$${idx++}`); vals.push(row.gp_egs_acc) }
        if (row.gp_egs_pt != null) { sets.push(`gp_egs_pt=$${idx++}`); vals.push(row.gp_egs_pt) }
        if (row.gp_mar_pct != null) { sets.push(`gp_mar_pct=$${idx++}`); vals.push(row.gp_mar_pct) }
        if (row.gp_mar_acc != null) { sets.push(`gp_mar_acc=$${idx++}`); vals.push(row.gp_mar_acc) }
        if (row.gp_mar_pt != null) { sets.push(`gp_mar_pt=$${idx++}`); vals.push(row.gp_mar_pt) }
        if (!sets.length) continue
        vals.push(id)
        await query(`UPDATE animais SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${idx}`, vals)
      } else if (tipo === 'ancp') {
        const sets = []; const vals = []; let idx = 1
        if (row.mgte != null) { sets.push(`mgte=$${idx++}`);  vals.push(row.mgte) }
        if (row.top  != null) { sets.push(`"top"=$${idx++}`); vals.push(row.top) }
        // DEPs ANCP adicionais
        if (row.ancp_d3p != null) { sets.push(`ancp_d3p=$${idx++}`); vals.push(row.ancp_d3p) }
        if (row.ancp_top_d3p != null) { sets.push(`ancp_top_d3p=$${idx++}`); vals.push(row.ancp_top_d3p) }
        if (row.ancp_dipp != null) { sets.push(`ancp_dipp=$${idx++}`); vals.push(row.ancp_dipp) }
        if (row.ancp_top_dipp != null) { sets.push(`ancp_top_dipp=$${idx++}`); vals.push(row.ancp_top_dipp) }
        if (row.ancp_dpe365 != null) { sets.push(`ancp_dpe365=$${idx++}`); vals.push(row.ancp_dpe365) }
        if (row.ancp_top_dpe365 != null) { sets.push(`ancp_top_dpe365=$${idx++}`); vals.push(row.ancp_top_dpe365) }
        if (row.ancp_dpn != null) { sets.push(`ancp_dpn=$${idx++}`); vals.push(row.ancp_dpn) }
        if (row.ancp_top_dpn != null) { sets.push(`ancp_top_dpn=$${idx++}`); vals.push(row.ancp_top_dpn) }
        if (row.ancp_dstay != null) { sets.push(`ancp_dstay=$${idx++}`); vals.push(row.ancp_dstay) }
        if (row.ancp_top_dstay != null) { sets.push(`ancp_top_dstay=$${idx++}`); vals.push(row.ancp_top_dstay) }
        if (row.ancp_mp120 != null) { sets.push(`ancp_mp120=$${idx++}`); vals.push(row.ancp_mp120) }
        if (row.ancp_top_mp120 != null) { sets.push(`ancp_top_mp120=$${idx++}`); vals.push(row.ancp_top_mp120) }
        if (row.ancp_mp210 != null) { sets.push(`ancp_mp210=$${idx++}`); vals.push(row.ancp_mp210) }
        if (row.ancp_top_mp210 != null) { sets.push(`ancp_top_mp210=$${idx++}`); vals.push(row.ancp_top_mp210) }
        if (row.ancp_dp450 != null) { sets.push(`ancp_dp450=$${idx++}`); vals.push(row.ancp_dp450) }
        if (row.ancp_top_dp450 != null) { sets.push(`ancp_top_dp450=$${idx++}`); vals.push(row.ancp_top_dp450) }
        if (row.ancp_daol != null) { sets.push(`ancp_daol=$${idx++}`); vals.push(row.ancp_daol) }
        if (row.ancp_top_daol != null) { sets.push(`ancp_top_daol=$${idx++}`); vals.push(row.ancp_top_daol) }
        if (row.ancp_dacab != null) { sets.push(`ancp_dacab=$${idx++}`); vals.push(row.ancp_dacab) }
        if (row.ancp_top_dacab != null) { sets.push(`ancp_top_dacab=$${idx++}`); vals.push(row.ancp_top_dacab) }
        if (row.ancp_mar != null) { sets.push(`ancp_mar=$${idx++}`); vals.push(row.ancp_mar) }
        if (!sets.length) continue
        vals.push(id)
        await query(`UPDATE animais SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${idx}`, vals)
      } else if (tipo === 'pmgz') {
        // Salva todas as colunas pmgz_* presentes no objeto
        const sets = []; const vals = []; let idx = 1
        const PMGZ_COLS = [
          'pmgz_pn_dep','pmgz_pn_deca','pmgz_pn_pct',
          'pmgz_pd_dep','pmgz_pd_deca','pmgz_pd_pct',
          'pmgz_pa_dep','pmgz_pa_deca','pmgz_pa_pct',
          'pmgz_ps_dep','pmgz_ps_deca','pmgz_ps_pct',
          'pmgz_ipp_dep','pmgz_ipp_deca','pmgz_ipp_pct',
          'pmgz_stay_dep','pmgz_stay_deca','pmgz_stay_pct',
          'pmgz_pe365_dep','pmgz_pe365_deca','pmgz_pe365_pct',
          'pmgz_aol_dep','pmgz_aol_deca','pmgz_aol_pct',
          'pmgz_acab_dep','pmgz_acab_deca','pmgz_acab_pct',
          'pmgz_mar_dep','pmgz_mar_deca','pmgz_mar_pct',
        ]
        for (const col of PMGZ_COLS) {
          if (row[col] != null) { sets.push(`${col}=$${idx++}`); vals.push(row[col]) }
        }
        if (!sets.length) continue
        vals.push(id)
        await query(`UPDATE animais SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${idx}`, vals)
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

  // Garante que as colunas (pub_*, carc_*, pmgz_*, gp_*, ancp_*) existam no banco
  // antes de tentar UPDATE. Isso evita cenário onde o banco remoto está com schema antigo.
  await createTables()

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

  const hasErrors = (stats.erros?.length || 0) > 0

  return res.status(200).json({
    success: !hasErrors,
    message: hasErrors
      ? `${stats.atualizados} animal(is) atualizados, porém ${stats.erros.length} erro(s) ocorreram (ver campo "erros").`
      : `${stats.atualizados} animal(is) atualizado(s) em ${stats.abas.filter(a => a.tipo !== 'ignorada').length} aba(s).`,
    abas: stats.abas,
    naoEncontrados: stats.naoEncontrados.length,
    erros: stats.erros.length,
    exemplosNaoEncontrados: stats.naoEncontrados.slice(0, 10),
    exemplosErros: stats.erros.slice(0, 5),
  })
}
