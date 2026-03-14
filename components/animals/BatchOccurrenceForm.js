import React, { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function BatchOccurrenceForm({ isOpen, onClose, onSuccess }) {
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [piquete, setPiquete] = useState('')
  const [piquetes, setPiquetes] = useState([])
  const [loadingPiquetes, setLoadingPiquetes] = useState(false)
  const [usarNovoPiquete, setUsarNovoPiquete] = useState(false)
  const [novoPiquete, setNovoPiquete] = useState('')
  
  const [buscaAnimal, setBuscaAnimal] = useState('')
  const [numeroAnimal, setNumeroAnimal] = useState('')
  const [animaisSelecionados, setAnimaisSelecionados] = useState([])
  const [animais, setAnimais] = useState([])
  const [loadingAnimais, setLoadingAnimais] = useState(false)
  const [animaisExpandidos, setAnimaisExpandidos] = useState(new Set())
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Tentar inicializar piquetes se necessÃ¡rio
      inicializarPiquetes()
      carregarPiquetes()
      carregarAnimais()
    }
  }, [isOpen])

  const inicializarPiquetes = async () => {
    try {
      // Chamar API para garantir que a tabela existe e tem dados
      const response = await fetch('/api/localizacoes/inicializar-piquetes', {
        method: 'POST'
      })
      if (response.ok) {
        console.log('âÅ“â€¦ Piquetes inicializados com sucesso')
      }
    } catch (error) {
      console.warn('âÅ¡ ï¸� Erro ao inicializar piquetes (continuando...):', error)
      // NÃ£o bloquear se falhar
    }
  }

  const carregarPiquetes = async () => {
    setLoadingPiquetes(true)
    try {
      console.log('ðÅ¸â€�â€ž Buscando piquetes...')
      const response = await fetch('/api/localizacoes/piquetes')
      console.log('ðÅ¸â€œ¡ Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('ðÅ¸â€œ¦ Resultado da API:', result)
      
      if (result.status === 'success' && result.data) {
        const piquetesList = result.data.piquetes || []
        console.log('âÅ“â€¦ Piquetes encontrados:', piquetesList)
        setPiquetes(piquetesList)
      } else {
        console.warn('âÅ¡ ï¸� Formato de resposta inesperado:', result)
        setPiquetes([])
      }
    } catch (error) {
      console.error('â�Å’ Erro ao carregar piquetes:', error)
      setError(`Erro ao carregar piquetes: ${error.message}`)
      setPiquetes([])
    } finally {
      setLoadingPiquetes(false)
    }
  }

  const carregarAnimais = async () => {
    setLoadingAnimais(true)
    try {
      const response = await fetch('/api/animals?situacao=Ativo')
      const result = await response.json()
      
      if (result.status === 'success' && result.data) {
        setAnimais(result.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      setAnimais([])
    } finally {
      setLoadingAnimais(false)
    }
  }

  const adicionarAnimal = (animal) => {
    if (animaisSelecionados.find(a => a.id === animal.id)) {
      return // JÃ¡ estÃ¡ adicionado
    }

    const animalComDados = {
      ...animal,
      peso: '',
      ce: '',
      observacoes: ''
    }

    setAnimaisSelecionados([...animaisSelecionados, animalComDados])
    setBuscaAnimal('')
    setNumeroAnimal('')
  }

  const adicionarPorNumero = async () => {
    if (!numeroAnimal.trim()) return

    // Separar por vÃ­rgula, quebra de linha, ponto e vÃ­rgula ou mÃºltiplos espaÃ§os
    // Remover linhas vazias e espaÃ§os extras
    const numeros = numeroAnimal
      .split(/[,\n;]+|\s{2,}/) // Separar por vÃ­rgula, quebra de linha, ponto e vÃ­rgula ou mÃºltiplos espaÃ§os
      .map(n => n.trim())
      .filter(n => n && n.length > 0) // Remover strings vazias
    
    console.log('ðÅ¸â€œ� NÃºmeros extraÃ­dos:', numeros)
    
    if (numeros.length === 0) {
      setError('Digite pelo menos um nÃºmero de animal')
      return
    }

    setLoadingAnimais(true)
    let encontrados = 0
    let naoEncontrados = []

    // FunÃ§Ã£o auxiliar para buscar um animal com mÃºltiplas estratÃ©gias
    const buscarAnimalCompleto = async (numero) => {
      // Extrair sÃ©rie e RG da entrada
      // Formato esperado: "CJCJ-16942" ou "CJCJ 16942" ou "CJCJ16942"
      let serie = ''
      let rg = ''
      
      // Tentar separar por hÃ­fen primeiro
      if (numero.includes('-')) {
        const partes = numero.split('-').map(s => s.trim())
        if (partes.length >= 2) {
          serie = partes[0].toUpperCase()
          rg = partes.slice(1).join('-').trim()
        }
      } else {
        // Tentar separar por espaÃ§o
        const partes = numero.trim().split(/\s+/).filter(Boolean)
        if (partes.length >= 2) {
          serie = partes[0].toUpperCase()
          rg = partes.slice(1).join(' ').trim()
        } else {
          // Tentar extrair sÃ©rie do inÃ­cio (2-5 letras) e o resto Ã© RG
          const match = numero.match(/^([A-Z]{2,5})(\d+.*)$/i)
          if (match) {
            serie = match[1].toUpperCase()
            rg = match[2].trim()
          }
        }
      }

      if (!serie || !rg) {
        console.log('â�Å’ NÃ£o foi possÃ­vel extrair sÃ©rie e RG de:', numero)
        return null
      }

      console.log('ðÅ¸â€�� Buscando animal:', { serie, rg, numero })

      // Tentar mÃºltiplas estratÃ©gias de busca
      let animais = []
      
      // EstratÃ©gia 1: Busca exata com sÃ©rie e RG
      if (serie && rg) {
        const params1 = new URLSearchParams()
        params1.append('serie', serie)
        params1.append('rg', rg)
        
        try {
          const response1 = await fetch(`/api/animals?${params1.toString()}`)
          if (response1.ok) {
            const data1 = await response1.json()
            animais = data1.data || []
            console.log('ðÅ¸â€œÅ  Busca exata (serie + rg):', animais.length, 'resultados')
          }
        } catch (err) {
          console.error('Erro na busca exata:', err)
        }
      }
      
      // EstratÃ©gia 2: Se nÃ£o encontrou, tentar sÃ³ com sÃ©rie e filtrar por RG
      if (animais.length === 0 && serie) {
        const params2 = new URLSearchParams()
        params2.append('serie', serie)
        
        try {
          const response2 = await fetch(`/api/animals?${params2.toString()}`)
          if (response2.ok) {
            const data2 = await response2.json()
            const animaisPorSerie = data2.data || []
            console.log('ðÅ¸â€œÅ  Busca por sÃ©rie:', animaisPorSerie.length, 'resultados')
            
            // Filtrar pelo RG se tiver
            if (rg) {
              animais = animaisPorSerie.filter(a => {
                const rgAnimal = a.rg?.toString().trim()
                const rgBuscado = rg.toString().trim()
                // Tentar comparaÃ§Ã£o numÃ©rica tambÃ©m
                const rgAnimalNum = parseInt(rgAnimal)
                const rgBuscadoNum = parseInt(rgBuscado)
                
                return rgAnimal === rgBuscado || 
                       (rgAnimalNum === rgBuscadoNum && !isNaN(rgAnimalNum) && !isNaN(rgBuscadoNum)) ||
                       rgAnimal?.endsWith(rgBuscado) ||
                       rgBuscado?.endsWith(rgAnimal)
              })
              console.log('ðÅ¸â€œÅ  ApÃ³s filtrar por RG:', animais.length, 'resultados')
            } else {
              animais = animaisPorSerie
            }
          }
        } catch (err) {
          console.error('Erro na busca por sÃ©rie:', err)
        }
      }
      
      // EstratÃ©gia 3: Se ainda nÃ£o encontrou e tem RG, tentar sÃ³ com RG (buscando em todas as sÃ©ries)
      if (animais.length === 0 && rg) {
        const params3 = new URLSearchParams()
        params3.append('rg', rg)
        
        try {
          const response3 = await fetch(`/api/animals?${params3.toString()}`)
          if (response3.ok) {
            const data3 = await response3.json()
            const animaisPorRG = data3.data || []
            console.log('ðÅ¸â€œÅ  Busca por RG:', animaisPorRG.length, 'resultados')
            
            // Se sÃ©rie foi fornecida, filtrar por ela
            if (serie) {
              animais = animaisPorRG.filter(a => 
                a.serie?.toUpperCase().trim() === serie.toUpperCase().trim()
              )
              console.log('ðÅ¸â€œÅ  ApÃ³s filtrar por sÃ©rie:', animais.length, 'resultados')
            } else {
              animais = animaisPorRG
            }
          }
        } catch (err) {
          console.error('Erro na busca por RG:', err)
        }
      }
      
      // Se encontrou exatamente um animal, retornar
      if (animais.length === 1) {
        console.log('âÅ“â€¦ Animal encontrado:', animais[0].serie, animais[0].rg)
        return animais[0]
      }
      
      // Se encontrou mÃºltiplos, tentar filtrar pelo RG completo se tiver
      if (rg && animais.length > 1) {
        const animalExato = animais.find(a => {
          const rgAnimal = a.rg?.toString().trim()
          const rgBuscado = rg.toString().trim()
          return rgAnimal === rgBuscado || 
                 parseInt(rgAnimal) === parseInt(rgBuscado)
        })
        if (animalExato) {
          console.log('âÅ“â€¦ Animal exato encontrado:', animalExato.serie, animalExato.rg)
          return animalExato
        }
      }
      
      // Se encontrou algum, retornar o primeiro
      if (animais.length > 0) {
        console.log('âÅ¡ ï¸� MÃºltiplos animais encontrados, retornando o primeiro:', animais[0].serie, animais[0].rg)
        return animais[0]
      }
      
      console.log('â�Å’ Nenhum animal encontrado para:', { serie, rg, numero })
      return null
    }

    // Processar cada nÃºmero - usar funÃ§Ã£o de atualizaÃ§Ã£o de estado para evitar problemas de closure
    const novosAnimais = []
    const idsExistentes = new Set(animaisSelecionados.map(a => a.id))
    
    for (const numero of numeros) {
      try {
        const animal = await buscarAnimalCompleto(numero)
        
        if (animal) {
          // Verificar se jÃ¡ existe na lista atual ou nos novos animais
          if (!idsExistentes.has(animal.id) && !novosAnimais.find(a => a.id === animal.id)) {
            const animalComDados = {
              ...animal,
              peso: '',
              ce: '',
              observacoes: ''
            }
            novosAnimais.push(animalComDados)
            idsExistentes.add(animal.id) // Adicionar ao set para evitar duplicatas
            encontrados++
            console.log('âÅ“â€¦ Animal adicionado Ã  lista:', animal.serie, animal.rg)
          } else {
            console.log('ââ€ž¹ï¸� Animal jÃ¡ estÃ¡ na lista:', animal.serie, animal.rg)
          }
        } else {
          naoEncontrados.push(numero)
        }
      } catch (err) {
        console.error('Erro ao buscar animal:', numero, err)
        naoEncontrados.push(numero)
      }
    }

    // Adicionar todos os novos animais de uma vez
    if (novosAnimais.length > 0) {
      setAnimaisSelecionados(prev => {
        // Filtrar duplicatas antes de adicionar
        const idsAtuais = new Set(prev.map(a => a.id))
        const semDuplicatas = novosAnimais.filter(a => !idsAtuais.has(a.id))
        return [...prev, ...semDuplicatas]
      })
    }

    setLoadingAnimais(false)
    setNumeroAnimal('')

    if (naoEncontrados.length > 0) {
      setError(`NÃ£o encontrados: ${naoEncontrados.join(' ')}`)
    } else if (encontrados > 0) {
      setError('') // Limpar erro se houver sucesso
    }
  }

  const removerAnimal = (animalId) => {
    setAnimaisSelecionados(animaisSelecionados.filter(a => a.id !== animalId))
    // Remover do conjunto de expandidos tambÃ©m
    const novosExpandidos = new Set(animaisExpandidos)
    novosExpandidos.delete(animalId)
    setAnimaisExpandidos(novosExpandidos)
  }

  const toggleExpandirAnimal = (animalId) => {
    const novosExpandidos = new Set(animaisExpandidos)
    if (novosExpandidos.has(animalId)) {
      novosExpandidos.delete(animalId)
    } else {
      novosExpandidos.add(animalId)
    }
    setAnimaisExpandidos(novosExpandidos)
  }

  const atualizarDadosAnimal = (animalId, campo, valor) => {
    setAnimaisSelecionados(animaisSelecionados.map(a => 
      a.id === animalId ? { ...a, [campo]: valor } : a
    ))
  }

  const animaisFiltrados = animais
    .filter(animal => {
      // Excluir animais jÃ¡ selecionados da lista de busca
      if (animaisSelecionados.find(a => a.id === animal.id)) {
        return false
      }

      if (!buscaAnimal) return true
      
      const busca = buscaAnimal.toLowerCase().trim()
      
      // Criar variaÃ§Ãµes para busca flexÃ­vel
      const serieRgHifen = `${animal.serie}-${animal.rg}`.toLowerCase()
      const serieRgEspaco = `${animal.serie} ${animal.rg}`.toLowerCase()
      const serieRgJunto = `${animal.serie}${animal.rg}`.toLowerCase()
      const nome = (animal.nome || '').toLowerCase()
      
      // Busca normalizada (remove espaÃ§os e hÃ­fens da busca)
      const buscaNormalizada = busca.replace(/[-\s]/g, '')
      
      return serieRgHifen.includes(busca) || 
             serieRgEspaco.includes(busca) || 
             serieRgJunto.includes(buscaNormalizada) ||
             nome.includes(busca)
    })
    .slice(0, 50) // Limitar a 50 resultados para performance

  const salvarNovoPiquete = async (nomePiquete) => {
    try {
      const response = await fetch('/api/piquetes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomePiquete,
          ativo: true
        })
      })

      if (response.ok) {
        // Recarregar lista de piquetes
        await carregarPiquetes()
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao salvar piquete:', error)
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!piquete) {
      setError('Piquete Ã© obrigatÃ³rio')
      return
    }

    if (animaisSelecionados.length === 0) {
      setError('Selecione pelo menos um animal')
      return
    }

    // Se foi adicionado um novo piquete, salvar no banco
    if (usarNovoPiquete && novoPiquete) {
      setLoading(true)
      const salvo = await salvarNovoPiquete(novoPiquete)
      if (!salvo) {
        setError('Erro ao salvar novo piquete, mas continuando com o lanÃ§amento...')
        // Continuar mesmo se falhar
      }
    }

    setLoading(true)

    try {
      const ocorrencias = []
      let sucessos = 0
      let erros = 0

      for (const animal of animaisSelecionados) {
        try {
          // Criar ocorrÃªncia de local (sempre)
          const responseLocal = await fetch('/api/ocorrencias/rapida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              animalId: animal.id,
              tipo: 'Local',
              data: data,
              local: piquete,
              observacoes: animal.observacoes || ''
            })
          })

          if (responseLocal.ok) {
            sucessos++
          } else {
            erros++
          }

          // Adicionar peso se informado (cria ocorrÃªncia separada)
          if (animal.peso) {
            const responsePeso = await fetch('/api/ocorrencias/rapida', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                animalId: animal.id,
                tipo: 'Pesagem',
                data: data,
                peso: parseFloat(animal.peso),
                observacoes: animal.observacoes || ''
              })
            })
            
            if (responsePeso.ok) {
              sucessos++
            } else {
              erros++
            }
          }

          // Adicionar CE se for macho e informado (cria ocorrÃªncia separada)
          if (animal.sexo === 'Macho' && animal.ce) {
            const responseCE = await fetch('/api/ocorrencias/rapida', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                animalId: animal.id,
                tipo: 'CE',
                data: data,
                ce: animal.ce,
                observacoes: animal.observacoes || ''
              })
            })
            
            if (responseCE.ok) {
              sucessos++
            } else {
              erros++
            }
          }

        } catch (err) {
          console.error(`Erro ao processar animal ${animal.serie}-${animal.rg}:`, err)
          erros++
        }
      }

      alert(`âÅ“â€¦ Processamento concluÃ­do!\nSucessos: ${sucessos}\nErros: ${erros}`)
      
      if (onSuccess) {
        onSuccess({ sucessos, erros })
      }
      
      handleClose()
    } catch (err) {
      setError(`Erro ao processar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setAnimaisSelecionados([])
    setBuscaAnimal('')
    setNumeroAnimal('')
    setPiquete('')
    setNovoPiquete('')
    setUsarNovoPiquete(false)
    setError('')
    setAnimaisExpandidos(new Set())
    setData(new Date().toISOString().split('T')[0])
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ðÅ¸�â€ž LanÃ§amento em Lote
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Comuns */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
              ðÅ¸â€œâ€¹ Dados Comuns a Todos os Animais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Piquete *
                </label>
                {loadingPiquetes ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Carregando...</div>
                ) : (
                  <>
                    {!usarNovoPiquete ? (
                      <>
                        <select
                          value={piquete}
                          onChange={(e) => {
                            if (e.target.value === '__novo__') {
                              setUsarNovoPiquete(true)
                              setPiquete('')
                            } else {
                              setPiquete(e.target.value)
                            }
                          }}
                          className="input-field w-full"
                          required={!usarNovoPiquete}
                        >
                          <option value="">Selecione um piquete...</option>
                          {piquetes.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                          <option value="__novo__">+ Adicionar novo piquete</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <Input
                          type="text"
                          value={novoPiquete}
                          onChange={(e) => {
                            setNovoPiquete(e.target.value)
                            setPiquete(e.target.value)
                          }}
                          placeholder="Digite o nome do piquete"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUsarNovoPiquete(false)
                            setNovoPiquete('')
                            setPiquete('')
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                        >
                          ââ€ � Voltar para seleÃ§Ã£o
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Adicionar Animais */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adicionar Animais por NÃºmero (SÃ©rie-RG)
              </label>
              <div className="space-y-2">
                <textarea
                  value={numeroAnimal}
                  onChange={(e) => {
                    setNumeroAnimal(e.target.value)
                    setError('')
                  }}
                  placeholder="Digite os nÃºmeros dos animais, um por linha ou separados por vÃ­rgula:&#10;CJCJ-17065&#10;CJCJ-17066&#10;CJCJ-17067&#10;&#10;Ou: CJCJ-17065, CJCJ-17066, CJCJ-17067"
                  rows={4}
                  className="input-field w-full font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={adicionarPorNumero}
                    disabled={loadingAnimais || !numeroAnimal.trim()}
                    className="flex-1"
                  >
                    {loadingAnimais ? 'Buscando...' : (() => {
                      const count = numeroAnimal.split(/[,\n]/).filter(n => n.trim()).length
                      return count > 0 ? `Adicionar ${count} Animal(is)` : 'Adicionar'
                    })()}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ðÅ¸â€™¡ VocÃª pode colar uma lista de nÃºmeros (um por linha) ou separados por vÃ­rgula
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecionar Animais da Lista
              </label>
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={buscaAnimal}
                  onChange={(e) => setBuscaAnimal(e.target.value)}
                  placeholder="Buscar por nome ou nÃºmero..."
                  className="input-field w-full pl-10"
                />
              </div>
            </div>

            {/* Lista de animais disponÃ­veis */}
            {loadingAnimais && !buscaAnimal ? (
              <div className="text-center py-4 text-gray-500">
                Carregando lista de animais...
              </div>
            ) : (
              animaisFiltrados.length > 0 ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                  {animaisFiltrados.map((animal) => (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => adicionarAnimal(animal)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {animal.serie}-{animal.rg}
                          </span>
                          {animal.nome && (
                            <span className="ml-2 text-gray-500 dark:text-gray-400">
                              ({animal.nome})
                            </span>
                          )}
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {animal.sexo} ââ‚¬¢ {animal.raca}
                          </span>
                        </div>
                        <PlusIcon className="h-5 w-5 text-blue-500" />
                      </div>
                    </button>
                  ))}
                  {animais.length > animaisFiltrados.length + animaisSelecionados.length && (
                    <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700">
                      Mostrando primeiros {animaisFiltrados.length} resultados. Use a busca para encontrar outros.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {buscaAnimal ? 'Nenhum animal encontrado.' : 'Nenhum animal disponÃ­vel para seleÃ§Ã£o.'}
                </div>
              )
            )}
          </div>

          {/* Lista de Animais Selecionados */}
          {animaisSelecionados.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {animaisSelecionados.length}
                  </span>
                  Animais Selecionados
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (animaisExpandidos.size === animaisSelecionados.length) {
                      setAnimaisExpandidos(new Set())
                    } else {
                      setAnimaisExpandidos(new Set(animaisSelecionados.map(a => a.id)))
                    }
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {animaisExpandidos.size === animaisSelecionados.length ? 'Colapsar Todos' : 'Expandir Todos'}
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {animaisSelecionados.map((animal, index) => {
                  const estaExpandido = animaisExpandidos.has(animal.id)
                  const temDados = animal.peso || animal.ce || animal.observacoes
                  
                  return (
                    <div
                      key={animal.id}
                      className={`border rounded-lg transition-all ${
                        estaExpandido 
                          ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 p-3' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2'
                      }`}
                    >
                      {/* CabeÃ§alho do Animal - Sempre VisÃ­vel */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-8">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleExpandirAnimal(animal.id)}
                            className="flex-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors flex items-center gap-2"
                          >
                            {estaExpandido ? (
                              <ChevronUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-bold text-gray-900 dark:text-white text-base">
                                {animal.serie}-{animal.rg}
                              </span>
                              {animal.nome && (
                                <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                                  ({animal.nome})
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {animal.sexo} ââ‚¬¢ {animal.raca}
                              </span>
                              {temDados && !estaExpandido && (
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  (com dados)
                                </span>
                              )}
                            </div>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerAnimal(animal.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1 transition-colors"
                          title="Remover animal"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Detalhes Expandidos */}
                      {estaExpandido && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              label="Peso (kg)"
                              type="number"
                              step="0.01"
                              value={animal.peso || ''}
                              onChange={(e) => atualizarDadosAnimal(animal.id, 'peso', e.target.value)}
                              placeholder="Ex: 350.5"
                            />

                            {animal.sexo === 'Macho' && (
                              <Input
                                label="CE - CircunferÃªncia Escrotal (cm)"
                                type="number"
                                step="0.1"
                                value={animal.ce || ''}
                                onChange={(e) => atualizarDadosAnimal(animal.id, 'ce', e.target.value)}
                                placeholder="Ex: 32.5"
                              />
                            )}

                            <div className={animal.sexo === 'Macho' ? '' : 'md:col-span-2'}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                ObservaÃ§Ãµes (opcional)
                              </label>
                              <textarea
                                value={animal.observacoes || ''}
                                onChange={(e) => atualizarDadosAnimal(animal.id, 'observacoes', e.target.value)}
                                rows={2}
                                className="input-field w-full"
                                placeholder="ObservaÃ§Ãµes especÃ­ficas deste animal..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || animaisSelecionados.length === 0}
            >
              {loading ? 'Processando...' : `Registrar ${animaisSelecionados.length} Animal(is)`}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

