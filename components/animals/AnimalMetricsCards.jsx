import React from 'react'
import {
  UserGroupIcon,
  TrophyIcon,
  SparklesIcon,
  HeartIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

function formatCurrency(v) {
  if (v == null || v === '') return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v))
}

export default function AnimalMetricsCards({ animal, metrics, rankings, onScrollTo }) {
  if (!animal || !metrics) return null

  const {
    posicaoIABCZ, posicaoDECA, posicaoIQG, posicaoPtIQG, posicaoMGte,
    filhoTopIABCZ, filhoTopDECA, filhoTopIQG, filhoTopPtIQG
  } = rankings || {}

  // Helper: estilos e emoji de troféu por posição (1º, 2º, 3º)
  const getTrophy = (pos) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : ''
  const getRankLabel = (pos, filhoTop) => filhoTop ? 'Mãe do 1º' : pos ? (getTrophy(pos) ? `${getTrophy(pos)} ${pos}º` : `${pos}º ranking`) : ''

  const {
    diasDesdeExame, isInapto, diasParaProximoExame,
    custoTotal,
    diasNaFazenda,
    isPrenha, diasGestacao, diasParaParto, gestacaoProgress,
    totalIAs, taxaSucessoIA, mediaOocitos,
    isMacho, isFemea
  } = metrics

  // Exibir previsão de parto apenas se estiver prenha
  const previsaoPartoExibir = isPrenha && diasParaParto != null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
      {/* iABCZ */}
      {(animal.abczg || animal.abczg === 0) && (
        <button
          type="button"
          onClick={() => onScrollTo?.('genética')}
          className={`rounded-xl p-3 border text-center w-full text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform ${
          filhoTopIABCZ
            ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-400 dark:border-emerald-500'
            : posicaoIABCZ === 1
            ? 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-500'
            : posicaoIABCZ === 2
            ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 border-2 border-slate-400 dark:border-slate-500'
            : posicaoIABCZ === 3
            ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 border-2 border-amber-600 dark:border-amber-700'
            : posicaoIABCZ && posicaoIABCZ <= 10
            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <p className={`text-2xl font-bold ${
            filhoTopIABCZ ? 'text-emerald-600 dark:text-emerald-400' :
            posicaoIABCZ === 1 ? 'text-amber-600 dark:text-amber-400' :
            posicaoIABCZ === 2 ? 'text-slate-600 dark:text-slate-300' :
            posicaoIABCZ === 3 ? 'text-amber-700 dark:text-amber-300' :
            posicaoIABCZ && posicaoIABCZ <= 10 ? 'text-blue-600 dark:text-blue-400' :
            'text-blue-600 dark:text-blue-400'
          }`}>
            {animal.abczg}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">iABCZ</p>
          {(filhoTopIABCZ || (posicaoIABCZ && posicaoIABCZ <= 10)) && (
            <p className={`text-xs font-bold mt-0.5 ${
              filhoTopIABCZ ? 'text-emerald-600 dark:text-emerald-400' :
              posicaoIABCZ === 1 ? 'text-amber-600 dark:text-amber-400' :
              posicaoIABCZ === 2 ? 'text-slate-600 dark:text-slate-400' :
              posicaoIABCZ === 3 ? 'text-amber-700 dark:text-amber-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {getRankLabel(posicaoIABCZ, filhoTopIABCZ)}
            </p>
          )}
        </button>
      )}

      {/* DECA */}
      {(animal.deca || animal.deca === 0) && (
        <button
          type="button"
          onClick={() => onScrollTo?.('genética')}
          className={`rounded-xl p-3 border text-center w-full text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform ${
          filhoTopDECA
            ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-400 dark:border-emerald-500'
            : posicaoDECA === 1
            ? 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-500'
            : posicaoDECA === 2
            ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 border-2 border-slate-400 dark:border-slate-500'
            : posicaoDECA === 3
            ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 border-2 border-amber-600 dark:border-amber-700'
            : posicaoDECA && posicaoDECA <= 10
            ? 'bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-300 dark:border-teal-700'
            : 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border-2 border-teal-300 dark:border-teal-600'
        }`}>
          <p className={`text-2xl font-bold ${
            filhoTopDECA ? 'text-emerald-600 dark:text-emerald-400' :
            posicaoDECA === 1 ? 'text-amber-600 dark:text-amber-400' :
            posicaoDECA === 2 ? 'text-slate-600 dark:text-slate-300' :
            posicaoDECA === 3 ? 'text-amber-700 dark:text-amber-300' :
            posicaoDECA && posicaoDECA <= 10 ? 'text-teal-600 dark:text-teal-400' :
            'text-teal-600 dark:text-teal-400'
          }`}>
            {animal.deca}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">DECA</p>
          {(filhoTopDECA || (posicaoDECA && posicaoDECA <= 10)) && (
            <p className={`text-xs font-bold mt-0.5 ${
              filhoTopDECA ? 'text-emerald-600 dark:text-emerald-400' :
              posicaoDECA === 1 ? 'text-amber-600 dark:text-amber-400' :
              posicaoDECA === 2 ? 'text-slate-600 dark:text-slate-400' :
              posicaoDECA === 3 ? 'text-amber-700 dark:text-amber-400' :
              'text-teal-600 dark:text-teal-400'
            }`}>
              {getRankLabel(posicaoDECA, filhoTopDECA)}
            </p>
          )}
        </button>
      )}

      {/* IQG */}
      {((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) && (
        <button
          type="button"
          onClick={() => onScrollTo?.('genética')}
          className={`rounded-xl p-3 border text-center w-full text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform ${
          filhoTopIQG
            ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-400 dark:border-emerald-500'
            : posicaoIQG === 1
            ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border-2 border-purple-400 dark:border-purple-500'
            : posicaoIQG === 2
            ? 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border-2 border-indigo-400 dark:border-indigo-500'
            : posicaoIQG === 3
            ? 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 border-2 border-violet-400 dark:border-violet-500'
            : posicaoIQG && posicaoIQG <= 10
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-600'
            : 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-600'
        }`}>
          <p className={`text-2xl font-bold ${
            filhoTopIQG ? 'text-emerald-600 dark:text-emerald-400' :
            posicaoIQG === 1 ? 'text-purple-600 dark:text-purple-400' :
            posicaoIQG === 2 ? 'text-indigo-600 dark:text-indigo-400' :
            posicaoIQG === 3 ? 'text-violet-600 dark:text-violet-400' :
            posicaoIQG && posicaoIQG <= 10 ? 'text-blue-600 dark:text-blue-400' :
            'text-purple-600 dark:text-purple-400'
          }`}>
            {(animal.iqg ?? animal.genetica_2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">IQG</p>
          {(filhoTopIQG || (posicaoIQG && posicaoIQG <= 10)) && (
            <p className={`text-xs font-bold mt-0.5 ${
              filhoTopIQG ? 'text-emerald-600 dark:text-emerald-400' :
              posicaoIQG === 1 ? 'text-purple-600 dark:text-purple-400' :
              posicaoIQG === 2 ? 'text-indigo-600 dark:text-indigo-400' :
              posicaoIQG === 3 ? 'text-violet-600 dark:text-violet-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {getRankLabel(posicaoIQG, filhoTopIQG)}
            </p>
          )}
        </button>
      )}

      {/* Pt IQG - antes de MGTe e TOP (ordem: iABCZ, DECA, IQG, Pt IQG, MGTe, TOP) */}
      {((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) && (
        <button
          type="button"
          onClick={() => onScrollTo?.('genética')}
          className={`rounded-xl p-3 border text-center w-full text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform ${
          filhoTopPtIQG
            ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-2 border-emerald-400 dark:border-emerald-500'
            : posicaoPtIQG === 1
            ? 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-500'
            : posicaoPtIQG === 2
            ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 border-2 border-slate-400 dark:border-slate-500'
            : posicaoPtIQG === 3
            ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 border-2 border-amber-600 dark:border-amber-700'
            : posicaoPtIQG && posicaoPtIQG <= 10
            ? 'bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-300 dark:border-cyan-700'
            : 'bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/30 dark:to-sky-900/30 border-2 border-cyan-300 dark:border-cyan-600'
        }`}>
          <p className={`text-2xl font-bold ${
            filhoTopPtIQG ? 'text-emerald-600 dark:text-emerald-400' :
            posicaoPtIQG === 1 ? 'text-amber-600 dark:text-amber-400' :
            posicaoPtIQG === 2 ? 'text-slate-600 dark:text-slate-300' :
            posicaoPtIQG === 3 ? 'text-amber-700 dark:text-amber-300' :
            posicaoPtIQG && posicaoPtIQG <= 10 ? 'text-cyan-600 dark:text-cyan-400' :
            'text-cyan-600 dark:text-cyan-400'
          }`}>
            {(animal.pt_iqg ?? animal.decile_2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pt IQG</p>
          {(filhoTopPtIQG || (posicaoPtIQG && posicaoPtIQG <= 10)) && (
            <p className={`text-xs font-bold mt-0.5 ${
              filhoTopPtIQG ? 'text-emerald-600 dark:text-emerald-400' :
              posicaoPtIQG === 1 ? 'text-amber-600 dark:text-amber-400' :
              posicaoPtIQG === 2 ? 'text-slate-600 dark:text-slate-400' :
              posicaoPtIQG === 3 ? 'text-amber-700 dark:text-amber-400' :
              'text-cyan-600 dark:text-cyan-400'
            }`}>
              {getRankLabel(posicaoPtIQG, filhoTopPtIQG)}
            </p>
          )}
        </button>
      )}

      {/* MGTe */}
      {(animal.mgte || animal.mgte === 0) && (
        <button
          type="button"
          onClick={() => onScrollTo?.('genética')}
          className={`rounded-xl p-3 border text-center w-full text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform ${
            posicaoMGte === 1
              ? 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-500'
              : posicaoMGte === 2
              ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 border-2 border-slate-400 dark:border-slate-500'
              : posicaoMGte === 3
              ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 border-2 border-amber-600 dark:border-amber-700'
              : posicaoMGte && posicaoMGte <= 10
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700'
              : 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-300 dark:border-indigo-600'
          }`}
        >
          <p className={`text-2xl font-bold ${
            posicaoMGte === 1 ? 'text-amber-600 dark:text-amber-400' :
            posicaoMGte === 2 ? 'text-slate-600 dark:text-slate-300' :
            posicaoMGte === 3 ? 'text-amber-700 dark:text-amber-300' :
            posicaoMGte && posicaoMGte <= 10 ? 'text-indigo-600 dark:text-indigo-400' :
            'text-indigo-600 dark:text-indigo-400'
          }`}>
            {animal.mgte}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">MGTe</p>
          {posicaoMGte && (
            <p className={`text-xs font-bold mt-0.5 ${
              posicaoMGte === 1 ? 'text-amber-600 dark:text-amber-400' :
              posicaoMGte === 2 ? 'text-slate-600 dark:text-slate-400' :
              posicaoMGte === 3 ? 'text-amber-700 dark:text-amber-400' :
              'text-indigo-600 dark:text-indigo-400'
            }`}>
              {posicaoMGte === 1 ? '🥇 1º' : posicaoMGte === 2 ? '🥈 2º' : posicaoMGte === 3 ? '🥉 3º' : `${posicaoMGte}º ranking`}
            </p>
          )}
        </button>
      )}

      {/* TOP */}
      {(animal.top != null && animal.top !== '') && (
        <button
          type="button"
          onClick={() => onScrollTo?.('genética')}
          className="rounded-xl p-3 border text-center w-full text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border-2 border-sky-300 dark:border-sky-600"
        >
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{animal.top}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">TOP</p>
        </button>
      )}

      {/* Gestação (Fêmeas Prenhas) - Dias p/ Parto */}
      {previsaoPartoExibir && (
        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg p-3 border-2 border-emerald-400 dark:border-emerald-500 text-center transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-center mb-0.5">
            <HeartIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{diasParaParto}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">dias p/ parto</p>
        </div>
      )}

      {/* Gestação (Fêmeas Prenhas) - Progresso */}
      {isPrenha && diasGestacao != null && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3 border border-emerald-300 dark:border-emerald-600 text-center transform transition-all duration-200 hover:scale-105">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{diasGestacao}d</p>
          {gestacaoProgress != null && (
            <div className="mt-1.5 w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${gestacaoProgress}%` }}
              />
            </div>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">gestação {gestacaoProgress}%</p>
        </div>
      )}

      {/* Crias */}
      {animal.filhos?.length > 0 && (
        <button
          type="button"
          onClick={() => onScrollTo?.('filhos')}
          className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-3 border border-amber-300 dark:border-amber-700 text-center w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-center mb-0.5">
            <UserGroupIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{animal.filhos.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">cria(s)</p>
        </button>
      )}

      {/* IAs (Fêmeas) */}
      {isFemea && totalIAs > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-3 border border-pink-300 dark:border-pink-700 text-center transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-center mb-0.5">
            <HeartIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{totalIAs}</p>
          {taxaSucessoIA != null && (
            <>
              <div className="mt-1 w-full bg-pink-200 dark:bg-pink-800 rounded-full h-1 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${taxaSucessoIA}%` }}
                />
              </div>
              <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mt-0.5">{taxaSucessoIA}%</p>
            </>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400">IAs</p>
        </div>
      )}

      {/* FIV (Fêmeas) */}
      {isFemea && animal.fivs?.length > 0 && (
        <button
          type="button"
          onClick={() => onScrollTo?.('fiv')}
          className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-violet-300 dark:border-violet-700 text-center w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-center mb-0.5">
            <BeakerIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{animal.fivs.length}</p>
          {mediaOocitos && (
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400">~{mediaOocitos}</p>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400">FIV</p>
        </button>
      )}

      {/* Dias na Fazenda */}
      {diasNaFazenda != null && diasNaFazenda > 0 && (
        <button
          type="button"
          onClick={() => onScrollTo?.('localizacao')}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-blue-300 dark:border-blue-700 text-center w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-center mb-0.5">
            <MapPinIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diasNaFazenda}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">dias fazenda</p>
        </button>
      )}

      {/* Dias Exame Andrológico */}
      {isMacho && diasDesdeExame != null && (
        <div className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-lg p-3 border border-cyan-300 dark:border-cyan-700 text-center transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-center mb-0.5">
            <AcademicCapIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{diasDesdeExame}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">dias exame</p>
        </div>
      )}

      {/* Próximo Exame (Inapto) */}
      {isInapto && diasParaProximoExame != null && (
        <div className="bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-lg p-3 border-2 border-red-400 dark:border-red-500 text-center transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-center mb-0.5">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {diasParaProximoExame > 0 ? diasParaProximoExame : '⚠️'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {diasParaProximoExame > 0 ? 'próx. exame' : 'reagendar'}
          </p>
        </div>
      )}
    </div>
  )
}
