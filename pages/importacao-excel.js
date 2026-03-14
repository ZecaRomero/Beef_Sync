import React, { useState } from 'react'
import UniversalExcelImporter from '../components/UniversalExcelImporter'
import {
  DocumentArrowUpIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout'

export default function ImportacaoExcel() {
  const [showImporter, setShowImporter] = useState(true)
  const [importSuccess, setImportSuccess] = useState(null)

  const handleImportSuccess = (type, count) => {
    setImportSuccess({ type, count })
    setTimeout(() => {
      setImportSuccess(null)
    }, 5000)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DocumentArrowUpIcon className="h-8 w-8 text-blue-600" />
            Importação Universal de Excel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Importe automaticamente: Animais, IA, FIV, Nascimentos, Diagnóstico de Gestação, Notas Fiscais e mais
          </p>
        </div>

        {/* Cards de tipos suportados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Animais</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Série, RG, Nome, Sexo, Raça, Data Nascimento, Pai, Mãe, Receptora, etc.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Inseminação Artificial</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Data IA, Touro, Data DG, Resultado (até 3 inseminações por animal)
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">FIV</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Doadora, Laboratório, Veterinário, Data FIV, Quantidade de Oócitos
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Nascimentos</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Série, RG, Data Nascimento, Peso, Tipo (IA/FIV/Natural), Pai, Mãe, Receptora
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Diagnóstico de Gestação</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Série, RG, Data DG, Resultado (P/N)
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Notas Fiscais</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Número NF, Tipo, Data, Origem, Destino, Valor Total
            </p>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Como funciona a detecção automática
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>O sistema detecta automaticamente o tipo de dados pelo nome das colunas</li>
                <li>Suporta variações de nomes (ex: "Data IA", "DataIA", "data_ia")</li>
                <li>Reconhece múltiplos formatos de data (DD/MM/YYYY, DD-MM-YYYY)</li>
                <li>Valida dados antes de importar</li>
                <li>Mostra preview dos dados antes de confirmar</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {importSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200">
                ✅ {importSuccess.count} registros de {importSuccess.type} importados com sucesso!
              </span>
            </div>
          </div>
        )}

        {/* Importador */}
        <UniversalExcelImporter
          isOpen={showImporter}
          onClose={() => setShowImporter(false)}
          onImportSuccess={handleImportSuccess}
        />
      </div>
    </Layout>
  )
}
