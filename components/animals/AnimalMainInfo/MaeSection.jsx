import React from 'react'
import Link from 'next/link'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../../utils/formatters'

export default function MaeSection({
  animal,
  maeLink,
  maeColetas,
  baixasMae,
  onOpenProleModal
}) {
  if (!animal.mae && !animal.serie_mae && !animal.rg_mae && !maeLink?.serie && !maeLink?.rg) return null

  const serie = animal.serie_mae || maeLink?.serie
  const rg = animal.rg_mae || maeLink?.rg
  const ident = serie && rg ? `${serie} ${rg}` : null

  return (
    <div className="px-4 py-2.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">Mãe</span>
        <div className="text-right">
          {ident ? (
            <Link href={`/consulta-animal/${serie}-${rg}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-end gap-1">
              {ident}
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0" />
            </Link>
          ) : (
            <span className="text-sm font-medium text-gray-900 dark:text-white">{animal.mae || '-'}</span>
          )}
        </div>
      </div>
      {/* Série/RG da mãe - exibir sempre que disponível (animal, maeLink ou busca em gestações/coletas) */}
      {serie && rg && (
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Série/RG da mãe</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{serie} {rg}</span>
        </div>
      )}
      {!ident && animal.mae && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">⚠️ Não encontrada no cadastro (pode estar inativa)</p>
      )}
      {animal.mae && ident && (
        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">{animal.mae}</span>
      )}
      {maeColetas?.resumo && (
        <div className="mt-1.5 px-2.5 py-2 rounded-lg bg-pink-50/80 dark:bg-pink-900/15 border-l-2 border-pink-400 dark:border-pink-600">
          <p className="text-[10px] font-bold text-pink-700 dark:text-pink-300 mb-0.5">🧪 FIV Doadora</p>
          <p className="text-xs text-pink-600 dark:text-pink-400">{maeColetas.resumo.totalColetas} coletas • {maeColetas.resumo.totalOocitos} oócitos • {maeColetas.resumo.totalEmbrioesProduzidos} embriões ({maeColetas.resumo.totalEmbrioesTransferidos} transferidos)</p>
        </div>
      )}
      {baixasMae?.baixaPropria?.vendido && (
        <div className="mt-1.5 px-2.5 py-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/15 border-l-2 border-emerald-400 dark:border-emerald-600">
          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">💰 Venda da mãe</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{baixasMae.baixaPropria.numero_nf && `NF ${baixasMae.baixaPropria.numero_nf} • `}{baixasMae.baixaPropria.data_venda && (formatDate(baixasMae.baixaPropria.data_venda) || '')}{baixasMae.baixaPropria.valor != null && baixasMae.baixaPropria.valor > 0 && ` • R$ ${Number(baixasMae.baixaPropria.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}{baixasMae.baixaPropria.comprador && ` • ${baixasMae.baixaPropria.comprador}`}</p>
        </div>
      )}
      {baixasMae?.resumoMae && (baixasMae.resumoMae.qtdVendidos > 0 || baixasMae.resumoMae.qtdMortesBaixas > 0) && (
        <button
          type="button"
          onClick={() => onOpenProleModal(baixasMae.resumoMae?.proleDetalhes)}
          className="mt-1.5 w-full text-left px-2.5 py-2 rounded-lg bg-amber-50/80 dark:bg-amber-900/15 border-l-2 border-amber-400 dark:border-amber-600 hover:bg-amber-100/80 dark:hover:bg-amber-900/25 transition-colors cursor-pointer active:scale-[0.99]"
        >
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
            📊 Crias {baixasMae.resumoMae.qtdVendidos > 0 && `${baixasMae.resumoMae.qtdVendidos} vendidos`}{baixasMae.resumoMae.qtdVendidos > 0 && baixasMae.resumoMae.qtdMortesBaixas > 0 && ' • '}{baixasMae.resumoMae.qtdMortesBaixas > 0 && `${baixasMae.resumoMae.qtdMortesBaixas} mortes/abates`}
            <span className="text-[9px] font-normal text-amber-500 dark:text-amber-400">(toque para detalhes)</span>
          </p>
        </button>
      )}
    </div>
  )
}
