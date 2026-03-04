import React from 'react'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function AnimalAdditionalInfo({ animal }) {
  const dataChegada = animal.data_chegada || animal.dataChegada || animal.data_entrada || animal.dataEntrada
  
  const hasInfo = animal.origem || animal.fazenda_origem || animal.fazendaOrigem || 
                  animal.lote || animal.status_sanitario || animal.statusSanitario || 
                  animal.comprador || animal.destino || animal.receptora || 
                  dataChegada || animal.data_saida || 
                  animal.valor_venda || animal.valorVenda || 
                  animal.custo_aquisicao || animal.custoAquisicao

  if (!hasInfo) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-3">
        <DocumentTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Informações Adicionais</h2>
      </div>
      <div className="space-y-2">
        {animal.origem && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Origem</span>
            <span className="font-medium text-gray-900 dark:text-white">{animal.origem}</span>
          </div>
        )}
        {(animal.fazenda_origem || animal.fazendaOrigem) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Fazenda origem</span>
            <span className="font-medium text-gray-900 dark:text-white">{animal.fazenda_origem || animal.fazendaOrigem}</span>
          </div>
        )}
        {animal.lote && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Lote</span>
            <span className="font-medium text-gray-900 dark:text-white">{animal.lote}</span>
          </div>
        )}
        {(animal.status_sanitario || animal.statusSanitario) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Status sanitário</span>
            <span className="font-medium text-gray-900 dark:text-white">{animal.status_sanitario || animal.statusSanitario}</span>
          </div>
        )}
        {(animal.comprador || animal.destino) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Comprador/Destino</span>
            <span className="font-medium text-gray-900 dark:text-white">{animal.comprador || animal.destino}</span>
          </div>
        )}
        {animal.receptora && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Receptora</span>
            <span className="font-medium text-gray-900 dark:text-white">{animal.receptora}</span>
          </div>
        )}
        {dataChegada && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Data chegada</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDate(dataChegada)}</span>
          </div>
        )}
        {animal.data_saida && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Data saída</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDate(animal.data_saida)}</span>
          </div>
        )}
        {(animal.valor_venda || animal.valorVenda) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Valor venda</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(animal.valor_venda || animal.valorVenda)}</span>
          </div>
        )}
        {(animal.custo_aquisicao || animal.custoAquisicao) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Custo aquisição</span>
            <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(animal.custo_aquisicao || animal.custoAquisicao)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
