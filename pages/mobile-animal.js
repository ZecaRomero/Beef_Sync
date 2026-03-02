import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function MobileAnimal() {
  const router = useRouter()
  const [serie, setSerie] = useState('')
  const [rg, setRg] = useState('')
  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allAnimals, setAllAnimals] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importMode, setImportMode] = useState('texto') // 'texto' | 'excel'
  const [importTexto, setImportTexto] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState(null)
  const [ranking, setRanking] = useState([])
  const [rankingPeso, setRankingPeso] = useState([])
  const [rankingCE, setRankingCE] = useState([])
  const [sincronizandoNascimento, setSincronizandoNascimento] = useState(false)
  const [toastSync, setToastSync] = useState(null)

  const sincronizarNascimentos = async () => {
    setSincronizandoNascimento(true)
    setToastSync(null)
    try {
      const res = await fetch('/api/animals/sync-nascimento', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.data) {
        setToastSync({ tipo: 'ok', msg: data.data.mensagem || `${data.data.atualizados} animal(is) atualizado(s)` })
        if (data.data.atualizados > 0) {
          const r = await fetch('/api/animals?orderBy=created_at')
          const d = await r.json()
          if (d.success && d.data) setAllAnimals(d.data)
        }
      } else {
        setToastSync({ tipo: 'erro', msg: data.message || 'Erro ao sincronizar' })
      }
    } catch (e) {
      setToastSync({ tipo: 'erro', msg: 'Erro de conexão' })
    } finally {
      setSincronizandoNascimento(false)
      setTimeout(() => setToastSync(null), 4000)
    }
  }

  // Carregar todos os animais e ranking
  useEffect(() => {
    fetch('/api/animals?orderBy=created_at')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setAllAnimals(data.data)
          
          // Calcular ranking de peso (Top 10 maiores pesos)
          const animaisComPeso = data.data
            .filter(a => a.peso && a.peso > 0)
            .sort((a, b) => b.peso - a.peso)
            .slice(0, 10)
            .map((a, index) => ({
              ...a,
              posicao: index + 1,
              identificacao: `${a.serie || ''}-${a.rg || ''}`
            }))
          setRankingPeso(animaisComPeso)
          
          // Calcular ranking de CE (Top 10 maiores CE - apenas machos)
          const animaisComCE = data.data
            .filter(a => a.ce && a.ce > 0 && a.sexo && (a.sexo.toLowerCase().includes('m') || a.sexo === 'M'))
            .sort((a, b) => b.ce - a.ce)
            .slice(0, 10)
            .map((a, index) => ({
              ...a,
              posicao: index + 1,
              identificacao: `${a.serie || ''}-${a.rg || ''}`
            }))
          setRankingCE(animaisComCE)
        }
      })
      .catch(err => console.error('Erro ao carregar animais:', err))

    fetch('/api/animals/ranking-iabcz?limit=10')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setRanking(data.data)
        }
      })
      .catch(err => console.error('Erro ao carregar ranking:', err))
  }, [])

  const buscarAnimal = async (e, overrideSerie, overrideRg) => {
    if (e) e.preventDefault()
    const s = overrideSerie ?? serie
    const r = overrideRg ?? rg
    if (!s || !r) {
      setError('Digite a Série e o RG')
      return
    }
    setSerie(s)
    setRg(r)
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/animals?serie=${encodeURIComponent(s)}&rg=${encodeURIComponent(r)}`)
      const data = await response.json()

      if (data.success && data.data && data.data.length > 0) {
        const animalEncontrado = data.data[0]
        setAnimal(animalEncontrado)
        
        // Encontrar índice do animal na lista completa
        const idx = allAnimals.findIndex(a => a.id === animalEncontrado.id)
        setCurrentIndex(idx)
      } else {
        setError('Animal não encontrado')
        setAnimal(null)
      }
    } catch (err) {
      setError('Erro ao buscar animal')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const navegarAnimal = (direcao) => {
    if (allAnimals.length === 0) return
    
    let novoIndex = currentIndex
    
    if (direcao === 'primeiro') novoIndex = 0
    else if (direcao === 'anterior') novoIndex = Math.max(0, currentIndex - 1)
    else if (direcao === 'proximo') novoIndex = Math.min(allAnimals.length - 1, currentIndex + 1)
    else if (direcao === 'ultimo') novoIndex = allAnimals.length - 1
    
    if (novoIndex !== currentIndex && allAnimals[novoIndex]) {
      const novoAnimal = allAnimals[novoIndex]
      setAnimal(novoAnimal)
      setSerie(novoAnimal.serie)
      setRg(novoAnimal.rg)
      setCurrentIndex(novoIndex)
    }
  }

  const limparBusca = () => {
    setSerie('')
    setRg('')
    setAnimal(null)
    setError('')
    setCurrentIndex(-1)
  }

  // Parsear texto colado (Série\tRG\tiABCZ\tDeca\tSituação ABCZ ou Série,RG,iABCZ,Deca,Situação ABCZ)
  const parsearTextoImport = (texto) => {
    const linhas = texto.trim().split(/\r?\n/).filter(Boolean)
    const sep = linhas[0].includes('\t') ? '\t' : ','
    const dados = []
    const header = linhas[0].toUpperCase()
    const skipHeader = header.includes('SÉRIE') || header.includes('SERIE') || header.includes('RG')
    const start = skipHeader ? 1 : 0
    for (let i = start; i < linhas.length; i++) {
      const cols = linhas[i].split(sep).map(c => c.trim())
      if (cols.length >= 2) {
        dados.push({
          serie: cols[0] || '',
          rg: cols[1] || '',
          iABCZ: cols[2] || null,
          deca: cols[3] || null,
          situacaoAbcz: cols[4] || null
        })
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
          fetch('/api/animals/ranking-iabcz?limit=10').then(r => r.json()).then(d => d.success && setRanking(d.data))
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
          fetch('/api/animals/ranking-iabcz?limit=10').then(r => r.json()).then(d => d.success && setRanking(d.data))
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

  return (
    <>
      <Head>
        <title>Beef-Sync Mobile | Buscar Animal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Beef-Sync Mobile</h1>
          <div className="flex gap-2">
            <button
              onClick={sincronizarNascimentos}
              disabled={sincronizandoNascimento}
              className="p-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 disabled:opacity-50 text-white"
              title="Sincronizar data de nascimento (nascimentos → animais)"
            >
              <ArrowPathIcon className={`h-5 w-5 ${sincronizandoNascimento ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => router.push('/mobile-feedback')}
              className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              title="Enviar Feedback"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => { setShowImportModal(true); setResultadoImport(null); setImportTexto(''); setImportFile(null); }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              title="Importar Série, RG, iABCZ, Deca"
            >
              <DocumentArrowUpIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toast sincronização nascimentos */}
        {toastSync && (
          <div className={`fixed top-20 left-4 right-4 z-50 p-4 rounded-xl shadow-lg ${
            toastSync.tipo === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toastSync.msg}
          </div>
        )}

        {/* Modal Importação */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Importar Série, RG, iABCZ, Deca</h3>
                <button onClick={() => setShowImportModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cole os dados (Série, RG, iABCZ, Deca) separados por tab ou vírgula:</p>
                    <textarea
                      value={importTexto}
                      onChange={(e) => setImportTexto(e.target.value)}
                      placeholder="SÉRIE	RG	iABCZ	DECA&#10;CJCJ	16974	47,71	1&#10;CJCJ	17037	43,25	1"
                      className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm font-mono"
                      rows={6}
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Arquivo Excel com colunas: Série, RG, iABCZ, Deca</p>
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
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleImportar}
                  disabled={importando || (importMode === 'texto' ? !importTexto.trim() : !importFile)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl"
                >
                  {importando ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ranking Top 10 iABCZ */}
        {ranking.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-amber-500" />
              Ranking iABCZ (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Quanto maior o iABCZ, melhor o animal</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ranking.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{r.abczg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking Top 10 Peso */}
        {rankingPeso.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-green-500" />
              Ranking Peso (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Maiores pesos registrados</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rankingPeso.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">{r.peso} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking Top 10 C.E */}
        {rankingCE.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-purple-500" />
              Ranking CE (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Maiores circunferências escrotais (machos)</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rankingCE.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{r.ce} cm</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Busca */}
        {!animal && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
              🔍 Buscar Animal
            </h2>
            
            <form onSubmit={buscarAnimal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Série
                </label>
                <input
                  type="text"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value.toUpperCase())}
                  placeholder="Digite a Série ( CJCJ) "
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RG
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  placeholder="Digite o RG do animal"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 text-center">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !serie || !rg}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    Buscar Animal
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Resultado */}
        {animal && (
          <div className="space-y-4">
            {/* Card Principal */}
            <div className={`rounded-2xl shadow-2xl p-5 ${
              animal.sexo?.toLowerCase().includes('macho') 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                : 'bg-gradient-to-br from-pink-600 to-purple-700'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={limparBusca}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium"
                >
                  ← Voltar
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  animal.situacao === 'Ativo' ? 'bg-green-500 text-white' :
                  animal.situacao === 'Vendido' ? 'bg-blue-500 text-white' :
                  animal.situacao === 'Morto' ? 'bg-red-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {animal.situacao || 'Ativo'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {animal.serie} {animal.rg}
              </h2>
              <p className="text-white/80 text-sm mb-1">
                ID: {animal.id} • {animal.raca}
              </p>
              <p className="text-white/90 text-sm font-medium">
                {animal.sexo} • {animal.meses || 0} meses
              </p>
              <p className="text-white/90 text-sm font-medium">
                Situação ABCZ: {animal.situacao_abcz || animal.situacaoAbcz || 'Não informado'}
              </p>

              {/* Navegação */}
              {allAnimals.length > 0 && currentIndex >= 0 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/20">
                  <span className="text-white font-bold">
                    {currentIndex + 1} de {allAnimals.length}
                  </span>
                  <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                    <button
                      onClick={() => navegarAnimal('primeiro')}
                      disabled={currentIndex === 0}
                      className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navegarAnimal('anterior')}
                      disabled={currentIndex === 0}
                      className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navegarAnimal('proximo')}
                      disabled={currentIndex === allAnimals.length - 1}
                      className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navegarAnimal('ultimo')}
                      disabled={currentIndex === allAnimals.length - 1}
                      className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Custos Totais</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  R$ 0,00
                </p>
              </div>
            </div>

            {/* Botões de Ação - Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push(`/animals/${animal.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <PlusCircleIcon className="h-6 w-6" />
                <span className="text-sm">Lançar</span>
              </button>

              <button
                onClick={() => alert('Função em desenvolvimento')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <PlusCircleIcon className="h-6 w-6" />
                <span className="text-sm">Lote</span>
              </button>

              <button
                onClick={() => alert('Função em desenvolvimento')}
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <DocumentArrowDownIcon className="h-6 w-6" />
                <span className="text-sm">PDF</span>
              </button>

              <button
                onClick={() => router.push(`/animals/${animal.id}`)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <PencilIcon className="h-6 w-6" />
                <span className="text-sm">Editar</span>
              </button>
            </div>

            {/* Informações Detalhadas - Colapsáveis */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">
                  📋 Informações
                </h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Nome</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.nome || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Raça</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.raca || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Sexo</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.sexo || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Idade</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.meses || 0} meses
                    </p>
                  </div>

                  {animal.peso && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Peso</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.peso} kg
                      </p>
                    </div>
                  )}

                  {animal.ce && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">CE</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.ce} cm
                      </p>
                    </div>
                  )}

                  {animal.data_nascimento && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Nascimento</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(animal.data_nascimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {(animal.abczg || animal.abczg === 0) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">iABCZ</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {animal.abczg}
                      </p>
                    </div>
                  )}

                  {(animal.deca || animal.deca === 0) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">DECA</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.deca}
                      </p>
                    </div>
                  )}

                  {(animal.genetica_2 || animal.genetica_2 === 0) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Avaliação 2</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {animal.genetica_2}
                      </p>
                    </div>
                  )}

                  {(animal.decile_2 || animal.decile_2 === 0) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Decile 2</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.decile_2}
                      </p>
                    </div>
                  )}

                  {animal.pai && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Pai</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.pai}
                      </p>
                    </div>
                  )}

                  {animal.mae && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Mãe</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.mae}
                      </p>
                    </div>
                  )}

                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Receptora</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.receptora || '-'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Localização (Piquete)</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.piquete_atual || animal.piqueteAtual || animal.pasto_atual || animal.pastoAtual || 'Não informado'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Situação ABCZ</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.situacao_abcz || animal.situacaoAbcz || 'Não informado'}
                    </p>
                  </div>
                </div>

                {animal.observacoes && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Observações</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {animal.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botão Ver Detalhes Completos */}
            <button
              onClick={() => router.push(`/animals/${animal.id}`)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Ver Detalhes Completos
            </button>
          </div>
        )}
      </div>
    </>
  )
}
