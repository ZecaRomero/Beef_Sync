import React, { useState } from 'react'
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

export default function ImportarBaixas({ onImportComplete }) {
  const [arquivo, setArquivo] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        setErro('Selecione um arquivo Excel (.xlsx, .xls) ou CSV')
        setArquivo(null)
        return
      }
      setArquivo(file)
      setErro(null)
      setResultado(null)
    }
  }

  const handleImport = async () => {
    if (!arquivo) {
      setErro('Selecione um arquivo Excel')
      return
    }

    setImportando(true)
    setErro(null)
    setResultado(null)

    try {
      const formData = new FormData()
      formData.append('file', arquivo)

      const res = await fetch('/api/import/baixas', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResultado(data.resultados)
        setArquivo(null)
        const el = document.getElementById('baixas-file-input'); if (el) el.value = ''
        onImportComplete?.(data.resultados?.importados || 0)
      } else {
        setErro(data.error || 'Erro ao importar arquivo')
      }
    } catch (err) {
      console.error('Erro ao importar:', err)
      setErro('Erro ao processar arquivo. Verifique o formato e tente novamente.')
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">📋 Formato do Excel (cabeçalhos em amarelo)</h3>
        <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
          Aceita 2 tipos de baixas na coluna <strong>OCORRENCIA</strong>:
        </p>
        <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
          <li><strong>MORTE/BAIXA</strong>: SÉRIE, RG, OCORRENCIA, Causa, Data, SÉRIE MAE, RG (mãe)</li>
          <li><strong>VENDA</strong>: SÉRIE, RG, OCORRENCIA, DATA, COMPRADOR, VALOR, NOTA FISCAL</li>
          <li><strong>SÉRIE MAE + RG</strong>: colunas separadas ou combinadas em &quot;SÉRIE MAE RG&quot;</li>
          <li>Pode importar em arquivos separados: um só com MORTE/BAIXA e outro só com VENDA</li>
          <li><strong>VENDAS-only</strong>: SÉRIE RG, DATA, COMPRADOR, VALOR, NOTA FISCAL, SÉRIE MAE RG</li>
          <li>Arquivos muito grandes (5000+ linhas): divida em partes para evitar erro de tamanho</li>
        </ul>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selecionar arquivo Excel:
        </label>
        <input
          id="baixas-file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={importando}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer dark:file:bg-amber-900/30 dark:file:text-amber-200"
        />
        {arquivo && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">✓ Arquivo: {arquivo.name}</p>
        )}
      </div>

      <button
        onClick={handleImport}
        disabled={!arquivo || importando}
        className="px-4 py-2 rounded-lg font-medium bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {importando ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Importando...
          </>
        ) : (
          <>
            <DocumentArrowUpIcon className="h-5 w-5" />
            Importar Baixas
          </>
        )}
      </button>

      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          <XCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {resultado && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-medium mb-2">
            <CheckCircleIcon className="h-5 w-5" />
            Importação concluída
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            <strong>{resultado.importados}</strong> baixas importadas
            {resultado.ignorados > 0 && ` • ${resultado.ignorados} linhas ignoradas`}
            {resultado.erroCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400"> • {resultado.erroCount} erros</span>
            )}
          </p>
          {resultado.erros?.length > 0 && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-300 max-h-24 overflow-y-auto">
              {resultado.erros.map((e, i) => (
                <div key={i}>Linha {e.linha}: {e.animal} - {e.msg}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
