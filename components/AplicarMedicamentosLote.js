import React, { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  XMarkIcon, 
  CheckIcon,
  MapPinIcon,
  BeakerIcon
} from './ui/Icons'
import ModernCard, { ModernCardHeader, ModernCardBody } from './ui/ModernCard'
import Button from './ui/Button'

export default function AplicarMedicamentosLote({ isOpen, onClose }) {
  const [piquetes, setPiquetes] = useState([])
  const [piqueteSelecionado, setPiqueteSelecionado] = useState('')
  const [animaisPiquete, setAnimaisPiquete] = useState([])
  const [animaisSelecionadosManual, setAnimaisSelecionadosManual] = useState([]) // Animais adicionados manualmente
  const [serieInput, setSerieInput] = useState('') // Campo para digitar série
  const [serieFixa, setSerieFixa] = useState('') // Série fixada (prefixo)
  const [fixarSerie, setFixarSerie] = useState(false) // Checkbox para fixar série
  const [buscandoAnimal, setBuscandoAnimal] = useState(false)
  const [medicamentos, setMedicamentos] = useState([])
  const [medicamentosSelecionados, setMedicamentosSelecionados] = useState([])
  const [dataAplicacao, setDataAplicacao] = useState(new Date().toISOString().split('T')[0])
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingAnimais, setLoadingAnimais] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    if (isOpen) {
      carregarPiquetes()
      carregarMedicamentos()
      // Limpar estados ao abrir o modal
      setAnimaisSelecionadosManual([])
      setSerieInput('')
      setSerieFixa('')
      setFixarSerie(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (piqueteSelecionado) {
      carregarAnimaisPiquete()
    } else {
      setAnimaisPiquete([])
    }
  }, [piqueteSelecionado])

  const carregarPiquetes = async () => {
    try {
      const response = await fetch('/api/piquetes')
      if (response.ok) {
        const data = await response.json()
        setPiquetes(data.piquetes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar piquetes:', error)
    }
  }

  const carregarAnimaisPiquete = async () => {
    if (!piqueteSelecionado) return

    setLoadingAnimais(true)
    try {
      const response = await fetch(
        `/api/localizacoes?piquete=${encodeURIComponent(piqueteSelecionado)}&atual=true`
      )
      if (response.ok) {
        const data = await response.json()
        setAnimaisPiquete(data.data || [])
      } else {
        setAnimaisPiquete([])
      }
    } catch (error) {
      console.error('Erro ao carregar animais do piquete:', error)
      setAnimaisPiquete([])
    } finally {
      setLoadingAnimais(false)
    }
  }

  const carregarMedicamentos = async () => {
    try {
      // Tentar carregar da API primeiro
      const response = await fetch('/api/medicamentos?ativo=true')
      if (response.ok) {
        const data = await response.json()
        if (data.medicamentos && data.medicamentos.length > 0) {
          setMedicamentos(data.medicamentos)
          return
        }
      }

      // Fallback: carregar do localStorage (customMedicamentos)
      if (typeof window !== 'undefined') {
        const customMedicamentos = localStorage.getItem('customMedicamentos')
        if (customMedicamentos) {
          const medicamentosObj = JSON.parse(customMedicamentos)
          const medicamentosArray = Object.entries(medicamentosObj).map(([key, med]) => ({
            id: key,
            nome: med.nome || key.replace(/_/g, ' '),
            preco: med.preco,
            unidade: med.unidade,
            porAnimal: med.porAnimal,
            tipoAplicacao: med.tipoAplicacao || 'individual',
            animaisPorLote: med.animaisPorLote,
            custoPorLote: med.custoPorLote
          }))
          setMedicamentos(medicamentosArray)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error)
    }
  }

  const adicionarMedicamento = () => {
    if (medicamentos.length === 0) {
      alert('Nenhum medicamento disponível. Cadastre medicamentos primeiro.')
      return
    }

    setMedicamentosSelecionados([
      ...medicamentosSelecionados,
      {
        id: null,
        nome: '',
        quantidade: 1,
        custoPorAnimal: 0,
        custoPorLote: 0,
        animaisPorLote: animaisPiquete.length || 1
      }
    ])
  }

  const removerMedicamento = (index) => {
    setMedicamentosSelecionados(medicamentosSelecionados.filter((_, i) => i !== index))
  }

  const atualizarMedicamento = (index, campo, valor) => {
    const novosMedicamentos = [...medicamentosSelecionados]
    const medicamento = novosMedicamentos[index]
    
    if (campo === 'id') {
      const medSelecionado = medicamentos.find(m => m.id === valor || m.nome === valor)
      if (medSelecionado) {
        medicamento.id = medSelecionado.id
        medicamento.nome = medSelecionado.nome
        medicamento.unidade = medSelecionado.unidade || 'UNIDADE'
        
        // Calcular custo baseado no tipo de aplicação
        medicamento.precoFrasco = medSelecionado.preco || 0
        medicamento.quantidadeFrasco = medSelecionado.quantidadeEstoque || null
        
        if (medSelecionado.tipoAplicacao === 'lote') {
          medicamento.tipoAplicacao = 'lote'
          medicamento.animaisPorLote = medSelecionado.animaisPorLote || animaisPiquete.length || 1
          medicamento.custoPorLote = medSelecionado.custoPorLote || medSelecionado.preco
          medicamento.custoPorAnimal = medicamento.custoPorLote / medicamento.animaisPorLote
        } else {
          medicamento.tipoAplicacao = 'individual'
          // Se tiver quantidade do frasco, calcular proporcionalmente
          if (medicamento.quantidadeFrasco && medicamento.quantidadeFrasco > 0 && medicamento.precoFrasco > 0) {
            // Usar quantidade padrão de 1 se não especificada
            medicamento.quantidadeAplicada = medicamento.quantidadeAplicada || 1
            medicamento.custoPorAnimal = (medicamento.precoFrasco / medicamento.quantidadeFrasco) * medicamento.quantidadeAplicada
          } else {
            medicamento.custoPorAnimal = medSelecionado.porAnimal || medSelecionado.preco
          }
        }
      }
    } else {
      medicamento[campo] = valor
      
      // Recalcular custo por animal se necessário
      if (campo === 'quantidadeAplicada' || campo === 'quantidadeFrasco') {
        // Se tiver quantidade aplicada e quantidade do frasco, calcular proporcionalmente
        if (medicamento.quantidadeAplicada && medicamento.quantidadeFrasco && medicamento.precoFrasco) {
          medicamento.custoPorAnimal = (medicamento.precoFrasco / medicamento.quantidadeFrasco) * medicamento.quantidadeAplicada
        }
      } else if (campo === 'custoPorLote' || campo === 'animaisPorLote') {
        if (medicamento.tipoAplicacao === 'lote') {
          const custoPorLote = parseFloat(medicamento.custoPorLote) || 0
          const animaisPorLote = parseInt(medicamento.animaisPorLote) || 1
          medicamento.custoPorAnimal = custoPorLote / animaisPorLote
        }
      }
    }
    
    novosMedicamentos[index] = medicamento
    setMedicamentosSelecionados(novosMedicamentos)
  }

  // Buscar animal por série completa ou parcial
  const buscarAnimalPorSerie = async (serieCompleta) => {
    if (!serieCompleta || serieCompleta.trim() === '') return null

    setBuscandoAnimal(true)
    try {
      // Extrair série e RG da entrada
      // Formato esperado: "CJCJ 17372" ou "CJCJ17372" ou apenas "17372" (se série fixada)
      let serie = ''
      let rg = ''
      
      if (serieFixa) {
        // Se série está fixada, o input é só o RG
        serie = serieFixa.trim().toUpperCase()
        rg = serieCompleta.trim()
      } else {
        // Tentar separar série e RG
        const partes = serieCompleta.trim().split(/\s+/)
        if (partes.length >= 2) {
          serie = partes[0].toUpperCase()
          rg = partes.slice(1).join(' ').trim()
        } else {
          // Tentar extrair série do início (2-5 letras) e o resto é RG
          const match = serieCompleta.match(/^([A-Z]{2,5})(\d+.*)$/i)
          if (match) {
            serie = match[1].toUpperCase()
            rg = match[2].trim()
          } else {
            // Se não conseguir separar, tentar buscar diretamente
            serie = serieCompleta.trim().toUpperCase()
          }
        }
      }

      console.log('🔍 Buscando animal:', { serie, rg, serieCompleta, serieFixa })

      // Tentar múltiplas estratégias de busca
      let animais = []
      
      // Estratégia 1: Busca exata com série e RG
      if (serie && rg) {
        const params1 = new URLSearchParams()
        params1.append('serie', serie)
        params1.append('rg', rg)
        
        const response1 = await fetch(`/api/animals?${params1.toString()}`)
        if (response1.ok) {
          const data1 = await response1.json()
          animais = data1.data || []
          console.log('📊 Busca exata (serie + rg):', animais.length, 'resultados')
        }
      }
      
      // Estratégia 2: Se não encontrou, tentar só com série
      if (animais.length === 0 && serie) {
        const params2 = new URLSearchParams()
        params2.append('serie', serie)
        
        const response2 = await fetch(`/api/animals?${params2.toString()}`)
        if (response2.ok) {
          const data2 = await response2.json()
          const animaisPorSerie = data2.data || []
          console.log('📊 Busca por série:', animaisPorSerie.length, 'resultados')
          
          // Filtrar pelo RG se tiver
          if (rg) {
            animais = animaisPorSerie.filter(a => {
              const rgAnimal = a.rg?.toString().trim()
              const rgBuscado = rg.toString().trim()
              // Tentar comparação numérica também
              const rgAnimalNum = parseInt(rgAnimal)
              const rgBuscadoNum = parseInt(rgBuscado)
              
              return rgAnimal === rgBuscado || 
                     rgAnimalNum === rgBuscadoNum ||
                     rgAnimal?.endsWith(rgBuscado) ||
                     rgBuscado?.endsWith(rgAnimal)
            })
            console.log('📊 Após filtrar por RG:', animais.length, 'resultados')
          } else {
            animais = animaisPorSerie
          }
        }
      }
      
      // Estratégia 3: Se ainda não encontrou e tem RG, tentar só com RG (buscando em todas as séries)
      if (animais.length === 0 && rg) {
        const params3 = new URLSearchParams()
        params3.append('rg', rg)
        
        const response3 = await fetch(`/api/animals?${params3.toString()}`)
        if (response3.ok) {
          const data3 = await response3.json()
          const animaisPorRG = data3.data || []
          console.log('📊 Busca por RG:', animaisPorRG.length, 'resultados')
          
          // Se série foi fornecida, filtrar por ela
          if (serie) {
            animais = animaisPorRG.filter(a => 
              a.serie?.toUpperCase() === serie.toUpperCase()
            )
            console.log('📊 Após filtrar por série:', animais.length, 'resultados')
          } else {
            animais = animaisPorRG
          }
        }
      }
      
      // Se encontrou exatamente um animal, retornar
      if (animais.length === 1) {
        console.log('✅ Animal encontrado:', animais[0].serie, animais[0].rg)
        return animais[0]
      }
      
      // Se encontrou múltiplos, tentar filtrar pelo RG completo se tiver
      if (rg && animais.length > 1) {
        const animalExato = animais.find(a => {
          const rgAnimal = a.rg?.toString().trim()
          const rgBuscado = rg.toString().trim()
          return rgAnimal === rgBuscado || 
                 parseInt(rgAnimal) === parseInt(rgBuscado)
        })
        if (animalExato) {
          console.log('✅ Animal exato encontrado:', animalExato.serie, animalExato.rg)
          return animalExato
        }
      }
      
      // Se encontrou algum, retornar o primeiro
      if (animais.length > 0) {
        console.log('⚠️ Múltiplos animais encontrados, retornando o primeiro:', animais[0].serie, animais[0].rg)
        return animais[0]
      }
      
      console.log('❌ Nenhum animal encontrado para:', { serie, rg, serieCompleta })
      return null
    } catch (error) {
      console.error('❌ Erro ao buscar animal:', error)
      return null
    } finally {
      setBuscandoAnimal(false)
    }
  }

  // Adicionar animal à lista manual
  const adicionarAnimalManual = async (e) => {
    e?.preventDefault()
    
    const serieCompleta = serieInput.trim()
    if (!serieCompleta) return

    // Se série está fixada e só tem número, combinar
    const serieCompletaFinal = serieFixa && /^\d+$/.test(serieCompleta) 
      ? `${serieFixa} ${serieCompleta}` 
      : serieCompleta

    const animal = await buscarAnimalPorSerie(serieCompletaFinal)
    
    if (!animal) {
      const mensagemErro = serieFixa 
        ? `Animal não encontrado: ${serieFixa} ${serieCompleta}\n\nVerifique se:\n- O número está correto\n- O animal existe no sistema\n- O animal está ativo`
        : `Animal não encontrado: ${serieCompletaFinal}\n\nVerifique se:\n- A série e número estão corretos\n- O animal existe no sistema\n- O animal está ativo`
      alert(mensagemErro)
      return
    }

    // Verificar se já foi adicionado
    const jaAdicionado = animaisSelecionadosManual.some(a => a.id === animal.id)
    if (jaAdicionado) {
      alert(`Animal ${animal.serie} ${animal.rg} já foi adicionado`)
      setSerieInput('')
      return
    }

    // Adicionar à lista
    setAnimaisSelecionadosManual([...animaisSelecionadosManual, animal])
    setSerieInput('')
    
    // Se foi a primeira série completa digitada e não tem série fixada, perguntar
    if (!serieFixa && !fixarSerie && animal.serie) {
      // Detectar se a série tem padrão (ex: 4 letras)
      const serieParte = animal.serie
      if (serieParte && serieParte.length >= 2) {
        // Não perguntar automaticamente, deixar o usuário decidir
      }
    }
  }

  // Remover animal da lista manual
  const removerAnimalManual = (animalId) => {
    setAnimaisSelecionadosManual(animaisSelecionadosManual.filter(a => a.id !== animalId))
  }

  // Quando fixar série, atualizar a série fixa
  useEffect(() => {
    if (fixarSerie && animaisSelecionadosManual.length > 0) {
      const primeiraSerie = animaisSelecionadosManual[0].serie
      if (primeiraSerie) {
        setSerieFixa(primeiraSerie)
      }
    } else if (!fixarSerie) {
      setSerieFixa('')
    }
  }, [fixarSerie, animaisSelecionadosManual])

  // Obter lista final de animais (piquete + manual)
  const animaisFinais = () => {
    const todosAnimais = [...animaisPiquete]
    
    // Adicionar animais manuais que não estão no piquete
    animaisSelecionadosManual.forEach(animalManual => {
      const jaExiste = todosAnimais.some(a => a.id === animalManual.id || 
        (a.animal_id === animalManual.id) ||
        (a.serie === animalManual.serie && a.rg === animalManual.rg))
      if (!jaExiste) {
        // Formatar como objeto de localização para compatibilidade
        todosAnimais.push({
          animal_id: animalManual.id,
          serie: animalManual.serie,
          rg: animalManual.rg,
          raca: animalManual.raca,
          sexo: animalManual.sexo,
          animal: `${animalManual.serie} ${animalManual.rg}`
        })
      }
    })
    
    return todosAnimais
  }

  const calcularCustoTotal = () => {
    const animaisFinaisLista = animaisFinais()
    if (!animaisFinaisLista.length || !medicamentosSelecionados.length) return 0
    
    return medicamentosSelecionados.reduce((total, med) => {
      return total + (med.custoPorAnimal * animaisFinaisLista.length)
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const animaisFinaisLista = animaisFinais()
    if (animaisFinaisLista.length === 0) {
      alert('Nenhum animal selecionado. Selecione um piquete ou adicione animais manualmente.')
      return
    }

    if (medicamentosSelecionados.length === 0) {
      alert('Adicione pelo menos um medicamento')
      return
    }

    // Validar medicamentos
    for (const med of medicamentosSelecionados) {
      if (!med.id || !med.nome) {
        alert(`Medicamento "${med.nome || 'não selecionado'}" está incompleto`)
        return
      }
      if (med.custoPorAnimal <= 0) {
        alert(`Custo do medicamento "${med.nome}" deve ser maior que zero`)
        return
      }
    }

    setLoading(true)
    setResultado(null)

    try {
      const response = await fetch('/api/custos/aplicar-lote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          piquete: piqueteSelecionado || null,
          animais_ids: animaisFinais().map(a => a.animal_id || a.id).filter(Boolean), // IDs dos animais selecionados
          medicamentos: medicamentosSelecionados.map(med => ({
            id: med.id,
            nome: med.nome,
            quantidade: med.quantidade || 1,
            quantidadeAplicada: med.quantidadeAplicada || med.quantidade || 1,
            quantidadeFrasco: med.quantidadeFrasco || med.quantiaFras || null,
            unidade: med.unidade,
            custoPorAnimal: med.custoPorAnimal,
            custoPorLote: med.custoPorLote,
            animaisPorLote: med.animaisPorLote
          })),
          data: dataAplicacao,
          observacoes: observacoes.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResultado({
          sucesso: true,
          mensagem: `Medicamentos aplicados com sucesso!`,
          detalhes: data.data
        })
        
        // Limpar formulário após sucesso
        setTimeout(() => {
          setMedicamentosSelecionados([])
          setObservacoes('')
          setAnimaisSelecionadosManual([])
          setSerieInput('')
          setSerieFixa('')
          setFixarSerie(false)
        }, 3000)
      } else {
        setResultado({
          sucesso: false,
          mensagem: data.message || 'Erro ao aplicar medicamentos',
          detalhes: data.data
        })
      }
    } catch (error) {
      console.error('Erro ao aplicar medicamentos:', error)
      setResultado({
        sucesso: false,
        mensagem: `Erro ao aplicar medicamentos: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <ModernCard>
          <ModernCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Aplicar Medicamentos em Lote
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aplique medicamentos a todos os animais de um piquete
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </ModernCardHeader>

          <ModernCardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Piquete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPinIcon className="h-5 w-5 inline mr-1" />
                  Piquete (Opcional)
                </label>
                <select
                  value={piqueteSelecionado}
                  onChange={(e) => setPiqueteSelecionado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um piquete (opcional)...</option>
                  {piquetes.map((piquete) => (
                    <option key={piquete.id} value={piquete.nome}>
                      {piquete.nome}
                    </option>
                  ))}
                </select>
                
                {loadingAnimais ? (
                  <p className="text-sm text-gray-500 mt-2">Carregando animais...</p>
                ) : animaisPiquete.length > 0 ? (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ {animaisPiquete.length} animal(is) encontrado(s) neste piquete
                  </p>
                ) : piqueteSelecionado ? (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                    ⚠ Nenhum animal encontrado neste piquete
                  </p>
                ) : null}
              </div>

              {/* Seleção Manual de Animais */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🐄 Adicionar Animais Manualmente
                </label>
                
                <div className="space-y-3">
                  {/* Campo de input para série */}
                  <form onSubmit={adicionarAnimalManual} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={serieInput}
                        onChange={(e) => setSerieInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            adicionarAnimalManual(e)
                          }
                        }}
                        placeholder={serieFixa ? `Digite o número (série fixada: ${serieFixa})` : "Digite a série completa (ex: CJCJ 17372)"}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        disabled={buscandoAnimal}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={buscandoAnimal || !serieInput.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {buscandoAnimal ? '...' : '+'}
                    </button>
                  </form>

                  {/* Checkbox para fixar série */}
                  {animaisSelecionadosManual.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="fixarSerie"
                        checked={fixarSerie}
                        onChange={(e) => {
                          setFixarSerie(e.target.checked)
                          if (e.target.checked && animaisSelecionadosManual.length > 0) {
                            setSerieFixa(animaisSelecionadosManual[0].serie || '')
                          } else {
                            setSerieFixa('')
                          }
                        }}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="fixarSerie" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Fixar série "{serieFixa || animaisSelecionadosManual[0]?.serie || ''}" 
                        {fixarSerie && serieFixa && (
                          <span className="ml-2 text-purple-600 font-medium">(Ativo)</span>
                        )}
                      </label>
                    </div>
                  )}

                  {/* Lista de animais adicionados manualmente */}
                  {animaisSelecionadosManual.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Animais adicionados ({animaisSelecionadosManual.length}):
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {animaisSelecionadosManual.map((animal) => (
                          <div
                            key={animal.id}
                            className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600"
                          >
                            <span className="text-sm text-gray-900 dark:text-white">
                              {animal.serie} {animal.rg} {animal.raca && `(${animal.raca})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => removerAnimalManual(animal.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data de Aplicação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Aplicação <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dataAplicacao}
                  onChange={(e) => setDataAplicacao(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Medicamentos Selecionados */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Medicamentos <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    onClick={adicionarMedicamento}
                    variant="secondary"
                    size="sm"
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                  >
                    Adicionar Medicamento
                  </Button>
                </div>

                {medicamentosSelecionados.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum medicamento adicionado. Clique em "Adicionar Medicamento" para começar.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicamentosSelecionados.map((med, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Medicamento {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removerMedicamento(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Medicamento <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={med.id || ''}
                              onChange={(e) => atualizarMedicamento(index, 'id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">Selecione...</option>
                              {medicamentos.map((m) => (
                                <option key={m.id || m.nome} value={m.id || m.nome}>
                                  {m.nome} {m.preco ? `(R$ ${m.preco.toFixed(2)})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantidade
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={med.quantidade || 1}
                              onChange={(e) => atualizarMedicamento(index, 'quantidade', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantidade Aplicada por Animal ({med.unidade || 'ml'})
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={med.quantidadeAplicada || med.quantidade || 1}
                              onChange={(e) => {
                                const qtdAplicada = parseFloat(e.target.value) || 0
                                atualizarMedicamento(index, 'quantidadeAplicada', qtdAplicada)
                                // Recalcular custo se tiver quantidade do frasco
                                if (med.quantidadeFrasco && med.precoFrasco) {
                                  const novoCusto = (med.precoFrasco / med.quantidadeFrasco) * qtdAplicada
                                  atualizarMedicamento(index, 'custoPorAnimal', novoCusto)
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Ex: 1.5"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantidade do Frasco ({med.unidade || 'ml'})
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={med.quantidadeFrasco || med.quantiaFras || ''}
                              onChange={(e) => {
                                const qtdFrasco = parseFloat(e.target.value) || 0
                                atualizarMedicamento(index, 'quantidadeFrasco', qtdFrasco)
                                // Recalcular custo se tiver quantidade aplicada
                                if (qtdFrasco > 0 && med.quantidadeAplicada && med.precoFrasco) {
                                  const novoCusto = (med.precoFrasco / qtdFrasco) * med.quantidadeAplicada
                                  atualizarMedicamento(index, 'custoPorAnimal', novoCusto)
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Ex: 60"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Quantidade total do frasco para cálculo proporcional
                            </p>
                          </div>

                          {med.tipoAplicacao === 'lote' ? (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Custo por Lote (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={med.custoPorLote || 0}
                                  onChange={(e) => atualizarMedicamento(index, 'custoPorLote', parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Animais por Lote
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={med.animaisPorLote || animaisPiquete.length || 1}
                                  onChange={(e) => atualizarMedicamento(index, 'animaisPorLote', parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </>
                          ) : null}
                          
                          <div className="md:col-span-2">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-xs">
                              <span className="text-blue-800 dark:text-blue-200">
                                💡 Custo calculado por animal: R$ {med.custoPorAnimal?.toFixed(2) || '0.00'}
                                {med.quantidadeAplicada && med.quantidadeFrasco && med.precoFrasco && (
                                  <span className="block mt-1 text-blue-600">
                                    Fórmula: (R$ {med.precoFrasco.toFixed(2)} / {med.quantidadeFrasco} {med.unidade}) × {med.quantidadeAplicada} {med.unidade} = R$ {med.custoPorAnimal?.toFixed(2)}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Observações adicionais sobre a aplicação..."
                />
              </div>

              {/* Resumo de Custo */}
              {animaisFinais().length > 0 && medicamentosSelecionados.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Resumo do Custo
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-300">Total de animais:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-200">{animaisFinais().length}</span>
                    </div>
                    {animaisPiquete.length > 0 && (
                      <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                        <span>• Do piquete:</span>
                        <span>{animaisPiquete.length}</span>
                      </div>
                    )}
                    {animaisSelecionadosManual.length > 0 && (
                      <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                        <span>• Adicionados manualmente:</span>
                        <span>{animaisSelecionadosManual.length}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-300">Medicamentos:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-200">{medicamentosSelecionados.length}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
                      <span className="font-medium text-blue-900 dark:text-blue-200">Custo Total:</span>
                      <span className="font-bold text-lg text-blue-900 dark:text-blue-200">
                        R$ {calcularCustoTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultado */}
              {resultado && (
                <div
                  className={`p-4 rounded-lg ${
                    resultado.sucesso
                      ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <p
                    className={`font-medium ${
                      resultado.sucesso
                        ? 'text-green-900 dark:text-green-200'
                        : 'text-red-900 dark:text-red-200'
                    }`}
                  >
                    {resultado.sucesso ? '✓' : '✗'} {resultado.mensagem}
                  </p>
                  {resultado.detalhes && (
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <p>Sucessos: {resultado.detalhes.resultados?.total_sucessos || 0}</p>
                      <p>Erros: {resultado.detalhes.resultados?.total_erros || 0}</p>
                      {resultado.detalhes.custo_total_lote && (
                        <p>Custo Total: R$ {resultado.detalhes.custo_total_lote.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botões */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                  leftIcon={loading ? null : <CheckIcon className="h-5 w-5" />}
                >
                  {loading ? 'Aplicando...' : 'Aplicar Medicamentos'}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </ModernCardBody>
        </ModernCard>
      </div>
    </div>
  )
}

