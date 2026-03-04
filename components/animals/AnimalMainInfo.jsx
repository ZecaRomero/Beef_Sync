import React from 'react'
import Link from 'next/link'
import {
  UserIcon,
  UserGroupIcon,
  TrophyIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  ChartBarIcon,
  SparklesIcon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline'
import InfoRow from './InfoRow'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function AnimalMainInfo({
  animal,
  rankings = {},
  metrics = {},
  examesAndrologicos = [],
  ultimaIA,
  totalOocitos,
  onCopyIdent,
  onWhatsAppShare,
  onEditGenetica,
  maeLink,
  locAtual
}) {
  const {
    posicaoIABCZ: rankingPosicao,
    posicaoIQG: rankingPosicaoGenetica2,
    filhoTopIABCZ: filhoTopRanking,
    filhoTopIQG: filhoTopRankingIQG
  } = rankings

  const {
    ultimoCE,
    diasDesdeExame,
    isPrenha,
    diasParaParto,
    previsaoPartoExibir,
    isMacho,
    isFemea
  } = metrics
  
  const nome = animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || '-'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Identificação em destaque */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identificação</p>
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{animal.serie || '-'} {animal.rg || ''}</p>
      </div>
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <UserIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{nome}</h1>
              {filhoTopRanking && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg">
                  <UserGroupIcon className="h-4 w-4" />
                  Mãe do 1º iABCZ
                </span>
              )}
              {rankingPosicao === 1 && !filhoTopRanking && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white text-sm font-bold shadow-lg">
                  <TrophyIcon className="h-4 w-4" />
                  1º iABCZ
                </span>
              )}
              {rankingPosicao === 2 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-500 text-white text-sm font-bold shadow-lg">
                  <TrophyIcon className="h-4 w-4" />
                  2º iABCZ
                </span>
              )}
              {rankingPosicao === 3 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700 text-white text-sm font-bold shadow-lg">
                  <TrophyIcon className="h-4 w-4" />
                  3º iABCZ
                </span>
              )}
              {rankingPosicao >= 4 && rankingPosicao <= 10 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-bold">
                  {rankingPosicao}º iABCZ
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
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
            <div className="mt-4 flex items-center gap-2">
              <button type="button" onClick={onCopyIdent} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-xs font-semibold">
                Copiar identificação
              </button>
              <button type="button" onClick={onWhatsAppShare} className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 text-xs font-semibold">
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        <InfoRow label="Sexo" value={animal.sexo} />
        <InfoRow label="Raça" value={animal.raca} />
        <InfoRow label="Pelagem" value={animal.pelagem} />
        <InfoRow label="Situação" value={animal.situacao} />
        <div className="px-6 py-3 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/30">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
            <MapPinIcon className="h-4 w-4" />
            Localização (Piquete)
          </span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {locAtual || 'Não informado'}
          </span>
        </div>
        <InfoRow label="Categoria" value={animal.categoria} />
        <InfoRow label="Data nascimento" value={formatDate(animal.data_nascimento)} />
        {ultimaIA && (
          <>
            <div className="px-6 py-3 flex justify-between items-center bg-pink-50/50 dark:bg-pink-900/20 border-t border-pink-100 dark:border-pink-800/30">
              <span className="text-sm font-medium text-pink-800 dark:text-pink-200">
                {isPrenha ? 'Touro (IA prenha)' : 'Touro (última IA)'}
              </span>
              <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                {ultimaIA.touro_nome || ultimaIA.touro || '-'}
              </span>
            </div>
            {previsaoPartoExibir && (
              <div className="px-6 py-3 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/30">
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Previsão de Parto
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {previsaoPartoExibir.toLocaleDateString('pt-BR')} ({diasParaParto != null ? diasParaParto : 0} dias)
                </span>
              </div>
            )}
          </>
        )}
        {(animal.mae || animal.serie_mae || animal.rg_mae) && (
          <div className="px-6 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Mãe</span>
            <div className="text-right">
              {(() => {
                const serie = animal.serie_mae || maeLink?.serie
                const rg = animal.rg_mae || maeLink?.rg
                const ident = serie && rg ? `${serie} ${rg}` : null
                if (ident) {
                  return (
                    <Link href={`/consulta-animal/${serie}-${rg}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-end gap-1">
                      {ident}
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    </Link>
                  )
                }
                return (
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {animal.mae || '-'}
                    </span>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      ⚠️ Não encontrada no cadastro (pode estar inativa)
                    </p>
                  </div>
                )
              })()}
              {animal.mae && (animal.serie_mae || maeLink) && (
                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  {animal.mae}
                </span>
              )}
            </div>
          </div>
        )}
        <InfoRow label="Pai" value={animal.pai} />
        {(animal.avo_materno || animal.avoMaterno || animal.avo_materna || animal.avoMaterna || animal.avo_paterno || animal.avoPaterno || animal.avo_paterna || animal.avoPaterna) && (
          <div className="px-6 py-4 bg-amber-50/30 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-800/20">
            
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
        {/* Informações Genéticas */}
        <div className={`px-6 py-3 flex justify-between items-center border-t ${
          (animal.abczg || animal.abczg === 0) ? (
            filhoTopRanking ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' :
            rankingPosicao === 1 ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' :
            rankingPosicao === 2 ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-700' :
            rankingPosicao === 3 ? 'bg-amber-50/30 dark:bg-amber-900/5 border-amber-100 dark:border-amber-800/20' :
            rankingPosicao && rankingPosicao <= 10 ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' :
            'bg-amber-50/30 dark:bg-amber-900/5 border-amber-100 dark:border-amber-800/20'
          ) : 'bg-amber-50/20 dark:bg-amber-900/5 border-amber-100/50 dark:border-amber-800/20'
        }`}>
          <span className={`text-sm font-medium flex items-center gap-1 ${
            (animal.abczg || animal.abczg === 0) ? (
              filhoTopRanking ? 'text-emerald-800 dark:text-emerald-200' :
              rankingPosicao === 1 ? 'text-amber-800 dark:text-amber-200' :
              rankingPosicao === 2 ? 'text-slate-700 dark:text-slate-300' :
              rankingPosicao === 3 ? 'text-amber-800 dark:text-amber-200' :
              rankingPosicao && rankingPosicao <= 10 ? 'text-blue-800 dark:text-blue-200' :
              'text-amber-700 dark:text-amber-300'
            ) : 'text-amber-700 dark:text-amber-300'
          }`}>
            {filhoTopRanking ? <UserGroupIcon className="h-4 w-4" /> : <TrophyIcon className="h-4 w-4" />}
            iABCZ (PMGZ)
          </span>
          <span className={`text-lg font-bold ${
            (animal.abczg || animal.abczg === 0) ? (
              filhoTopRanking ? 'text-emerald-600 dark:text-emerald-400' :
              rankingPosicao === 1 ? 'text-amber-600 dark:text-amber-400' :
              rankingPosicao === 2 ? 'text-slate-600 dark:text-slate-300' :
              rankingPosicao === 3 ? 'text-amber-700 dark:text-amber-400' :
              rankingPosicao && rankingPosicao <= 10 ? 'text-blue-600 dark:text-blue-400' :
              'text-amber-600 dark:text-amber-400'
            ) : 'text-amber-600/80 dark:text-amber-400/80'
          }`}>
            {(animal.abczg || animal.abczg === 0) ? animal.abczg : 'Não informado'}
            {filhoTopRanking && (animal.abczg || animal.abczg === 0) && (
              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                Mãe do 1º
              </span>
            )}
            {rankingPosicao && rankingPosicao <= 10 && !filhoTopRanking && (animal.abczg || animal.abczg === 0) && (
              <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${
                rankingPosicao === 1 ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100' :
                rankingPosicao === 2 ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' :
                rankingPosicao === 3 ? 'bg-amber-300 dark:bg-amber-800 text-amber-900 dark:text-amber-100' :
                'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
              }`}>
                {rankingPosicao}º ranking
              </span>
            )}
          </span>
        </div>
        <div className={`px-6 py-3 flex justify-between items-center border-t ${
          (animal.deca || animal.deca === 0) ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800/30' : 'bg-teal-50/20 dark:bg-teal-900/5 border-teal-100/50 dark:border-teal-800/20'
        }`}>
          <span className={`text-sm font-medium flex items-center gap-1 ${
            (animal.deca || animal.deca === 0) ? 'text-teal-800 dark:text-teal-200' : 'text-teal-700 dark:text-teal-300'
          }`}>
            <ChartBarIcon className="h-4 w-4" />
            DECA
          </span>
          <span className={`text-lg font-bold ${
            (animal.deca || animal.deca === 0) ? 'text-teal-600 dark:text-teal-400' : 'text-teal-600/80 dark:text-teal-400/80'
          }`}>
            {(animal.deca || animal.deca === 0) ? animal.deca : 'Não informado'}
          </span>
        </div>
        <div className={`px-6 py-3 flex justify-between items-center border-t ${
          ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? (
            rankingPosicaoGenetica2 === 1 ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30' :
            rankingPosicaoGenetica2 === 2 ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30' :
            rankingPosicaoGenetica2 === 3 ? 'bg-violet-50/50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30' :
            rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' :
            'bg-purple-50/30 dark:bg-purple-900/5 border-purple-100 dark:border-purple-800/20'
          ) : 'bg-purple-50/20 dark:bg-purple-900/5 border-purple-100/50 dark:border-purple-800/20'
        }`}>
          <span className={`text-sm font-medium flex items-center gap-1 ${
            ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? (
              rankingPosicaoGenetica2 === 1 ? 'text-purple-800 dark:text-purple-200' :
              rankingPosicaoGenetica2 === 2 ? 'text-indigo-800 dark:text-indigo-200' :
              rankingPosicaoGenetica2 === 3 ? 'text-violet-800 dark:text-violet-200' :
              rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 ? 'text-blue-800 dark:text-blue-200' :
              'text-purple-700 dark:text-purple-300'
            ) : 'text-purple-700 dark:text-purple-300'
          }`}>
            <SparklesIcon className="h-4 w-4" />
            IQG
          </span>
          <span className={`text-lg font-bold ${
            ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? (
              rankingPosicaoGenetica2 === 1 ? 'text-purple-600 dark:text-purple-400' :
              rankingPosicaoGenetica2 === 2 ? 'text-indigo-600 dark:text-indigo-400' :
              rankingPosicaoGenetica2 === 3 ? 'text-violet-600 dark:text-violet-400' :
              rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 ? 'text-blue-600 dark:text-blue-400' :
              'text-purple-600 dark:text-purple-400'
            ) : 'text-purple-600/80 dark:text-purple-400/80'
          }`}>
            {((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? (animal.iqg ?? animal.genetica_2) : 'Não informado'}
            {rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10 && ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) && (
              <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${
                rankingPosicaoGenetica2 === 1 ? 'bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100' :
                rankingPosicaoGenetica2 === 2 ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100' :
                rankingPosicaoGenetica2 === 3 ? 'bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100' :
                'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
              }`}>
                {rankingPosicaoGenetica2}º ranking
              </span>
            )}
          </span>
        </div>
        <div className={`px-6 py-3 flex justify-between items-center border-t ${
          ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? 'bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-100 dark:border-cyan-800/30' : 'bg-cyan-50/20 dark:bg-cyan-900/5 border-cyan-100/50 dark:border-cyan-800/20'
        }`}>
          <span className={`text-sm font-medium flex items-center gap-1 ${
            ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? 'text-cyan-800 dark:text-cyan-200' : 'text-cyan-700 dark:text-cyan-300'
          }`}>
            <CubeTransparentIcon className="h-4 w-4" />
            Pt IQG
          </span>
          <span className={`text-lg font-bold ${
            ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? 'text-cyan-600 dark:text-cyan-400' : 'text-cyan-600/80 dark:text-cyan-400/80'
          }`}>
            {((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? (animal.pt_iqg ?? animal.decile_2) : 'Não informado'}
          </span>
        </div>
        <InfoRow label="Brinco" value={animal.brinco} />
        <InfoRow label="Tatuagem" value={animal.tatuagem} />
        {(animal.valor_venda || animal.valorVenda) && (
          <InfoRow label="Valor venda" value={formatCurrency(animal.valor_venda || animal.valorVenda)} />
        )}
        <InfoRow label="Comprador/Destino" value={animal.comprador || animal.destino} />
        <InfoRow label="Receptora" value={animal.receptora} />
        <InfoRow 
          label="Situação ABCZ" 
          value={animal.situacao_abcz || animal.situacaoAbcz || 'Não informado'} 
          action={
            <button
              type="button"
              onClick={onEditGenetica}
              className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              title="Editar dados genéticos"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          }
        />
        {(animal.custo_aquisicao || animal.custoAquisicao) && (
          <InfoRow label="Custo aquisição" value={formatCurrency(animal.custo_aquisicao || animal.custoAquisicao)} />
        )}
        <InfoRow label="Observações" value={animal.observacoes} />
      </div>
    </div>
  )
}
