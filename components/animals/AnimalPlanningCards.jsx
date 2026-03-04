import React from 'react'
import Link from 'next/link'
import {
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

export default function AnimalPlanningCards({ metrics }) {
  if (!metrics) return null

  const {
    elegivelBrucelose,
    elegivelDGT,
    temBrucelose,
    precisaBrucelose,
    janelaEncerrada,
    idadeDias,
    isFemea
  } = metrics

  // Renderizar somente se houver alguma informação relevante
  if (!elegivelBrucelose && !elegivelDGT && !temBrucelose && !precisaBrucelose) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheckIcon className="h-6 w-6 text-amber-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">Planejamento / Obrigações</h3>
      </div>
      <div className="space-y-3 text-sm">
        {isFemea && precisaBrucelose && (
          <div className={`p-3 rounded-xl border ${
            elegivelBrucelose
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
              : temBrucelose
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
          }`}>
            <p className="font-semibold text-gray-900 dark:text-white">Vacina Brucelose (obrigatório fêmeas 3-8 meses)</p>
            {temBrucelose ? (
              <p className="text-green-600 dark:text-green-400 mt-1">✓ Já vacinada</p>
            ) : elegivelBrucelose ? (
              <p className="text-amber-600 dark:text-amber-400 mt-1">⚠️ Elegível agora ({idadeDias} dias) – agendar vacinação</p>
            ) : janelaEncerrada ? (
              <p className="text-red-500 dark:text-red-400 mt-1">
                Janela encerrada ({Math.floor(idadeDias / 30)} meses) — não é mais necessário vacinar
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Aguardar até 3 meses (atual: {idadeDias}d)
              </p>
            )}
          </div>
        )}
        {isFemea && temBrucelose && (
          <div className="p-3 rounded-xl border bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
            <p className="font-semibold text-gray-900 dark:text-white">Vacina Brucelose (obrigatório fêmeas 3-8 meses)</p>
            <p className="text-green-600 dark:text-green-400 mt-1">✓ Já vacinada</p>
          </div>
        )}
        <div className={`p-3 rounded-xl border ${
          elegivelDGT ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' :
          'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
        }`}>
          <p className="font-semibold text-gray-900 dark:text-white">Avaliação DGT (330-640 dias)</p>
          {elegivelDGT ? (
            <p className="text-emerald-600 dark:text-emerald-400 mt-1">✓ Elegível para avaliação ({idadeDias} dias)</p>
          ) : idadeDias != null ? (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {idadeDias < 330 ? `Aguardar até 330 dias (atual: ${idadeDias}d)` : `Fora da janela (${idadeDias}d > 640d)`}
            </p>
          ) : null}
        </div>
      </div>
      <Link
        href="/planejamento/agenda"
        className="inline-flex items-center gap-2 mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
      >
        Ver agenda de planejamento
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </Link>
    </div>
  )
}
