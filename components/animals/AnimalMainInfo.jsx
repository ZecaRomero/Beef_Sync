import React, { useState } from 'react'
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
  CubeTransparentIcon,
  XMarkIcon
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
  maeColetas,
  baixasResumo,
  baixasMae,
  locAtual,
  onScrollToLocation
}) {
  const {
    posicaoIABCZ: rankingPosicao,
    posicaoDECA,
    posicaoIQG: rankingPosicaoGenetica2,
    posicaoPtIQG,
    posicaoMGte,
    filhoTopIABCZ: filhoTopRanking,
    filhoTopDECA,
    filhoTopIQG: filhoTopRankingIQG,
    filhoTopPtIQG
  } = rankings

  const [showProleModal, setShowProleModal] = useState(false)
  const [proleDetalhesData, setProleDetalhesData] = useState(null)

  const {
    ultimoCE,
    diasDesdeExame,
    isPrenha,
    diasParaParto,
    previsaoPartoExibir,
    isMacho,
    isFemea,
    mesesIdade,
    diasAdicionais,
    idadeDias
  } = metrics
  
  const nome = animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || '-'

  // Para animais inativos (só em baixas): usar animal.baixas como fallback se baixasResumo ainda não carregou
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Identificação em destaque */}
      <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Identificação</p>
        <p className="text-base font-bold text-amber-600 dark:text-amber-400 tracking-tight">{animal.serie || '-'} {animal.rg || ''}</p>
      </div>
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
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
              {filhoTopDECA && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg">
                  <UserGroupIcon className="h-4 w-4" />
                  Mãe do 1º DECA
                </span>
              )}
              {filhoTopRankingIQG && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg">
                  <UserGroupIcon className="h-4 w-4" />
                  Mãe do 1º IQG
                </span>
              )}
              {filhoTopPtIQG && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg">
                  <UserGroupIcon className="h-4 w-4" />
                  Mãe do 1º Pt IQG
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
              {posicaoDECA === 1 && !filhoTopDECA && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white text-sm font-bold shadow-lg">
                  <TrophyIcon className="h-4 w-4" /> 1º DECA
                </span>
              )}
              {posicaoDECA === 2 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-500 text-white text-sm font-bold">
                  <TrophyIcon className="h-4 w-4" /> 2º DECA
                </span>
              )}
              {posicaoDECA === 3 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700 text-white text-sm font-bold">
                  <TrophyIcon className="h-4 w-4" /> 3º DECA
                </span>
              )}
              {rankingPosicaoGenetica2 === 1 && !filhoTopRankingIQG && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-bold shadow-lg">
                  <TrophyIcon className="h-4 w-4" /> 1º IQG
                </span>
              )}
              {rankingPosicaoGenetica2 === 2 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500 text-white text-sm font-bold">
                  <TrophyIcon className="h-4 w-4" /> 2º IQG
                </span>
              )}
              {rankingPosicaoGenetica2 === 3 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500 text-white text-sm font-bold">
                  <TrophyIcon className="h-4 w-4" /> 3º IQG
                </span>
              )}
              {posicaoPtIQG === 1 && !filhoTopPtIQG && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500 text-white text-sm font-bold shadow-lg">
                  <TrophyIcon className="h-4 w-4" /> 1º Pt IQG
                </span>
              )}
              {posicaoPtIQG === 2 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-500 text-white text-sm font-bold">
                  <TrophyIcon className="h-4 w-4" /> 2º Pt IQG
                </span>
              )}
              {posicaoPtIQG === 3 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700 text-white text-sm font-bold">
                  <TrophyIcon className="h-4 w-4" /> 3º Pt IQG
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
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <button type="button" onClick={onCopyIdent} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-sm font-semibold active:scale-[0.98] transition-transform">
                Copiar identificação
              </button>
              <button type="button" onClick={onWhatsAppShare} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 text-sm font-semibold active:scale-[0.98] transition-transform">
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {/* Morte/Baixa/Abate - exibe para animais cadastrados e inativos (histórico) */}
        {baixaPropriaExibir?.morto && !baixaPropriaExibir?.vendido && (
          <div className="px-6 py-4 bg-gray-100/50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-600">
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
        )}
        {/* Venda (Data, NF, Valor, Comprador) */}
        {baixaPropriaExibir?.vendido && (
          <div className="px-6 py-4 bg-emerald-50/80 dark:bg-emerald-900/20 border-b border-emerald-200/50 dark:border-emerald-800/50">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm mb-3 flex items-center gap-2">
              <span>💰</span> Venda
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
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
        )}
        {/* Registrar venda - quando não há venda registrada (apenas animais cadastrados) - REMOVIDO para animais ativos */}
        {false && !animal._apenas_baixas && baixasResumo && !baixaPropriaExibir?.vendido && !baixaPropriaExibir?.morto && (animal.serie || animal.serie_mae) && (animal.rg || animal.rg_mae) && (
          <Link
            href={`/registrar-venda?serie=${encodeURIComponent(animal.serie || animal.serie_mae || '')}&rg=${encodeURIComponent(animal.rg || animal.rg_mae || '')}`}
            className="block px-6 py-4 bg-amber-50/80 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-800/50 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors"
          >
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <span>💰</span> Nenhuma venda registrada — <span className="underline font-semibold">Registrar venda</span>
            </p>
          </Link>
        )}
        {/* Resumo Mãe - Filhos vendidos e média R$ - clicável para ver detalhes */}
        {baixasResumo?.resumoMae && (baixasResumo.resumoMae.qtdVendidos > 0 || baixasResumo.resumoMae.qtdMortesBaixas > 0) && (
          <button
            type="button"
            onClick={() => { setProleDetalhesData(baixasResumo.resumoMae?.proleDetalhes); setShowProleModal(true) }}
            className="w-full text-left px-6 py-4 bg-amber-50/80 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-800/50 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
          >
            <h3 className="font-bold text-amber-800 dark:text-amber-200 text-sm mb-3 flex items-center gap-2">
              <span>📊</span> Prole (Baixas)
              <span className="text-xs font-normal text-amber-600 dark:text-amber-400">(clique para ver detalhes)</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {baixasResumo.resumoMae.qtdVendidos > 0 && (
                <>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Filhos vendidos</p>
                    <p className="font-bold text-amber-700 dark:text-amber-300">{baixasResumo.resumoMae.qtdVendidos}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Média R$</p>
                    <p className="font-bold text-amber-700 dark:text-amber-300">
                      R$ {Number(baixasResumo.resumoMae.mediaVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Total vendas</p>
                    <p className="font-bold text-amber-700 dark:text-amber-300">
                      R$ {Number(baixasResumo.resumoMae.totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </>
              )}
              {baixasResumo.resumoMae.qtdMortesBaixas > 0 && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Mortes/Abates</p>
                  <p className="font-bold text-amber-700 dark:text-amber-300">{baixasResumo.resumoMae.qtdMortesBaixas}</p>
                </div>
              )}
            </div>
          </button>
        )}
        <InfoRow label="Sexo" value={animal.sexo} />
        <InfoRow label="Raça" value={animal.raca} />
        <InfoRow label="Pelagem" value={animal.pelagem} />
        <InfoRow label="Situação" value={animal.situacao} />
        <button
          type="button"
          onClick={() => onScrollToLocation?.()}
          className={`w-full px-6 py-3 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/30 text-left ${onScrollToLocation ? 'cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors' : 'cursor-default'}`}
        >
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
            <MapPinIcon className="h-4 w-4" />
            Localização (Piquete)
          </span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
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
          <div className="px-6 py-3">
            <div className="flex justify-between items-center">
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
                    <>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {animal.mae || '-'}
                      </span>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        ⚠️ Não encontrada no cadastro (pode estar inativa)
                      </p>
                    </>
                  )
                })()}
                {animal.mae && (animal.serie_mae || maeLink) && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                    {animal.mae}
                  </span>
                )}
              </div>
            </div>
            {/* Histórico FIV da mãe (doadora) - exibido na ficha do filho */}
            {maeColetas?.resumo && (
              <div className="mt-2 p-3 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
                <p className="text-xs font-semibold text-pink-800 dark:text-pink-200 mb-2">🧪 Histórico FIV (Doadora)</p>
                <ul className="space-y-1 text-xs text-pink-700 dark:text-pink-300">
                  <li>{maeColetas.resumo.totalColetas} coletas • {maeColetas.resumo.totalOocitos} oócitos (média {maeColetas.resumo.mediaOocitos}/coleta)</li>
                  <li>{maeColetas.resumo.totalEmbrioesProduzidos} embriões (média {maeColetas.resumo.mediaEmbrioesProduzidos}) • {maeColetas.resumo.totalEmbrioesTransferidos} transferidos</li>
                </ul>
              </div>
            )}
            {/* Resumo de venda da mãe - exibido na ficha do filho */}
            {baixasMae?.baixaPropria?.vendido && (
              <div className="mt-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 mb-2">💰 Venda da mãe</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  {baixasMae.baixaPropria.numero_nf && (
                    <div><span className="text-gray-500 dark:text-gray-400">NF:</span> {baixasMae.baixaPropria.numero_nf}</div>
                  )}
                  {baixasMae.baixaPropria.data_venda && (
                    <div><span className="text-gray-500 dark:text-gray-400">Data:</span> {new Date(baixasMae.baixaPropria.data_venda).toLocaleDateString('pt-BR')}</div>
                  )}
                  {baixasMae.baixaPropria.valor != null && baixasMae.baixaPropria.valor > 0 && (
                    <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">Valor:</span> R$ {Number(baixasMae.baixaPropria.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  )}
                  {baixasMae.baixaPropria.comprador && (
                    <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">Comprador:</span> {baixasMae.baixaPropria.comprador}</div>
                  )}
                </div>
              </div>
            )}
            {/* Resumo prole da mãe (filhos vendidos, média R$) - clicável para ver detalhes */}
            {baixasMae?.resumoMae && (baixasMae.resumoMae.qtdVendidos > 0 || baixasMae.resumoMae.qtdMortesBaixas > 0) && (
              <button
                type="button"
                onClick={() => { setProleDetalhesData(baixasMae.resumoMae?.proleDetalhes); setShowProleModal(true) }}
                className="mt-2 w-full text-left p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
              >
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1">
                  📊 Informações crias
                  <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">(clique para ver detalhes)</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-amber-700 dark:text-amber-300">
                  {baixasMae.resumoMae.qtdVendidos > 0 && (
                    <>
                      <div><span className="text-gray-500 dark:text-gray-400">Filhos vendidos:</span> {baixasMae.resumoMae.qtdVendidos}</div>
                      <div><span className="text-gray-500 dark:text-gray-400">Média R$:</span> R$ {Number(baixasMae.resumoMae.mediaVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </>
                  )}
                  {baixasMae.resumoMae.qtdMortesBaixas > 0 && (
                    <div><span className="text-gray-500 dark:text-gray-400">Mortes/Abates:</span> {baixasMae.resumoMae.qtdMortesBaixas}</div>
                  )}
                </div>
              </button>
            )}
            {/* Modal com lista detalhada da prole */}
            {showProleModal && proleDetalhesData && proleDetalhesData.length > 0 && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowProleModal(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    <h3 className="font-bold text-amber-800 dark:text-amber-200">📊 Prole – detalhes importados</h3>
                    <button type="button" onClick={() => setShowProleModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
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
            )}
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
        {/* Informações Genéticas - só exibe quando tem dado */}
        {(animal.abczg || animal.abczg === 0) && (
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
            {animal.abczg}
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
        )}
        {(animal.deca || animal.deca === 0) && (
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
            {animal.deca}
          </span>
        </div>
        )}
        {((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) && (
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
            {(animal.iqg ?? animal.genetica_2)}
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
        )}
        {((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) && (
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
            {(animal.pt_iqg ?? animal.decile_2)}
          </span>
        </div>
        )}
        {(animal.mgte || animal.mgte === 0) && (
          <div className="px-6 py-3 flex justify-between items-center border-t bg-indigo-50/30 dark:bg-indigo-900/5 border-indigo-100 dark:border-indigo-800/20">
            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">MGTe</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{animal.mgte}</span>
          </div>
        )}
        {(animal.top != null && animal.top !== '') && (
          <div className="px-6 py-3 flex justify-between items-center border-t bg-sky-50/30 dark:bg-sky-900/5 border-sky-100 dark:border-sky-800/20">
            <span className="text-sm font-medium text-sky-800 dark:text-sky-200">TOP</span>
            <span className="text-lg font-bold text-sky-600 dark:text-sky-400">{animal.top}</span>
          </div>
        )}
        <InfoRow label="Brinco" value={animal.brinco} />
        <InfoRow label="Tatuagem" value={animal.tatuagem} />
        {(animal.valor_venda || animal.valorVenda) && (
          <InfoRow label="Valor venda" value={formatCurrency(animal.valor_venda || animal.valorVenda)} />
        )}
        <InfoRow label="Comprador/Destino" value={animal.comprador || animal.destino} />
        <InfoRow label="Receptora" value={animal.receptora} />
        {(animal.situacao_abcz || animal.situacaoAbcz) && (
        <InfoRow 
          label="Situação ABCZ" 
          value={animal.situacao_abcz || animal.situacaoAbcz} 
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
        )}
        {(animal.custo_aquisicao || animal.custoAquisicao) && (
          <InfoRow label="Custo aquisição" value={formatCurrency(animal.custo_aquisicao || animal.custoAquisicao)} />
        )}
        <InfoRow label="Observações" value={animal.observacoes} />
      </div>
    </div>
  )
}
