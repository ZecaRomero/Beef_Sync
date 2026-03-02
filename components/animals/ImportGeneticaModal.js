import React, { useState } from 'react'
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import Modal from '../ui/Modal'

export default function ImportGeneticaModal({ isOpen, onClose, onSuccess }) {
  const [importMode, setImportMode] = useState('texto')
  const [importTexto, setImportTexto] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importando, setImportando] = useState(false)
  const [limpando, setLimpando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState(null)

  const parsearTextoImport = (texto) => {
    const linhas = texto.trim().split(/\r?\n/).filter(Boolean)
    if (linhas.length === 0) return []
    const sep = linhas[0].includes('\t') ? '\t' : ','
    const dados = []
    const header = linhas[0].toUpperCase()
    const skipHeader = header.includes('SÉRIE') || header.includes('SERIE') || header.includes('SERII') || header.includes('RG') || header.includes('RGN')
    const primeiraLinhaDados = skipHeader ? linhas[1] : linhas[0]
    const col3 = primeiraLinhaDados ? primeiraLinhaDados.split(sep).map(c => c.trim())[2] : null
    const col3EhNumero = col3 != null && col3 !== '' && !isNaN(parseFloat(String(col3).replace(',', '.')))
    const formatoStatus = header.includes('STATUS') || (col3 != null && col3 !== '' && !col3EhNumero)
    const start = skipHeader ? 1 : 0
    for (let i = start; i < linhas.length; i++) {
      const cols = linhas[i].split(sep).map(c => c.trim())
      if (cols.length >= 2) {
        if (formatoStatus && cols.length >= 3) {
          dados.push({ serie: cols[0] || '', rg: cols[1] || '', situacaoAbcz: cols[2] || null })
        } else {
          dados.push({
            serie: cols[0] || '',
            rg: cols[1] || '',
            iABCZ: cols[2] || null,
            deca: cols[3] || null,
            situacaoAbcz: cols[4] || null,
            genetica_2: cols[5] || null,
            decile_2: cols[6] || null
          })
        }
      }
    }
    return dados
  }

  const handleImportar = async () => {
    setImportando(true)
    setResultadoImport(null)
    try {
      if (importMode === 'texto') {
        const dados = parsearTextoImport(importTexto)
        if (dados.length === 0) {
          setResultadoImport({ erro: 'Nenhum dado válido. Use formato: Série, RG, iABCZ, Deca (separados por tab ou vírgula)' })
          return
        }
        const res = await fetch('/api/import/excel-genetica', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dados })
        })
        const json = await res.json()
        if (res.ok) {
          setResultadoImport(json)
          setImportTexto('')
          onSuccess?.()
        } else {
          setResultadoImport({ erro: json.error || json.details || 'Erro na importação' })
        }
      } else {
        if (!importFile) {
          setResultadoImport({ erro: 'Selecione um arquivo Excel' })
          return
        }
        const formData = new FormData()
        formData.append('file', importFile)
        const res = await fetch('/api/import/excel-genetica', {
          method: 'POST',
          body: formData
        })
        const json = await res.json()
        if (res.ok) {
          setResultadoImport(json)
          setImportFile(null)
          onSuccess?.()
        } else {
          setResultadoImport({ erro: json.error || json.details || 'Erro na importação' })
        }
      }
    } catch (err) {
      setResultadoImport({ erro: err.message || 'Erro ao importar' })
    } finally {
      setImportando(false)
    }
  }

  const handleLimparTodas = async () => {
    if (!confirm('Limpar TODAS as Situações ABCZ de todos os animais? Depois você pode importar novamente.')) return
    setLimpando(true)
    setResultadoImport(null)
    try {
      const res = await fetch('/api/import/limpar-situacao-abcz', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setResultadoImport({ success: true, message: json.message })
        onSuccess?.()
      } else {
        setResultadoImport({ erro: json.error || json.details || 'Erro ao limpar' })
      }
    } catch (err) {
      setResultadoImport({ erro: err.message || 'Erro ao limpar' })
    } finally {
      setLimpando(false)
    }
  }

  const handleClose = () => {
    setResultadoImport(null)
    setImportTexto('')
    setImportFile(null)
    onClose?.()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Série, RG, iABCZ, Deca" size="lg">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setImportMode('texto')}
            className={`flex-1 py-2 rounded-lg font-medium ${importMode === 'texto' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Colar texto
          </button>
          <button
            onClick={() => setImportMode('excel')}
            className={`flex-1 py-2 rounded-lg font-medium ${importMode === 'excel' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Excel
          </button>
        </div>
        {importMode === 'texto' ? (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cole os dados. Formato: Série, RG, iABCZ, Deca [, Avaliação 2, Decile 2] (ou Série, RGN, Status para Situação ABCZ)</p>
            <textarea
              value={importTexto}
              onChange={(e) => setImportTexto(e.target.value)}
              placeholder="SÉRIE	RG	iABCZ	DECA	Aval2	Dec2&#10;CJCJ	16974	47,71	1	29,32	1&#10;CJCJ	17037	43,25	1	25,1	2&#10;&#10;Ou: Série	RGN	Status&#10;CJCJ	16974	Ok para RGN"
              className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm font-mono"
              rows={6}
            />
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Excel: Série, RG, iABCZ, Deca [, Avaliação 2, Decile 2] (ou Série, RGN, Status). Animais não encontrados e inativos são ignorados.</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300"
            />
            {importFile && <p className="text-sm text-green-600 mt-1">✓ {importFile.name}</p>}
          </div>
        )}
        {resultadoImport?.erro && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
            {resultadoImport.erro}
          </div>
        )}
        {resultadoImport?.success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-sm text-green-700 dark:text-green-300">
            ✅ {resultadoImport.message}
            {resultadoImport.resultados?.naoEncontrados?.length > 0 && (
              <p className="mt-1">Não encontrados: {resultadoImport.resultados.naoEncontrados.length}</p>
            )}
            {resultadoImport.resultados?.ignoradosInativos?.length > 0 && (
              <p className="mt-1">Ignorados (inativos): {resultadoImport.resultados.ignoradosInativos.length}</p>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleLimparTodas}
            disabled={limpando || importando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
            title="Zera todas as Situações ABCZ para importar novamente"
          >
            <TrashIcon className="h-4 w-4" />
            {limpando ? 'Limpando...' : 'Excluir todas e importar novamente'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Fechar
            </button>
            <button
              onClick={handleImportar}
              disabled={importando || (importMode === 'texto' ? !importTexto.trim() : !importFile)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold"
            >
              {importando ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
