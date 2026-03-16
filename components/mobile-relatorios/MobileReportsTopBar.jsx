import Link from 'next/link'
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function MobileReportsTopBar({ selectedTipo, allTypes, onBackToHome }) {
  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-amber-200/50 dark:border-amber-900/30 shadow-[0_4px_30px_rgba(251,191,36,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {selectedTipo ? (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium"
          >
            <ArrowLeftIcon className="h-6 w-6" />
            Voltar
          </button>
        ) : (
          <Link
            href="/a"
            className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium"
          >
            <ArrowLeftIcon className="h-6 w-6" />
            Voltar
          </Link>
        )}

        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <ChartBarIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          {selectedTipo ? (
            <span className="truncate max-w-[180px]">
              {allTypes.find((t) => t.key === selectedTipo)?.label || 'Relatório'}
            </span>
          ) : (
            <span>Relatórios</span>
          )}
        </h1>

        <div className="w-16" />
      </div>
    </div>
  )
}

