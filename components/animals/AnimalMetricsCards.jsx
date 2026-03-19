import {
    AcademicCapIcon,
    BeakerIcon,
    ExclamationTriangleIcon,
    HeartIcon,
    MapPinIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline'
import { getMetricsCardShadowClasses } from '../../utils/animalSexTheme'

export default function AnimalMetricsCards({ animal, metrics, semenResumo, onScrollTo, sexTheme = 'neutral' }) {
  if (!animal || !metrics) return null

  const {
    diasDesdeExame, isInapto, diasParaProximoExame,
    custoTotal,
    diasNaFazenda,
    isPrenha, diasGestacao, diasParaParto, gestacaoProgress,
    totalIAs, taxaSucessoIA, mediaOocitos,
    isMacho, isFemea,
  } = metrics

  const totalDosesSemen =
    semenResumo?.totalDosesDisponiveis ??
    metrics?.semenResumo?.totalDosesDisponiveis ??
    null

  // Exibir previsão de parto apenas se estiver prenha
  const previsaoPartoExibir = isPrenha && diasParaParto != null

  const shadowAccent = getMetricsCardShadowClasses(sexTheme) // accent para cards neutros

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {/* Sêmen disponível (Touros com estoque) */}
      {isMacho && totalDosesSemen > 0 && (
        <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-emerald-300 dark:border-emerald-600 text-center w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-md ${shadowAccent}`}>
          <div className="flex items-center justify-center mb-0.5">
            <span className="text-lg">🧊</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalDosesSemen}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">doses sêmen em estoque</p>
        </div>
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
          className={`bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-3 border border-amber-300 dark:border-amber-700 text-center w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-md ${shadowAccent}`}
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
          className={`bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-blue-300 dark:border-blue-700 text-center w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-md ${shadowAccent}`}
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
