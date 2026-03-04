import React from 'react'
import { BeakerIcon } from '@heroicons/react/24/outline'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function AnimalGenetics({ animal }) {
  const hasDNA = animal.laboratorio_dna || animal.dna?.laboratorio || animal.data_envio_dna || animal.custo_dna

  if (!hasDNA) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-3">
        <BeakerIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
        <h2 className="font-semibold text-gray-900 dark:text-white">DNA</h2>
      </div>
      <div className="space-y-2">
        {(animal.laboratorio_dna || animal.dna?.laboratorio) && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Laboratório: {animal.laboratorio_dna || animal.dna?.laboratorio}
          </p>
        )}
        {(animal.data_envio_dna || animal.dataEnvioDNA) && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Envio: {formatDate(animal.data_envio_dna || animal.dataEnvioDNA)}
          </p>
        )}
        {(animal.custo_dna || animal.custoDNA) && (
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Custo: {formatCurrency(animal.custo_dna || animal.custoDNA)}
          </p>
        )}
      </div>
    </div>
  )
}
