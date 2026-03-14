import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ModernLayout from '../../components/layout/ModernLayout'
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NovaFazenda() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/boletim-defesa/fazendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('✅ Fazenda cadastrada com sucesso!')
        router.push('/boletim-defesa')
      } else {
        const error = await response.json()
        alert(`❌ Erro: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao cadastrar fazenda:', error)
      alert('❌ Erro ao cadastrar fazenda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Nova Fazenda - Boletim Defesa</title>
      </Head>

      <ModernLayout
        title="Nova Fazenda"
        subtitle="Cadastrar fazenda para boletim de defesa"
        icon={<PlusIcon className="w-8 h-8 text-white" />}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Fazenda
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: FAZENDA SANT ANNA - RANCHARIA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  required
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: CNPJ 44.017.440/0010-18"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/boletim-defesa')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      Cadastrar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModernLayout>
    </>
  )
}
