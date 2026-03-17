/**
 * POST /api/import/excel-avaliacao-completa
 * Lê um arquivo Excel com múltiplas abas de avaliação e importa tudo de uma vez.
 *
 * Abas reconhecidas (case-insensitive, busca por nome parcial):
 *   PROCRIAR  → Puberdade: SERIE E RG | CLASSE | IDADE | %MÉDIA | GRUPO | CLASSIF
 *   GENEPLUS  → Genética GENEPLUS: SERIE E RG | IQg Básico | Pt IQg | ...
 *   ANCP      → Genética ANCP: SERIE E RG | MGTe | TOP | ...
 *   PMGZ      → Genética PMGZ: SERIE E RG | MGTe | TOP | DEP/DECA cols
 *   DGT       → Carcaça: SERIE E RG | AOL | AOL/100kg | RATIO | MAR | EGS | EGS/100kg | PICANHA
 */

import formidable from 'formidable'
import ExcelJS from 'exceljs'
import fs from 'fs'
import { query } from '../../../lib/database'

export const config = { api: { bodyParser: false } }

// ── helpers ───────────────────────────────────────────────────────────────────
function cellVal(cell) {
  if (!cell) return null
  const v = cell.result !== undefined ? cell.result : cell.value
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
  return s === '' ? null : s
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
  // "CJCJ 16974"
  const m = s.match(/^([A-Za-z]+)\s+(\d+)$/)
  if (m) return { serie: m[1].toUpperCase(), rg: m[2] }
  // "CJCJ-16974"
  const m2 = s.match(/^([A-Za-z]+)-(\d+)$/)
  if (m2) return { serie: m2[1].toUpperCase(), rg: m2[2] }
  return null
}

function sheetToRows(ws) {
  const rows = []
  ws.eachRow({ includeEmpty: false }, (row) => {
    rows.push(row.values) // 1-indexed
  })
  return rows
}

function colIndex(headerRow, ...candidates) {
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

// ── parsers por aba ───────────────────────────────────────────────────────────
function parsePuberdade(ws) {
  const rows = sheetToRows(ws)
  if (rows.length < 2) return []
  // encontra linha de header (contém CLASSE ou GRUPO)
  let hi = 0
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const r = rows[i]
    const str = r.map(v => toStr(cellVal({ value: v })) || '').join(' ').toUpperCase()
    if (str.includes('CLASSE') || str.includes('GRUPO')) { hi = i; break }
  }
  const hdr = rows[hi]
  const iSRG    = colIndex(hdr, 'SERIE E RG', 'SERIERГ', 'RG')
  const iClasse = colIndex(hdr, 'CLASSE')
  const iIdade  = colIndex(hdr, 'IDADE')
  const iPct    = colIndex(hdr, 'MEDIA', '%MEDIA', 'PMEDIA')
  const iGrupo  = colIndex(hdr, 'GRUPO')
  const iClassif= colIndex(hdr, 'CLASSIF')

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[iSRG] }))
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

function parseCarcaca(ws) {
  const rows = sheetToRows(ws)
  if (rows.length < 2) return []
  let hi = 0
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const str = rows[i].map(v => toStr(cellVal({ value: v })) || '').join(' ').toUpperCase()
    if (str.includes('AOL') || str.includes('PICANHA') || str.includes('EGS')) { hi = i; break }
  }
  const hdr = rows[hi]
  const iSRG   = colIndex(hdr, 'SERIE E RG', 'RG')
  const iAol   = colIndex(hdr, 'AOL')
  const iAol100= colIndex(hdr, 'AOL100', 'AOL/100')
  const iRatio = colIndex(hdr, 'RATIO')
  const iMar   = colIndex(hdr, 'MAR')
  const iEgs   = colIndex(hdr, 'EGS')
  const iEgs100= colIndex(hdr, 'EGS100', 'EGS/100')
  const iPic   = colIndex(hdr, 'PICANHA')

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[iSRG] }))
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

function parseGeneticaGeneplus(ws) {
  // IQg Básico = IQG, Pt IQg Básico = Pt IQG
  const rows = sheetToRows(ws)
  if (rows.length < 2) return []
  let hi = 0
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const str = rows[i].map(v => toStr(cellVal({ value: v })) || '').join(' ').toUpperCase()
    if (str.includes('IQG') || str.includes('IQg')) { hi = i; break }
  }
  const hdr = rows[hi]
  const iSRG = colIndex(hdr, 'SERIE E RG', 'RG')
  const iIQG = colIndex(hdr, 'IQG BASICO', 'IQGBASICO', 'IQg')
  const iPt  = colIndex(hdr, 'PT IQG', 'PTIQG', 'Pt IQg')

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[iSRG] }))
    if (!srg) continue
    const iqg   = toNum(cellVal({ value: r[iIQG] }))
    const pt    = toNum(cellVal({ value: r[iPt] }))
    if (iqg == null && pt == null) continue
    result.push({ ...srg, iqg: iqg != null ? String(iqg) : null, pt_iqg: pt != null ? String(pt) : null })
  }
  return result
}

