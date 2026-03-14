import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Toast from '../../components/ui/SimpleToast'
import { 
  BeakerIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PencilIcon,
  CheckIcon,
  DocumentArrowDownIcon
} from '../../components/ui/Icons'
import Modal from '../../components/ui/Modal'

export default function DNAPage() {
  const router = useRouter()
  const [animais, setAnimais] = useState([])
  const [animaisFiltrados, setAnimaisFiltrados] = useState([])
  const [selectedAnimals, setSelectedAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showLaboratorioModal, setShowLaboratorioModal] = useState(false)
  const [laboratorio, setLaboratorio] = useState('')
  const [dataEnvio, setDataEnvio] = useState(new Date().toISOString().split('T')[0])
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [custoVrgen, setCustoVrgen] = useState(50.00)
  const [custoNeogen, setCustoNeogen] = useState(80.00)
  const [editandoCustos, setEditandoCustos] = useState(false)
  const [proprietario, setProprietario] = useState('JOVELINO CARVALHO MINEIRO FILHO')
  const [responsavel, setResponsavel] = useState('JOSE CARLOS ROMERO')
  const [emailAssociacao, setEmailAssociacao] = useState('abczz16@abcz.org.br idenia@abcz.org.br')
  const [emailFazenda, setEmailFazenda] = useState('zeca@fazendasantanna.com.br')
  const [tipoExame, setTipoExame] = useState('')

  useEffect(() => {
    loadAnimais()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = animais.filter(animal => {
        const search = searchTerm.toLowerCase()
        return (
          animal.serie?.toLowerCase().includes(search) ||
          animal.rg?.toLowerCase().includes(search) ||
          animal.nome?.toLowerCase().includes(search) ||
          animal.raca?.toLowerCase().includes(search)
        )
      })
      setAnimaisFiltrados(filtered)
    } else {
      setAnimaisFiltrados(animais)
    }
  }, [searchTerm, animais])

  const loadAnimais = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/animals')
      if (response.ok) {
        const data = await response.json()
        const animaisList = data.data || data.animais || data || []
        
        // Filtrar apenas animais com IDs válidos
        const animaisValidos = animaisList.filter(animal => {
          const id = parseInt(animal.id, 10)
          if (isNaN(id)) {
            console.warn(`⚠️ Animal sem ID válido ignorado:`, animal)
            return false
          }
          return true
        })
        
        console.log(`✅ Carregados ${animaisValidos.length} animais válidos de ${animaisList.length} totais`)
        
        setAnimais(animaisValidos)
        setAnimaisFiltrados(animaisValidos)
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      Toast.error('Erro ao carregar animais')
    } finally {
      setLoading(false)
    }
  }

  const toggleAnimalSelection = (animalId) => {
    // Validar ID
    const id = parseInt(animalId, 10)
    if (isNaN(id)) {
      console.error(`❌ Tentativa de selecionar animal com ID inválido: ${animalId}`)
      Toast.error(`ID de animal inválido: ${animalId}`)
      return
    }
    
    setSelectedAnimals(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectedAnimals.length === animaisFiltrados.length) {
      setSelectedAnimals([])
    } else {
      setSelectedAnimals(animaisFiltrados.map(a => a.id))
    }
  }

  const handleEnviarParaLaboratorio = () => {
    if (selectedAnimals.length === 0) {
      Toast.error('Selecione pelo menos um animal')
      return
    }
    setShowLaboratorioModal(true)
  }

  const handleConfirmarEnvio = async () => {
    if (!laboratorio) {
      Toast.error('Selecione um laboratório')
      return
    }

    try {
      setSaving(true)
      
      const custoPorAnimal = laboratorio === 'VRGEN' ? custoVrgen : custoNeogen
      const custoTotal = selectedAnimals.length * custoPorAnimal

      const response = await fetch('/api/dna/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animais_ids: selectedAnimals,
          laboratorio,
          data_envio: dataEnvio,
          custo_por_animal: custoPorAnimal,
          custo_total: custoTotal,
          observacoes,
          tipo_exame: tipoExame
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Verificar se há animais não encontrados
        if (result.data?.animais_nao_encontrados > 0) {
          Toast.error(
            `${result.data.animais_atualizados} animal(is) enviado(s), mas ${result.data.animais_nao_encontrados} não foram encontrados no banco de dados. IDs: ${result.data.animais_nao_encontrados_ids?.join(', ')}`
          )
          console.warn('⚠️ Animais não encontrados:', result.data.animais_nao_encontrados_ids)
        } else {
          Toast.success(result.message || `${selectedAnimals.length} animal(is) enviado(s) para ${laboratorio} com sucesso!`)
        }

        // Se for VRGEN, gerar PDF automaticamente após o envio
        if (laboratorio === 'VRGEN') {
          setTimeout(() => {
            handleGerarPDFVRGEN()
          }, 500)
        }
        
        // Limpar seleção
        setSelectedAnimals([])
        setShowLaboratorioModal(false)
        setLaboratorio('')
        setObservacoes('')
        
        // Recarregar animais para atualizar informações de DNA
        loadAnimais()
      } else {
        const error = await response.json()
        Toast.error(error.message || 'Erro ao enviar para laboratório')
      }
    } catch (error) {
      console.error('Erro ao enviar para laboratório:', error)
      Toast.error('Erro ao enviar para laboratório')
    } finally {
      setSaving(false)
    }
  }

  const getLaboratorioInfo = (lab) => {
    if (lab === 'VRGEN') {
      return { nome: 'VRGEN', custo: custoVrgen, cor: 'text-blue-600' }
    } else if (lab === 'NEOGEN') {
      return { nome: 'NEOGEN', custo: custoNeogen, cor: 'text-green-600' }
    }
    return null
  }

  const handleGerarPDFVRGEN = async () => {
    try {
      // Buscar dados completos dos animais selecionados
      const animaisCompletos = []
      
      for (const animalId of selectedAnimals) {
        try {
          const response = await fetch(`/api/animals/${animalId}`)
          if (response.ok) {
            const data = await response.json()
            const animal = data.animal || data
            
            // Determinar raça automaticamente baseado na série
            let raca = animal.raca || 'NELORE'
            if (animal.serie) {
              const serie = animal.serie.toUpperCase()
              if (serie.startsWith('CJCJ') || serie.startsWith('CJCA') || serie.startsWith('CJCS')) {
                raca = 'NELORE'
              }
            }
            
            // Calcular meses de idade
            let meses = ''
            if (animal.data_nascimento) {
              const hoje = new Date()
              const nascimento = new Date(animal.data_nascimento)
              const diffTime = Math.abs(hoje - nascimento)
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              meses = Math.floor(diffDays / 30).toString()
            }
            
            // Buscar dados do pai
            let dadosPai = { serie: '', rg: '', nome: animal.pai || '' }
            if (animal.pai_id) {
              try {
                const paiResponse = await fetch(`/api/animals/${animal.pai_id}`)
                if (paiResponse.ok) {
                  const paiData = await paiResponse.json()
                  const pai = paiData.animal || paiData
                  dadosPai = {
                    serie: pai.serie || '',
                    rg: pai.rg || '',
                    nome: pai.nome || animal.pai || ''
                  }
                }
              } catch (e) {
                console.log('Pai não encontrado, usando nome:', animal.pai)
              }
            }
            
            // Buscar dados da mãe
            let dadosMae = { serie: '', rg: '', nome: animal.mae || '' }
            if (animal.mae_id) {
              try {
                const maeResponse = await fetch(`/api/animals/${animal.mae_id}`)
                if (maeResponse.ok) {
                  const maeData = await maeResponse.json()
                  const mae = maeData.animal || maeData
                  dadosMae = {
                    serie: mae.serie || '',
                    rg: mae.rg || '',
                    nome: mae.nome || animal.mae || ''
                  }
                }
              } catch (e) {
                console.log('Mãe não encontrada, usando nome:', animal.mae)
              }
            }
            
            animaisCompletos.push({
              serie: animal.serie || '',
              rg: animal.rg || '',
              raca: raca,
              sexo: animal.sexo || '',
              data_nascimento: animal.data_nascimento || '',
              meses: meses,
              serie_pai: dadosPai.serie,
              rg_pai: dadosPai.rg,
              nome_pai: dadosPai.nome,
              serie_mae: dadosMae.serie,
              rg_mae: dadosMae.rg,
              nome_mae: dadosMae.nome
            })
          }
        } catch (error) {
          console.error(`Erro ao buscar animal ${animalId}:`, error)
        }
      }

      if (animaisCompletos.length === 0) {
        Toast.error('Nenhum animal válido encontrado')
        return
      }

      console.log('Animais completos para PDF:', animaisCompletos)
      console.log('📊 Total de animais:', animaisCompletos.length)
      console.log('📋 Primeiro animal:', animaisCompletos[0])

      // Importar dinamicamente o gerador de PDF
      const { downloadDNAFormularioVRGEN } = await import('../../utils/dnaFormularioPDF')

      // Preparar dados para o PDF
      const dadosPDF = {
        dataEnvio: new Date(dataEnvio).toLocaleDateString('pt-BR'),
        dataColeta: new Date().toLocaleDateString('pt-BR'),
        proprietario: proprietario,
        responsavel: responsavel,
        raca: 'NELORE',
        emailAssociacao: emailAssociacao,
        emailFazenda: emailFazenda,
        tipoExame: tipoExame,
        animais: animaisCompletos,
        observacoes: observacoes || 'ANIMAIS VÃO SER CONTROLADOS NO COMEÇO DE FEVEREIRO'
      }

      console.log('📄 Dados preparados para PDF:', dadosPDF)
      console.log('📊 Animais no dadosPDF:', dadosPDF.animais?.length)

      await downloadDNAFormularioVRGEN(dadosPDF)
      Toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      Toast.error('Erro ao gerar PDF: ' + error.message)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BeakerIcon className="h-8 w-8 text-indigo-600" />
            Análise de DNA
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Selecione animais para envio ao laboratório de análise genética
          </p>
        </div>
        <Button
          onClick={() => router.push('/dna/historico')}
          variant="outline"
        >
          Ver Histórico
        </Button>
      </div>

      {/* Informações dos Laboratórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">VRGEN</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Custo por animal</p>
              {editandoCustos ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-blue-600">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={custoVrgen}
                    onChange={(e) => setCustoVrgen(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-lg font-bold text-blue-600 border border-blue-300 rounded"
                  />
                </div>
              ) : (
                <p className="text-2xl font-bold text-blue-600">R$ {custoVrgen.toFixed(2)}</p>
              )}
            </div>
            <BeakerIcon className="h-12 w-12 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">NEOGEN</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Custo por animal</p>
              {editandoCustos ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-green-600">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={custoNeogen}
                    onChange={(e) => setCustoNeogen(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-lg font-bold text-green-600 border border-green-300 rounded"
                  />
                </div>
              ) : (
                <p className="text-2xl font-bold text-green-600">R$ {custoNeogen.toFixed(2)}</p>
              )}
            </div>
            <BeakerIcon className="h-12 w-12 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Botão para editar custos */}
      <div className="flex justify-end">
        <Button
          variant={editandoCustos ? "primary" : "outline"}
          size="sm"
          onClick={() => setEditandoCustos(!editandoCustos)}
          className="flex items-center gap-2"
        >
          {editandoCustos ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Salvar Valores
            </>
          ) : (
            <>
              <PencilIcon className="h-4 w-4" />
              Editar Valores
            </>
          )}
        </Button>
      </div>

      {/* Busca e Seleção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Selecionar Animais ({selectedAnimals.length} selecionado(s))
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {selectedAnimals.length === animaisFiltrados.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              {selectedAnimals.length > 0 && (
                <Button
                  onClick={handleEnviarParaLaboratorio}
                  className="flex items-center gap-2"
                >
                  <BeakerIcon className="h-5 w-5" />
                  Enviar para Laboratório ({selectedAnimals.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Busca */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por série, RG, nome ou raça..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Animais */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : animaisFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Nenhum animal encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={selectedAnimals.length === animaisFiltrados.length && animaisFiltrados.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Série
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      RG
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Raça
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Sexo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Laboratório DNA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {animaisFiltrados.map((animal) => {
                    const isSelected = selectedAnimals.includes(animal.id)
                    const labInfo = animal.laboratorio_dna ? getLaboratorioInfo(animal.laboratorio_dna) : null
                    
                    // Validar se o animal tem ID válido
                    if (!animal.id || isNaN(parseInt(animal.id, 10))) {
                      console.warn(`⚠️ Animal sem ID válido:`, animal)
                      return null
                    }
                    
                    return (
                      <tr
                        key={animal.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => toggleAnimalSelection(animal.id)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAnimalSelection(animal.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {animal.serie || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {animal.rg || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {animal.nome || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                          ID: {animal.id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {animal.raca || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {animal.sexo || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {labInfo ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${labInfo.cor}`}>
                              {labInfo.nome}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Seleção de Laboratório */}
      <Modal
        isOpen={showLaboratorioModal}
        onClose={() => !saving && setShowLaboratorioModal(false)}
        title="Selecionar Laboratório"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Laboratório *
            </label>
            <select
              value={laboratorio}
              onChange={(e) => setLaboratorio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={saving}
            >
              <option value="">Selecione um laboratório</option>
              <option value="VRGEN">VRGEN - R$ {custoVrgen.toFixed(2)} por animal</option>
              <option value="NEOGEN">NEOGEN - R$ {custoNeogen.toFixed(2)} por animal</option>
            </select>
          </div>

          {laboratorio && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedAnimals.length} animal(is) selecionado(s)
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Custo por animal: R$ {(laboratorio === 'VRGEN' ? custoVrgen : custoNeogen).toFixed(2)}
                  </p>
                  {laboratorio === 'VRGEN' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      📄 O formulário PDF será gerado automaticamente após o envio
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    Total: R$ {(selectedAnimals.length * (laboratorio === 'VRGEN' ? custoVrgen : custoNeogen)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data de Envio *
            </label>
            <Input
              type="date"
              value={dataEnvio}
              onChange={(e) => setDataEnvio(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              disabled={saving}
            />
          </div>

          {laboratorio === 'VRGEN' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Proprietário
                  </label>
                  <Input
                    type="text"
                    value={proprietario}
                    onChange={(e) => setProprietario(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Responsável
                  </label>
                  <Input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-mail Associação ABCZ
                </label>
                <Input
                  type="text"
                  value={emailAssociacao}
                  onChange={(e) => setEmailAssociacao(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-mail Fazenda
                </label>
                <Input
                  type="text"
                  value={emailFazenda}
                  onChange={(e) => setEmailFazenda(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Exame
                </label>
                <Input
                  type="text"
                  value={tipoExame}
                  onChange={(e) => setTipoExame(e.target.value)}
                  placeholder="Ex: Genômico, Paternidade, etc."
                  disabled={saving}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Observações sobre o envio..."
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowLaboratorioModal(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            {laboratorio === 'VRGEN' && (
              <Button
                variant="outline"
                onClick={handleGerarPDFVRGEN}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Gerar PDF
              </Button>
            )}
            <Button
              onClick={handleConfirmarEnvio}
              disabled={!laboratorio || saving}
            >
              {saving ? 'Enviando...' : 'Confirmar Envio'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
