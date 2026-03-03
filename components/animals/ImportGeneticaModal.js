import React, { useState, useMemo } from 'react'
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import Modal from '../ui/Modal'

const parsearTextoImport = (texto) => {
  const linhas = texto.trim().split(/\r?\n/).filter(Boolean)
  if (linhas.length === 0) return []
  // Tab, vírgula (se não houver números com vírgula decimal) ou espaço
  const primeira = linhas[0]
  let sep = '\t'
  if (primeira.includes('\t')) {
    sep = '\t'
  } else if (primeira.includes(',') && !/\d,\d/.test(primeira)) {
    sep = ','
  } else {
    sep = /\s+/
  }
  const dados = []
  const splitLinha = (linha) => linha.split(sep).map(c => c.trim()).filter(Boolean)
  const header = linhas[0].toUpperCase()
  const skipHeader = header.includes('SÉRIE') || header.includes('SERIE') || header.includes('SERII') || header.includes('RG') || header.includes('RGN')
  const primeiraLinhaDados = skipHeader ? linhas[1] : linhas[0]
  const primeiraCols = primeiraLinhaDados ? splitLinha(primeiraLinhaDados) : []
  const col3 = primeiraCols[2]
  const col4 = primeiraCols[3]
  const col3EhNumero = col3 != null && col3 !== '' && !isNaN(parseFloat(String(col3).replace(',', '.')))
  const col4EhNumeroOuDecil = col4 != null && col4 !== '' && (/^[\d,.\s]+$/.test(String(col4)) || col4.length <= 3)
  const formatoStatus = header.includes('STATUS') || (col3 != null && col3 !== '' && !col3EhNumero)
  // Formato completo 6 colunas: SÉRIE | RG | iABCZg | DECA | IQG | Pt IQG
  const formatoCompleto6Cols = header.includes('IABCZ') && header.includes('DECA') &&
    (header.includes('IQG') || header.includes('IQGG')) &&
    (header.includes('PT') || header.includes('PL'))
  // Sem header: 6 cols com col2-5 numéricos = iABCZ, DECA, IQG, Pt IQG
  const col5Num = primeiraCols[4] != null && !isNaN(parseFloat(String(primeiraCols[4]).replace(',', '.')))
  const col6Num = primeiraCols[5] != null && !isNaN(parseFloat(String(primeiraCols[5]).replace(',', '.')))
  const formatoCompleto6ColsPelosDados = !skipHeader && primeiraCols.length === 6 && col3EhNumero && col4EhNumeroOuDecil && col5Num && col6Num
  // Formato: Série, RG, IQG, Pt IQG (4 cols)
  const headerCols = splitLinha(linhas[0])
  const formatoIQGPeloHeader = headerCols.length >= 4 && headerCols.length <= 6 &&
    ((header.includes('IQG') || header.includes('IQGG')) && (header.includes('PT') || header.includes('PL'))) &&
    !header.includes('IABCZ') && !header.includes('DECA')
  // Sem header: detectar por dados (4 cols, col3 e col4 numéricos = IQG) ou 3 cols com serie+rg em col0
  const col1EhNumero = primeiraCols[1] != null && !isNaN(parseFloat(String(primeiraCols[1]).replace(',', '.')))
  const col2EhNumero = primeiraCols[2] != null && (/^[\d,.\s]+$/.test(String(primeiraCols[2])) || String(primeiraCols[2]).length <= 3)
  const formatoIQG3Cols = !skipHeader && primeiraCols.length === 3 && col1EhNumero && col2EhNumero && /^\S+\s+\d+$/.test(String(primeiraCols[0] || ''))
  const formatoIQG4Cols = !skipHeader && primeiraCols.length === 4 && col3EhNumero && col4EhNumeroOuDecil
  const formatoIQGPelosDados = formatoIQG4Cols || formatoIQG3Cols
  const formatoIQG = formatoIQGPeloHeader || formatoIQGPelosDados
  const start = skipHeader ? 1 : 0
  for (let i = start; i < linhas.length; i++) {
    const cols = splitLinha(linhas[i])
    if (cols.length >= 2) {
      let serie = cols[0] || ''
      let rg = cols[1] || ''
      let offsetCols = 0 // 0 = cols normais, 1 = col0 tinha serie+rg junto
      
      // Se col0 parece "SÉRIE RG" (ex: "CJCJ 17267") e col1 é numérico (iABCZ/IQG), extrair da col0
      const col1Num = cols[1] != null && !isNaN(parseFloat(String(cols[1]).replace(',', '.')))
      if (col1Num && serie && /\s+\d+$/.test(serie)) {
        const m = serie.match(/^(.+?)\s+(\d+)$/)
        if (m) {
          serie = m[1].trim()
          rg = m[2]
          offsetCols = 1 // iABCZ em cols[1], deca em cols[2]
        }
      }
      // Se RG contém hífen, pode estar no formato "CJCJ-16310" (série-rg junto)
      if (rg && rg.includes('-')) {
        const partes = rg.split('-')
        if (partes.length === 2) {
          if (!serie || serie === rg) {
            serie = partes[0].trim()
          }
          rg = partes[1].trim()
        }
      }
      
      const dataStart = offsetCols === 0 ? 2 : 1
      const c = (idx) => cols[dataStart + idx - 2]
      
      if (formatoStatus && cols.length >= 2 + offsetCols) {
        dados.push({ serie, rg, situacaoAbcz: c(2) || null })
      } else if ((formatoCompleto6Cols || formatoCompleto6ColsPelosDados) && cols.length >= 6) {
        // Série, RG, iABCZg, DECA, IQG, Pt IQG (6 colunas - sem confusão)
        dados.push({
          serie,
          rg,
          iABCZ: c(2) || null,
          deca: c(3) || null,
          situacaoAbcz: null,
          iqg: c(4) || null,
          pt_iqg: c(5) || null
        })
      } else if (formatoIQG && cols.length >= (offsetCols ? 3 : 4) && cols.length <= 5) {
        dados.push({
          serie,
          rg,
          iABCZ: null,
          deca: null,
          situacaoAbcz: null,
          iqg: c(2) || null,
          pt_iqg: c(3) || null
        })
      } else {
        dados.push({
          serie,
          rg,
          iABCZ: c(2) || null,
          deca: c(3) || null,
          situacaoAbcz: c(4) || null,
          iqg: c(5) || null,
          pt_iqg: c(6) || null
        })
      }
    }
  }
  return dados
}

