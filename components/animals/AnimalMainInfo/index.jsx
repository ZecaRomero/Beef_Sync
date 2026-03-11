import React, { useState } from 'react'
import Link from 'next/link'
import {
  UserIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import InfoRow from '../InfoRow'
import { formatDate, formatCurrency } from '../../../utils/formatters'
import { getCardHeaderClasses, getIconClasses, getIconColorClasses, getIdentColorClasses, getCardBorderClasses, getLocationButtonClasses, getLocationTextClasses } from '../../../utils/animalSexTheme'
import RankingBadges from './RankingBadges'
import BaixaSection from './BaixaSection'
import ProleResumoSection from './ProleResumoSection'
import MaeSection from './MaeSection'
import ProleModal from './ProleModal'
import GeneticInfoSection from './GeneticInfoSection'

export default function AnimalMainInfo({
  animal,
  sexTheme = 'neutral',
  rankings = {},
  metrics = {},
  examesAndrologicos = [],
  ultimaIA,
  totalOocitos,
  onCopyIdent,
  onWhatsAppShare,
  onEditGenetica,
  maeLink,
  maeColetas,
  baixasResumo,
  baixasMae,
  locAtual,
  onScrollToLocation
}) {
  const [showProleModal, setShowProleModal] = useState(false)
  const [proleDetalhesData, setProleDetalhesData] = useState(null)

  const {
    filhoTopIABCZ: filhoTopRanking,
    filhoTopIQG: filhoTopRankingIQG
  } = rankings

  const {
    mesesIdade,
    diasAdicionais,
    idadeDias,
    isPrenha,
    diasParaParto,
    previsaoPartoExibir,
    isParidaEPrenha
  } = metrics

  const nome = animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || '-'

  const baixaPropriaExibir = baixasResumo?.baixaPropria || (animal._apenas_baixas && animal.baixas?.length > 0 ? (() => {
    const venda = animal.baixas.find(b => b.tipo === 'VENDA')
    const morte = animal.baixas.find(b => b.tipo === 'MORTE/BAIXA')
    return {
      vendido: !!venda,
      morto: !!morte,
      numero_nf: venda?.numero_nf || null,
      data_venda: venda?.data_baixa || null,
      valor: venda?.valor != null ? parseFloat(venda.valor) : null,
      comprador: venda?.comprador || null,
      causa: morte?.causa || null,
      data_baixa: morte?.data_baixa || venda?.data_baixa || null,
    }
  })() : null)

  const handleOpenProleModal = (data) => {
    setProleDetalhesData(data)
    setShowProleModal(true)
  }

  return (
    <div className={`bg-white/95 dark:bg-gray-800/95 rounded-xl border ${getCardBorderClasses(sexTheme)} dark:border-gray-600 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 backdrop-blur-sm`}>
      <div className={`px-4 py-2.5 ${getCardHeaderClasses(sexTheme)}`}>
        <p className={`text-[10px] uppercase tracking-wider font-semibold ${getIdentColorClasses(sexTheme)} opacity-90`}>Identificação</p>
        <p className={`text-sm font-bold tracking-tight ${getIdentColorClasses(sexTheme)}`}>{animal.serie || '-'} {animal.rg || ''}</p>
      </div>
      <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-2.5 mb-3">
          <div className={`p-2 rounded-lg flex-shrink-0 ${getIconClasses(sexTheme)}`}>
            <UserIcon className={`h-6 w-6 ${getIconColorClasses(sexTheme)}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{nome}</h1>
              <RankingBadges rankings={rankings} />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {isParidaEPrenha && (
                <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-amber-100 to-emerald-100 dark:from-amber-900/40 dark:to-emerald-900/40 border-2 border-amber-400/50 dark:border-emerald-500/50 text-amber-900 dark:text-emerald-100 shadow-sm">
                  🐄 PARIDA e PRENHA
                </span>
              )}
              {examesAndrologicos.length > 0 && (() => {
                const ult = examesAndrologicos[0]
                const res = String(ult?.resultado || '').toUpperCase()
                return (
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                    res.includes('APTO')
                      ? 'bg-white dark:bg-gray-700 border-2 border-green-500 text-green-800 dark:text-green-200'
                      : res.includes('INAPTO')
                      ? 'bg-white dark:bg-gray-700 border-2 border-red-500 text-red-800 dark:text-red-200'
                      : 'bg-white dark:bg-gray-700 border-2 border-amber-500 text-amber-900 dark:text-amber-200'
                  }`}>
                    Andrológico: {ult.resultado || 'Pendente'}
                  </span>
                )
              })()}
              {animal.fivs?.length > 0 && (
                <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-gray-700 border-2 border-violet-500 text-violet-900 dark:text-violet-100 shadow-sm">
                  🧪 Doadora FIV • {animal.fivs.length} coleta{animal.fivs.length > 1 ? 's' : ''} • {totalOocitos} oócitos
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button type="button" onClick={onCopyIdent} className="min-h-[40px] px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all">
                Copiar identificação
              </button>
              <button type="button" onClick={onWhatsAppShare} className="min-h-[40px] px-3 py-2 rounded-lg bg-green-500/90 hover:bg-green-600 text-white border border-green-600 dark:border-green-500 text-xs font-semibold active:scale-[0.98] transition-all shadow-sm">
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        <BaixaSection baixaPropriaExibir={baixaPropriaExibir} animal={animal} baixasResumo={baixasResumo} />
        <ProleResumoSection baixasResumo={baixasResumo} onOpenProleModal={handleOpenProleModal} />
        <InfoRow label="Sexo" value={animal.sexo} />
        <InfoRow label="Raça" value={animal.raca} />
        <InfoRow label="Pelagem" value={animal.pelagem} />
        <InfoRow label="Situação" value={animal.situacao} />
        <button
          type="button"
          onClick={() => onScrollToLocation?.()}
          className={`w-full px-4 py-2.5 flex justify-between items-center border-t text-left ${getLocationButtonClasses(sexTheme)} ${onScrollToLocation ? 'cursor-pointer active:scale-[0.99] transition-all' : 'cursor-default'}`}
        >
          <span className={`text-sm font-medium flex items-center gap-1 ${getLocationTextClasses(sexTheme)}`}>
            <MapPinIcon className="h-4 w-4" />
            Localização (Piquete)
          </span>
          <span className={`text-sm font-bold flex items-center gap-1 ${getIdentColorClasses(sexTheme)}`}>
            {locAtual || 'Não informado'}
            {onScrollToLocation && <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 opacity-70" />}
          </span>
        </button>
        <InfoRow label="Categoria" value={animal.categoria} />
        <InfoRow
          label="Data nascimento"
          value={
            <>
              {formatDate(animal.data_nascimento)}
              {(mesesIdade != null || idadeDias != null) && (
                <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  ({mesesIdade != null ? `${mesesIdade}m${diasAdicionais != null && diasAdicionais > 0 ? ` +${diasAdicionais}d` : ''}` : `${idadeDias}d`})
                </span>
              )}
            </>
          }
        />
        {ultimaIA && (
          <>
            <div className="px-4 py-2.5 flex justify-between items-center bg-pink-50/50 dark:bg-pink-900/20 border-t border-pink-100 dark:border-pink-800/30">
              <span className="text-sm font-medium text-pink-800 dark:text-pink-200">
                {isPrenha ? 'Touro (IA prenha)' : 'Touro (última IA)'}
              </span>
              <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                {ultimaIA.touro_nome || ultimaIA.touro || '-'}
              </span>
            </div>
            {previsaoPartoExibir && (
              <div className="px-4 py-2.5 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/30">
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Previsão de Parto</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {previsaoPartoExibir.toLocaleDateString('pt-BR')} ({diasParaParto != null ? diasParaParto : 0} dias)
                </span>
              </div>
            )}
          </>
        )}
        <MaeSection
          animal={animal}
          maeLink={maeLink}
          maeColetas={maeColetas}
          baixasMae={baixasMae}
          onOpenProleModal={handleOpenProleModal}
        />
        <InfoRow label="Pai" value={animal.pai} />
        {(animal.avo_materno || animal.avoMaterno || animal.avo_materna || animal.avoMaterna || animal.avo_paterno || animal.avoPaterno || animal.avo_paterna || animal.avoPaterna) && (
          <div className="px-4 py-2.5 bg-amber-50/30 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-800/20">
            <div className="space-y-2 text-sm">
              {(animal.avo_materno || animal.avoMaterno) && (
                <div className="flex justify-between pl-3 border-l-2 border-amber-300 dark:border-amber-700">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">Avô materno</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{animal.avo_materno || animal.avoMaterno}</span>
                </div>
              )}
              {(animal.avo_materna || animal.avoMaterna) && (
                <div className="flex justify-between pl-3 border-l-2 border-amber-300 dark:border-amber-700">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">Avó materna</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{animal.avo_materna || animal.avoMaterna}</span>
                </div>
              )}
              {(animal.avo_paterno || animal.avoPaterno) && (
                <div className="flex justify-between pl-3 border-l-2 border-blue-300 dark:border-blue-700 mt-3">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">Avô paterno</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{animal.avo_paterno || animal.avoPaterno}</span>
                </div>
              )}
              {(animal.avo_paterna || animal.avoPaterna) && (
                <div className="flex justify-between pl-3 border-l-2 border-blue-300 dark:border-blue-700">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">Avó paterna</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{animal.avo_paterna || animal.avoPaterna}</span>
                </div>
              )}
            </div>
          </div>
        )}
        <GeneticInfoSection animal={animal} rankings={rankings} onEditGenetica={onEditGenetica} />
      </div>
      {showProleModal && proleDetalhesData && proleDetalhesData.length > 0 && (
        <ProleModal proleDetalhesData={proleDetalhesData} onClose={() => setShowProleModal(false)} />
      )}
    </div>
  )
}
