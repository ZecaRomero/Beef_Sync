/**
 * Página central de Importações - todos os tipos em um só lugar
 * Evita poluição das páginas específicas
 */
import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import UniversalExcelImporter from '../components/UniversalExcelImporter'
import ImportGeneticaModal from '../components/animals/ImportGeneticaModal'
import ImportarObservacoesAnimais from '../components/ImportarObservacoesAnimais'
import ImportarSerieRgNome from '../components/ImportarSerieRgNome'
import ImportarSerieRgMae from '../components/ImportarSerieRgMae'
import ImportarExcelPiquetes from '../components/ImportarExcelPiquetes'
import ImportarTextoPiquetes from '../components/ImportarTextoPiquetes'
import ImportarTextoPesagens from '../components/ImportarTextoPesagens'
import ImportarBaixas from '../components/ImportarBaixas'
import {
  DocumentArrowUpIcon,
  BeakerIcon,
  HeartIcon,
  MapPinIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  CubeIcon,
  ScaleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const IMPORT_TIPOS = [
  {
    id: 'excel-universal',
    titulo: 'Excel Universal',
    descricao: 'Animais, IA, FIV, Nascimentos, Diagnóstico de Gestação, Notas Fiscais',
    icon: DocumentArrowUpIcon,
    color: 'blue',
    tipos: ['Animais', 'IA', 'FIV', 'Nascimentos', 'DG', 'Notas Fiscais', 'Baixas']
  },
  {
    id: 'genetica',
    titulo: 'Genética',
    descricao: 'iABCZ, DECA, IQG, Pt IQG, Situação ABCZ',
    icon: BeakerIcon,
    color: 'emerald',
    tipos: ['iABCZ', 'DECA', 'IQG', 'Pt IQG']
  },
  {
    id: 'localizacao',
    titulo: 'Localização',
    descricao: 'Onde estão os animais (piquetes)',
    icon: MapPinIcon,
    color: 'purple',
    href: '/movimentacao/localizacao',
    tipos: ['Excel', 'Texto']
  },
  {
    id: 'piquetes',
    titulo: 'Piquetes',
    descricao: 'Dados de animais e piquetes',
    icon: CubeIcon,
    color: 'amber',
    tipos: ['Excel', 'Texto']
  },
  {
    id: 'obitos',
    titulo: 'Óbitos',
    descricao: 'Registro de mortes do rebanho',
    icon: ClipboardDocumentListIcon,
    color: 'gray',
    href: '/movimentacoes/mortes',
    tipos: ['Excel']
  },
  {
    id: 'te',
    titulo: 'Transferência de Embriões (TE)',
    descricao: 'Importar TEs do Excel',
    icon: HeartIcon,
    color: 'pink',
    href: '/reproducao/transferencia-embrioes',
    tipos: ['Excel']
  },
  {
    id: 'observacoes',
    titulo: 'Observações',
    descricao: 'Observações por animal (Série, RG, Observação)',
    icon: ClipboardDocumentListIcon,
    color: 'cyan',
    tipos: ['Texto']
  },
  {
    id: 'pesagens',
    titulo: 'Pesagens',
    descricao: 'Peso e CE por animal',
    icon: ScaleIcon,
    color: 'lime',
    tipos: ['Texto']
  },
  {
    id: 'receptoras-dg',
    titulo: 'Receptoras DG',
    descricao: 'Importar DG por texto',
    icon: UserGroupIcon,
    color: 'indigo',
    href: '/reproducao/receptoras-dg',
    tipos: ['Texto']
  }
]

const CORES = {
  blue: 'from-blue-500 to-blue-600',
  emerald: 'from-emerald-500 to-emerald-600',
  purple: 'from-purple-500 to-purple-600',
  amber: 'from-amber-500 to-amber-600',
  gray: 'from-gray-500 to-gray-600',
  pink: 'from-pink-500 to-pink-600',
  cyan: 'from-cyan-500 to-cyan-600',
  lime: 'from-lime-500 to-lime-600',
  indigo: 'from-indigo-500 to-indigo-600'
}

const CORES_BG = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  gray: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700',
  pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
  cyan: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
  lime: 'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
}

