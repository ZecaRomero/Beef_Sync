import React from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { getPrimaryButtonClasses } from '../../utils/animalSexTheme'

export default function AnimalFixedActions({ onShare, onWhatsAppShare, isSharing, sexTheme = 'neutral' }) {
  const handleShare = onShare || onWhatsAppShare
  const borderAccent = sexTheme === 'macho' ? 'border-t-2 border-t-blue-300/60 dark:border-t-blue-700/50' : sexTheme === 'femea' ? 'border-t-2 border-t-pink-300/60 dark:border-t-pink-700/50' : 'border-t-2 border-t-amber-300/60 dark:border-t-amber-700/50'
  return (
    <div className={`fixed bottom-0 left-0 right-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/98 dark:bg-gray-800/98 ${borderAccent} border-gray-200 dark:border-gray-700 z-20 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl`}>
      <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
        <Link
          href="/a?buscar=1"
          className={`flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[48px] rounded-lg font-semibold text-xs active:scale-[0.98] transition-all ${getPrimaryButtonClasses(sexTheme)}`}
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Nova Consulta
        </Link>
        <Link
          href="/mobile-relatorios"
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[48px] rounded-lg bg-indigo-500 dark:bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 dark:hover:bg-indigo-600 active:scale-[0.98] transition-all"
        >
          <ChartBarIcon className="h-5 w-5" />
          Relatórios
        </Link>
        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[48px] rounded-lg bg-emerald-500 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 dark:hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSharing ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Compartilhando
            </>
          ) : (
            <>
              <DocumentTextIcon className="h-6 w-6" />
              Compartilhar
            </>
          )}
        </button>
      </div>
    </div>
  )
}
