import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ChartBarIcon, ScaleIcon, ArrowLeftIcon, XMarkIcon } from '../../components/ui/Icons'

export default function ResumoPesagens() {
  const router = useRouter()
  const [pesagens, setPesagens] = useState([])
  const [animais, setAnimais] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showLocalModal, setShowLocalModal] = useState(false)
  const [selectedLocalDados, setSelectedLocalDados] = useState(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    const load = async () => {
      setLoading(true)
      try {
        const [apiRes, animalsRes] = await Promise.all([
          fetch('/api/pesagens').then(r => r.ok ? r.json() : { pesagens: [] }),
          fetch('/api/animals').then(r => r.ok ? r.json() : { animals: [] })
        ])
        const apiPesagens = apiRes.pesagens || []
        const animaisList = animalsRes.animals || []
        setAnimais(animaisList)
        const fromStorage = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pesagens') || '[]') : []
        const idsApi = new Set(apiPesagens.map(p => `${p.animal_id}-${p.data}-${p.peso}`))
        const storageUnicas = fromStorage.filter(p => !idsApi.has(`${p.animal_id}-${p.data}-${p.peso}`))
        setPesagens([...apiPesagens, ...storageUnicas])
      } catch (e) {
        const fromStorage = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pesagens') || '[]') : []
        const savedAnimals = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('animals') || '[]') : []
        setAnimais(savedAnimals)
        setPesagens(fromStorage)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [mounted])

  // Enriquecer pesagens sem animal_sexo (igual à página de pesagem)
  useEffect(() => {
    if (!mounted || pesagens.length === 0 || animais.length === 0) return
    const semSexo = pesagens.filter(p => !p.animal_sexo && (p.animal_id || p.animal))
    if (semSexo.length === 0) return
    const mapa = Object.fromEntries(animais.map(a => [a.id, a.sexo]).filter(([, s]) => s))
    const enriquecido = pesagens.map(p => {
      if (p.animal_sexo) return p
      const sexo = p.animal_id ? mapa[p.animal_id] : null
      if (!sexo && p.animal) {
        const [serie, rg] = String(p.animal).split(/\s*-\s*/)
        const a = animais.find(x => x.serie === serie && x.rg == rg)
        if (a?.sexo) return { ...p, animal_sexo: a.sexo }
      }
      return sexo ? { ...p, animal_sexo: sexo } : p
    })
    if (JSON.stringify(enriquecido) !== JSON.stringify(pesagens)) {
      setPesagens(enriquecido)
    }
  }, [mounted, pesagens, animais])

  const extrairLocal = (obs) => {
    if (!obs || typeof obs !== 'string') return 'Não informado'
    const s = obs.trim()
    if (!s) return 'Não informado'
    const sNorm = s.replace(/CONFINAÇÃO/gi, 'CONFINA').replace(/CONFINACAO/gi, 'CONFINA')
    const m = sNorm.match(/(PIQUETE\s*\d+|PROJETO\s*[\dA-Za-z\-]+|LOTE\s*\d+|CONFINA\w*|GUARITA|CABANHA|PISTA\s*\d*)/i)
    if (m) {
      let loc = m[1].trim().toUpperCase().replace(/\s+/g, ' ')
      if (/^CONFINA/.test(loc)) loc = 'CONFINA'
      // PIQUETE X e PROJETO X → PROJETO X (agrupar mesmo local)
      if (/^PIQUETE\s+\d+$/.test(loc)) loc = loc.replace(/^PIQUETE\s+/i, 'PROJETO ')
      return loc
    }
    return s.length <= 35 ? s.toUpperCase() : s.substring(0, 35).toUpperCase()
  }

  const machos = pesagens.filter(p => p.animal_sexo === 'Macho')
  const femeas = pesagens.filter(p => p.animal_sexo === 'Fêmea')
  const pesos = pesagens.map(p => parseFloat(p.peso)).filter(n => !isNaN(n))
  const ces = pesagens.map(p => parseFloat(p.ce)).filter(n => !isNaN(n))

  const resumoPorSexo = [
    { label: '♂️ Machos', dados: machos },
    { label: '♀️ Fêmeas', dados: femeas }
  ].map(({ label, dados }) => {
    const p = dados.map(x => parseFloat(x.peso)).filter(n => !isNaN(n))
    const c = dados.map(x => parseFloat(x.ce)).filter(n => !isNaN(n))
    return {
      label,
      qtde: dados.length,
      mediaPeso: p.length ? (p.reduce((a, b) => a + b, 0) / p.length).toFixed(1) : '-',
      minPeso: p.length ? Math.min(...p).toFixed(1) : '-',
      maxPeso: p.length ? Math.max(...p).toFixed(1) : '-',
      mediaCE: c.length ? (c.reduce((a, b) => a + b, 0) / c.length).toFixed(1) : '-'
    }
  })

  // Local atual = da última pesagem de cada animal (como no relatório "Contagem de RGN")
  const porAnimalUltima = {}
  pesagens.forEach(p => {
    const aid = p.animal_id ?? p.animal ?? `f${(p.peso || 0)}-${p.data || ''}`
    const d = p.data || ''
    const prev = porAnimalUltima[aid]
    if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (p.created_at || '') > (prev.created_at || ''))) {
      porAnimalUltima[aid] = p
    }
  })
  const porLocal = {}
  Object.values(porAnimalUltima).forEach(p => {
    const local = extrairLocal(p.observacoes)
    if (!porLocal[local]) porLocal[local] = []
    porLocal[local].push(p)
  })
  const resumoPorLocal = Object.entries(porLocal).map(([local, dados]) => {
    const animaisUnicos = new Set(dados.map(p => p.animal_id || p.animal || `${p.peso}-${p.data}`))
    const qtde = animaisUnicos.size
    const femeasLocal = dados.filter(p => p.animal_sexo === 'Fêmea')
    const machosLocal = dados.filter(p => p.animal_sexo === 'Macho')
    const animaisFemeas = new Set(femeasLocal.map(p => p.animal_id || p.animal))
    const animaisMachos = new Set(machosLocal.map(p => p.animal_id || p.animal))
    const pesosArr = dados.map(x => parseFloat(x.peso)).filter(n => !isNaN(n))
    const c = dados.map(x => parseFloat(x.ce)).filter(n => !isNaN(n))
    return {
      local,
      dados,
      qtde,
      femeas: animaisFemeas.size,
      machos: animaisMachos.size,
      mediaPeso: pesosArr.length ? (pesosArr.reduce((a, b) => a + b, 0) / pesosArr.length).toFixed(1) : '-',
      minPeso: pesosArr.length ? Math.min(...pesosArr).toFixed(1) : '-',
      maxPeso: pesosArr.length ? Math.max(...pesosArr).toFixed(1) : '-',
      mediaCE: c.length ? (c.reduce((a, b) => a + b, 0) / c.length).toFixed(1) : '-'
    }
  }).sort((a, b) => b.qtde - a.qtde)

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => router.push('/manejo/pesagem')}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Voltar para Pesagem
        </button>

        <div className="flex items-center gap-3 mb-6">
          <ScaleIcon className="w-10 h-10 text-amber-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resumo Completo das Pesagens</h1>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Carregando...</div>
        ) : pesagens.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center text-gray-500">
            Nenhuma pesagem encontrada. Importe pesagens em Manejo → Pesagem.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow p-6 text-white">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6" />
                Totais Gerais
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <div className="text-xs opacity-80">Total</div>
                  <div className="text-2xl font-bold">{pesagens.length}</div>
                </div>
                <div>
                  <div className="text-xs opacity-80">Peso Médio</div>
                  <div className="text-2xl font-bold">{pesos.length ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : '-'} kg</div>
                </div>
                <div>
                  <div className="text-xs opacity-80">Peso Mín</div>
                  <div className="text-2xl font-bold">{pesos.length ? Math.min(...pesos).toFixed(1) : '-'} kg</div>
                </div>
                <div>
                  <div className="text-xs opacity-80">Peso Máx</div>
                  <div className="text-2xl font-bold">{pesos.length ? Math.max(...pesos).toFixed(1) : '-'} kg</div>
                </div>
                <div>
                  <div className="text-xs opacity-80">CE Médio</div>
                  <div className="text-2xl font-bold">{ces.length ? (ces.reduce((a, b) => a + b, 0) / ces.length).toFixed(1) : '-'} cm</div>
                </div>
                <div>
                  <div className="text-xs opacity-80">Animais Únicos</div>
                  <div className="text-2xl font-bold">{new Set(pesagens.map(p => p.animal_id || p.animal)).size}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">Por Sexo</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2">Sexo</th>
                    <th className="text-right py-2">Qtde</th>
                    <th className="text-right py-2">Média Peso</th>
                    <th className="text-right py-2">Peso Mín</th>
                    <th className="text-right py-2">Peso Máx</th>
                    <th className="text-right py-2">Média CE</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoPorSexo.map((r, i) => (
                    <tr key={i} className="border-b border-white/10">
                      <td className="py-2 font-medium text-white">{r.label}</td>
                      <td className="text-right text-white">{r.qtde}</td>
                      <td className="text-right text-white">{r.mediaPeso}{r.mediaPeso !== '-' ? ' kg' : ''}</td>
                      <td className="text-right text-white">{r.minPeso}{r.minPeso !== '-' ? ' kg' : ''}</td>
                      <td className="text-right text-white">{r.maxPeso}{r.maxPeso !== '-' ? ' kg' : ''}</td>
                      <td className="text-right text-white">{r.mediaCE}{r.mediaCE !== '-' ? ' cm' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">Por Piquete / Local</h2>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 sticky top-0 bg-slate-800">Local</th>
                      <th className="text-right py-2 sticky top-0 bg-slate-800">Fêmea</th>
                      <th className="text-right py-2 sticky top-0 bg-slate-800">Macho</th>
                      <th className="text-right py-2 sticky top-0 bg-slate-800">Total</th>
                      <th className="text-right py-2 sticky top-0 bg-slate-800">Média Peso</th>
                      <th className="text-right py-2 sticky top-0 bg-slate-800">Peso Mín</th>
                      <th className="text-right py-2 sticky top-0 bg-slate-800">Peso Máx</th>
                      <th className="text-right py-2 sticky top-0 bg-slate-800">Média CE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoPorLocal.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedLocalDados({ local: r.local, dados: r.dados })
                          setShowLocalModal(true)
                        }}
                        title="Clique para ver os animais deste local"
                      >
                        <td className="py-2 font-medium text-white">{r.local}</td>
                        <td className="text-right text-white">{r.femeas ?? 0}</td>
                        <td className="text-right text-white">{r.machos ?? 0}</td>
                        <td className="text-right text-white">{r.qtde}</td>
                        <td className="text-right text-white">{r.mediaPeso}{r.mediaPeso !== '-' ? ' kg' : ''}</td>
                        <td className="text-right text-white">{r.minPeso}{r.minPeso !== '-' ? ' kg' : ''}</td>
                        <td className="text-right text-white">{r.maxPeso}{r.maxPeso !== '-' ? ' kg' : ''}</td>
                        <td className="text-right text-white">{r.mediaCE}{r.mediaCE !== '-' ? ' cm' : '-'}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-white/30 font-semibold bg-slate-800/50">
                      <td className="py-2 text-white">Total Geral</td>
                      <td className="text-right text-white">{resumoPorLocal.reduce((s, r) => s + (r.femeas ?? 0), 0)}</td>
                      <td className="text-right text-white">{resumoPorLocal.reduce((s, r) => s + (r.machos ?? 0), 0)}</td>
                      <td className="text-right text-white">{resumoPorLocal.reduce((s, r) => s + r.qtde, 0)}</td>
                      <td colSpan={4} className="text-white">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Animais por Local */}
      {showLocalModal && selectedLocalDados && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowLocalModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Animais em {selectedLocalDados.local}
              </h2>
              <button
                onClick={() => setShowLocalModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {selectedLocalDados.dados.length} animal(is) com última pesagem neste local
            </p>
            <div className="overflow-y-auto flex-1 border border-gray-200 dark:border-gray-600 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Animal</th>
                    <th className="text-right py-2 px-3 font-medium">Sexo</th>
                    <th className="text-right py-2 px-3 font-medium">Peso (kg)</th>
                    <th className="text-right py-2 px-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLocalDados.dados.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2 px-3 font-medium">{p.animal || `ID ${p.animal_id}`}</td>
                      <td className="text-right px-3">{p.animal_sexo || '-'}</td>
                      <td className="text-right px-3">{p.peso != null && !isNaN(Number(p.peso)) ? Number(p.peso) : '-'}</td>
                      <td className="text-right px-3">{p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowLocalModal(false)}
              className="mt-4 w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