function parseGeneticaMGTe(ws) {
  // ANCP / PMGZ → MGTe + TOP (+ opcionalmente iABCZ, DECA)
  const rows = sheetToRows(ws)
  if (rows.length < 2) return []
  let hi = 0
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const str = rows[i].map(v => toStr(cellVal({ value: v })) || '').join(' ').toUpperCase()
    if (str.includes('MGTE') || str.includes('MGTe')) { hi = i; break }
  }
  const hdr = rows[hi]
  const iSRG   = colIndex(hdr, 'SERIE E RG', 'RG')
  const iMGTe  = colIndex(hdr, 'MGTE', 'MGTe')
  const iTOP   = colIndex(hdr, 'TOP_MGTE', 'TOPMGTE', 'TOP')
  const iIABCZ = colIndex(hdr, 'IABCZ', 'IABCZg')
  const iDECA  = colIndex(hdr, 'DECA')
  const iIQG   = colIndex(hdr, 'IQGG', 'IQGg')
  const iPt    = colIndex(hdr, 'PTIQG', 'PT')

  const result = []
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[iSRG] }))
    if (!srg) continue
    const mgte  = toNum(cellVal({ value: r[iMGTe] }))
    const top   = toNum(cellVal({ value: r[iTOP] }))
    const iabcz = iIABCZ > 0 ? toNum(cellVal({ value: r[iIABCZ] })) : null
    const deca  = iDECA  > 0 ? toNum(cellVal({ value: r[iDECA] }))  : null
    const iqg   = iIQG   > 0 ? toNum(cellVal({ value: r[iIQG] }))   : null
    const pt    = iPt    > 0 ? toNum(cellVal({ value: r[iPt] }))     : null
    if (mgte == null && top == null && iabcz == null) continue
    result.push({
      ...srg,
      mgte:   mgte  != null ? String(mgte)  : null,
      top:    top   != null ? String(top)   : null,
      abczg:  iabcz != null ? String(iabcz) : null,
      deca:   deca  != null ? String(deca)  : null,
      iqg:    iqg   != null ? String(iqg)   : null,
      pt_iqg: pt    != null ? String(pt)    : null,
    })
  }
  return result
}

// ── identificar aba ───────────────────────────────────────────────────────────
function detectTipo(name) {
  const n = name.toUpperCase()
  if (n.includes('PROCRIAR') || n.includes('PUBERD')) return 'puberdade'
  if (n.includes('DGT') || n.includes('CARCAC') || n.includes('CARC')) return 'carcaca'
  if (n.includes('GENEPLUS')) return 'geneplus'
  if (n.includes('ANCP') || n.includes('PMGZ') || n.includes('MGTE')) return 'mgte'
  return null
}

// ── gravar no banco ───────────────────────────────────────────────────────────
async function upsertAnimal(tipo, data, stats) {
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
          `UPDATE animais SET
            pub_classe=$1, pub_idade=$2, pub_pct_media=$3, pub_grupo=$4, pub_classif=$5, updated_at=NOW()
          WHERE id=$6`,
          [row.pub_classe, row.pub_idade, row.pub_pct_media, row.pub_grupo, row.pub_classif, id]
        )
      } else if (tipo === 'carcaca') {
        await query(
          `UPDATE animais SET
            carc_aol=$1, carc_aol_100kg=$2, carc_ratio=$3, carc_mar=$4,
            carc_egs=$5, carc_egs_100kg=$6, carc_picanha=$7, updated_at=NOW()
          WHERE id=$8`,
          [row.carc_aol, row.carc_aol_100kg, row.carc_ratio, row.carc_mar,
           row.carc_egs, row.carc_egs_100kg, row.carc_picanha, id]
        )
      } else if (tipo === 'geneplus') {
        const sets = []
        const vals = []
        let idx = 1
        if (row.iqg   != null) { sets.push(`iqg=$${idx++}`);    vals.push(row.iqg) }
        if (row.pt_iqg!= null) { sets.push(`pt_iqg=$${idx++}`); vals.push(row.pt_iqg) }
        if (!sets.length) continue
        vals.push(id)
        await query(`UPDATE animais SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${idx}`, vals)
      } else if (tipo === 'mgte') {
        const sets = []
        const vals = []
        let idx = 1
        if (row.mgte  != null) { sets.push(`mgte=$${idx++}`);   vals.push(row.mgte) }
        if (row.top   != null) { sets.push(`"top"=$${idx++}`);   vals.push(row.top) }
        if (row.abczg != null) { sets.push(`abczg=$${idx++}`);  vals.push(row.abczg) }
        if (row.deca  != null) { sets.push(`deca=$${idx++}`);   vals.push(row.deca) }
        if (row.iqg   != null) { sets.push(`iqg=$${idx++}`);    vals.push(row.iqg) }
        if (row.pt_iqg!= null) { sets.push(`pt_iqg=$${idx++}`); vals.push(row.pt_iqg) }
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

// ── handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const form = formidable({ maxFileSize: 50 * 1024 * 1024 })
  let fields, files
  try {
    ;[fields, files] = await form.parse(req)
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
    if (!tipo) { stats.abas.push({ nome: ws.name, tipo: 'ignorada' }); continue }

    let dados = []
    if (tipo === 'puberdade') dados = parsePuberdade(ws)
    else if (tipo === 'carcaca') dados = parseCarcaca(ws)
    else if (tipo === 'geneplus') dados = parseGeneticaGeneplus(ws)
    else if (tipo === 'mgte') dados = parseGeneticaMGTe(ws)

    const antes = stats.atualizados
    await upsertAnimal(tipo, dados, stats)
    stats.abas.push({ nome: ws.name, tipo, registros: dados.length, atualizados: stats.atualizados - antes })
  }

  return res.status(200).json({
    success: true,
    message: `${stats.atualizados} animal(is) atualizado(s) em ${stats.abas.filter(a => a.tipo !== 'ignorada').length} aba(s).`,
    abas: stats.abas,
    naoEncontrados: stats.naoEncontrados.length,
    erros: stats.erros.length,
    exemplosNaoEncontrados: stats.naoEncontrados.slice(0, 10),
  })
}
