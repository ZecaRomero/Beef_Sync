import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { 
  DocumentTextIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import Button from '../components/ui/Button'
import { Card, CardHeader, CardBody } from '../components/ui/Card'

export default function ContabilidadeSimple() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    }
  })
  const [stats, setStats] = useState({
    totalAnimals: 0,
    nfsEntradas: 0,
    nfsSaidas: 0,
    movimentacoes: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Carregar animais
      let totalAnimals = 0
      try {
        const animalsResponse = await fetch('/api/animals')
        if (animalsResponse.ok) {
          const result = await animalsResponse.json()
          const animals = result.success ? result.data : result
          totalAnimals = Array.isArray(animals) ? animals.length : 0
        }
      } catch (error) {
        console.error('Erro ao carregar animais:', error)
        const animals = JSON.parse(localStorage.getItem('animals') || '[]')
        totalAnimals = animals.length
      }

      // Carregar notas fiscais
      let nfsEntradas = 0
      let nfsSaidas = 0
      
      try {
        const nfsResponse = await fetch('/api/notas-fiscais')
        if (nfsResponse.ok) {
          const result = await nfsResponse.json()
          const nfs = result.success ? result.data : result
          const nfsArray = Array.isArray(nfs) ? nfs : []
          
          nfsEntradas = nfsArray.filter(nf => nf.tipo === 'entrada').length
          nfsSaidas = nfsArray.filter(nf => nf.tipo === 'saida').length
        }
      } catch (error) {
        console.error('Erro ao carregar NFs:', error)
      }
      
      setStats({
        totalAnimals,
        nfsEntradas,
        nfsSaidas,
        movimentacoes: nfsEntradas + nfsSaidas
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const downloadBoletimGado = async () => {
    try {
      setLoading(true)
      
      // Carregar dados dos animais
      let animalsData = []
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          const result = await response.json()
          animalsData = result.success ? result.data : result
        } else {
          throw new Error('API não disponível')
        }
      } catch (apiError) {
        console.error('Erro ao conectar com API, usando localStorage:', apiError)
        animalsData = JSON.parse(localStorage.getItem('animals') || '[]')
      }
      
      const response = await fetch('/api/contabilidade/boletim-gado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          period,
          animalsData,
          sendToAccounting: false
        })
      })

      if (!response.ok) throw new Error('Erro ao gerar boletim')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `boletim-gado-contabilidade-${period.startDate}-${period.endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert('✅ Boletim de Gado baixado com sucesso!')
    } catch (error) {
      console.error('Erro:', error)
      alert('❌ Erro: Não foi possível gerar o boletim de gado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            📊 Contabilidade - Beef Sync
          </h1>
          <p className="text-blue-100">Relatórios contábeis e fiscais para seu rebanho</p>
        </div>

        {/* Período */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2" />
              Período do Relatório
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={period.startDate}
                  onChange={(e) => setPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={period.endDate}
                  onChange={(e) => setPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardBody className="text-center">
              <UserGroupIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAnimals}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total de Animais</div>
            </CardBody>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardBody className="text-center">
              <DocumentArrowDownIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.nfsEntradas}
              </div>
              <div className="text-gray-600 dark:text-gray-400">NFs Entrada</div>
            </CardBody>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardBody className="text-center">
              <DocumentTextIcon className="h-12 w-12 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.nfsSaidas}
              </div>
              <div className="text-gray-600 dark:text-gray-400">NFs Saída</div>
            </CardBody>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardBody className="text-center">
              <ChartBarIcon className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.movimentacoes}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Movimentações</div>
            </CardBody>
          </Card>
        </div>

        {/* Ações */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Relatórios Disponíveis
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={downloadBoletimGado}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                {loading ? 'Gerando...' : 'Boletim de Gado'}
              </Button>

              <Button
                onClick={() => router.push('/notas-fiscais')}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Notas Fiscais
              </Button>

              <Button
                onClick={() => router.push('/boletim-contabil')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Boletim Contábil
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Navegação */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            ← Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}