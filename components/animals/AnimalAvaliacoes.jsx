import { useState } from 'react'

// ── formatação ────────────────────────────────────────────────────────────────
function v(val, dec = 2) {
  if (val == null || val === '' || val === '-') return '—'
  const n = Number(String(val).replace(',', '.'))
  if (!Number.isFinite(n)) return String(val)

  // Sem casas decimais
  if (dec === 0) {
    return n.toLocaleString('pt-BR', {
      maximumFractionDigits: 0,
    })
  }

  // Com casas decimais fixas e vírgula
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })
}

// ── Bloco com tabela horizontal ───────────────────────────────────────────────
const SCHEMES = {
  red:    { bar: 'bg-red-600',    bg: 'bg-red-950/40 dark:bg-red-950/60',    border: 'border-red-800/50',    head: 'text-red-300',    row: 'text-red-400' },
  blue:   { bar: 'bg-blue-600',   bg: 'bg-blue-950/40 dark:bg-blue-950/60',  border: 'border-blue-800/50',   head: 'text-blue-300',   row: 'text-blue-400' },
  green:  { bar: 'bg-emerald-600',bg: 'bg-emerald-950/40 dark:bg-emerald-950/60', border: 'border-emerald-800/50', head: 'text-emerald-300', row: 'text-emerald-400' },
  purple: { bar: 'bg-purple-700', bg: 'bg-purple-950/40 dark:bg-purple-950/60', border: 'border-purple-800/50', head: 'text-purple-300', row: 'text-purple-400' },
  orange: { bar: 'bg-orange-500', bg: 'bg-orange-950/30 dark:bg-orange-950/50', border: 'border-orange-800/50', head: 'text-orange-300', row: 'text-orange-400' },
}

