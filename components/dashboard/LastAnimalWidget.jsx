import { useEffect, useState } from 'react'
import { Card, CardBody } from '../ui/Card'
import Button from '../ui/Button'

export default function LastAnimalWidget() {
  const [lastAnimals, setLastAnimals] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedRace, setSelectedRace] = useState('all')

  useEffect(() => {
    const fetchLastAnimals = async () => {
      try {
        const res = await fetch('/api/animals?orderBy=created_at')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data && data.data.length > 0) {
            const animalsByRace = {}
            const racas = new Set()

            data.data.forEach((animal) => {
              const raca = animal.raca || 'Sem Raça'
              racas.add(raca)

              if (!animalsByRace[raca]) {
                animalsByRace[raca] = animal
              }
            })

            animalsByRace.all = data.data[0]
            setLastAnimals(animalsByRace)
          }
        }
      } catch (err) {
        console.error('Erro ao buscar últimos animais:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLastAnimals()
  }, [])

  if (loading) {
    return (
      <Card className="mb-6 border-2 border-gray-300 dark:border-gray-700">
        <CardBody className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando últimos animais...</p>
        </CardBody>
      </Card>
    )
  }

  if (Object.keys(lastAnimals).length === 0) return null

  const currentAnimal = lastAnimals[selectedRace] || lastAnimals.all
  const racas = Object.keys(lastAnimals)
    .filter((r) => r !== 'all')
    .sort()

  return (
    <Card className="mb-6 border-2 border-yellow-400 bg-gray-900 shadow-xl transform transition-all hover:scale-[1.002]">
      <CardBody className="flex flex-col gap-3 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 border-b border-gray-700 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🆕</span>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">Últimos Animais Cadastrados</h3>
          </div>
          <div className="bg-red-600 text-white px-4 py-1 rounded-full border border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">
            <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              ⚠️ Verifique antes de cadastrar ⚠️
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-700">
          <button
            onClick={() => setSelectedRace('all')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              selectedRace === 'all' ? 'bg-yellow-500 text-gray-900 shadow-lg scale-105' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🔥 Todos
          </button>
          {racas.map((raca) => (
            <button
              key={raca}
              onClick={() => setSelectedRace(raca)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                selectedRace === raca ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {raca === 'Nelore' && '🐂'}
              {raca === 'Angus' && '🐄'}
              {raca === 'Brahman' && '🐃'}
              {raca === 'Mestiça' && '🐮'}
              {!['Nelore', 'Angus', 'Brahman', 'Mestiça'].includes(raca) && '🐄'} {raca}
            </button>
          ))}
        </div>

        {currentAnimal && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
                  <span className="text-gray-400 block text-xs font-bold uppercase tracking-widest mb-0.5">Identificação (Série / RG)</span>
                  <span className="font-black text-yellow-400 text-3xl md:text-4xl tracking-tight leading-none drop-shadow-md">
                    {currentAnimal.serie} {currentAnimal.rg}
                  </span>
                </div>

                <div className="bg-gray-900 p-2 rounded-lg border border-gray-700">
                  <span className="text-gray-400 block text-xs font-bold uppercase tracking-widest mb-0.5">Raça</span>
                  <span className="font-bold text-white text-xl">{currentAnimal.raca}</span>
                </div>

                <div className="bg-gray-900 p-2 rounded-lg border border-gray-700">
                  <span className="text-gray-400 block text-xs font-bold uppercase tracking-widest mb-0.5">Sexo</span>
                  <span className="font-bold text-white text-xl">{currentAnimal.sexo}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-col md:flex-row items-start md:items-center justify-between text-gray-400 text-xs border-t border-gray-700 pt-2 gap-2">
                <div className="flex items-center gap-2">
                  <span>📅 Cadastrado em:</span>
                  <span className="text-white font-bold text-base">
                    {new Date(currentAnimal.created_at || Date.now()).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(currentAnimal.created_at || Date.now()).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔢 ID:</span>
                  <span className="font-mono text-gray-500">{currentAnimal.id}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center md:w-40">
              <Button
                onClick={() => {
                  window.location.href = `/animals?edit=${currentAnimal.id}`
                }}
                className="w-full h-full min-h-[60px] text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 rounded-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                Ver Detalhes
              </Button>
            </div>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {racas.map((raca) => {
              const animal = lastAnimals[raca]
              return (
                <div
                  key={raca}
                  className="bg-gray-800 p-2 rounded-lg border border-gray-700 hover:border-blue-500 transition-all cursor-pointer"
                  onClick={() => setSelectedRace(raca)}
                >
                  <div className="text-xs text-gray-400 font-bold uppercase">{raca}</div>
                  <div className="text-sm text-white font-bold truncate">
                    {animal.serie}-{animal.rg}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(animal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

