import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Card, CardBody } from '../ui/Card'

export default function ReceptorasNF2141Widget() {
  const router = useRouter()
  const [receptoras, setReceptoras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notas-fiscais/receptoras?numero=2141')
      .then((r) => (r.ok ? r.json() : { receptoras: [] }))
      .then((data) => setReceptoras(data.receptoras || []))
      .catch(() => setReceptoras([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || receptoras.length === 0) return null

  return (
    <Card
      className="mb-6 border-2 border-pink-300 dark:border-pink-700 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onClick={() => router.push('/notas-fiscais?busca=2141')}
    >
      <CardBody className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-pink-800 dark:text-pink-200 flex items-center gap-2">
                <span>🤰</span> Receptoras NF 2141
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {receptoras.length} receptoras chegaram — clique no card para conferir a atividade
              </p>
            </div>
            <div className="text-pink-500 text-2xl">➔</div>
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-pink-200 dark:border-pink-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 dark:bg-pink-900/40 rounded-full p-3">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-lg font-bold text-pink-800 dark:text-pink-200">Cadastradas no Sistema</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">{receptoras.length}</p>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

