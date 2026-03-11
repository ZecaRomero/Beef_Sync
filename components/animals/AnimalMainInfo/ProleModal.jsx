import React from 'react'
import Link from 'next/link'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ProleModal({ proleDetalhesData, onClose }) {
  if (!proleDetalhesData || proleDetalhesData.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <h3 className="font-bold text-amber-800 dark:text-amber-200">📊 Prole – detalhes importados</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {proleDetalhesData.map((item, i) => (
            <div key={i} className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-start mb-2">
                {(item.serie && item.rg) ? (
                  <Link href={`/consulta-animal/${String(item.serie).trim()}-${String(item.rg).trim()}`} className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                    {item.serie} {item.rg}
                  </Link>
                ) : (
                  <span className="font-bold text-amber-600 dark:text-amber-400">{item.serie || ''} {item.rg || ''}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.tipo === 'VENDA' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                  {item.tipo}
                </span>
              </div>
              {item.tipo === 'MORTE/BAIXA' && (
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {item.causa && <p><span className="text-gray-500">Causa:</span> {item.causa}</p>}
                  {item.data_baixa && <p><span className="text-gray-500">Data:</span> {new Date(item.data_baixa).toLocaleDateString('pt-BR')}</p>}
                </div>
              )}
              {item.tipo === 'VENDA' && (
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {item.numero_nf && <p><span className="text-gray-500">NF:</span> {item.numero_nf}</p>}
                  {item.data_baixa && <p><span className="text-gray-500">Data:</span> {new Date(item.data_baixa).toLocaleDateString('pt-BR')}</p>}
                  {item.valor != null && item.valor > 0 && <p><span className="text-gray-500">Valor:</span> R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
                  {item.comprador && <p><span className="text-gray-500">Comprador:</span> {item.comprador}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
