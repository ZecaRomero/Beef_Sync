import React from 'react'
import { HeartIcon } from '@heroicons/react/24/outline'
import InfoRow from './InfoRow'
import { formatDate } from '../../utils/formatters'

export default function AnimalReproduction({ animal }) {
  const hasReproductionData = animal.resultado_dg || animal.resultadoDG || animal.data_te || animal.dataTE || animal.data_dg || animal.dataDG

  if (!hasReproductionData) return null

  const resultado = animal.resultado_dg || animal.resultadoDG
  const isPrenha = String(resultado || '').toLowerCase().includes('prenha')
  const dataTE = animal.data_te || animal.dataTE
  const dataDG = animal.data_dg || animal.dataDG

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <HeartIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Reprodução</h2>
      </div>
      <div className="space-y-2">
        {dataTE && (
          <InfoRow label="Data TE/IA" value={formatDate(dataTE)} />
        )}
        {dataDG && (
          <InfoRow 
            label="Data DG" 
            value={formatDate(dataDG)} 
          />
        )}
        {resultado && (
          <div className="px-0 py-2 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Resultado DG</span>
            <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
              isPrenha
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {resultado}
            </span>
          </div>
        )}
        {isPrenha && dataTE && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Parto previsto: {new Date(new Date(dataTE).getTime() + (285 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    </div>
  )
}
