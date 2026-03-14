import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function DebugAnimalData() {
  const router = useRouter()
  const [animalId, setAnimalId] = useState('')
  const [animalData, setAnimalData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchAnimalData = async () => {
    if (!animalId) {
      setError('Por favor, informe o ID do animal')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/animals/${animalId}`)
      const result = await response.json()
      
      if (result.status === 'success' && result.data) {
        setAnimalData(result.data)
      } else {
        setError(result.message || 'Animal não encontrado')
        setAnimalData(null)
      }
    } catch (err) {
      setError(`Erro ao buscar animal: ${err.message}`)
      setAnimalData(null)
    } finally {
      setLoading(false)
    }
  }

  const updateAnimalFields = async () => {
    if (!animalId || !animalData) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/animals/${animalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: animalData.nome || null,
          abczg: animalData.abczg || null,
          deca: animalData.deca || null,
        })
      })

      const result = await response.json()
      
      if (result.status === 'success') {
        alert('✅ Campos atualizados com sucesso!')
        fetchAnimalData()
      } else {
        setError(result.message || 'Erro ao atualizar')
      }
    } catch (err) {
      setError(`Erro ao atualizar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔍 Verificação de Dados do Animal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Verifique e atualize os campos nome, ABCZg e DECA de um animal específico
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Buscar Animal
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              <Input
                label="ID do Animal"
                type="number"
                value={animalId}
                onChange={(e) => setAnimalId(e.target.value)}
                placeholder="Ex: 1802"
                className="flex-1"
              />
              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={fetchAnimalData}
                  disabled={loading}
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {error && (
          <Card className="mb-6 border-red-500">
            <CardBody>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardBody>
          </Card>
        )}

        {animalData && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dados do Animal (ID: {animalData.id})
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Série
                    </label>
                    <p className="text-gray-900 dark:text-white font-mono">
                      {animalData.serie || 'NULL'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      RG
                    </label>
                    <p className="text-gray-900 dark:text-white font-mono">
                      {animalData.rg || 'NULL'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome (do banco)
                    </label>
                    <Input
                      value={animalData.nome || ''}
                      onChange={(e) => setAnimalData({ ...animalData, nome: e.target.value })}
                      placeholder="Nome do animal"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Valor atual no banco: {animalData.nome ? `"${animalData.nome}"` : 'NULL'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ABCZg (do banco)
                    </label>
                    <Input
                      value={animalData.abczg || ''}
                      onChange={(e) => setAnimalData({ ...animalData, abczg: e.target.value })}
                      placeholder="ABCZg"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Valor atual no banco: {animalData.abczg ? `"${animalData.abczg}"` : 'NULL'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      DECA (do banco)
                    </label>
                    <Input
                      value={animalData.deca || ''}
                      onChange={(e) => setAnimalData({ ...animalData, deca: e.target.value })}
                      placeholder="DECA"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Valor atual no banco: {animalData.deca ? `"${animalData.deca}"` : 'NULL'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Dados completos do banco (JSON):
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(animalData, null, 2)}
                  </pre>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="primary"
                    onClick={updateAnimalFields}
                    disabled={loading}
                  >
                    {loading ? 'Atualizando...' : 'Atualizar Campos'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

