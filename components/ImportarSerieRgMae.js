import React, { useState } from 'react'

export default function ImportarSerieRgMae({ onImportComplete }) {
  const [arquivo, setArquivo] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ext !== 'xlsx' && ext !== 'xls') {
        setErro('Por favor, selecione um arquivo Excel (.xlsx ou .xls)')
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

      const response = await fetch('/api/animals/corrigir-serie-rg-mae', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResultado(data.resultados)
        setArquivo(null)
        const input = document.getElementById('file-input-serie-rg-mae')
        if (input) input.value = ''

        if (onImportComplete) {
          onImportComplete(data.resultados?.atualizados ?? 0)
        }
      } else {
        setErro(data.error || 'Erro ao importar arquivo')
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      setErro('Erro ao processar arquivo. Verifique o formato e tente novamente.')
    } finally {
      setImportando(false)
    }
  }

  const limpar = () => {
    setArquivo(null)
    setResultado(null)
    setErro(null)
    const input = document.getElementById('file-input-serie-rg-mae')
    if (input) input.value = ''
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-600 p-3 rounded-xl">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Série e RG da Mãe
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Corrige animais que mostram &quot;Não encontrada no cadastro&quot; — preenche serie_mae e rg_mae
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 rounded">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2">Formato do Excel:</h4>
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-2">
            O arquivo deve conter as colunas (com ou sem cabeçalho):
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-emerald-800 dark:text-emerald-200">
            <li><strong>SÉRIE</strong> – série do filho (ex: CJCJ)</li>
            <li><strong>RG</strong> – RG do filho (ex: 17000)</li>
            <li><strong>SÉRIE MÃE</strong> – série da mãe (ex: CJCJ)</li>
            <li><strong>RG MÃE</strong> ou <strong>RGN MÃE</strong> – RG da mãe</li>
          </ol>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
            Exemplo: CJCJ | 17000 | CJCJ | 16999 — atualiza o animal CJCJ 17000 com mãe CJCJ 16999
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Selecionar arquivo Excel:
          </label>
          <input
            id="file-input-serie-rg-mae"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={importando}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700
              hover:file:bg-emerald-100
              cursor-pointer dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
          />
          {arquivo && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ Arquivo selecionado: {arquivo.name}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={!arquivo || importando}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {importando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Importando...
              </>
            ) : (
              <>📤 Importar Série/RG da Mãe</>
            )}
          </button>
          <button
            onClick={limpar}
            disabled={importando}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
          >
            Limpar
          </button>
        </div>

        {erro && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 font-semibold">Erro:</p>
            <p className="text-red-700 dark:text-red-300 text-sm">{erro}</p>
          </div>
        )}

        {resultado && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
            <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">Importação concluída</h4>
            <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <p>Atualizados: <strong>{resultado.atualizados}</strong></p>
              {resultado.naoEncontrados?.length > 0 && (
                <p>Não encontrados: <strong>{resultado.naoEncontrados.length}</strong></p>
              )}
              {resultado.erros?.length > 0 && (
                <p>Erros: <strong>{resultado.erros.length}</strong></p>
              )}
            </div>
            {resultado.naoEncontrados?.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-bold text-amber-800 dark:text-amber-300">
                  Ver não encontrados ({resultado.naoEncontrados.length})
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {resultado.naoEncontrados.slice(0, 50).map((d, i) => (
                    <div key={i} className="text-xs">
                      Linha {d.linha}: {d.serie} {d.rg}
                    </div>
                  ))}
                  {resultado.naoEncontrados.length > 50 && (
                    <p className="text-xs italic">... e mais {resultado.naoEncontrados.length - 50}</p>
                  )}
                </div>
              </details>
            )}
            {resultado.erros?.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-bold text-red-800 dark:text-red-300">
                  Ver erros ({resultado.erros.length})
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {resultado.erros.slice(0, 20).map((d, i) => (
                    <div key={i} className="text-xs">
                      Linha {d.linha}: {d.serie} {d.rg} – {d.erro}
                    </div>
                  ))}
                  {resultado.erros.length > 20 && (
                    <p className="text-xs italic">... e mais {resultado.erros.length - 20}</p>
                  )}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
