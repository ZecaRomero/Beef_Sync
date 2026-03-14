import React, { useState, useEffect, useRef } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, PaperAirplaneIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

const HEADERS = ['LOCAL', 'LOCAL 1', 'SUB_LOCAL_2', 'QUANT.', 'SEXO', 'CATEGORIA', 'RAÇA', 'ERA', 'OBSERVAÇÃO']

export default function BoletimCampo({ usuario, isAdelso }) {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [importando, setImportando] = useState(false)
  const [modalMovimentacao, setModalMovimentacao] = useState(null)
  const [locais, setLocais] = useState([])
  const [whatsappAdelso, setWhatsappAdelso] = useState(null)
  const [modalWhatsapp, setModalWhatsapp] = useState(false)
  const [whatsappInput, setWhatsappInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [modalEnviar, setModalEnviar] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (isAdelso) {
      fetch('/api/boletim-campo/adelso-whatsapp')
        .then(r => r.json())
        .then(j => { if (j.success) setWhatsappAdelso(j.whatsapp) })
        .catch(() => {})
    }
  }, [isAdelso])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boletim-campo')
      const json = await res.json()
      if (json.success) {
        setDados(json.data || [])
        const locaisUnicos = [...new Set(json.data?.map(d => d.sub_local_2 || d.local_1 || d.local).filter(Boolean))]
        setLocais(locaisUnicos)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantChange = async (reg, novoValor) => {
    const valorAntigo = reg.quant || 0
    const valorNovo = parseInt(novoValor) || 0

    if (valorNovo === valorAntigo) return

    if (valorNovo < valorAntigo) {
      setModalMovimentacao({
        tipo: 'saida',
        registro: reg,
        quantidade: valorAntigo - valorNovo,
        valorNovo,
        valorAntigo
      })
    } else {
      setModalMovimentacao({
        tipo: 'entrada',
        registro: reg,
        quantidade: valorNovo - valorAntigo,
        valorNovo,
        valorAntigo
      })
    }
  }

  const cancelarMovimentacao = () => {
    if (modalMovimentacao) {
      // Recarregar dados para reverter o valor no input
      carregarDados()
    }
    setModalMovimentacao(null)
  }

  const confirmarMovimentacao = async (destinoLocal, destinoSubLocal, motivo) => {
    if (!modalMovimentacao) return

    const { registro, tipo, quantidade } = modalMovimentacao

    try {
      await fetch('/api/boletim-campo/movimentacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boletimCampoId: registro.id,
          tipo,
          destinoLocal: destinoLocal || null,
          destinoSubLocal: destinoSubLocal || null,
          motivo,
          quantidade,
          usuario
        })
      })

      await fetch('/api/boletim-campo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: registro.id,
          quant: modalMovimentacao.valorNovo,
          usuario
        })
      })

      setModalMovimentacao(null)
      carregarDados()
    } catch (e) {
      console.error(e)
      alert('Erro ao registrar movimentação')
    }
  }

  const exportarExcel = () => {
    window.open('/api/boletim-campo/download-excel', '_blank')
  }

  const handleImport = async (e) => {
    const file = e.target?.files?.[0]
    if (!file) return

    setImportando(true)
    const formData = new FormData()
    formData.append('file', file)
    if (usuario) formData.append('usuario', usuario)

    try {
      const res = await fetch('/api/boletim-campo/import-excel', {
        method: 'POST',
        body: formData
      })
      const json = await res.json()
      if (json.success) {
        alert(`Importação concluída: ${json.inseridos} registros`)
        carregarDados()
      } else {
        alert(json.error || json.details || 'Erro na importação')
      }
    } catch (err) {
      alert('Erro ao importar')
    } finally {
      setImportando(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    )
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
    setEnviando(true)
    try {
      const res = await fetch('/api/boletim-campo/enviar-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formato })
      })
      const json = await res.json()
      if (json.success) {
        setModalEnviar(false)
        if (json.fallback) {
          const base = typeof window !== 'undefined' ? window.location.origin : ''
          const url = json.downloadUrl?.startsWith('/') ? `${base}${json.downloadUrl}` : json.downloadUrl
          window.open(url || '/api/boletim-campo/download-excel', '_blank')
          window.open(json.waLink, '_blank')
          alert('Arquivo baixado. Envie o arquivo no WhatsApp que abriu.')
        } else {
          alert('Enviado para WhatsApp!')
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {!isAdelso ? (
          <>
            <button
              onClick={exportarExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Exportar Excel
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importando}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              {importando ? 'Importando...' : 'Importar Excel'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
          </>
        ) : (
          <>
            {!whatsappAdelso ? (
              <button
                onClick={() => setModalWhatsapp(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Cog6ToothIcon className="w-5 h-5" />
                Cadastrar WhatsApp
              </button>
            ) : (
              <>
                <button
                  onClick={() => setModalEnviar(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Enviar
                </button>
                <button
                  onClick={() => setModalWhatsapp(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  WhatsApp: {whatsappAdelso.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal cadastrar WhatsApp */}
      {modalWhatsapp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cadastrar WhatsApp</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Informe seu número uma única vez. Os relatórios serão enviados sempre para este WhatsApp.
            </p>
            <input
              type="tel"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setModalWhatsapp(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancelar</button>
              <button onClick={salvarWhatsapp} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal escolher formato e enviar */}
      {modalEnviar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Enviar para WhatsApp</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Escolha o formato do arquivo:
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleEnviar('excel')}
                disabled={enviando}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Excel'}
              </button>
              <button
                onClick={() => handleEnviar('pdf')}
                disabled={enviando}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'PDF'}
              </button>
            </div>
            <button onClick={() => setModalEnviar(false)} className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-orange-100 dark:bg-orange-900/30">
              {HEADERS.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 text-gray-900 dark:text-white">{row.local}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.local_1 || '-'}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.sub_local_2 || '-'}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    defaultValue={row.quant || 0}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value)
                      if (v !== (row.quant || 0)) {
                        handleQuantChange(row, v)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur()
                    }}
                    className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </td>
                <td className="px-3 py-2">{row.sexo || '-'}</td>
                <td className="px-3 py-2">{row.categoria || '-'}</td>
                <td className="px-3 py-2">{row.raca || '-'}</td>
                <td className="px-3 py-2">{row.era || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={row.observacao}>{row.observacao || '-'}</td>
              </tr>
            ))}
            {dados.length > 0 && (
              <tr className="bg-green-100 dark:bg-green-900/30 border-t-2 border-green-500 font-bold">
                <td colSpan={3} className="px-3 py-3 text-gray-900 dark:text-white">TOTAL GERAL</td>
                <td className="px-3 py-3 text-center text-green-700 dark:text-green-400">
                  {dados.reduce((s, r) => s + (parseInt(r.quant) || 0), 0)}
                </td>
                <td colSpan={5} className="px-3 py-3 text-gray-600 dark:text-gray-400">-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dados.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          {isAdelso ? 'Nenhum registro no momento.' : 'Nenhum registro. Importe um arquivo Excel ou adicione manualmente.'}
        </p>
      )}

      {/* Modal Saída */}
      {modalMovimentacao?.tipo === 'saida' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Saída de animais</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {modalMovimentacao.registro.local} / {modalMovimentacao.registro.sub_local_2 || modalMovimentacao.registro.local_1 || '-'} — Quantidade: {modalMovimentacao.quantidade}
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Para onde vão os animais?</p>
            <div className="space-y-2">
              <button
                onClick={() => confirmarMovimentacao(null, null, 'piquete')}
                className="w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Entrar em outro local/piquete
              </button>
              <button
                onClick={() => confirmarMovimentacao(null, null, 'morte')}
                className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Morte
              </button>
              <button
                onClick={() => confirmarMovimentacao(null, null, 'venda')}
                className="w-full py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Venda
              </button>
              <button
                onClick={cancelarMovimentacao}
                className="w-full py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Entrada */}
      {modalMovimentacao?.tipo === 'entrada' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Entrada de animais</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {modalMovimentacao.registro.local} / {modalMovimentacao.registro.sub_local_2 || modalMovimentacao.registro.local_1 || '-'} — Quantidade: +{modalMovimentacao.quantidade}
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qual a origem?</p>
            <div className="space-y-2">
              <button
                onClick={() => confirmarMovimentacao(null, null, 'nascimento')}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Nascimento
              </button>
              <button
                onClick={() => confirmarMovimentacao(null, null, 'entrada_externa')}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Entrada de fora
              </button>
              <button
                onClick={cancelarMovimentacao}
                className="w-full py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
