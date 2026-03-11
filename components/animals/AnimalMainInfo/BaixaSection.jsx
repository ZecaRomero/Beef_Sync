import React from 'react'
import Link from 'next/link'

export default function BaixaSection({ baixaPropriaExibir, animal, baixasResumo }) {
  if (!baixaPropriaExibir) return null

  if (baixaPropriaExibir.morto && !baixaPropriaExibir.vendido) {
    return (
      <div className="px-4 py-2.5 bg-gray-100/50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-600">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2 flex items-center gap-2">
          <span>⚠️</span> {baixaPropriaExibir.causa === 'Abate' ? 'Abate' : 'Morte/Baixa'}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {baixaPropriaExibir.data_baixa ? (
            <span className="font-semibold">{new Date(baixaPropriaExibir.data_baixa).toLocaleDateString('pt-BR')}</span>
          ) : (
            'Data não informada'
          )}
          {baixaPropriaExibir.causa && baixaPropriaExibir.causa !== 'Abate' && (
            <span className="ml-2">• Causa: {baixaPropriaExibir.causa}</span>
          )}
        </p>
      </div>
    )
  }

  if (baixaPropriaExibir.vendido) {
    return (
      <div className="px-6 py-4 bg-emerald-50/80 dark:bg-emerald-900/20 border-b border-emerald-200/50 dark:border-emerald-800/50">
        <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm mb-3 flex items-center gap-2">
          <span>💰</span> Venda
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {baixaPropriaExibir.data_venda && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Data</p>
              <p className="font-bold text-emerald-700 dark:text-emerald-300">
                {new Date(baixaPropriaExibir.data_venda).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
          {baixaPropriaExibir.numero_nf && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Nota Fiscal</p>
              <p className="font-bold text-emerald-700 dark:text-emerald-300">{baixaPropriaExibir.numero_nf}</p>
            </div>
          )}
          {baixaPropriaExibir.valor != null && baixaPropriaExibir.valor > 0 && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Valor</p>
              <p className="font-bold text-emerald-700 dark:text-emerald-300">
                R$ {Number(baixaPropriaExibir.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
          {baixaPropriaExibir.comprador && (
            <div className={baixaPropriaExibir.valor != null && baixaPropriaExibir.valor > 0 ? '' : 'col-span-2'}>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Comprador</p>
              <p className="font-bold text-emerald-700 dark:text-emerald-300">{baixaPropriaExibir.comprador}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
