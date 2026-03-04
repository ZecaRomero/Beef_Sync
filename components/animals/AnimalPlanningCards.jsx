import React from 'react'
import Link from 'next/link'
import {
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

export default function AnimalPlanningCards({ metrics }) {
  if (!metrics) return null

  const {
    // Brucelose
    elegivelBrucelose,
    temBrucelose,
    precisaBrucelose,
    janelaEncerrada,       // fêmea >240d sem vacina
    // DGT
    elegivelDGT,
    temDGT,
    precisaDGT,            // 330-900 dias (na janela ou passou recentemente)
    janelaEncerradaDGT,    // >640d sem DGT
    // Geral
    idadeDias,
    isFemea,
  } = metrics

  const mostrarBrucelose = isFemea && (temBrucelose || precisaBrucelose)
  const mostrarDGT = precisaDGT || temDGT

  // Nada relevante para mostrar
  if (!mostrarBrucelose && !mostrarDGT) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheckIcon className="h-6 w-6 text-amber-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">Planejamento / Obrigações</h3>
      </div>

      <div className="space-y-3 text-sm">

        {/* ── BRUCELOSE (somente fêmeas) ─────────────────────────────── */}
        {mostrarBrucelose && (
          <div className={`p-3 rounded-xl border ${
            temBrucelose
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
              : elegivelBrucelose
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
              : janelaEncerrada
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
          }`}>
            <p className="font-semibold text-gray-900 dark:text-white">
              Vacina Brucelose <span className="font-normal text-gray-500">(fêmeas 3-8 meses)</span>
            </p>
            {temBrucelose ? (
              <p className="text-green-600 dark:text-green-400 mt-1">✓ Já vacinada</p>
            ) : elegivelBrucelose ? (
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                ⚠️ Na janela agora ({Math.floor(idadeDias / 30)} meses) — agendar vacinação
              </p>
            ) : janelaEncerrada ? (
              <p className="text-red-500 dark:text-red-400 mt-1">
                Janela encerrada ({Math.floor(idadeDias / 30)} meses) — não é mais necessário vacinar
              </p>
            ) : (
              /* idadeDias < 90 */
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Aguardar 3 meses para vacinar (atual: {idadeDias}d)
              </p>
            )}
          </div>
        )}

        {/* ── DGT — Avaliação Andrológica/Reprodutiva ────────────────── */}
        {mostrarDGT && (
          <div className={`p-3 rounded-xl border ${
            temDGT
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
              : elegivelDGT
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
              : janelaEncerradaDGT
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
          }`}>
            <p className="font-semibold text-gray-900 dark:text-white">
              Avaliação DGT <span className="font-normal text-gray-500">(330-640 dias)</span>
            </p>
            {temDGT ? (
              <p className="text-green-600 dark:text-green-400 mt-1">✓ Avaliação já realizada</p>
            ) : elegivelDGT ? (
              <p className="text-emerald-600 dark:text-emerald-400 mt-1">
                ⚠️ Na janela agora ({idadeDias} dias) — agendar avaliação
              </p>
            ) : janelaEncerradaDGT ? (
              <p className="text-red-500 dark:text-red-400 mt-1">
                Janela encerrada ({Math.floor(idadeDias / 30)} meses) — avaliação não realizada na janela
              </p>
            ) : null
            /* Nota: não mostramos "aguardar" para DGT — o card só aparece quando idadeDias >= 330 */
            }
          </div>
        )}

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
