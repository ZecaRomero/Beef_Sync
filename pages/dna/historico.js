import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Toast from '../../components/ui/SimpleToast'
import { 
  BeakerIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  DocumentArrowDownIcon
} from '../../components/ui/Icons'

export default function DNAHistorico() {
  const router = useRouter()
  const [envios, setEnvios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLaboratorio, setFilterLaboratorio] = useState('')

  useEffect(() => {
    loadEnvios()
  }, [])

  const loadEnvios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dna/historico')
      if (response.ok) {
        const data = await response.json()
        setEnvios(data.data || data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      Toast.error('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (envioId) => {
    if (!confirm('Tem certeza que deseja excluir este envio? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/dna/historico/${envioId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        Toast.success('Envio excluído com sucesso')
        loadEnvios() // Recarrega a lista
      } else {
        const error = await response.json()
        Toast.error(error.message || 'Erro ao excluir envio')
      }
    } catch (error) {
      console.error('Erro ao excluir envio:', error)
      Toast.error('Erro ao excluir envio')
    }
  }

  const handleGerarPDF = async (envio) => {
    if (envio.laboratorio !== 'VRGEN') {
      Toast.error('Geração de PDF disponível apenas para VRGEN')
      return
    }

    try {
      // Buscar animais do envio
      const response = await fetch(`/api/dna/historico/${envio.id}/animais`)
      if (!response.ok) {
        throw new Error('Erro ao buscar animais do envio')
      }

      const data = await response.json()
      const animaisIds = data.animais || []

      console.log('🐄 Animais encontrados:', animaisIds)
      Toast.info(`Processando ${animaisIds.length} animal(is)...`)

      if (animaisIds.length === 0) {
        Toast.error('Nenhum animal encontrado neste envio')
        return
      }

      // Buscar dados completos dos animais
      const animaisCompletos = []
      
      for (const animalId of animaisIds) {
        try {
          console.log(`🔍 Buscando animal ID: ${animalId}`)
          const animalResponse = await fetch(`/api/animals/${animalId}`)
          
          if (!animalResponse.ok) {
            console.error(`❌ Erro ao buscar animal ${animalId}: ${animalResponse.status}`)
            continue
          }
          
          const animalData = await animalResponse.json()
          console.log(`📦 Dados recebidos do animal ${animalId}:`, animalData)
          
          const animal = animalData.data || animalData.animal || animalData
          
          if (!animal || !animal.serie || !animal.rg) {
            console.error(`❌ Animal ${animalId} sem dados válidos:`, animal)
            continue
          }
          
          // Determinar raça
          let raca = animal.raca || 'NELORE'
          if (animal.serie) {
            const serie = animal.serie.toUpperCase()
            if (serie.startsWith('CJCJ') || serie.startsWith('CJCA') || serie.startsWith('CJCS')) {
              raca = 'NELORE'
            }
          }
          
          // Calcular meses
          let meses = ''
          if (animal.data_nascimento || animal.dataNascimento) {
            const hoje = new Date()
            const nascimento = new Date(animal.data_nascimento || animal.dataNascimento)
            if (!isNaN(nascimento.getTime())) {
              const diffTime = Math.abs(hoje - nascimento)
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              meses = Math.floor(diffDays / 30).toString()
            }
          }
          
          // Buscar dados do pai (usar campos diretos ou buscar pelo nome)
          let dadosPai = { 
            serie: animal.serie_pai || '', 
            rg: animal.rg_pai || '', 
            nome: animal.pai || '' 
          }
          
          if (animal.pai && (!dadosPai.serie || !dadosPai.rg)) {
            try {
              console.log(`👨 Buscando pai pelo nome: ${animal.pai}`)
              const paiResponse = await fetch(`/api/animals/buscar-por-nome?nome=${encodeURIComponent(animal.pai)}`)
              if (paiResponse.ok) {
                const paiData = await paiResponse.json()
                if (paiData.success && paiData.data) {
                  dadosPai = {
                    serie: paiData.data.serie || dadosPai.serie,
                    rg: paiData.data.rg || dadosPai.rg,
                    nome: paiData.data.nome || animal.pai
                  }
                  console.log(`✅ Pai encontrado:`, dadosPai)
                }
              }
            } catch (e) {
              console.log(`⚠️ Pai não encontrado para animal ${animalId}:`, e.message)
            }
          }
          
          // Buscar dados da mãe (usar campos diretos ou buscar pelo nome)
          let dadosMae = { 
            serie: animal.serie_mae || '', 
            rg: animal.rg_mae || '', 
            nome: animal.mae || '' 
          }
          
          if (animal.mae && (!dadosMae.serie || !dadosMae.rg)) {
            try {
              console.log(`👩 Buscando mãe pelo nome: ${animal.mae}`)
              const maeResponse = await fetch(`/api/animals/buscar-por-nome?nome=${encodeURIComponent(animal.mae)}`)
              if (maeResponse.ok) {
                const maeData = await maeResponse.json()
                if (maeData.success && maeData.data) {
                  dadosMae = {
                    serie: maeData.data.serie || dadosMae.serie,
                    rg: maeData.data.rg || dadosMae.rg,
                    nome: maeData.data.nome || animal.mae
                  }
                  console.log(`✅ Mãe encontrada:`, dadosMae)
                }
              }
            } catch (e) {
              console.log(`⚠️ Mãe não encontrada para animal ${animalId}:`, e.message)
            }
          }
          
          // Preparar dados do animal para o PDF
          const animalPDF = {
            serie: animal.serie || '',
            rg: animal.rg || '',
            raca: raca,
            sexo: animal.sexo || '',
            data_nascimento: animal.data_nascimento || animal.dataNascimento || '',
            meses: meses,
            serie_pai: dadosPai.serie || '',
            rg_pai: dadosPai.rg || '',
            nome_pai: dadosPai.nome || '',
            serie_mae: dadosMae.serie || '',
            rg_mae: dadosMae.rg || '',
            nome_mae: dadosMae.nome || '',
            tipoExame: envio.tipo_exame || ''
          }
          
          console.log(`✅ Animal ${animal.serie}-${animal.rg} preparado para PDF:`, animalPDF)
          animaisCompletos.push(animalPDF)
        } catch (error) {
          console.error(`❌ Erro ao buscar animal ${animalId}:`, error)
        }
      }

      if (animaisCompletos.length === 0) {
        Toast.error('Nenhum animal válido encontrado')
        return
      }

      // Importar gerador de PDF
      const { downloadDNAFormularioVRGEN } = await import('../../utils/dnaFormularioPDF')

      // Preparar dados
      const dadosPDF = {
        dataEnvio: new Date(envio.data_envio).toLocaleDateString('pt-BR'),
        dataColeta: new Date(envio.data_envio).toLocaleDateString('pt-BR'),
        proprietario: 'JOVELINO CARVALHO MINEIRO FILHO',
        responsavel: 'JOSE CARLOS ROMERO',
        raca: 'NELORE',
        emailAssociacao: 'abczz16@abcz.org.br idenia@abcz.org.br',
        emailFazenda: 'zeca@fazendasantanna.com.br',
        tipoExame: '',
        animais: animaisCompletos,
        observacoes: envio.observacoes || ' '
      }

      downloadDNAFormularioVRGEN(dadosPDF)
      Toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      Toast.error('Erro ao gerar PDF: ' + error.message)
    }
  }

  const enviosFiltrados = envios.filter(envio => {
    const matchSearch = !searchTerm || 
      envio.laboratorio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchLab = !filterLaboratorio || envio.laboratorio === filterLaboratorio
    
    return matchSearch && matchLab
  })

  const totalGasto = enviosFiltrados.reduce((sum, envio) => sum + (parseFloat(envio.custo_total) || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dna')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BeakerIcon className="h-8 w-8 text-indigo-600" />
            Histórico de Envios de DNA
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Visualize todos os envios realizados para análise de DNA
          </p>
        </div>
      </div>

      {/* Filtros e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total de Envios</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{enviosFiltrados.length}</p>
            </div>
            <BeakerIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Gasto</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">VRGEN</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {enviosFiltrados.filter(e => e.laboratorio === 'VRGEN').length}
              </p>
            </div>
            <BeakerIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">NEOGEN</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {enviosFiltrados.filter(e => e.laboratorio === 'NEOGEN').length}
              </p>
            </div>
            <BeakerIcon className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por laboratório ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrar por Laboratório
              </label>
              <select
                value={filterLaboratorio}
                onChange={(e) => setFilterLaboratorio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="VRGEN">VRGEN</option>
                <option value="NEOGEN">NEOGEN</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Envios */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Envios Realizados
          </h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : enviosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Nenhum envio encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Data de Envio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Laboratório
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Quantidade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Animais
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Custo Unitário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Custo Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Observações
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {enviosFiltrados.map((envio) => (
                    <tr key={envio.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(envio.data_envio).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          envio.laboratorio === 'VRGEN' 
                            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
                            : 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {envio.laboratorio}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {envio.quantidade_animais || envio.animais?.length || 0} animal(is)
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {envio.animais && envio.animais.length > 0 ? (
                          <div className="max-w-xs">
                            {envio.animais.slice(0, 3).map((animal, idx) => (
                              <span key={idx} className="inline-block mr-1 mb-1">
                                {animal.serie}-{animal.rg}
                                {idx < Math.min(2, envio.animais.length - 1) && ','}
                              </span>
                            ))}
                            {envio.animais.length > 3 && (
                              <span className="text-gray-500">
                                +{envio.animais.length - 3} mais
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        R$ {parseFloat(envio.custo_por_animal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        R$ {parseFloat(envio.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {envio.observacoes || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {envio.laboratorio === 'VRGEN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGerarPDF(envio)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Gerar PDF"
                            >
                              <DocumentArrowDownIcon className="h-5 w-5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(envio.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Excluir"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
