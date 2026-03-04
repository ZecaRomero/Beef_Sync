import React, { useState } from 'react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  DatabaseIcon
} from '../components/ui/Icons'

export default function MigrateComplete() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [localStorageData, setLocalStorageData] = useState(null)
  const [step, setStep] = useState(1) // 1: Verificar, 2: Migrar, 3: Limpar

  // Verificar dados no localStorage
  const checkLocalStorageData = async () => {    se
tLoading(true)
    try {
      // Verificar se há dados no localStorage
      const animalsData = localStorage.getItem('animals')
      const costsData = localStorage.getItem('costs')
      const birthsData = localStorage.getItem('births')
      const deathsData = localStorage.getItem('deaths')
      
      const data = {
        animals: animalsData ? JSON.parse(animalsData) : [],
        costs: costsData ? JSON.parse(costsData) : [],
        births: birthsData ? JSON.parse(birthsData) : [],
        deaths: deathsData ? JSON.parse(deathsData) : []
      }
      
      setLocalStorageData(data)
      setStep(2)
    } catch (error) {
      console.error('Erro ao verificar localStorage:', error)
      alert('Erro ao verificar dados locais')
    } finally {
      setLoading(false)
    }
  }

  // Migrar dados para PostgreSQL
  const migrateData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migrate-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localStorageData)
      })
      
      const result = await response.json()
      setResults(result)
      setStep(3)
    } catch (error) {
      console.error('Erro na migração:', error)
      alert('Erro durante a migração')
    } finally {
      setLoading(false)
    }
  }

  // Limpar localStorage
  const clearLocalStorage = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('animals')
      localStorage.removeItem('costs')
      localStorage.removeItem('births')
      localStorage.removeItem('deaths')
      alert('Dados locais limpos com sucesso!')
      setStep(1)
      setLocalStorageData(null)
      setResults(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Migração Completa para PostgreSQL
          </h1>
          <p className="text-gray-600">
            Migre todos os seus dados do localStorage para o banco PostgreSQL
          </p>
        </div>

        {/* Passo 1: Verificar */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <DatabaseIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Verificar Dados Locais</h2>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 mb-4">
                Primeiro, vamos verificar quais dados estão armazenados localmente no seu navegador.
              </p>
              <Button
                onClick={checkLocalStorageData}
                loading={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Verificar Dados
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Passo 2: Migrar */}
        {step === 2 && localStorageData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Dados Encontrados</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {localStorageData.animals.length}
                    </div>
                    <div className="text-sm text-gray-600">Animais</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {localStorageData.costs.length}
                    </div>
                    <div className="text-sm text-gray-600">Custos</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {localStorageData.births.length}
                    </div>
                    <div className="text-sm text-gray-600">Nascimentos</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {localStorageData.deaths.length}
                    </div>
                    <div className="text-sm text-gray-600">Mortes</div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={migrateData}
                    loading={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Migrar para PostgreSQL
                  </Button>
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                  >
                    Voltar
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Passo 3: Resultados */}
        {step === 3 && results && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold">Migração Concluída</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {results.animals && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span>Animais migrados:</span>
                      <span className="font-semibold text-blue-600">
                        {results.animals.success}/{results.animals.total}
                      </span>
                    </div>
                  )}
                  
                  {results.costs && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span>Custos migrados:</span>
                      <span className="font-semibold text-green-600">
                        {results.costs.success}/{results.costs.total}
                      </span>
                    </div>
                  )}
                  
                  {results.births && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span>Nascimentos migrados:</span>
                      <span className="font-semibold text-purple-600">
                        {results.births.success}/{results.births.total}
                      </span>
                    </div>
                  )}
                  
                  {results.deaths && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span>Mortes migradas:</span>
                      <span className="font-semibold text-red-600">
                        {results.deaths.success}/{results.deaths.total}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Importante</h4>
                      <p className="text-yellow-700 text-sm">
                        Agora que os dados foram migrados com sucesso, você pode limpar os dados locais 
                        para liberar espaço no navegador.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={clearLocalStorage}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Limpar Dados Locais
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Ir para Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}