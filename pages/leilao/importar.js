import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import UniversalExcelImporter from '../../components/UniversalExcelImporter'
import ImportarTextoPesagens from '../../components/ImportarTextoPesagens'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  DocumentArrowDownIcon,
  BanknotesIcon,
  ScaleIcon,
  HeartIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function LeilaoImportar() {
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [importSuccess, setImportSuccess] = useState(null)
  const [animais, setAnimais] = useState([])
  const [abaAtiva, setAbaAtiva] = useState('avaliacao') // 'avaliacao' | 'excel' | 'pesagens'

  // AvaliaÃ§Ã£o/ProjeÃ§Ã£o - import
  const [fileAvaliacao, setFileAvaliacao] = useState(null)
  const [carimboLeilao, setCarimboLeilao] = useState('10Âº LeilÃ£o Matrizes Sant Anna no dia 15/03')
  const [loadingAvaliacao, setLoadingAvaliacao] = useState(false)
  const [previewAvaliacao, setPreviewAvaliacao] = useState(null)
  const [erroAvaliacao, setErroAvaliacao] = useState(null)

  useEffect(() => {
    fetch('/api/animals')
      .then((r) => r.json())
      .then((d) => setAnimais(d.data || d.animals || []))
      .catch(() => {})
  }, [])

  const handleImportSuccess = (type, count) => {
    setImportSuccess({ type, count })
    setTimeout(() => setImportSuccess(null), 5000)
  }

  const refreshAnimais = () => {
    fetch('/api/animals')
      .then((r) => r.json())
      .then((d) => setAnimais(d.animals || d.data || []))
      .catch(() => {})
  }

  const handleFileAvaliacaoChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileAvaliacao(f)
    setErroAvaliacao(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' })
        setPreviewAvaliacao({ total: json.length, sample: json.slice(0, 5), headers: json[0] ? Object.keys(json[0]) : [] })
      } catch (err) {
        setErroAvaliacao('Erro ao ler arquivo: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  const importarAvaliacao = async () => {
    if (!fileAvaliacao || !previewAvaliacao) {
      setErroAvaliacao('Selecione um arquivo Excel primeiro')
      return
    }
    setLoadingAvaliacao(true)
    setErroAvaliacao(null)
    try {
      const data = new Uint8Array(await fileAvaliacao.arrayBuffer())
      const wb = XLSX.read(data, { type: 'array' })
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
      const res = await fetch('/api/import/leilao-avaliacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registros: json, carimboLeilao: carimboLeilao.trim() || null })
      })
      let result
      try {
        result = await res.json()
      } catch (parseErr) {
        setErroAvaliacao('Resposta invÃ¡lida do servidor. Verifique se o banco estÃ¡ acessÃ­vel.')
        setLoadingAvaliacao(false)
        return
      }
      if (result.success) {
        const atualizados = result.data?.atualizados ?? 0
        const errosCount = result.data?.erros ?? 0
        if (atualizados > 0) {
          handleImportSuccess('AvaliaÃ§Ã£o/ProjeÃ§Ã£o', atualizados)
          setFileAvaliacao(null)
          setPreviewAvaliacao(null)
        } else if (errosCount > 0) {
          const detalhes = result.data?.detalhes || []
          const exemplos = detalhes.slice(0, 3).map(d => `${d.serie || '?'}-${d.rg || '?'}: ${d.motivo}`).join('; ')
          setErroAvaliacao(
            `Nenhum animal foi atualizado. ${errosCount} registro(s) com problema. ` +
            `Os animais precisam existir no banco (SÃ©rie + RG). Exemplos: ${exemplos || 'verifique SÃ©rie e RGN no Excel'}`
          )
        } else {
          setErroAvaliacao('Nenhum animal foi atualizado. Verifique se as colunas SÃ©rie e RGN existem no Excel e se os animais estÃ£o cadastrados.')
        }
      } else {
        const msg = typeof result.message === 'string'
          ? result.message
          : (result.message?.required ? `Campos obrigatÃ³rios: ${(result.message.required || []).join(', ')}` : 'Erro na importaÃ§Ã£o')
        setErroAvaliacao(msg)
      }
    } catch (err) {
      setErroAvaliacao('Erro: ' + (err.message || 'Falha na conexÃ£o. Tente novamente.'))
    } finally {
      setLoadingAvaliacao(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/leilao" className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:underline mb-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar ao Dashboard LeilÃ£o
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DocumentArrowDownIcon className="h-8 w-8 text-amber-600" />
            Importar Dados para LeilÃ£o
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Pesagens, InseminaÃ§Ã£o Artificial, PariÃ§Ãµes e mais ââ‚¬â€� prepare seus dados para anÃ¡lise de custo e ROI
          </p>
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {importSuccess && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800 dark:text-green-200 font-medium">
            {importSuccess.count} registros de {importSuccess.type} importados com sucesso!
          </span>
        </div>
      )}

      {/* Cards de tipos suportados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <HeartIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">InseminaÃ§Ã£o Artificial</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data IA, Touro, DG, Resultado</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">PariÃ§Ãµes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nascimentos, SÃ©rie, RG, Peso, Pai, MÃ£e</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <ScaleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Pesagens</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Peso, CE, Data por animal</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setAbaAtiva('avaliacao')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            abaAtiva === 'avaliacao'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          ðÅ¸�·ï¸� AvaliaÃ§Ã£o + Carimbo LeilÃ£o
        </button>
        <button
          onClick={() => setAbaAtiva('excel')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            abaAtiva === 'excel'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          ðÅ¸â€œÅ  Excel (IA, PariÃ§Ãµes, DG)
        </button>
        <button
          onClick={() => setAbaAtiva('pesagens')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            abaAtiva === 'pesagens'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          âÅ¡â€“ï¸� Pesagens (Texto)
        </button>
      </div>

      {/* ConteÃºdo das abas */}
      {abaAtiva === 'avaliacao' && (
        <Card className="p-6 relative">
          {loadingAvaliacao && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-lg flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <span className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
                <p className="font-medium text-gray-700 dark:text-gray-300">Importando...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aguarde, processando o Excel</p>
              </div>
            </div>
          )}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <TagIcon className="h-6 w-6 text-amber-600" />
              AvaliaÃ§Ã£o - ProjeÃ§Ã£o da Cria
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Importe o Excel com SÃ©rie, RGN, LOTE, OBSERVAÃâ€¡ÃÆ’O (PRENHA, PARIDA...), PREV PARTO, genÃ©tica. 
              Aplique o carimbo de leilÃ£o aos animais importados.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Carimbo do LeilÃ£o (ex: 10Âº LeilÃ£o Matrizes Sant Anna no dia 15/03)
              </label>
              <input
                type="text"
                value={carimboLeilao}
                onChange={(e) => setCarimboLeilao(e.target.value)}
                placeholder="10Âº LeilÃ£o Matrizes Sant Anna no dia 15/03"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arquivo Excel (AVALIAÃâ€¡ÃÆ’O - PROJEÃâ€¡ÃÆ’O DA CRIA)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileAvaliacaoChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-100 dark:file:bg-amber-900/30 file:text-amber-700 dark:file:text-amber-300 file:font-medium"
              />
            </div>

            {previewAvaliacao && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {previewAvaliacao.total} registro(s) encontrado(s). Colunas: {previewAvaliacao.headers?.join(', ')}
                </p>
              </div>
            )}

            {erroAvaliacao && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-300">{erroAvaliacao}</span>
              </div>
            )}

            <Button
              onClick={importarAvaliacao}
              disabled={!previewAvaliacao || loadingAvaliacao}
              className="flex items-center gap-2"
            >
              {loadingAvaliacao ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Importando...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Importar e aplicar carimbo
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">âÅ¡ ï¸� Importante:</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              Os animais precisam jÃ¡ estar cadastrados no sistema (SÃ©rie + RG). Se nÃ£o estiverem, importe primeiro pela Central de ImportaÃ§Ãµes ou Excel Universal.
            </p>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Colunas esperadas:</p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li><strong>SÃ©rie:</strong> identificaÃ§Ã£o da sÃ©rie</li>
              <li><strong>RGN:</strong> RG do animal</li>
              <li><strong>LOTE:</strong> nÃºmero do lote</li>
              <li><strong>OBSERVAÃâ€¡ÃÆ’O:</strong> prenha, parida, etc (situaÃ§Ã£o reprodutiva)</li>
              <li><strong>PREV PARTO:</strong> previsÃ£o de parto (ex: JUNHO/2026)</li>
              <li><strong>iABCZg*, DECA, IQG, PtIQG, MGT, TOP:</strong> genÃ©tica</li>
            </ul>
          </div>
        </Card>
      )}

      {abaAtiva === 'excel' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                ImportaÃ§Ã£o via Excel
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O sistema detecta automaticamente: IA, Nascimentos (pariÃ§Ãµes), DiagnÃ³stico de GestaÃ§Ã£o. 
                Suporta variaÃ§Ãµes de nomes de colunas (ex: Data IA, DataIA, data_ia).
              </p>
            </div>
            <Button onClick={() => setShowExcelModal(true)} className="flex items-center gap-2">
              <DocumentArrowDownIcon className="h-5 w-5" />
              Selecionar arquivo Excel
            </Button>
          </div>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Colunas esperadas:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li><strong>IA:</strong> SÃ©rie, RG, Data IA, Touro, Data DG, Resultado</li>
              <li><strong>PariÃ§Ãµes:</strong> SÃ©rie, RG, Data Nascimento, Peso, Pai, MÃ£e, Receptora</li>
              <li><strong>DG:</strong> SÃ©rie, RG, Data DG, Resultado (P/N)</li>
            </ul>
          </div>
        </Card>
      )}

      {abaAtiva === 'pesagens' && (
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Importar Pesagens por Texto
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cole o texto com SÃ©rie, RG, Peso, CE (opcional), Data. Formatos: SERIE RG PESO ou SERIE RG DATA PESO CE
            </p>
          </div>
          <ImportarTextoPesagens
            animais={animais}
            onImportComplete={() => handleImportSuccess('Pesagens', 0)}
            onRefreshAnimais={refreshAnimais}
          />
        </Card>
      )}

      {/* Link para pesagem Excel */}
      <Card className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Pesagens em Excel?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use a pÃ¡gina de Pesagem para importar Excel com mapeamento de colunas
            </p>
          </div>
          <Link href="/manejo/pesagem">
            <Button variant="outline" className="flex items-center gap-2">
              Ir para Pesagem
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>

      <UniversalExcelImporter
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
}
