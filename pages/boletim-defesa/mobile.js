import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { DocumentTextIcon, ArrowPathIcon, ShieldCheckIcon, TableCellsIcon, PencilSquareIcon, PaperAirplaneIcon, Cog6ToothIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

const CATEGORIAS_LOCAL = [
  { key: 'Piquetes', label: 'Piquetes', test: (s) => /piquete|^piq\s/i.test(s) },
  { key: 'Projetos', label: 'Projetos', test: (s) => /projeto/i.test(s) },
  { key: 'Confinamento', label: 'Confinamento', test: (s) => /confina|^conf\b/i.test(s) },
  { key: 'Cabanha', label: 'Cabanha', test: (s) => /cabanha/i.test(s) }
]
const ehOutros = (s) => !CATEGORIAS_LOCAL.some(c => c.test(s))

const LABELS_CAMPO = {
  local: 'Local',
  local_1: 'Local 1',
  sub_local_2: 'Sub Local',
  quant: 'Qtd',
  sexo: 'Sexo',
  categoria: 'Categoria',
  raca: 'Raça',
  era: 'Era',
  observacao: 'Observação'
}

export default function BoletimDefesaMobile() {
  const [abaAtiva, setAbaAtiva] = useState('campo')
  const [fazendas, setFazendas] = useState([])
  const [dadosCampo, setDadosCampo] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCampo, setLoadingCampo] = useState(false)
  const [busca, setBusca] = useState('')
  const [buscaFocada, setBuscaFocada] = useState(false)
  const buscaRef = useRef(null)
  const [isAdelso, setIsAdelso] = useState(false)
  const [whatsappAdelso, setWhatsappAdelso] = useState(null)
  const [modalWhatsapp, setModalWhatsapp] = useState(false)
  const [whatsappInput, setWhatsappInput] = useState('')
  const [modalEnviar, setModalEnviar] = useState(false)
  const [modalConferencia, setModalConferencia] = useState(false)
  const [formatoEnvio, setFormatoEnvio] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [modalAlterarQtd, setModalAlterarQtd] = useState(null)
  const [formMovimentacao, setFormMovimentacao] = useState({ novaQuant: '', sexo: '', era: '', raca: '', categoria: '', observacao: '', motivo: '' })
  const [opcoes, setOpcoes] = useState({ raca: [], categoria: [], era: [] })
  
  // Contatos pré-cadastrados
  const [contatos, setContatos] = useState([
    { nome: 'Zeca', telefone: '11969009621' },
    { nome: 'Nilson', telefone: '11969009198' }
  ])
  const [contatoSelecionado, setContatoSelecionado] = useState(null)
  const [novoContato, setNovoContato] = useState({ nome: '', telefone: '' })
  const [alteracoesFeitas, setAlteracoesFeitas] = useState([])
  const [sugerirResumo, setSugerirResumo] = useState(false)
  const [modalResumoAlteracoes, setModalResumoAlteracoes] = useState(false)
  const [modalEscolhaEnvio, setModalEscolhaEnvio] = useState(null) // { downloadUrl, waLink, nomeContato } quando fallback

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (abaAtiva === 'campo') {
      fetch('/api/boletim-campo/opcoes')
        .then(r => r.json())
        .then(j => {
          if (j.success) setOpcoes({ raca: j.raca || [], categoria: j.categoria || [], era: j.era || [] })
          else if (j.raca) setOpcoes({ raca: j.raca, categoria: j.categoria || [], era: j.era || [] })
        })
        .catch(() => {})
    }
  }, [abaAtiva])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const auth = localStorage.getItem('beef_adelso_auth')
        if (auth) {
          const data = JSON.parse(auth)
          if (data.nome === 'Adelso' && (!data.expiresAt || data.expiresAt > Date.now())) setIsAdelso(true)
        } else {
          const mobileAuth = localStorage.getItem('mobile-auth')
          if (mobileAuth) {
            const data = JSON.parse(mobileAuth)
            if (data.nome === 'Adelso') setIsAdelso(true)
          }
        }
      } catch (_) {}
    }
  }, [])

  useEffect(() => {
    if (isAdelso) {
      fetch('/api/boletim-campo/adelso-whatsapp')
        .then(r => r.json())
        .then(j => { if (j.success) setWhatsappAdelso(j.whatsapp) })
        .catch(() => {})
    }
  }, [isAdelso])

  useEffect(() => {
    if (abaAtiva === 'campo') carregarCampo()
  }, [abaAtiva])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const fn = (e) => {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) setBuscaFocada(false)
    }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [])

  const carregarDados = async () => {
    try {
      const response = await fetch('/api/boletim-defesa')
      const data = await response.json()
      setFazendas(data.fazendas || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarCampo = async () => {
    setLoadingCampo(true)
    try {
      const res = await fetch('/api/boletim-campo')
      const json = await res.json()
      if (json.success) {
        const data = (json.data || []).filter(d => d.local !== 'TOTAL GERAL' && d.local_1 !== 'TOTAL GERAL')
        setDadosCampo(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCampo(false)
    }
  }

  const confirmarAlteracaoCompleta = async (registro, valorNovo, form) => {
    const valorAntigo = registro.quant || 0
    if (valorNovo === valorAntigo) {
      setModalAlterarQtd(null)
      return
    }
    const tipo = valorNovo < valorAntigo ? 'saida' : 'entrada'
    const quantidade = Math.abs(valorNovo - valorAntigo)
    const motivo = form.motivo || (tipo === 'saida' ? 'piquete' : 'nascimento')
    try {
      await fetch('/api/boletim-campo/movimentacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boletimCampoId: registro.id,
          tipo,
          destinoLocal: null,
          destinoSubLocal: null,
          motivo,
          quantidade,
          sexo: form.sexo || null,
          era: form.era || null,
          raca: form.raca || null,
          categoria: form.categoria || null,
          observacao: form.observacao || null,
          usuario: 'Adelso'
        })
      })
      await fetch('/api/boletim-campo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: registro.id,
          quant: valorNovo,
          usuario: 'Adelso'
        })
      })
      const path = [registro.local, registro.local_1, registro.sub_local_2].filter(Boolean).join(' / ')
      setAlteracoesFeitas(prev => [...prev, {
        local: path || registro.local,
        valorAntigo: valorAntigo,
        valorNovo,
        tipo,
        quantidade,
        sexo: form.sexo,
        era: form.era,
        raca: form.raca,
        categoria: form.categoria,
        motivo
      }])
      setSugerirResumo(true)
      setModalAlterarQtd(null)
      setFormMovimentacao({ novaQuant: '', sexo: '', era: '', raca: '', categoria: '', observacao: '', motivo: '' })
      carregarCampo()
    } catch (e) {
      console.error(e)
      alert('Erro ao registrar movimentação')
    }
  }

  const salvarWhatsapp = async () => {
    const digits = (whatsappInput || '').replace(/\D/g, '')
    if (digits.length < 10) {
      alert('Informe DDD + número (ex: 11999999999)')
      return
    }
    try {
      const res = await fetch('/api/boletim-campo/adelso-whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: whatsappInput })
      })
      const json = await res.json()
      if (json.success) {
        setWhatsappAdelso(json.whatsapp)
        setModalWhatsapp(false)
        setWhatsappInput('')
      } else {
        alert(json.message || 'Erro ao salvar')
      }
    } catch (e) {
      alert('Erro ao salvar WhatsApp')
    }
  }

  const handleEnviar = async (formato) => {
    if (!contatoSelecionado) {
      alert('Selecione um contato para enviar')
      return
    }
    
    setEnviando(true)
    try {
      const res = await fetch('/api/boletim-campo/enviar-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formato,
          telefone: contatoSelecionado.telefone,
          nome: contatoSelecionado.nome
        })
      })
      const json = await res.json()
      if (json.success) {
        setModalConferencia(false)
        setModalEnviar(false)
        if (json.fallback) {
          const base = typeof window !== 'undefined' ? window.location.origin : ''
          const url = json.downloadUrl?.startsWith('/') ? `${base}${json.downloadUrl}` : json.downloadUrl
          setModalEscolhaEnvio({
            downloadUrl: url || `${base}/api/boletim-campo/download-excel`,
            waLink: json.waLink,
            nomeContato: contatoSelecionado?.nome
          })
        } else {
          setContatoSelecionado(null)
          alert(`Enviado para ${contatoSelecionado.nome}!`)
        }
      } else {
        alert(json.message || 'Erro ao enviar')
      }
    } catch (e) {
      alert('Erro ao enviar')
    } finally {
      setEnviando(false)
    }
  }

  const adicionarContato = () => {
    const nome = novoContato.nome.trim()
    const telefone = novoContato.telefone.replace(/\D/g, '')
    
    if (!nome) {
      alert('Digite o nome do contato')
      return
    }
    
    if (telefone.length < 10) {
      alert('Digite um telefone válido (DDD + número)')
      return
    }
    
    setContatos([...contatos, { nome, telefone }])
    setNovoContato({ nome: '', telefone: '' })
    alert(`Contato ${nome} adicionado!`)
  }

  const calcularSubtotais = (quantidades) => {
    const faixas = ['0a3', '3a8', '8a12', '12a24', '25a36', 'acima36']
    let totalM = 0
    let totalF = 0

    faixas.forEach(faixa => {
      totalM += quantidades[faixa]?.M || 0
      totalF += quantidades[faixa]?.F || 0
    })

    return { M: totalM, F: totalF, total: totalM + totalF }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Boletim Defesa Mobile - Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Boletim</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Defesa e Campo</p>
              </div>
            </div>
            <button
              onClick={abaAtiva === 'defesa' ? carregarDados : carregarCampo}
              className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setAbaAtiva('campo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              abaAtiva === 'campo'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <TableCellsIcon className="w-5 h-5" />
            Campo
          </button>
          <button
            onClick={() => setAbaAtiva('defesa')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              abaAtiva === 'defesa'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <ShieldCheckIcon className="w-5 h-5" />
            Defesa
          </button>
        </div>

        {/* Botões Adelso (Campo) */}
        {abaAtiva === 'campo' && isAdelso && (
          <div className="flex flex-wrap gap-2 mb-4">
            {alteracoesFeitas.length > 0 && !sugerirResumo && (
              <button
                onClick={() => setModalResumoAlteracoes(true)}
                className="w-full py-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-400/50 text-sm font-medium"
              >
                Ver resumo das alterações ({alteracoesFeitas.length})
              </button>
            )}
            <button
              onClick={() => setModalEnviar(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-semibold"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Enviar
            </button>
            <button
              onClick={() => setModalWhatsapp(true)}
              className="py-3 px-4 rounded-xl bg-gray-500 text-white text-sm font-medium"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Busca por piquete/local (só no Campo) */}
        {abaAtiva === 'campo' && (
          <div className="mb-4 space-y-3" ref={buscaRef}>
            {/* Filtros por tipo - Piquetes, Projetos, etc. (só locais com gado) */}
            {(() => {
              const comGado = dadosCampo.filter(d => (parseInt(d.quant) || 0) > 0)
              const textoRow = (r) => [r.local, r.local_1, r.sub_local_2].map(v => (v || '').trim()).filter(Boolean).join(' ')
              const categoriasComDados = [
                ...CATEGORIAS_LOCAL.filter(c => comGado.some(d => c.test(textoRow(d)))),
                ...(comGado.some(d => ehOutros(textoRow(d))) ? [{ key: 'Outros', label: 'Outros' }] : [])
              ]
              if (categoriasComDados.length === 0) return null
              return (
                <div className="flex flex-wrap gap-2">
                  {categoriasComDados.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setBusca(busca === c.key ? '' : c.key)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        busca === c.key
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-teal-900/30'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )
            })()}
            {/* Campo de busca com sugestões */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onFocus={() => setBuscaFocada(true)}
                placeholder="Digite piquete ou local..."
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              {busca.trim() && (
                <button
                  type="button"
                  onClick={() => { setBusca(''); setBuscaFocada(false) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
              {/* Dropdown de sugestões ao digitar */}
              {buscaFocada && dadosCampo.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl z-20">
                  {(() => {
                    const comGado = dadosCampo.filter(d => (parseInt(d.quant) || 0) > 0)
                    const q = busca.trim().toLowerCase()
                    const path = (d) => [d.local, d.local_1, d.sub_local_2].map(v => (v || '').trim()).filter(Boolean).join(' / ') || '-'
                    const sugestoes = [...new Set(comGado.map(path))].filter(v => v !== '-').sort()
                    const filtradas = q ? sugestoes.filter(s => s.toLowerCase().includes(q)) : sugestoes
                    if (filtradas.length === 0) return <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Nenhum local encontrado</p>
                    return filtradas.map(v => (
                      <button
                        key={v}
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-0"
                        onClick={() => { setBusca(v); setBuscaFocada(false) }}
                      >
                        {v}
                      </button>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo Campo (cards) */}
        {abaAtiva === 'campo' && (
          <div className="space-y-4">
            {loadingCampo ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
              </div>
            ) : (
              <>
                {(() => {
                  const comGado = dadosCampo.filter(d => (parseInt(d.quant) || 0) > 0)
                  const cols = ['local', 'local_1', 'sub_local_2', 'quant', 'sexo', 'categoria', 'raca', 'era', 'observacao']
                  const totalGeral = comGado.reduce((s, d) => s + (parseInt(d.quant) || 0), 0)
                  const linhaTotal = { local: 'TOTAL GERAL', local_1: 'TOTAL GERAL', sub_local_2: 'TOTAL GERAL', quant: totalGeral, sexo: '-', categoria: '-', raca: '-', era: '-', observacao: '-' }
                  const comTotal = [...comGado, linhaTotal]
                  const textoRow = (r) => [r.local, r.local_1, r.sub_local_2].map(v => (v || '').trim()).filter(Boolean).join(' ')
                  const filtrados = busca.trim()
                    ? comTotal.filter(r => {
                        if (r.local === 'TOTAL GERAL') return true
                        const cat = CATEGORIAS_LOCAL.find(c => c.key === busca)
                        if (cat) return cat.test(textoRow(r))
                        if (busca === 'Outros') return ehOutros(textoRow(r))
                        const q = busca.toLowerCase()
                        const rowTexto = textoRow(r).toLowerCase()
                        if (rowTexto.includes(q)) return true
                        return Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
                      })
                    : comTotal
                  return (
                    <>
                      {/* Resumo */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total de animais</p>
                          <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{totalGeral}</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/20 rounded-xl p-4 border-2 border-teal-200 dark:border-teal-700">
                          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                            {busca.trim() ? 'Encontrados' : 'Registros'}
                          </p>
                          <p className="text-2xl font-bold text-teal-800 dark:text-teal-200">
                            {busca.trim() ? filtrados.filter(r => r.local !== 'TOTAL GERAL').length : comGado.length}
                          </p>
                          {busca.trim() && (
                            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">de {comGado.length} total</p>
                          )}
                        </div>
                      </div>
                      {/* Cards */}
                      <div className="space-y-3">
                        {filtrados.map((row, i) => {
                          const isTotal = row.local === 'TOTAL GERAL' || row.local_1 === 'TOTAL GERAL'
                          const podeEditar = isAdelso && !isTotal && row.id
                          return (
                            <div
                              key={row.id || i}
                              className={`rounded-xl border-2 p-4 ${
                                isTotal
                                  ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <div className="space-y-2">
                                {cols.map(k => {
                                  const v = row[k]
                                  const display = v ?? '-'
                                  return (
                                    <div key={k} className="flex justify-between items-start gap-3 text-base">
                                      <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0 min-w-[90px]">
                                        {LABELS_CAMPO[k] || k}:
                                      </span>
                                      <span className={`text-right break-words ${isTotal ? 'font-bold text-amber-800 dark:text-amber-200' : 'text-gray-900 dark:text-white'}`}>
                                        {display}
                                      </span>
                                    </div>
                                  )
                                })}
                                {podeEditar && (
                                  <button
                                    onClick={() => {
                                      setModalAlterarQtd({ registro: row, valorAtual: row.quant || 0 })
                                      const s = (row.sexo || '').toString().toUpperCase()
                                      const sexoVal = s.startsWith('M') ? 'M' : s.startsWith('F') ? 'F' : ''
                                      const eraVal = (row.era || '').toString().trim()
                                      const racaVal = (row.raca || '').toString().trim()
                                      const catVal = (row.categoria || '').toString().trim()
                                      setFormMovimentacao({ novaQuant: String(row.quant || 0), sexo: sexoVal, era: eraVal, raca: racaVal, categoria: catVal, observacao: '', motivo: '' })
                                    }}
                                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    Alterar quantidade
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {filtrados.length === 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                          <TableCellsIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">
                            {busca.trim() ? 'Nenhum registro encontrado' : 'Nenhum registro no Boletim Campo'}
                          </p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </>
            )}
          </div>
        )}

        {/* Fazendas (Defesa) */}
        {abaAtiva === 'defesa' && (
        <div className="space-y-4">
          {fazendas.map(fazenda => {
            const subtotais = calcularSubtotais(fazenda.quantidades)
            
            return (
              <div key={fazenda.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                {/* Header da fazenda */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                  <h2 className="text-base font-bold text-white">{fazenda.nome}</h2>
                  <p className="text-xs text-blue-100">{fazenda.cnpj}</p>
                </div>

                {/* Total em destaque */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-5 border-b-2 border-red-300 dark:border-red-700">
                  <div className="text-center">
                    <p className="text-xs text-red-700 dark:text-red-300 mb-2 font-semibold uppercase tracking-wider">Total Geral</p>
                    <p className="text-5xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-3">{subtotais.total}</p>
                    <div className="flex justify-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">♂ Machos</p>
                        <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{subtotais.M}</span>
                      </div>
                      <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                      <div className="text-center">
                        <p className="text-xs text-pink-600 dark:text-pink-400 mb-1">♀ Fêmeas</p>
                        <span className="text-2xl font-bold text-pink-700 dark:text-pink-300">{subtotais.F}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Faixas etárias */}
                <div className="p-4 space-y-3">
                  {[
                    { key: '0a3', label: '0 a 3 meses', colorClass: 'from-blue-600 to-blue-700' },
                    { key: '3a8', label: '3 a 8 meses', colorClass: 'from-indigo-600 to-indigo-700' },
                    { key: '8a12', label: '8 a 12 meses', colorClass: 'from-purple-600 to-purple-700' },
                    { key: '12a24', label: '12 a 24 meses', colorClass: 'from-violet-600 to-violet-700' },
                    { key: '25a36', label: '25 a 36 meses', colorClass: 'from-fuchsia-600 to-fuchsia-700' },
                    { key: 'acima36', label: 'Acima de 36 meses', colorClass: 'from-pink-600 to-pink-700' }
                  ].map(faixa => {
                    const m = fazenda.quantidades[faixa.key]?.M || 0
                    const f = fazenda.quantidades[faixa.key]?.F || 0
                    const total = m + f

                    return (
                      <div key={faixa.key} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {faixa.label}
                          </span>
                          <span className={`text-2xl font-bold bg-gradient-to-r ${faixa.colorClass} bg-clip-text text-transparent`}>
                            {total}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl p-3 border border-blue-300 dark:border-blue-700">
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1 font-semibold">♂ Machos</p>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{m}</p>
                          </div>
                          <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/40 dark:to-pink-800/40 rounded-xl p-3 border border-pink-300 dark:border-pink-700">
                            <p className="text-xs text-pink-700 dark:text-pink-300 mb-1 font-semibold">♀ Fêmeas</p>
                            <p className="text-2xl font-bold text-pink-800 dark:text-pink-200">{f}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {fazendas.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
              <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma fazenda cadastrada
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Acesse o sistema desktop para cadastrar fazendas
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Modal alterar quantidade - formulário completo (Adelso) */}
      {modalAlterarQtd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 my-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Alterar quantidade</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {modalAlterarQtd.registro.local} / {modalAlterarQtd.registro.sub_local_2 || modalAlterarQtd.registro.local_1 || '-'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nova quantidade</label>
                <input
                  type="number"
                  min="0"
                  value={formMovimentacao.novaQuant}
                  onChange={e => setFormMovimentacao(f => ({ ...f, novaQuant: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sexo (entrada/saída) <span className="text-red-500">*</span></label>
                <select
                  value={formMovimentacao.sexo}
                  onChange={e => setFormMovimentacao(f => ({ ...f, sexo: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-</option>
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Era <span className="text-red-500">*</span></label>
                <select
                  value={formMovimentacao.era}
                  onChange={e => setFormMovimentacao(f => ({ ...f, era: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-</option>
                  {[...new Set([formMovimentacao.era, ...(opcoes.era.length ? opcoes.era : ['+23', '+25', '0/7', '12/23', '08/12'])])].filter(Boolean).sort().map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Raça <span className="text-red-500">*</span></label>
                <select
                  value={formMovimentacao.raca}
                  onChange={e => setFormMovimentacao(f => ({ ...f, raca: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-</option>
                  {[...new Set([formMovimentacao.raca, ...(opcoes.raca.length ? opcoes.raca : ['Nelore', 'Angus', 'Brahman', 'Mestiça', 'Receptora', 'Não informado'])])].filter(Boolean).sort().map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Categoria <span className="text-red-500">*</span></label>
                <select
                  value={formMovimentacao.categoria}
                  onChange={e => setFormMovimentacao(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-</option>
                  {[...new Set([formMovimentacao.categoria, ...(opcoes.categoria.length ? opcoes.categoria : ['BEZERRO(AS)', 'DESMAMA', 'GARROTE', 'NOVILHA', 'NOVILHAS', 'TOURO', 'VACA'])])].filter(Boolean).sort().map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Observação</label>
                <textarea
                  value={formMovimentacao.observacao}
                  onChange={e => setFormMovimentacao(f => ({ ...f, observacao: e.target.value }))}
                  placeholder="Alguma observação..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              {(() => {
                const valorNovo = parseInt(formMovimentacao.novaQuant) || 0
                const isSaida = valorNovo < modalAlterarQtd.valorAtual
                const isEntrada = valorNovo > modalAlterarQtd.valorAtual
                if (isSaida) {
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Motivo da saída</label>
                      <div className="flex gap-2">
                        {['piquete', 'morte', 'venda'].map(m => (
                          <button
                            key={m}
                            onClick={() => setFormMovimentacao(f => ({ ...f, motivo: m }))}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                              formMovimentacao.motivo === m ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {m === 'piquete' ? 'Outro local' : m === 'morte' ? 'Morte' : 'Venda'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }
                if (isEntrada) {
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Motivo da entrada</label>
                      <div className="flex gap-2">
                        {['nascimento', 'entrada_externa'].map(m => (
                          <button
                            key={m}
                            onClick={() => setFormMovimentacao(f => ({ ...f, motivo: m }))}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                              formMovimentacao.motivo === m ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {m === 'nascimento' ? 'Nascimento' : 'Entrada externa'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setModalAlterarQtd(null); setFormMovimentacao({ novaQuant: '', sexo: '', era: '', raca: '', categoria: '', observacao: '', motivo: '' }) }} className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 rounded-xl font-semibold">Cancelar</button>
              <button
                onClick={() => {
                  const valorNovo = parseInt(formMovimentacao.novaQuant) || 0
                  if (valorNovo !== modalAlterarQtd.valorAtual) {
                    const tipo = valorNovo < modalAlterarQtd.valorAtual ? 'saida' : 'entrada'
                    const motivo = formMovimentacao.motivo || (tipo === 'saida' ? 'piquete' : 'nascimento')
                    if (!formMovimentacao.sexo?.trim()) {
                      alert('Por favor, selecione o Sexo')
                      return
                    }
                    if (!formMovimentacao.era?.trim()) {
                      alert('Por favor, selecione a Era')
                      return
                    }
                    if (!formMovimentacao.raca?.trim()) {
                      alert('Por favor, selecione a Raça')
                      return
                    }
                    if (!formMovimentacao.categoria?.trim()) {
                      alert('Por favor, selecione a Categoria')
                      return
                    }
                    confirmarAlteracaoCompleta(modalAlterarQtd.registro, valorNovo, { ...formMovimentacao, motivo })
                  } else {
                    setModalAlterarQtd(null)
                  }
                }}
                className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner: sugerir ver resumo das alterações */}
      {sugerirResumo && alteracoesFeitas.length > 0 && isAdelso && abaAtiva === 'campo' && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-teal-600 text-white rounded-xl p-4 shadow-xl flex flex-col gap-3">
          <p className="font-semibold">
            Você fez {alteracoesFeitas.length} alteração{alteracoesFeitas.length > 1 ? 'ões' : ''}. Quer ver o resumo?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSugerirResumo(false)
                setModalResumoAlteracoes(true)
              }}
              className="flex-1 py-2 rounded-lg bg-white text-teal-600 font-semibold"
            >
              Ver resumo
            </button>
            <button
              onClick={() => setSugerirResumo(false)}
              className="flex-1 py-2 rounded-lg bg-teal-500/50 text-white font-medium"
            >
              Agora não
            </button>
          </div>
        </div>
      )}

      {/* Modal resumo das alterações + opção de enviar */}
      {modalResumoAlteracoes && alteracoesFeitas.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto my-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Resumo das alterações</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Alterações feitas nesta sessão:
            </p>
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {alteracoesFeitas.map((alt, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <p className="font-semibold text-gray-900 dark:text-white">{alt.local}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {alt.valorAntigo} → {alt.valorNovo} ({alt.tipo === 'saida' ? 'Saída' : 'Entrada'} de {alt.quantidade})
                  </p>
                  {(alt.sexo || alt.raca || alt.categoria) && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {[
                        alt.sexo && `Sexo: ${alt.sexo === 'M' ? 'Macho' : alt.sexo === 'F' ? 'Fêmea' : alt.sexo}`,
                        alt.raca && `Raça: ${alt.raca}`,
                        alt.categoria && `Cat: ${alt.categoria}`
                      ].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Deseja enviar o Boletim Campo atualizado para os contatos WhatsApp?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setModalResumoAlteracoes(false)
                  setAlteracoesFeitas([])
                }}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setModalResumoAlteracoes(false)
                  setModalEnviar(true)
                  setAlteracoesFeitas([])
                }}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                Enviar para contatos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gerenciar contatos */}
      {modalWhatsapp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Gerenciar Contatos</h3>
            
            {/* Lista de contatos */}
            <div className="space-y-2 mb-4">
              {contatos.map((contato, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{contato.nome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contato.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remover ${contato.nome}?`)) {
                        setContatos(contatos.filter((_, i) => i !== idx))
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar novo contato */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Adicionar Novo Contato</h4>
              <input
                type="text"
                value={novoContato.nome}
                onChange={e => setNovoContato({ ...novoContato, nome: e.target.value })}
                placeholder="Nome"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
              />
              <input
                type="tel"
                value={novoContato.telefone}
                onChange={e => setNovoContato({ ...novoContato, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={adicionarContato}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
              >
                + Adicionar Contato
              </button>
            </div>

            <button
              onClick={() => setModalWhatsapp(false)}
              className="w-full mt-4 py-3 bg-gray-200 dark:bg-gray-600 rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal enviar WhatsApp */}
      {modalEnviar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Enviar para WhatsApp</h3>
            
            {/* Seleção de contato */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecione o contato:
              </label>
              <div className="space-y-2">
                {contatos.map((contato, idx) => (
                  <button
                    key={idx}
                    onClick={() => setContatoSelecionado(contato)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      contatoSelecionado?.telefone === contato.telefone
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">{contato.nome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contato.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Formato */}
            {contatoSelecionado && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Escolha o formato:
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setFormatoEnvio('excel')
                      setModalConferencia(true)
                    }}
                    disabled={enviando}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl disabled:opacity-50 font-semibold"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => {
                      setFormatoEnvio('pdf')
                      setModalConferencia(true)
                    }}
                    disabled={enviando}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl disabled:opacity-50 font-semibold"
                  >
                    PDF
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setModalEnviar(false)
                setContatoSelecionado(null)
              }}
              className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal conferência antes de enviar WhatsApp */}
      {modalConferencia && contatoSelecionado && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Conferência antes de enviar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Revise os dados que serão enviados para <strong>{contatoSelecionado.nome}</strong> ({(contatoSelecionado.telefone || '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')})
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4 space-y-2">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Resumo do Boletim Campo</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de animais: <strong>{dadosCampo.reduce((s, d) => s + (parseInt(d.quant) || 0), 0)}</strong></p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Registros (piquetes/locais): <strong>{dadosCampo.length}</strong></p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Formato: <strong>{formatoEnvio === 'excel' ? 'Excel (.xlsx)' : 'PDF'}</strong></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setModalConferencia(false)
                  setFormatoEnvio(null)
                }}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (formatoEnvio) {
                    setModalConferencia(false)
                    setModalEnviar(false)
                    setContatoSelecionado(null)
                    handleEnviar(formatoEnvio)
                    setFormatoEnvio(null)
                  }
                }}
                disabled={enviando}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Confirmar e enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal escolher: Baixar ou Enviar (quando WhatsApp API não configurada) */}
      {modalEscolhaEnvio && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Arquivo pronto</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              O link do WhatsApp não permite anexar arquivos automaticamente. Baixe o arquivo e anexe manualmente no chat.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  window.open(modalEscolhaEnvio.downloadUrl, '_blank')
                  setModalEscolhaEnvio(null)
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <DocumentTextIcon className="w-5 h-5" />
                Baixar arquivo
              </button>
              <button
                onClick={() => {
                  window.open(modalEscolhaEnvio.downloadUrl, '_blank')
                  setTimeout(() => window.open(modalEscolhaEnvio.waLink, '_blank'), 300)
                  setModalEscolhaEnvio(null)
                }}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                Baixar arquivo e abrir WhatsApp
              </button>
            </div>
            <button
              onClick={() => setModalEscolhaEnvio(null)}
              className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </>
  )
}
