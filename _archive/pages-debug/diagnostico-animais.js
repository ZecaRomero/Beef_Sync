
import React, { useEffect, useState } from 'react'

import SimpleCard, { SimpleCardHeader as CardHeader, SimpleCardBody as CardBody } from '../components/ui/SimpleCard'
import Button from '../components/ui/Button'
import { 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '../components/ui/Icons'

export default function DiagnosticoAnimais() {
  const [animals, setAnimals] = useState([])
  const [apiAnimals, setApiAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [diagnostico, setDiagnostico] = useState({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      carregarDiagnostico()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient])

  const carregarDiagnostico = async () => {
    try {
      setLoading(true)
      
      // Verificar se estamos no navegador antes de acessar localStorage
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }
      
      // Carregar do localStorage
      const localStorageAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
      setAnimals(localStorageAnimals)
      
      // Carregar da API
      let apiData = []
      try {
        const response = await fetch('/api/animals')
        if (response.ok) {
          apiData = await response.json()
          apiData = Array.isArray(apiData) ? apiData : []
          setApiAnimals(apiData)
        } else {
          console.error('Erro na API:', response.status)
          setApiAnimals([])
        }
      } catch (error) {
        console.error('Erro ao carregar da API:', error)
        setApiAnimals([])
      }
      
      // Gerar diagnóstico usando os dados carregados diretamente
      const diag = {
        localStorage: localStorageAnimals.length,
        api: apiData.length,
        diferenca: localStorageAnimals.length - apiData.length,
        ultimosCadastrados: localStorageAnimals.slice(-10),
        problemas: []
      }
      
      if (diag.localStorage > 0 && diag.api === 0) {
        diag.problemas.push('❌ API não está retornando animais (possível problema no PostgreSQL)')
      }
      
      if (diag.localStorage === 0) {
        diag.problemas.push('⚠️ Nenhum animal no localStorage')
      }
      
      if (diag.diferenca > 0) {
        diag.problemas.push(`⚠️ ${diag.diferenca} animal(is) no localStorage não aparecem na API`)
      }
      
      setDiagnostico(diag)
      
    } catch (error) {
      console.error('Erro no diagnóstico:', error)
    } finally {
      setLoading(false)
    }
  }

  const sincronizarDados = () => {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') {
      return
    }
    
    // Copiar dados do localStorage para a API (simulação)
    const localStorageAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
    
    localStorageAnimals.forEach(async (animal) => {
      try {
        const response = await fetch('/api/animals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serie: animal.serie,
            rg: animal.rg,
            sexo: animal.sexo,
            raca: animal.raca,
            data_nascimento: animal.dataNascimento,
            peso: animal.peso,
            situacao: animal.situacao || 'Ativo',
            pai: animal.pai,
            mae: animal.mae,
            observacoes: animal.observacoes
          })
        })
        
        if (response.ok) {
          console.log('✅ Animal sincronizado:', animal.serie, animal.rg)
        } else {
          console.error('❌ Erro ao sincronizar:', animal.serie, animal.rg)
        }
      } catch (error) {
        console.error('❌ Erro na sincronização:', error)
      }
    })
    
    alert('🔄 Sincronização iniciada! Verifique o console para detalhes.')
    setTimeout(() => carregarDiagnostico(), 2000)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 'N/A'
    const nascimento = new Date(dataNascimento)
    const hoje = new Date()
    const idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44))
    return `${idadeMeses} meses`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando diagnóstico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <MagnifyingGlassIcon className="h-8 w-8 mr-3" />
              Diagnóstico de Animais
            </h1>
            <p className="text-blue-100 mt-2">
              Verificação completa do sistema de cadastro de animais
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={carregarDiagnostico}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Resumo do Diagnóstico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimpleCard>
          <CardBody>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {diagnostico.localStorage || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                LocalStorage
              </div>
            </div>
          </CardBody>
        </SimpleCard>

        <SimpleCard>
          <CardBody>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {diagnostico.api || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                API/PostgreSQL
              </div>
            </div>
          </CardBody>
        </SimpleCard>

        <SimpleCard>
          <CardBody>
            <div className="text-center">
              <div className={`text-2xl font-bold ${diagnostico.diferenca > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {diagnostico.diferenca || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Diferença
              </div>
            </div>
          </CardBody>
        </SimpleCard>
      </div>

      {/* Problemas Identificados */}
      {diagnostico.problemas && diagnostico.problemas.length > 0 && (
        <SimpleCard>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Problemas Identificados
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {diagnostico.problemas.map((problema, index) => (
                <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">{problema}</p>
                </div>
              ))}
            </div>
            
            {diagnostico.diferenca > 0 && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  onClick={sincronizarDados}
                  leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                >
                  Sincronizar com API
                </Button>
              </div>
            )}
          </CardBody>
        </SimpleCard>
      )}

      {/* Últimos 10 Animais Cadastrados */}
      <SimpleCard>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
            Últimos 10 Animais Cadastrados
          </h3>
        </CardHeader>
        <CardBody>
          {diagnostico.ultimosCadastrados && diagnostico.ultimosCadastrados.length > 0 ? (
            <div className="space-y-3">
              {diagnostico.ultimosCadastrados.map((animal, index) => (
                <div key={animal.id || index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {animal.serie} {animal.rg}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          animal.sexo === 'Macho' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                          'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300'
                        }`}>
                          {animal.sexo}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {animal.raca}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <strong>Idade:</strong> {calcularIdade(animal.dataNascimento)}
                        </div>
                        <div>
                          <strong>Peso:</strong> {animal.peso ? `${animal.peso} kg` : 'N/A'}
                        </div>
                        <div>
                          <strong>Situação:</strong> {animal.situacao || 'Ativo'}
                        </div>
                        <div>
                          <strong>Cadastrado:</strong> {formatDate(animal.dataCadastro)}
                        </div>
                      </div>
                      
                      {(animal.pai || animal.mae) && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <strong>Genealogia:</strong> 
                          {animal.pai && ` Pai: ${animal.pai}`}
                          {animal.mae && ` Mãe: ${animal.mae}`}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        ID: {animal.id}
                      </span>
                      {animal.dataNascimento ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" title="Data de nascimento cadastrada" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" title="Sem data de nascimento" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum animal encontrado no localStorage
              </p>
            </div>
          )}
        </CardBody>
      </SimpleCard>

      {/* Instruções */}
      <SimpleCard>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📋 Instruções para Resolver Problemas
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p><strong>1. Se animais não aparecem na lista:</strong></p>
              <p>• Verifique se o PostgreSQL está rodando</p>
              <p>• Use o botão "Sincronizar com API" acima</p>
              <p>• Verifique os logs do servidor</p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p><strong>2. Para cadastrar novos animais:</strong></p>
              <p>• Vá em "Animais" → "Lista de Animais"</p>
              <p>• Clique em "+ Novo Animal"</p>
              <p>• Preencha os dados obrigatórios</p>
            </div>
            
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p><strong>3. Se o problema persistir:</strong></p>
              <p>• Reinicie o servidor (Ctrl+C e npm run dev)</p>
              <p>• Verifique a conexão com o banco de dados</p>
              <p>• Limpe o cache do navegador</p>
            </div>
          </div>
        </CardBody>
      </SimpleCard>
    </div>
  )
}
