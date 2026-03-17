import React, { useState } from 'react'
import { ChartBarIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

// ── helpers de formatação ─────────────────────────────────────────────────────
function fmt(v, decimals = 2) {
  if (v == null || v === '') return '—'
  const n = parseFloat(v)
  return isNaN(n) ? String(v) : n.toFixed(decimals)
}
function fmtInt(v) {
  if (v == null || v === '') return '—'
  const n = parseInt(v)
  return isNaN(n) ? String(v) : String(n)
}
function fmtStr(v) {
  if (v == null || v === '' || v === '-') return '—'
  return String(v)
}

// ── sub-componentes ───────────────────────────────────────────────────────────
function SectionCard({ title, color, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const colors = {
    orange: 'border-orange-400 dark:border-orange-500',
    red:    'border-red-400 dark:border-red-500',
    green:  'border-green-500 dark:border-green-400',
    blue:   'border-blue-500 dark:border-blue-400',
    purple: 'border-purple-500 dark:border-purple-400',
  }
  const titleColors = {
    orange: 'text-orange-600 dark:text-orange-400',
    red:    'text-red-600 dark:text-red-400',
    green:  'text-green-600 dark:text-green-400',
    blue:   'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }
  return (
    <div className={`rounded-xl border-l-4 ${colors[color]} bg-white dark:bg-gray-800 shadow-sm overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${titleColors[color]}`} />}
          <span className={`font-semibold text-sm ${titleColors[color]}`}>{title}</span>
        </div>
        {open ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  )
}

// ── PMGZ tabela de traits ─────────────────────────────────────────────────────
const PMGZ_TRAITS = [
  { key: 'pn',    label: 'PN-Edg',   cat: 'Crescimento' },
  { key: 'pd',    label: 'PD-Edg',   cat: 'Crescimento' },
  { key: 'pa',    label: 'PA-Edg',   cat: 'Crescimento' },
  { key: 'ps',    label: 'PS-Edg',   cat: 'Crescimento' },
  { key: 'ipp',   label: 'IPPg',     cat: 'Reprodução' },
  { key: 'stay',  label: 'STAYg',    cat: 'Reprodução' },
  { key: 'pe365', label: 'PE-365g',  cat: 'Reprodução' },
  { key: 'aol',   label: 'AOLg',     cat: 'Carcaça' },
  { key: 'acab',  label: 'ACABg',    cat: 'Carcaça' },
  { key: 'mar',   label: 'MARg',     cat: 'Carcaça' },
]

const CAT_COLORS = {
  'Crescimento': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  'Reprodução':  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  'Carcaça':     'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
}

function PmgzTable({ animal }) {
  const rows = PMGZ_TRAITS.map(t => ({
    ...t,
    dep:  animal[`pmgz_${t.key}_dep`],
    deca: animal[`pmgz_${t.key}_deca`],
    pct:  animal[`pmgz_${t.key}_pct`],
  })).filter(r => r.dep != null || r.deca != null || r.pct != null)

  if (!rows.length) return <p className="text-xs text-gray-400 py-2">Sem dados PMGZ</p>

  let lastCat = ''
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 dark:text-gray-400">
            <th className="text-left pb-2 pr-3 font-medium">Trait</th>
            <th className="text-right pb-2 px-2 font-medium">DEP</th>
            <th className="text-right pb-2 px-2 font-medium">DECA</th>
            <th className="text-right pb-2 pl-2 font-medium">P%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const showCat = r.cat !== lastCat
            lastCat = r.cat
            return (
              <React.Fragment key={r.key}>
                {showCat && (
                  <tr>
                    <td colSpan={4} className="pt-2 pb-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${CAT_COLORS[r.cat]}`}>
                        {r.cat}
                      </span>
                    </td>
                  </tr>
                )}
                <tr className="border-b border-gray-100 dark:border-gray-700/40 last:border-0">
                  <td className="py-1 pr-3 font-medium text-gray-700 dark:text-gray-300">{r.label}</td>
                  <td className="py-1 px-2 text-right font-semibold text-gray-900 dark:text-white">{fmt(r.dep, 2)}</td>
                  <td className="py-1 px-2 text-right font-semibold text-gray-900 dark:text-white">{fmtInt(r.deca)}</td>
                  <td className="py-1 pl-2 text-right text-gray-500 dark:text-gray-400">{fmt(r.pct, 1)}</td>
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── componente principal ──────────────────────────────────────────────────────
export default function AnimalAvaliacoes({ animal }) {
  if (!animal) return null

  const hasPuberdade = animal.pub_classe || animal.pub_grupo || animal.pub_classif != null
  const hasCarcaca   = animal.carc_aol   != null || animal.carc_mar != null || animal.carc_egs != null
  const hasGeneplus  = animal.iqg        != null || animal.pt_iqg   != null
  const hasAncp      = animal.mgte       != null
  const hasPmgz      = PMGZ_TRAITS.some(t => animal[`pmgz_${t.key}_dep`] != null)

  if (!hasPuberdade && !hasCarcaca && !hasGeneplus && !hasAncp && !hasPmgz) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ChartBarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Avaliações</h2>
      </div>

      <div className="space-y-3">

        {/* PUBERDADE */}
        {hasPuberdade && (
          <SectionCard title="Puberdade — PROCRIAR" color="orange">
            <div className="grid grid-cols-2 gap-x-6 mt-1">
              <Row label="Classe"       value={fmtStr(animal.pub_classe)} />
              <Row label="Classificação" value={fmtInt(animal.pub_classif)} />
              <Row label="Grupo"        value={fmtStr(animal.pub_grupo)} />
              <Row label="Idade (meses)" value={fmt(animal.pub_idade, 1)} />
              <Row label="% Média"      value={fmt(animal.pub_pct_media, 2)} />
            </div>
          </SectionCard>
        )}

        {/* CARCAÇA */}
        {hasCarcaca && (
          <SectionCard title="Carcaça — DGT" color="red">
            <div className="grid grid-cols-2 gap-x-6 mt-1">
              <Row label="AOL (cm²)"      value={fmt(animal.carc_aol, 2)} />
              <Row label="AOL / 100kg"    value={fmt(animal.carc_aol_100kg, 2)} />
              <Row label="Ratio"          value={fmt(animal.carc_ratio, 3)} />
              <Row label="Marmoreio"      value={fmt(animal.carc_mar, 2)} />
              <Row label="EGS (mm)"       value={fmt(animal.carc_egs, 2)} />
              <Row label="EGS / 100kg"    value={fmt(animal.carc_egs_100kg, 2)} />
              <Row label="Picanha (mm)"   value={fmt(animal.carc_picanha, 2)} />
            </div>
          </SectionCard>
        )}

        {/* GENEPLUS */}
        {hasGeneplus && (
          <SectionCard title="Genética — GENEPLUS" color="green">
            <div className="grid grid-cols-2 gap-x-6 mt-1">
              <Row label="IQGg Básico"    value={fmt(animal.iqg, 3)}    highlight />
              <Row label="Pt IQGg Básico" value={fmt(animal.pt_iqg, 1)} highlight />
            </div>
          </SectionCard>
        )}

        {/* ANCP */}
        {hasAncp && (
          <SectionCard title="Genética — ANCP" color="blue">
            <div className="grid grid-cols-2 gap-x-6 mt-1">
              <Row label="MGTe"    value={fmt(animal.mgte, 2)}         highlight />
              <Row label="TOP"     value={fmtInt(animal.top)}           />
              {animal.ancp_d3p    != null && <Row label="D3P"     value={fmt(animal.ancp_d3p, 2)} />}
              {animal.ancp_dipp   != null && <Row label="DIPP"    value={fmt(animal.ancp_dipp, 2)} />}
              {animal.ancp_dpe365 != null && <Row label="DPE365"  value={fmt(animal.ancp_dpe365, 2)} />}
              {animal.ancp_dpn    != null && <Row label="DPN"     value={fmt(animal.ancp_dpn, 2)} />}
              {animal.ancp_dstay  != null && <Row label="DSTAY"   value={fmt(animal.ancp_dstay, 2)} />}
              {animal.ancp_mp120  != null && <Row label="MP120"   value={fmt(animal.ancp_mp120, 2)} />}
              {animal.ancp_mp210  != null && <Row label="MP210"   value={fmt(animal.ancp_mp210, 2)} />}
              {animal.ancp_dp450  != null && <Row label="DP450"   value={fmt(animal.ancp_dp450, 2)} />}
              {animal.ancp_daol   != null && <Row label="DAOL"    value={fmt(animal.ancp_daol, 2)} />}
              {animal.ancp_dacab  != null && <Row label="DACAB"   value={fmt(animal.ancp_dacab, 2)} />}
              {animal.ancp_mar    != null && <Row label="MAR"     value={fmt(animal.ancp_mar, 2)} />}
            </div>
          </SectionCard>
        )}

        {/* PMGZ */}
        {hasPmgz && (
          <SectionCard title="Genética — PMGZ" color="purple" defaultOpen={false}>
            <div className="mt-1">
              <PmgzTable animal={animal} />
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  )
}
