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
    janelaEncerrada,       // fÃªmea >240d sem vacina
    // DGT
    elegivelDGT,
    temDGT,
    precisaDGT,            // 330-900 dias (na janela ou passou recentemente)
    janelaEncerradaDGT,    // >640d sem DGT
    // Geral
    idadeDias,
    isFemea,
  } = metrics

  // Mostrar Brucelose sÃ³ quando precisar de aÃ§Ã£o ââ‚¬â€� se jÃ¡ vacinada ou janela encerrada, nÃ£o mostrar
  const mostrarBrucelose = isFemea && !temBrucelose && elegivelBrucelose
  // Mostrar DGT apenas se estÃ¡ NA janela (330-640d) ou jÃ¡ fez ââ‚¬â€� nÃ£o mostrar se janela jÃ¡ encerrou
  const mostrarDGT = elegivelDGT || temDGT

  // Nada relevante para mostrar
  if (!mostrarBrucelose && !mostrarDGT) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheckIcon className="h-6 w-6 text-amber-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">Planejamento / ObrigaÃ§Ãµes</h3>
      </div>

      <div className="space-y-3 text-sm">

        {/* ââ€�â‚¬ââ€�â‚¬ BRUCELOSE (somente fÃªmeas) ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ */}
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
              Vacina Brucelose <span className="font-normal text-gray-500">(fÃªmeas 3-8 meses)</span>
            </p>
            {temBrucelose ? (
              <p className="text-green-600 dark:text-green-400 mt-1">âÅ“â€œ JÃ¡ vacinada</p>
            ) : elegivelBrucelose ? (
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                âÅ¡ ï¸� Na janela agora ({Math.floor(idadeDias / 30)} meses) ââ‚¬â€� agendar vacinaÃ§Ã£o
              </p>
            ) : janelaEncerrada ? (
              <p className="text-red-500 dark:text-red-400 mt-1">
                Janela encerrada ({Math.floor(idadeDias / 30)} meses) ââ‚¬â€� nÃ£o Ã© mais necessÃ¡rio vacinar
              </p>
            ) : (
              /* idadeDias < 90 */
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Aguardar 3 meses para vacinar (atual: {idadeDias}d)
              </p>
            )}
          </div>
        )}

        {/* ââ€�â‚¬ââ€�â‚¬ DGT ââ‚¬â€� AvaliaÃ§Ã£o AndrolÃ³gica/Reprodutiva ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ */}
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
              AvaliaÃ§Ã£o DGT <span className="font-normal text-gray-500">(330-640 dias)</span>
            </p>
            {temDGT ? (
              <p className="text-green-600 dark:text-green-400 mt-1">âÅ“â€œ AvaliaÃ§Ã£o jÃ¡ realizada</p>
            ) : elegivelDGT ? (
              <p className="text-emerald-600 dark:text-emerald-400 mt-1">
                âÅ¡ ï¸� Na janela agora ({idadeDias} dias) ââ‚¬â€� agendar avaliaÃ§Ã£o
              </p>
            ) : janelaEncerradaDGT ? (
              <p className="text-red-500 dark:text-red-400 mt-1">
                Janela encerrada ({Math.floor(idadeDias / 30)} meses) ââ‚¬â€� avaliaÃ§Ã£o nÃ£o realizada na janela
              </p>
            ) : null
            /* Nota: nÃ£o mostramos "aguardar" para DGT ââ‚¬â€� o card sÃ³ aparece quando idadeDias >= 330 */
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
