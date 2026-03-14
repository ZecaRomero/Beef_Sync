import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function RegistrarVendaPage() {
  const router = useRouter()
  const { serie, rg } = router.query
  const [form, setForm] = useState({
    data_venda: new Date().toISOString().slice(0, 10),
    valor: '',
    comprador: '',
    numero_nf: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (serie && rg) {
      setForm(f => ({ ...f }))
    }
  }, [serie, rg])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/animals/registrar-venda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serie: serie || form.serie,
          rg: rg || form.rg,
          data_venda: form.data_venda,
          valor: form.valor ? parseFloat(String(form.valor).replace(',', '.')) : null,
          comprador: form.comprador || null,
          numero_nf: form.numero_nf || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data)
        setTimeout(() => router.push(`/consulta-animal/${serie || form.serie}-${rg || form.rg}`), 1500)
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

  return (
    <>
      <Head>
        <title>Registrar venda | Beef-Sync</title>
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
              Registrar venda
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {serie && rg ? `Animal: ${ident}` : 'Preencha a identificação e os dados da venda.'}
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
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RG</label>
                    <input
                      type="text"
                      value={form.rg || ''}
                      onChange={e => setForm(f => ({ ...f, rg: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: 16013"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da venda *</label>
                <input
                  type="date"
                  value={form.data_venda}
                  onChange={e => setForm(f => ({ ...f, data_venda: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$) *</label>
                <input
                  type="text"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 3500,00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprador</label>
                <input
                  type="text"
                  value={form.comprador}
                  onChange={e => setForm(f => ({ ...f, comprador: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nome do comprador"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nota Fiscal</label>
                <input
                  type="text"
                  value={form.numero_nf}
                  onChange={e => setForm(f => ({ ...f, numero_nf: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Número da NF"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
              {result && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
                  ✅ {result.message} Redirecionando...
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Registrando...' : 'Registrar venda'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
