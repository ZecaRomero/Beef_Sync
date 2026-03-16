import React from 'react'

export default function ProleResumoSection({ baixasResumo, filhosAtivos = [], onOpenProleModal }) {
  const qtdVendidos = baixasResumo?.resumoMae?.qtdVendidos || 0
  const qtdMortes = baixasResumo?.resumoMae?.qtdMortesBaixas || 0
  const mediaVendas = baixasResumo?.resumoMae?.mediaVendas || 0
  const totalVendas = baixasResumo?.resumoMae?.totalVendas || 0
  const proleDetalhes = baixasResumo?.resumoMae?.proleDetalhes || []

  const qtdAtivos = filhosAtivos.filter(f => {
    const sit = (f.situacao || '').toLowerCase()
    return !sit.includes('vendido') && !sit.includes('morto') && !sit.includes('morte') && !sit.includes('inativo')
  }).length

  const totalProle = qtdAtivos + qtdVendidos + qtdMortes

  if (totalProle === 0) return null

  return (
    <button
      type="button"
      onClick={() => onOpenProleModal(proleDetalhes)}
      className="w-full text-left px-4 py-2.5 bg-amber-50/80 dark:bg-amber-900/15 border-b border-amber-100 dark:border-amber-800/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/25 transition-colors cursor-pointer active:scale-[0.99]"
    >
      <h3 className="font-bold text-amber-800 dark:text-amber-200 text-xs mb-1.5 flex items-center gap-1">
        <span>🐄</span> Prole — {totalProle} filho{totalProle !== 1 ? 's' : ''}
        {proleDetalhes.length > 0 && (
          <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">(toque para baixas)</span>
        )}
      </h3>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {qtdAtivos > 0 && (
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px]">Ativos</p>
            <p className="font-bold text-green-700 dark:text-green-400 text-sm">{qtdAtivos}</p>
          </div>
        )}
        {qtdVendidos > 0 && (
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px]">Vendidos</p>
            <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">{qtdVendidos}</p>
          </div>
        )}
        {qtdMortes > 0 && (
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px]">Mortes</p>
            <p className="font-bold text-red-600 dark:text-red-400 text-sm">{qtdMortes}</p>
          </div>
        )}
        {qtdVendidos > 0 && totalVendas > 0 && (
          <>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">Média venda</p>
              <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                R$ {Number(mediaVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">Total vendas</p>
              <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                R$ {Number(totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </>
        )}
      </div>
    </button>
  )
}
