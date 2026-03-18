import { ArrowLeftIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getAccentClasses, getChipClasses } from '../../utils/animalSexTheme'

export default function AnimalHeader({ 
  darkMode, 
  toggleDarkMode, 
  animal, 
  resumoChips, 
  setShowIABCZInfo,
  rankings,
  sexTheme = 'neutral'
}) {


  return (
    <>
      {/* Header fixo - safe area para notch */}
      <header className="sticky top-0 z-20 bg-white/98 dark:bg-gray-800/98 border-b border-gray-200 dark:border-gray-700 backdrop-blur-md shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3 min-h-[52px]">
          <Link
            href="/a?buscar=1"
            className={`flex items-center gap-2 font-semibold py-2 -ml-2 pr-2 min-w-[88px] active:opacity-80 transition-opacity ${getAccentClasses(sexTheme)}`}
            aria-label="Voltar para nova consulta"
          >
            <ArrowLeftIcon className="h-5 w-5 flex-shrink-0" />
            <span>Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg bg-gray-100/80 dark:bg-gray-700/80 hidden sm:inline">
              Modo consulta
            </span>
            <button
              type="button"
              onClick={() => toggleDarkMode?.()}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={darkMode ? 'Modo claro' : 'Modo escuro'}
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Barra de chips */}
      <div className="sticky z-10 bg-white/95 dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-2.5">
          <div className="flex flex-wrap gap-2">
          {resumoChips.slice(0, 5).map((c, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getChipClasses(sexTheme)}`}>
              {c}
            </span>
          ))}
          {animal.situacao_reprodutiva && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-300">
              🩺 {animal.situacao_reprodutiva}
            </span>
          )}
          {animal.prev_parto && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              📅 Prev: {animal.prev_parto}
            </span>
          )}
          {animal.carimbo_leilao && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 border border-amber-400 text-amber-700 dark:text-amber-300">
              🏷️ {animal.carimbo_leilao}
            </span>
          )}
          {/* Puberdade — apenas para machos */}
          {animal.pub_classe && (animal.sexo === 'M' || animal.sexo === 'Macho' || String(animal.sexo || '').toUpperCase().startsWith('M')) && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              animal.pub_classe.toUpperCase().includes('SUPERPRECOCE')
                ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-400 text-orange-700 dark:text-orange-300'
                : animal.pub_classe.toUpperCase().includes('PRECOCE')
                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 text-yellow-700 dark:text-yellow-300'
                : 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-300'
            }`}>
              {animal.pub_classe}{animal.pub_idade != null ? ` • ${animal.pub_idade}m` : ''}{animal.pub_classif != null ? ` • ${animal.pub_classif}º` : ''}
            </span>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