// ── PROCRIAR – layout especial ────────────────────────────────────────────────
function ProcriarBlock({ animal }) {
  const s = SCHEMES.orange
  const [isExpanded, setIsExpanded] = useState(true)
  // Não ocultar o bloco em ambientes onde o backend pode retornar campos nulos
  // (ex: diferenças entre localhost e Vercel). Se faltar dado, apenas os campos
  // internos não renderizam.

  const classeColor = {
    'SUPERPRECOCE': 'bg-amber-400 text-black',
    'PRECOCE':      'bg-yellow-300 text-black',
    'TRADICIONAL':  'bg-red-500 text-white',
  }[animal.pub_classe?.toUpperCase()] || 'bg-gray-600 text-white'

  const grupoColor = {
    'ELITE':   'bg-purple-500 text-white',
    'SUPERIOR':'bg-blue-500 text-white',
    'INFERIOR':'bg-rose-600 text-white',
    'REGULAR': 'bg-gray-500 text-white',
  }[animal.pub_grupo?.toUpperCase()] || 'bg-gray-600 text-white'

  return (
    <div className={`rounded-xl border ${s.border} overflow-hidden`}>
      <div className="flex items-stretch">
        <div className={`${s.bar} flex flex-col items-center justify-center px-2 py-3 min-w-[40px]`}>
          <span
            className="text-white font-black text-[11px] leading-tight text-center"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.08em' }}
          >
            PROCRIAR
          </span>
        </div>
        <div className={`flex-1 ${s.bg}`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors border-b ${s.border}`}
          >
            <span className={`text-xs font-bold ${s.head} uppercase tracking-wide`}>PROCRIAR</span>
            <svg
              className={`w-4 h-4 ${s.head} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded && (
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-5 flex-wrap">
                {animal.pub_classe && (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-[9px] font-bold ${s.row} uppercase`}>Classe</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${classeColor}`}>{animal.pub_classe}</span>
                  </div>
                )}
                {animal.pub_classif != null && (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-[9px] font-bold ${s.row} uppercase`}>Classif.</span>
                    <span className="text-sm font-black text-white">{animal.pub_classif}º</span>
                  </div>
                )}
                {animal.pub_grupo && (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-[9px] font-bold ${s.row} uppercase`}>Grupo</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${grupoColor}`}>{animal.pub_grupo}</span>
                  </div>
                )}
                {animal.pub_idade != null && (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-[9px] font-bold ${s.row} uppercase`}>Idade</span>
                    <span className="text-sm font-semibold text-white">
                      {v(animal.pub_idade, 2)}m
                    </span>
                  </div>
                )}
                {animal.pub_pct_media != null && (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-[9px] font-bold ${s.row} uppercase`}>% Média</span>
                    <span className="text-sm font-semibold text-white">
                      {v(animal.pub_pct_media, 0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EvalBlock({ logo, sublogo, color, cols, rows }) {
  const s = SCHEMES[color]
  // Não ocultar o bloco quando não houver dados no backend (ex: divergência
  // entre ambientes). As células vão exibir '—' quando não tiver valor.

  return (
    <div className={`rounded-xl border ${s.border} overflow-hidden`}>
      <div className="flex items-stretch">
        {/* Barra lateral colorida com logo */}
        <div className={`${s.bar} flex flex-col items-center justify-center px-2 py-3 min-w-[40px]`}>
          <span className="text-white font-black text-[11px] leading-tight text-center"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.08em' }}>
            {logo}
          </span>
          {sublogo && (
            <span className="text-white/60 font-bold text-[8px] mt-0.5 text-center"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              {sublogo}
            </span>
          )}
        </div>

        {/* Tabela */}
        <div className={`${s.bg}`} style={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }} className="eval-scrollbar">
            <table className="border-collapse text-xs" style={{ width: 'max-content', minWidth: '100%' }}>
              <thead>
                <tr>
                  <th className={`px-1.5 py-1.5 text-left ${s.row} font-bold text-[10px] border-b ${s.border} sticky left-0 ${s.bg} z-10`} />
                  {cols.map(c => (
                    <th key={c.key} className={`px-1.5 py-1.5 text-center ${s.head} font-bold text-[10px] border-b ${s.border} whitespace-nowrap`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 1 ? 'bg-white/5' : ''}>
                    <td className={`px-1.5 py-1.5 font-black ${s.row} text-[10px] whitespace-nowrap sticky left-0 ${s.bg} z-10`}>{row.label}</td>
                    {cols.map(c => (
                      <td key={c.key} className="px-1.5 py-1.5 text-center text-[11px] font-semibold text-white whitespace-nowrap">
                        {row.vals[c.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


// ── traits PMGZ ───────────────────────────────────────────────────────────────
const PMGZ_TRAITS = [
  { key: 'pn',    label: 'PN-Edg' },
  { key: 'pd',    label: 'PD-Edg' },
  { key: 'pa',    label: 'PA-Edg' },
  { key: 'ps',    label: 'PS-Edg' },
  { key: 'ipp',   label: 'IPPg' },
  { key: 'stay',  label: 'STAYg' },
  { key: 'pe365', label: 'PE-365g' },
  { key: 'aol',   label: 'AOLg' },
  { key: 'acab',  label: 'ACABg' },
  { key: 'mar',   label: 'MARg' },
]

export default function AnimalAvaliacoes({ animal }) {
  const [isExpanded, setIsExpanded] = useState(true)
  if (!animal) return null

  // ── DGT (Carcaça) ────────────────────────────────────────────────────────────
  const dgtCols = [
    { key: 'aol',       label: 'AOL' },
    { key: 'aol_100kg', label: 'AOL/100kg' },
    { key: 'ratio',     label: 'Ratio' },
    { key: 'mar',       label: 'MAR' },
    { key: 'egs',       label: 'EGS' },
    { key: 'egs_100kg', label: 'EGS/100kg' },
    { key: 'picanha',   label: 'Picanha' },
  ]
  const dgtRows = [
    {
      label: 'Valor',
      vals: {
        aol:       v(animal.carc_aol),
        aol_100kg: v(animal.carc_aol_100kg),
        ratio:     v(animal.carc_ratio),
        mar:       v(animal.carc_mar),
        egs:       v(animal.carc_egs),
        egs_100kg: v(animal.carc_egs_100kg),
        picanha:   v(animal.carc_picanha),
      }
    }
  ]

  // ── PMGZ ─────────────────────────────────────────────────────────────────────
  const pmgzCols = PMGZ_TRAITS.map(t => ({ key: t.key, label: t.label }))
  const pmgzRows = [
    { label: 'DEP',  vals: Object.fromEntries(PMGZ_TRAITS.map(t => [t.key, v(animal[`pmgz_${t.key}_dep`])])) },
    { label: 'DECA', vals: Object.fromEntries(PMGZ_TRAITS.map(t => [t.key, v(animal[`pmgz_${t.key}_deca`], 0)])) },
    { label: '%P',   vals: Object.fromEntries(PMGZ_TRAITS.map(t => [t.key, v(animal[`pmgz_${t.key}_pct`], 1)])) },
  ]

  // ── GENEPLUS ─────────────────────────────────────────────────────────────────
  const geneplusCols = [
    { key: 'iqg', label: 'IQGg' },
    { key: 'pt_iqg', label: 'Pt IQGg' },
    { key: 'pn_kg', label: 'PN(Kg)' },
    { key: 'pn_pt', label: 'Pt' },
    { key: 'p120_kg_em', label: 'P120(Kg)EM' },
    { key: 'p120_pt', label: 'Pt' },
    { key: 'p2_kg', label: 'P2(Kg)' },
    { key: 'p2_pt', label: 'Pt' },
    { key: 'p5_kg', label: 'P5(Kg)' },
    { key: 'p5_pt', label: 'Pt' },
    { key: 'hp_stay_pct', label: 'HP/STAY(%)' },
    { key: 'hp_stay_pt', label: 'Pt' },
    { key: 'ipp_01em', label: 'IPP(0,1em)' },
    { key: 'ipp_pt', label: 'Pt' },
    { key: 'ipp_dias', label: 'IPP(dias)' },
    { key: 'ipp_dias_pt', label: 'Pt' },
    { key: 'pfp30_pct', label: 'PFP30(%)' },
    { key: 'pfp30_pt', label: 'Pt' },
    { key: 'rd_pct', label: 'RD(%)' },
    { key: 'rd_pt', label: 'Pt' },
    { key: 'aol_cm2', label: 'AOL(cm²)' },
    { key: 'aol_pt', label: 'Pt' },
    { key: 'egs_01mm', label: 'EGS(0,1mm)' },
    { key: 'egs_pt', label: 'Pt' },
    { key: 'mar_pct', label: 'MAR(%)' },
    { key: 'mar_pt', label: 'Pt' },
  ]
  const geneplusRows = [
    {
      label: 'Valor',
      vals: {
        iqg: v(animal.iqg, 3),
        pt_iqg: v(animal.pt_iqg, 1),
        pn_kg: v(animal.gp_pn_kg, 2),
        pn_pt: v(animal.gp_pn_pt, 1),
        p120_kg_em: v(animal.gp_p120_kg_em, 2),
        p120_pt: v(animal.gp_p120_pt, 1),
        p2_kg: v(animal.gp_p2_kg, 2),
        p2_pt: v(animal.gp_p2_pt, 1),
        p5_kg: v(animal.gp_p5_kg, 2),
        p5_pt: v(animal.gp_p5_pt, 1),
        hp_stay_pct: v(animal.gp_hp_stay_pct, 2),
        hp_stay_pt: v(animal.gp_hp_stay_pt, 1),
        ipp_01em: v(animal.gp_ipp_01em, 2),
        ipp_pt: v(animal.gp_ipp_pt, 1),
        ipp_dias: v(animal.gp_ipp_dias, 2),
        ipp_dias_pt: v(animal.gp_ipp_dias_pt, 1),
        pfp30_pct: v(animal.gp_pfp30_pct, 2),
        pfp30_pt: v(animal.gp_pfp30_pt, 1),
        rd_pct: v(animal.gp_rd_pct, 2),
        rd_pt: v(animal.gp_rd_pt, 1),
        aol_cm2: v(animal.gp_aol_cm2, 2),
        aol_pt: v(animal.gp_aol_pt, 1),
        egs_01mm: v(animal.gp_egs_01mm, 2),
        egs_pt: v(animal.gp_egs_pt, 1),
        mar_pct: v(animal.gp_mar_pct, 3),
        mar_pt: v(animal.gp_mar_pt, 0),
      }
    }
  ]

  // ── ANCP ─────────────────────────────────────────────────────────────────────
  const ancpCols = [
    { key: 'mgte',  label: 'MGTe' },
    { key: 'd3p',   label: 'D3P' },
    { key: 'dipp',  label: 'DIPP' },
    { key: 'dpe365',label: 'DPE365' },
    { key: 'dpn',   label: 'DPN' },
    { key: 'dstay', label: 'DSTAY' },
    { key: 'mp120', label: 'MP120' },
    { key: 'mp210', label: 'MP210' },
    { key: 'dp450', label: 'DP450' },
    { key: 'daol',  label: 'DAOL' },
    { key: 'dacab', label: 'DACAB' },
  ]
  const ancpDepVals = {
    mgte:  v(animal.mgte),
    d3p:   v(animal.ancp_d3p),
    dipp:  v(animal.ancp_dipp),
    dpe365:v(animal.ancp_dpe365),
    dpn:   v(animal.ancp_dpn),
    dstay: v(animal.ancp_dstay),
    mp120: v(animal.ancp_mp120),
    mp210: v(animal.ancp_mp210),
    dp450: v(animal.ancp_dp450),
    daol:  v(animal.ancp_daol),
    dacab: v(animal.ancp_dacab),
  }
  const ancpTopVals = {
    mgte:  v(animal.top, 0),
    d3p:   v(animal.ancp_top_d3p, 0),
    dipp:  v(animal.ancp_top_dipp, 0),
    dpe365:v(animal.ancp_top_dpe365, 0),
    dpn:   v(animal.ancp_top_dpn, 0),
    dstay: v(animal.ancp_top_dstay, 0),
    mp120: v(animal.ancp_top_mp120, 0),
    mp210: v(animal.ancp_top_mp210, 0),
    dp450: v(animal.ancp_top_dp450, 0),
    daol:  v(animal.ancp_top_daol, 0),
    dacab: v(animal.ancp_top_dacab, 0),
  }
  const ancpRows = [
    { label: 'DEP', vals: ancpDepVals },
    { label: 'TOP', vals: ancpTopVals },
  ]

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-700/50 bg-gray-900/50 dark:bg-gray-900 shadow-xl">
      <style jsx global>{`
        .eval-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .eval-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .eval-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .eval-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .eval-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05);
        }
        .scrollbar-custom::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
      `}</style>

      {/* Cabeçalho com seta para expandir/colapsar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700 hover:bg-gray-750 transition-colors"
      >
        <span className="text-base">📊</span>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-black text-gray-100 uppercase tracking-wider truncate">
            {animal.nome || `${animal.serie} ${animal.rg}`}
          </p>
          <p className="text-[10px] text-gray-400 font-mono">{animal.serie} {animal.rg}</p>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-2">Avaliações</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2 max-h-[75vh] overflow-y-auto scrollbar-custom pr-1.5">
          <ProcriarBlock animal={animal} />
          <div id="eval-dgt">
            <EvalBlock logo="DGT" sublogo="" color="red" cols={dgtCols} rows={dgtRows} />
          </div>
          <div id="eval-pmgz">
            <EvalBlock logo="PMGZ" color="blue" cols={pmgzCols} rows={pmgzRows} />
          </div>
          <div id="eval-geneplus">
            <EvalBlock logo="GENEPLUS" sublogo="" color="green" cols={geneplusCols} rows={geneplusRows} />
          </div>
          <div id="eval-ancp">
            <EvalBlock logo="ANCP" color="purple" cols={ancpCols} rows={ancpRows} />
          </div>
        </div>
      )}
    </div>
  )
}
