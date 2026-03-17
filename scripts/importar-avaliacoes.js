/**
 * node scripts/importar-avaliacoes.js
 * Importa o arquivo Excel de avaliações (5 abas) diretamente no banco local.
 */
const ExcelJS = require('exceljs')
const { Pool } = require('pg')
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: false
})

const ARQUIVO = 'g:/Meu Drive/Compartilhado/Imports_Beef_Sync/Avaliações/5 juntas_modificadas_mauricio.xlsx'

// ── helpers ──────────────────────────────────────────────────────────────────
function cellVal(c) {
  if (!c) return null
  const v = (c.result !== undefined && c.result !== null) ? c.result : c.value
  if (v == null) return null
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map(t => t.text).join('').trim()
    if (v.text) return String(v.text).trim()
    return v.result ?? v.value ?? null
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
  const n = parseFloat(String(v).replace(',', '.'))
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
function sheetToRows(ws) {
  const r = []
  ws.eachRow({ includeEmpty: false }, row => r.push(row.values))
  return r
}
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const v = toStr(cellVal({ value: rows[i][1] })) || ''
    if (v.toUpperCase().includes('SERIE')) return i
  }
  return 0
}
function findCol(hdr, ...cands) {
  for (let i = 1; i < hdr.length; i++) {
    const v = (toStr(cellVal({ value: hdr[i] })) || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    for (const c of cands) {
      if (v.includes(c.toUpperCase().replace(/[^A-Z0-9]/g, ''))) return i
    }
  }
  return -1
}

// ── importadores por aba ──────────────────────────────────────────────────────
async function importProcriar(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]
  const iC = findCol(hdr, 'CLASSE')
  const iI = findCol(hdr, 'IDADE')
  const iP = findCol(hdr, 'MEDIA')
  const iG = findCol(hdr, 'GRUPO')
  const iCl = findCol(hdr, 'CLASSIF')
  let atu = 0, naoEnc = 0
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    const res = await pool.query('SELECT id FROM animais WHERE UPPER(serie)=$1 AND rg=$2 LIMIT 1', [srg.serie, srg.rg])
    if (!res.rows.length) { naoEnc++; continue }
    await pool.query(
      'UPDATE animais SET pub_classe=$1, pub_idade=$2, pub_pct_media=$3, pub_grupo=$4, pub_classif=$5, updated_at=NOW() WHERE id=$6',
      [toStr(cellVal({ value: r[iC] })), toNum(cellVal({ value: r[iI] })), toNum(cellVal({ value: r[iP] })),
       toStr(cellVal({ value: r[iG] })), toNum(cellVal({ value: r[iCl] })), res.rows[0].id]
    )
    atu++
  }
  return { atu, naoEnc }
}

async function importDgt(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]
  const iA   = findCol(hdr, 'AOL')
  const iA1  = findCol(hdr, 'AOL / 100', 'AOL/100', 'AOL100')
  const iR   = findCol(hdr, 'RATIO')
  const iM   = findCol(hdr, 'MAR')
  const iE   = findCol(hdr, 'EGS')
  const iE1  = findCol(hdr, 'EGS / 100', 'EGS100')
  const iPic = findCol(hdr, 'PICANHA')
  let atu = 0, naoEnc = 0
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    const res = await pool.query('SELECT id FROM animais WHERE UPPER(serie)=$1 AND rg=$2 LIMIT 1', [srg.serie, srg.rg])
    if (!res.rows.length) { naoEnc++; continue }
    await pool.query(
      'UPDATE animais SET carc_aol=$1, carc_aol_100kg=$2, carc_ratio=$3, carc_mar=$4, carc_egs=$5, carc_egs_100kg=$6, carc_picanha=$7, updated_at=NOW() WHERE id=$8',
      [toNum(cellVal({ value: r[iA] })), toNum(cellVal({ value: r[iA1] })), toNum(cellVal({ value: r[iR] })),
       toNum(cellVal({ value: r[iM] })), toNum(cellVal({ value: r[iE] })), toNum(cellVal({ value: r[iE1] })),
       toNum(cellVal({ value: r[iPic] })), res.rows[0].id]
    )
    atu++
  }
  return { atu, naoEnc }
}

