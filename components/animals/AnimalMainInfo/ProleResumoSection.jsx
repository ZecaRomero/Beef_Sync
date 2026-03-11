import React from 'react'

export default function ProleResumoSection({ baixasResumo, onOpenProleModal }) {
  if (!baixasResumo?.resumoMae || (baixasResumo.resumoMae.qtdVendidos === 0 && baixasResumo.resumoMae.qtdMortesBaixas === 0)) {
    return null
  }

  return (
    <button
      type="button"
      onClick={() => onOpenProleModal(baixasResumo.resumoMae?.proleDetalhes)}
      className="w-full text-left px-4 py-2.5 bg-amber-50/80 dark:bg-amber-900/15 border-b border-amber-100 dark:border-amber-800/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/25 transition-colors cursor-pointer active:scale-[0.99]"
    >
      <h3 className="font-bold text-amber-800 dark:text-amber-200 text-xs mb-1.5 flex items-center gap-1">
        <span>📊</span> Prole (Baixas)
        <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">(toque para detalhes)</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {baixasResumo.resumoMae.qtdVendidos > 0 && (
          <>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">Vendidos</p>
              <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">{baixasResumo.resumoMae.qtdVendidos}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">Média R$</p>
              <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                R$ {Number(baixasResumo.resumoMae.mediaVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">Total</p>
              <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                R$ {Number(baixasResumo.resumoMae.totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </>
        )}
        {baixasResumo.resumoMae.qtdMortesBaixas > 0 && (
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-[10px]">Mortes/Abates</p>
            <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">{baixasResumo.resumoMae.qtdMortesBaixas}</p>
          </div>
        )}
      </div>
    </button>
  )
}
