import React from 'react'
import Link from 'next/link'
import { XMarkIcon } from '@heroicons/react/24/outline'

function SexoBadge({ sexo }) {
  if (!sexo) return null
  const ehF = /^f/i.test(sexo)
  const ehM = /^m/i.test(sexo)
  if (!ehF && !ehM) return null
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
      ehF
        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    }`}>
      {ehF ? 'ââ„¢â‚¬' : 'ââ„¢â€š'} {ehF ? 'FÃªmea' : 'Macho'}
    </span>
  )
}

function EraBadge({ era }) {
  if (!era) return null
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      ðÅ¸â€œâ€¦ Era {era}
    </span>
  )
}

export default function ProleModal({ proleDetalhesData, onClose }) {
  if (!proleDetalhesData || proleDetalhesData.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-200">ðÅ¸â€œÅ  Prole ââ‚¬â€� detalhes importados</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{proleDetalhesData.length} filho(s) registrado(s)</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-gray-700 transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {proleDetalhesData.map((item, i) => {
            const isVenda = item.tipo === 'VENDA'
            const isMorte = item.tipo === 'MORTE/BAIXA'
            const label = String(item.serie || '').trim() + ' ' + String(item.rg || '').trim()
            const link  = (item.serie && item.rg)
              ? `/consulta-animal/${String(item.serie).trim()}-${String(item.rg).trim()}`
              : null

            return (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 overflow-hidden"
              >
                {/* Faixa colorida por tipo */}
                <div className={`px-3 py-1.5 flex items-center justify-between ${
                  isVenda
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
                    : isMorte
                    ? 'bg-red-500/10 dark:bg-red-500/20'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {link ? (
                    <Link href={link} className="font-bold text-amber-600 dark:text-amber-400 hover:underline text-sm">
                      {label}
                    </Link>
                  ) : (
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{label}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isVenda
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                      : isMorte
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.tipo}
                  </span>
                </div>

                {/* Corpo com sexo, era e detalhes */}
                <div className="px-3 py-2 space-y-2">

                  {/* Badges de sexo e era */}
                  {(item.sexo || item.era) && (
                    <div className="flex flex-wrap gap-1.5">
                      <SexoBadge sexo={item.sexo} />
                      <EraBadge era={item.era} />
                    </div>
                  )}

                  {/* Detalhes por tipo */}
                  {isMorte && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                      {item.causa && (
                        <p><span className="text-gray-400">Causa:</span> <span className="font-medium">{item.causa}</span></p>
                      )}
                      {item.data_baixa && (
                        <p><span className="text-gray-400">Data:</span> {new Date(item.data_baixa).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                  )}

                  {isVenda && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                      {item.numero_nf && (
                        <p><span className="text-gray-400">NF:</span> <span className="font-medium">{item.numero_nf}</span></p>
                      )}
                      {item.data_baixa && (
                        <p><span className="text-gray-400">Data:</span> {new Date(item.data_baixa).toLocaleDateString('pt-BR')}</p>
                      )}
                      {item.valor != null && item.valor > 0 && (
                        <p>
                          <span className="text-gray-400">Valor:</span>{' '}
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </p>
                      )}
                      {item.comprador && (
                        <p><span className="text-gray-400">Comprador:</span> <span className="font-medium">{item.comprador}</span></p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
