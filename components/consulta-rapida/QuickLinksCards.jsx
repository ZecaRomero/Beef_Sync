import { ChartBarIcon, ChatBubbleLeftRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function QuickLinksCards({ isAdelso }) {
  return (
    <div className="space-y-3 mb-4">
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/mobile-feedback"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          <span className="text-sm">Feedback</span>
        </Link>

        <Link
          href="/mobile-relatorios"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <ChartBarIcon className="h-5 w-5" />
          <span className="text-sm">Relatórios</span>
        </Link>
      </div>

      {isAdelso && (
        <Link
          href="/mobile-relatorios?tipo=boletim_campo"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <DocumentTextIcon className="h-5 w-5" />
          <span className="text-sm">📋 Boletim de Campo</span>
        </Link>
      )}
    </div>
  )
}

