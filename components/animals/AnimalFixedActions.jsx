import React from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function AnimalFixedActions({ onShare, isSharing }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
      <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
        <Link
          href="/a?buscar=1"
          className="flex items-center justify-center gap-1 py-4 rounded-xl bg-amber-600 dark:bg-amber-500 text-white font-semibold text-sm hover:bg-amber-700 dark:hover:bg-amber-600 active:scale-[0.98] transition-transform"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Nova Consulta
        </Link>
        <Link
          href="/mobile-relatorios"
          className="flex items-center justify-center gap-1 py-4 rounded-xl bg-gray-600 dark:bg-gray-500 text-white font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-600 active:scale-[0.98] transition-transform"
        >
          <ChartBarIcon className="h-5 w-5" />
          Relatórios
        </Link>
        <button
          type="button"
          onClick={onShare}
          disabled={isSharing}
          className="flex items-center justify-center gap-1 py-4 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
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