async function importGeneplus(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]
  let iI = findCol(hdr, 'BASICO'); if (iI < 0) iI = 2  // IQGg Básico
  let iP = findCol(hdr, 'PT IQGg', 'PT IQGG'); if (iP < 0) iP = 3
  let atu = 0, naoEnc = 0
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    const iqg = toNum(cellVal({ value: r[iI] }))
    const pt  = toNum(cellVal({ value: r[iP] }))
    if (iqg == null && pt == null) continue
    const res = await pool.query('SELECT id FROM animais WHERE UPPER(serie)=$1 AND rg=$2 LIMIT 1', [srg.serie, srg.rg])
    if (!res.rows.length) { naoEnc++; continue }
    const sets = []; const vals = []; let pi = 1
    if (iqg != null) { sets.push(`iqg=$${pi++}`);    vals.push(String(iqg)) }
    if (pt  != null) { sets.push(`pt_iqg=$${pi++}`); vals.push(String(pt)) }
    vals.push(res.rows[0].id)
    await pool.query(`UPDATE animais SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${pi}`, vals)
    atu++
  }
  return { atu, naoEnc }
}

async function importAncp(ws) {
  const rows = sheetToRows(ws)
  const hi = findHeaderRow(rows)
  const hdr = rows[hi]
  const iM = findCol(hdr, 'MGTE', 'MGTe')
  const iT = findCol(hdr, 'TOP_MGTE', 'TOPMGTE')
  let atu = 0, naoEnc = 0
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue
    const mgte = toNum(cellVal({ value: r[iM] }))
    if (mgte == null) continue
    const top = toNum(cellVal({ value: r[iT] }))
    const res = await pool.query('SELECT id FROM animais WHERE UPPER(serie)=$1 AND rg=$2 LIMIT 1', [srg.serie, srg.rg])
    if (!res.rows.length) { naoEnc++; continue }
    await pool.query(
      'UPDATE animais SET mgte=$1, "top"=$2, updated_at=NOW() WHERE id=$3',
      [String(mgte), top != null ? String(top) : null, res.rows[0].id]
    )
    atu++
  }
  return { atu, naoEnc }
}

// Mapa: nome da trait no Excel → prefixo da coluna no banco
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

async function importPmgz(ws) {
  const rows = sheetToRows(ws)
  // hi = 2 (linha 3, onde está SERIE E RG)
  const hi = findHeaderRow(rows)
  if (hi < 1) return { atu: 0, naoEnc: 0 }

  const traitRow  = rows[hi - 1] // linha 2: PN-Edg, PD-Edg, ...
  const headerRow = rows[hi]     // linha 3: DEP, DECA, P%

  // Monta mapa col → { prefixo, tipo }
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

  let atu = 0, naoEnc = 0
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]
    const srg = parseSerieRg(cellVal({ value: r[1] }))
    if (!srg) continue

    const res = await pool.query(
      'SELECT id FROM animais WHERE UPPER(serie)=$1 AND rg=$2 LIMIT 1',
      [srg.serie, srg.rg]
    )
    if (!res.rows.length) { naoEnc++; continue }

    const sets = []; const vals = []; let pi = 1
    for (const [col, colName] of Object.entries(colMap)) {
      const val = toNum(cellVal({ value: r[parseInt(col)] }))
      if (val != null) { sets.push(`${colName}=$${pi++}`); vals.push(val) }
    }
    if (!sets.length) continue
    vals.push(res.rows[0].id)
    await pool.query(`UPDATE animais SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${pi}`, vals)
    atu++
  }
  return { atu, naoEnc }
}

// ── main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('Lendo arquivo Excel...')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(ARQUIVO)
  console.log('Abas encontradas:', wb.worksheets.map(w => w.name).join(', '))

  let totalAtu = 0, totalNaoEnc = 0

  for (const ws of wb.worksheets) {
    process.stdout.write(`\nProcessando aba "${ws.name}"... `)
    let r = { atu: 0, naoEnc: 0 }
    try {
      if (ws.name === 'PROCRIAR') r = await importProcriar(ws)
      else if (ws.name === 'DGT')     r = await importDgt(ws)
      else if (ws.name === 'GENEPLUS') r = await importGeneplus(ws)
      else if (ws.name === 'ANCP')    r = await importAncp(ws)
      else if (ws.name === 'PMGZ') r = await importPmgz(ws)
      else {
        console.log('(ignorada)')
        continue
      }
      totalAtu += r.atu
      totalNaoEnc += r.naoEnc
      console.log(`✅ ${r.atu} atualizados | ${r.naoEnc} não encontrados`)
    } catch (e) {
      console.log(`❌ ERRO: ${e.message}`)
    }
  }

  console.log('\n══════════════════════════════')
  console.log(`TOTAL: ${totalAtu} animais atualizados`)
  console.log(`Não encontrados no banco: ${totalNaoEnc}`)
  console.log('══════════════════════════════')
  await pool.end()
}

run().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1) })
