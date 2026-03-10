import React from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function AnimalFixedActions({ onShare, onWhatsAppShare, isSharing }) {
  const handleShare = onShare || onWhatsAppShare
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/98 dark:bg-gray-800/98 border-t border-gray-200 dark:border-gray-700 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm">
      <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
        <Link
          href="/a?buscar=1"
          className="flex flex-col items-center justify-center gap-1 py-3.5 min-h-[56px] rounded-xl bg-amber-600 dark:bg-amber-500 text-white font-semibold text-xs hover:bg-amber-700 dark:hover:bg-amber-600 active:scale-[0.98] transition-all"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Nova Consulta
        </Link>
        <Link
          href="/mobile-relatorios"
          className="flex flex-col items-center justify-center gap-1 py-3.5 min-h-[56px] rounded-xl bg-gray-600 dark:bg-gray-500 text-white font-semibold text-xs hover:bg-gray-700 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
        >
          <ChartBarIcon className="h-5 w-5" />
          Relatórios
        </Link>
        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="flex flex-col items-center justify-center gap-1 py-3.5 min-h-[56px] rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-semibold text-xs hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
