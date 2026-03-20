/**
 * Vendas de Sêmen e Embriões do animal
 * Busca no localStorage (beef-vendas-genetica) vendas cujo produto menciona a série+RG do animal
 */
import {
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'

const fmt = (v) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AnimalGeneticSales({ animal }) {
  const [vendas, setVendas] = useState([])
  const [expanded, setExpanded] = useState(false)

  const serie = (animal?.serie || '').trim().toUpperCase()
  const rg = (animal?.rg || '').toString().trim()

  useEffect(() => {
    if (!serie && !rg) return
    try {
      const saved = localStorage.getItem('beef-vendas-genetica')
      if (saved) setVendas(JSON.parse(saved))
    } catch (_) {}
  }, [serie, rg])

  // Filtrar vendas que mencionam este animal no produto
  const vendasDoAnimal = useMemo(() => {
    if ((!serie && !rg) || vendas.length === 0) return []

    // Normalizar para busca: remover espaços extras, pontos, hífens
    const normalizar = (s) => String(s || '').toUpperCase().replace(/[\s.\-_/]+/g, '')
    const serieNorm = normalizar(serie)
    const rgNorm = normalizar(rg)

    return vendas.filter(v => {
      const prodNorm = normalizar(v.produto)
      // Buscar série+RG juntos no produto (ex: CJCJ4582, CJCJ 4582)
      if (serieNorm && rgNorm) {
        if (prodNorm.includes(serieNorm + rgNorm)) return true
        // Tentar com espaço entre série e RG no produto original
        const prodUpper = (v.produto || '').toUpperCase()
        if (prodUpper.includes(`${serie}${rg}`) || prodUpper.includes(`${serie} ${rg}`) || prodUpper.includes(`${serie}-${rg}`)) return true
      }
      // Buscar só pelo RG se for numérico e grande o suficiente (evitar falsos positivos)
      if (rgNorm && rgNorm.length >= 4 && serieNorm) {
        // Verificar se o produto contém a série E o RG separadamente
        const prodUpper = (v.produto || '').toUpperCase()
        if (prodUpper.includes(serie) && prodUpper.includes(rg)) return true
      }
      return false
    })
  }, [vendas, serie, rg])

  const resumo = useMemo(() => {
    if (vendasDoAnimal.length === 0) return null
    const total = vendasDoAnimal.reduce((s, v) => s + (v.vlTotal || 0), 0)
    const totalQtd = vendasDoAnimal.reduce((s, v) => s + (v.quantidade || 0), 0)
    const semen = vendasDoAnimal.filter(v => v.tipo === 'semen')
    const embrioes = vendasDoAnimal.filter(v => v.tipo === 'embriao')
    const clientes = [...new Set(vendasDoAnimal.map(v => v.cliente).filter(Boolean))]
    return {
      total, totalQtd,
      qtdSemen: semen.reduce((s, v) => s + (v.quantidade || 0), 0),
      totalSemen: semen.reduce((s, v) => s + (v.vlTotal || 0), 0),
      qtdEmbrioes: embrioes.reduce((s, v) => s + (v.quantidade || 0), 0),
      totalEmbrioes: embrioes.reduce((s, v) => s + (v.vlTotal || 0), 0),
      clientes,
    }
  }, [vendasDoAnimal])

  if (!resumo) return null

  return (
    <div className="mt-3 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <span className="text-base">🧬</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Vendas de Genética</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {vendasDoAnimal.length} venda(s) · {resumo.totalQtd.toLocaleString('pt-BR')} unid. · {fmt(resumo.total)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-violet-600 dark:text-violet-400">{fmt(resumo.total)}</span>
          {expanded ? <ChevronUpIcon className="h-4 w-4 text-gray-400" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-violet-100 dark:border-violet-800/30 p-3 space-y-3">
          {/* Resumo por tipo */}
          <div className="grid grid-cols-2 gap-2">
            {resumo.qtdSemen > 0 && (
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">🧪 Sêmen</p>
                <p className="text-sm font-bold text-blue-800 dark:text-blue-200">{resumo.qtdSemen.toLocaleString('pt-BR')} doses</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{fmt(resumo.totalSemen)}</p>
              </div>
            )}
            {resumo.qtdEmbrioes > 0 && (
              <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-500 dark:text-pink-400">🧬 Embriões</p>
                <p className="text-sm font-bold text-pink-800 dark:text-pink-200">{resumo.qtdEmbrioes.toLocaleString('pt-BR')} unid.</p>
                <p className="text-xs text-pink-600 dark:text-pink-400">{fmt(resumo.totalEmbrioes)}</p>
              </div>
            )}
          </div>

          {/* Clientes */}
          {resumo.clientes.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Clientes compradores</p>
              <div className="flex flex-wrap gap-1">
                {resumo.clientes.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-700 dark:text-gray-300">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Lista de vendas */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Detalhamento</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {vendasDoAnimal.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-700 dark:text-gray-300 truncate">{v.cliente}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{v.produto}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{fmt(v.vlTotal)}</p>
                    <p className="text-[10px] text-gray-400">{v.quantidade}x · {v.ano} · NF {v.notaFiscal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