export default function ImportacoesPage() {
  const [showExcelUniversal, setShowExcelUniversal] = useState(false)
  const [showGenetica, setShowGenetica] = useState(false)
  const [modoPiquetes, setModoPiquetes] = useState('texto')
  const [importSuccess, setImportSuccess] = useState(null)
  const [animais, setAnimais] = useState([])

  useEffect(() => {
    fetch('/api/animals')
      .then((r) => r.json())
      .then((d) => setAnimais(d.animals || []))
      .catch(() => {})
  }, [])

  const handleImportSuccess = (type, count) => {
    setImportSuccess({ type, count })
    setTimeout(() => setImportSuccess(null), 5000)
  }

  return (
    <>
      <Head>
        <title>Importações | Beef Sync</title>
      </Head>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <DocumentArrowUpIcon className="h-8 w-8" />
            </div>
            Central de Importações
          </h1>
          <p className="text-gray-700 dark:text-gray-200 mt-2 font-medium">
            Todas as importações em um só lugar. Escolha o tipo e importe os dados.
          </p>
        </div>

        {/* Mensagem de sucesso */}
        {importSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200">
              ✅ {importSuccess.count} registros de {importSuccess.type} importados com sucesso!
            </span>
          </div>
        )}

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {IMPORT_TIPOS.map((item) => {
            const Icon = item.icon
            const color = CORES[item.color] || CORES.blue
            const bgColor = CORES_BG[item.color] || CORES_BG.blue

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`block rounded-xl border p-5 transition-all hover:shadow-lg hover:scale-[1.02] ${bgColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base">{item.titulo}</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 font-medium">{item.descricao}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tipos.map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded bg-white/70 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              )
            }

            if (item.id === 'excel-universal') {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setShowExcelUniversal(true)}
                  className={`text-left rounded-xl border p-5 transition-all hover:shadow-lg hover:scale-[1.02] ${bgColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base">{item.titulo}</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 font-medium">{item.descricao}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tipos.map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded bg-white/70 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            }

            if (item.id === 'genetica') {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setShowGenetica(true)}
                  className={`text-left rounded-xl border p-5 transition-all hover:shadow-lg hover:scale-[1.02] ${bgColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base">{item.titulo}</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 font-medium">{item.descricao}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tipos.map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded bg-white/70 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            }

            return null
          })}
        </div>

        {/* Seções inline: Piquetes, Observações, Pesagens */}
        <div className="mt-10 space-y-8">
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-b border-gray-200 dark:border-gray-700">
              <CubeIcon className="h-6 w-6 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Piquetes</h2>
            </div>
            <div className="p-4">
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setModoPiquetes('texto')}
                  className={`px-4 py-2 rounded-lg font-medium ${modoPiquetes === 'texto' ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  📝 Texto
                </button>
                <button
                  type="button"
                  onClick={() => setModoPiquetes('excel')}
                  className={`px-4 py-2 rounded-lg font-medium ${modoPiquetes === 'excel' ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  📊 Excel
                </button>
              </div>
              {modoPiquetes === 'texto' ? (
                <ImportarTextoPiquetes onImportComplete={() => {}} />
              ) : (
                <ImportarExcelPiquetes onImportComplete={() => {}} />
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-b border-gray-200 dark:border-gray-700">
              <DocumentArrowUpIcon className="h-6 w-6 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Corrigir Série, RG e Nome</h2>
            </div>
            <div className="p-4">
              <ImportarSerieRgNome onImportComplete={(count) => handleImportSuccess('Correção Série/RG/Nome', count)} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border-b border-gray-200 dark:border-gray-700">
              <UserGroupIcon className="h-6 w-6 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Série e RG da Mãe</h2>
            </div>
            <div className="p-4">
              <ImportarSerieRgMae onImportComplete={(count) => handleImportSuccess('Série/RG da Mãe', count)} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-500/10 to-red-600/10 border-b border-gray-200 dark:border-gray-700">
              <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Corrigir Pai/Mãe = Nome</h2>
            </div>
            <div className="p-4">
              <CorrigirPaiMaeNome />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border-b border-gray-200 dark:border-gray-700">
              <ClipboardDocumentListIcon className="h-6 w-6 text-cyan-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Observações</h2>
            </div>
            <div className="p-4">
              <ImportarObservacoesAnimais />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-lime-500/10 to-lime-600/10 border-b border-gray-200 dark:border-gray-700">
              <ScaleIcon className="h-6 w-6 text-lime-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pesagens</h2>
            </div>
            <div className="p-4">
              <ImportarTextoPesagens
                animais={animais}
                onImportComplete={() => handleImportSuccess('Pesagens', 0)}
                onRefreshAnimais={() => fetch('/api/animals').then((r) => r.json()).then((d) => setAnimais(d.animals || [])).catch(() => {})}
              />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-b border-gray-200 dark:border-gray-700">
              <DocumentArrowUpIcon className="h-6 w-6 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Baixas (MORTE/BAIXA e VENDA)</h2>
            </div>
            <div className="p-4">
              <ImportarBaixas onImportComplete={(count) => handleImportSuccess('Baixas', count)} />
            </div>
          </section>

          {/* Histórico de Movimentações */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 border-b border-gray-200 dark:border-gray-700">
              <ArrowPathIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Movimentações</h2>
            </div>
            <div className="p-4">
              <HistoricoMovimentacoes />
            </div>
          </section>
        </div>
      </div>

      {/* Modais */}
      <UniversalExcelImporter
        isOpen={showExcelUniversal}
        onClose={() => setShowExcelUniversal(false)}
        onImportSuccess={handleImportSuccess}
      />
      <ImportGeneticaModal
        isOpen={showGenetica}
        onClose={() => setShowGenetica(false)}
        onSuccess={() => handleImportSuccess('Genética', 0)}
      />
    </>
  )
}

// Componente para corrigir animais com pai/mae = nome (bug de importação)
function CorrigirPaiMaeNome() {
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [corrigindo, setCorrigindo] = useState(false)
  const [msg, setMsg] = useState(null)

  const verificar = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/animals/corrigir-pai-mae-nome')
      const data = await res.json()
      if (data.success) setTotal(data.total)
    } catch (e) {
      setMsg('Erro ao verificar')
    } finally {
      setLoading(false)
    }
  }

  const corrigir = async () => {
    if (!confirm(`Corrigir ${total} animal(is) com pai/mãe incorretos? Os campos serão zerados.`)) return
    setCorrigindo(true)
    setMsg(null)
    try {
      const res = await fetch('/api/animals/corrigir-pai-mae-nome', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMsg(`✅ ${data.corrigidos} corrigido(s)`)
        setTotal(0)
      } else {
        setMsg(data.message || 'Erro')
      }
    } catch (e) {
      setMsg('Erro ao corrigir')
    } finally {
      setCorrigindo(false)
    }
  }

  useEffect(() => { verificar() }, [])

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Animais onde pai ou mãe estão preenchidos com o nome do próprio animal (bug de importação).
      </p>
      {loading ? (
        <p className="text-sm">Verificando...</p>
      ) : (
        <>
          <p className="text-sm font-semibold">
            {total != null ? `${total} animal(is) afetado(s)` : '—'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={verificar}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={corrigir}
              disabled={corrigindo || total === 0}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
            >
              {corrigindo ? 'Corrigindo...' : 'Corrigir todos'}
            </button>
          </div>
        </>
      )}
      {msg && <p className="text-sm text-green-600 dark:text-green-400">{msg}</p>}
    </div>
  )
}

// Componente de Histórico de Movimentações
function HistoricoMovimentacoes() {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState(null)

  useEffect(() => {
    carregarHistorico()
  }, [])

  const carregarHistorico = async () => {
    try {
      const res = await fetch('/api/importacoes/historico')
      const data = await res.json()
      setHistorico(data.historico || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const excluirRegistro = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este registro do histórico?')) {
      return
    }

    setExcluindo(id)
    try {
      const res = await fetch(`/api/importacoes/historico/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setHistorico(historico.filter(item => item.id !== id))
      } else {
        alert('Erro ao excluir registro')
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir registro')
    } finally {
      setExcluindo(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando histórico...</span>
      </div>
    )
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhuma movimentação registrada ainda</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Data/Hora</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Registros</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Usuário</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {new Date(item.data).toLocaleString('pt-BR')}
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                  {item.tipo}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{item.descricao}</td>
              <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                {item.registros}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.usuario || 'Sistema'}</td>
              <td className="py-3 px-4 text-center">
                {item.status === 'sucesso' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto" />
                ) : (
                  <span className="text-red-600">❌</span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  type="button"
                  onClick={() => excluirRegistro(item.id)}
                  disabled={excluindo === item.id}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  title="Excluir registro"
                >
                  {excluindo === item.id ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    '🗑️'
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