export default function ImportGeneticaModal({ isOpen, onClose, onSuccess }) {
  const [importMode, setImportMode] = useState('texto')
  const [importTexto, setImportTexto] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [criarNaoEncontrados, setCriarNaoEncontrados] = useState(true)
  const [importando, setImportando] = useState(false)
  const [limpando, setLimpando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState(null)

  const previewDados = useMemo(() => {
    if (!importTexto.trim()) return []
    return parsearTextoImport(importTexto).slice(0, 5)
  }, [importTexto])

  const formatarResultadoImport = (r) => {
    const n = r.animaisAtualizados ?? 0
    const criados = r.animaisCriados ?? 0
    const ignorados = (r.naoEncontrados?.length || 0) + (r.ignoradosInativos?.length || 0)
    let msg = `Importação concluída! ${n} animal(is) atualizado(s).`
    if (criados > 0) msg += ` ${criados} criado(s).`
    if (ignorados > 0) {
      msg += ` Os demais (${ignorados}) foram ignorados (não estão no cadastro ou estão inativos).`
    }
    if (n === 0 && criados === 0 && (r.naoEncontrados?.length || 0) > 0) {
      const amostra = (r.naoEncontrados || []).slice(0, 5).map(x => `${x.serie || '?'} ${x.rg || '?'}`.trim()).join(', ')
      msg += `\n\nExemplos não encontrados: ${amostra}. Marque "Criar animais não cadastrados" para cadastrar automaticamente.`
    }
    if ((r.erros?.length || 0) > 0) {
      const amostraErro = (r.erros || []).slice(0, 3).map(x => `${x.serie || '?'} ${x.rg || '?'} (${x.erro})`).join(', ')
      msg += `\n\n⚠️ ${r.erros.length} erro(s) ao importar. Ex: ${amostraErro}`
    }
    return msg
  }


  const handleImportar = async () => {
    setImportando(true)
    setResultadoImport(null)
    try {
      console.log('[Import Genética] Iniciando...')
      if (importMode === 'texto') {
        const dados = parsearTextoImport(importTexto)
        if (dados.length === 0) {
          setResultadoImport({ erro: 'Nenhum dado válido. Use tab ou espaço entre colunas. Ex: Série RG iABCZ Deca ou Série RG IQG Pt' })
          return
        }
        const res = await fetch('/api/import/excel-genetica', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dados, criarNaoEncontrados })
        })
        const json = await res.json()
        console.log('[Import Genética] Resposta:', res.status, json)
        if (res.ok) {
          setResultadoImport(json)
          setImportTexto('')
          onSuccess?.()
          alert(formatarResultadoImport(json.resultados || {}))
        } else {
          setResultadoImport({ erro: json.error || json.details || 'Erro na importação' })
          alert(`❌ Erro: ${json.error || json.details || 'Erro na importação'}`)
        }
      } else {
        if (!importFile) {
          setResultadoImport({ erro: 'Selecione um arquivo Excel' })
          return
        }
        const formData = new FormData()
        formData.append('file', importFile)
        formData.append('criarNaoEncontrados', criarNaoEncontrados ? 'true' : 'false')
        const res = await fetch('/api/import/excel-genetica', {
          method: 'POST',
          body: formData
        })
        const json = await res.json()
        console.log('[Import Genética] Resposta Excel:', res.status, json)
        if (res.ok) {
          setResultadoImport(json)
          setImportFile(null)
          onSuccess?.()
          alert(formatarResultadoImport(json.resultados || {}))
        } else {
          setResultadoImport({ erro: json.error || json.details || 'Erro na importação' })
          alert(`❌ Erro: ${json.error || json.details || 'Erro na importação'}`)
        }
      }
    } catch (err) {
      console.error('[Import Genética] Erro:', err)
      setResultadoImport({ erro: err.message || 'Erro ao importar' })
      alert(`❌ Erro: ${err.message || 'Verifique a conexão e tente novamente.'}`)
    } finally {
      setImportando(false)
    }
  }

  const handleLimparTodas = async () => {
    if (!confirm('Limpar TODOS os dados genéticos (iABCZ, DECA, IQG, Pt IQG, Situação ABCZ) de todos os animais? Depois você pode importar novamente.')) return
    setLimpando(true)
    setResultadoImport(null)
    try {
      const res = await fetch('/api/import/limpar-situacao-abcz', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const json = await res.json()
      if (res.ok) {
        setResultadoImport({ success: true, message: json.message })
        onSuccess?.()
        alert(`${json.message}\n\nRecarregue a página (F5) para ver os dados atualizados.`)
      } else {
        setResultadoImport({ erro: json.error || json.details || 'Erro ao limpar' })
        alert(`Erro: ${json.error || json.details || 'Erro ao limpar'}`)
      }
    } catch (err) {
      setResultadoImport({ erro: err.message || 'Erro ao limpar' })
      alert(`Erro: ${err.message || 'Erro ao limpar'}`)
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Série, RG (iABCZ/DECA ou IQG/Pt IQG)" size="lg">
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cole os dados (tab entre colunas). Formato principal: Série, RG, iABCZg, DECA, IQG, Pt IQG (6 colunas). Ou só IQG: Série, RG, IQG, Pt IQG (4 cols).</p>
            <textarea
              value={importTexto}
              onChange={(e) => setImportTexto(e.target.value)}
              placeholder="SÉRIE	RG	iABCZg	DECA	IQG	Pt IQG&#10;CJCS	1	34,8	1	45,93	0,1&#10;CJCS	3	40,5	1	53,86	0,5&#10;CJCS	10	36,68	1	52,02	2"
              className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm font-mono"
              rows={6}
            />
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Excel: Série, RG, iABCZg, DECA, IQG, Pt IQG (6 colunas). Ou só IQG: Série, RG, IQG, Pt IQG (4 cols). Animais não encontrados e inativos são ignorados.</p>
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={criarNaoEncontrados}
            onChange={(e) => setCriarNaoEncontrados(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Criar animais não cadastrados (cadastra automaticamente os que não existem)</span>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleLimparTodas}
            disabled={limpando || importando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
            title="Zera todos os dados genéticos para importar novamente"
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
              {importando ? 'Importando... (aguarde)' : 'Importar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
