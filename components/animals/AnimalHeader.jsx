import Link from 'next/link'
import { ArrowLeftIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export default function AnimalHeader({ 
  darkMode, 
  toggleDarkMode, 
  animal, 
  resumoChips, 
  setShowIABCZInfo,
  rankings 
}) {
  const { 
    posicaoIABCZ: rankingPosicao, 
    posicaoIQG: rankingPosicaoGenetica2, 
    filhoTopIABCZ: filhoTopRanking, 
    filhoTopIQG: filhoTopRankingIQG 
  } = rankings || {}

  return (
    <>
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link
            href="/a?buscar=1"
            className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleDarkMode?.()}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={darkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Modo consulta</span>
          </div>
        </div>
      </div>
      
      {/* Barra de chips */}
      <div className="sticky top-12 z-10 bg-white/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 px-4 py-2 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex flex-wrap gap-2">
          {resumoChips.slice(0, 3).map((c, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {c}
            </span>
          ))}
          {(animal.abczg || animal.abczg === 0) && (
            <button
              type="button"
              onClick={() => setShowIABCZInfo(true)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                rankingPosicao === 1
                  ? 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-200'
                  : rankingPosicao === 2
                  ? 'bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800/40 dark:border-slate-500 dark:text-slate-200'
                  : rankingPosicao === 3
                  ? 'bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300'
                  : rankingPosicao && rankingPosicao <= 10
                  ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200'
                  : 'bg-white border-gray-300 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
              }`}
            >
              iABCZ {animal.abczg}{filhoTopRanking ? ' • Mãe do 1º' : rankingPosicao ? ` • ${rankingPosicao}º` : ''}
            </button>
          )}
          {(animal.deca || animal.deca === 0) && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-gradient-to-r from-teal-100 to-cyan-100 border-teal-400 text-teal-700 dark:from-teal-900/30 dark:to-cyan-900/30 dark:border-teal-600 dark:text-teal-300">
              DECA {animal.deca}
            </span>
          )}
          {((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              filhoTopRankingIQG 
                ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-400 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-600 dark:text-indigo-300'
                : rankingPosicaoGenetica2 === 1
                ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-400 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:border-purple-600 dark:text-purple-300'
                : rankingPosicaoGenetica2 && rankingPosicaoGenetica2 <= 10
                ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-400 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-600 dark:text-indigo-300'
                : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 text-purple-700 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-600 dark:text-purple-300'
            }`}>
              IQG {animal.iqg ?? animal.genetica_2}{filhoTopRankingIQG ? ' • Mãe do 1º' : rankingPosicaoGenetica2 ? ` • ${rankingPosicaoGenetica2}º` : ''}
            </span>
          )}
          {((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-gradient-to-r from-cyan-100 to-sky-100 border-cyan-400 text-cyan-700 dark:from-cyan-900/30 dark:to-sky-900/30 dark:border-cyan-600 dark:text-cyan-300">
              Pt IQG {animal.pt_iqg ?? animal.decile_2}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
