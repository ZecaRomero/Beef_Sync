import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function RegistrarBaixaPage() {
  const router = useRouter()
  const { serie, rg } = router.query
  const [isMobile, setIsMobile] = useState(null)
  const [form, setForm] = useState({
    tipo: 'MORTE/BAIXA',
    data_baixa: '',
    causa: 'Abate',
    valor: '',
    comprador: '',
    numero_nf: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
  }, [])

  useEffect(() => {
    if (serie && rg && !form.data_baixa) {
      const hoje = new Date().toISOString().slice(0, 10)
      setForm(f => ({ ...f, data_baixa: hoje }))
    }
  }, [serie, rg])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/animals/registrar-baixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serie: (serie || form.serie || '').toString().trim(),
          rg: (rg || form.rg || '').toString().trim(),
          tipo: form.tipo,
          data_baixa: form.data_baixa,
          causa: form.tipo === 'MORTE/BAIXA' ? (form.causa || 'Abate') : null,
          valor: form.tipo === 'VENDA' && form.valor ? parseFloat(String(form.valor).replace(',', '.')) : null,
          comprador: form.tipo === 'VENDA' ? form.comprador || null : null,
          numero_nf: form.tipo === 'VENDA' ? form.numero_nf || null : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data)
        const s = serie || form.serie
        const r = rg || form.rg
        setTimeout(() => router.push(`/consulta-animal/${s}-${r}`), 1500)
      } else {
        setError(data.error || 'Erro ao registrar')
      }
    } catch (err) {
      setError(err.message || 'Erro ao registrar')
    } finally {
      setLoading(false)
    }
  }

  const ident = `${serie || ''} ${rg || ''}`.trim() || 'Animal'

  // Bloquear registro de baixa no mobile - somente desktop
  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <span className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
      </div>
    )
  }
  if (isMobile) {
    return (
      <>
        <Head>
          <title>Registrar baixa | Beef-Sync</title>
        </Head>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
          <p className="text-amber-600 dark:text-amber-400 font-semibold text-center mb-4">
            Registrar baixa não está disponível no celular.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">
            Use um computador para registrar abate, morte ou venda.
          </p>
          <Link
            href={serie && rg ? `/consulta-animal/${serie}-${rg}` : '/a'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Voltar
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Registrar baixa (abate/morte/venda) | Beef-Sync</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-md mx-auto">
          <Link
            href={serie && rg ? `/consulta-animal/${serie}-${rg}` : '/'}
            className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Registrar baixa
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {serie && rg ? `Animal: ${ident}` : 'Preencha a identificação e os dados da baixa.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(!serie || !rg) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Série</label>
                    <input
                      type="text"
                      value={form.serie || ''}
                      onChange={e => setForm(f => ({ ...f, serie: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: CJCJ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RG</label>
                    <input
                      type="text"
                      value={form.rg || ''}
                      onChange={e => setForm(f => ({ ...f, rg: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: 13604"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="MORTE/BAIXA">Abate / Morte</option>
                  <option value="VENDA">Venda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input
                  type="date"
                  value={form.data_baixa}
                  onChange={e => setForm(f => ({ ...f, data_baixa: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {form.tipo === 'MORTE/BAIXA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Causa</label>
                  <input
                    type="text"
                    value={form.causa}
                    onChange={e => setForm(f => ({ ...f, causa: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Abate"
                  />
                </div>
              )}

              {form.tipo === 'VENDA' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                    <input
                      type="text"
                      value={form.valor}
                      onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: 28800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprador</label>
                    <input
                      type="text"
                      value={form.comprador}
                      onChange={e => setForm(f => ({ ...f, comprador: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nota Fiscal</label>
                    <input
                      type="text"
                      value={form.numero_nf}
                      onChange={e => setForm(f => ({ ...f, numero_nf: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              {result && <p className="text-sm text-green-600 dark:text-green-400">✅ {result.message}</p>}

              <button
                type="submit"
                disabled={loading || !(serie || form.serie) || !(rg || form.rg) || !form.data_baixa}
                className="w-full px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrando...' : 'Registrar baixa'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
