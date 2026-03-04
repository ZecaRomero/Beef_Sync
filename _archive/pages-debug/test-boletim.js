

import React, { useEffect, useState } from 'react'

export default function TestBoletim() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState(null)

  useEffect(() => {
    loadAnimals()
  }, [])

  const loadAnimals = () => {
    try {
      const animalsData = JSON.parse(localStorage.getItem('animals') || '[]')
      setAnimals(animalsData)
      console.log('🔍 Animais carregados:', animalsData.length)
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
    } finally {
      setLoading(false)
    }
  }

  const testBoletim = async () => {
    try {
      setLoading(true)
      
      // Verificar se animals é um array válido
      if (!Array.isArray(animals) || animals.length === 0) {
        alert('❌ Nenhum animal encontrado. Carregue alguns animais primeiro.')
        return
      }
      
      const period = {
        startDate: '2025-09-30',
        endDate: '2025-10-30'
      }
      
      console.log('🧪 Testando boletim com dados:', {
        totalAnimais: animals.length,
        animais: animals.map(a => ({
          serie: a.serie,
          rg: a.rg,
          raca: a.raca,
          dataNascimento: a.dataNascimento,
          data_nascimento: a.data_nascimento,
          sexo: a.sexo
        }))
      })
      
      const response = await fetch('/api/contabilidade/boletim-gado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          period,
          animalsData: animals
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar boletim')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `teste-boletim-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert('✅ Boletim de teste gerado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao testar boletim:', error)
      alert('❌ Erro ao gerar boletim de teste: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const analyzeAnimals = () => {
    // Verificar se animals é um array válido
    if (!Array.isArray(animals) || animals.length === 0) {
      setTestResults({
        total: 0,
        racas: {},
        semDataNascimento: [],
        comDataNascimento: [],
        idades: {}
      })
      return
    }
    
    const analysis = {
      total: animals.length,
      racas: {},
      semDataNascimento: [],
      comDataNascimento: [],
      idades: {}
    }

    animals.forEach(animal => {
      // Contar raças
      const raca = animal.raca || 'Não informado'
      analysis.racas[raca] = (analysis.racas[raca] || 0) + 1

      // Verificar data de nascimento
      const dataNascimento = animal.dataNascimento || animal.data_nascimento
      
      if (!dataNascimento) {
        analysis.semDataNascimento.push({
          serie: animal.serie,
          rg: animal.rg,
          raca: animal.raca
        })
      } else {
        analysis.comDataNascimento.push({
          serie: animal.serie,
          rg: animal.rg,
          raca: animal.raca,
          dataNascimento: dataNascimento
        })

        // Calcular idade
        const nascimento = new Date(dataNascimento)
        const hoje = new Date()
        const idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44))
        
        analysis.idades[raca] = analysis.idades[raca] || []
        analysis.idades[raca].push({
          serie: animal.serie,
          rg: animal.rg,
          idadeMeses: idadeMeses
        })
      }
    })

    setTestResults(analysis)
    console.log('🔍 Análise dos animais:', analysis)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🧪 Teste - Boletim de Gado
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📊 Status Atual
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Total de Animais:</strong> {animals.length}</p>
                <p><strong>Raças Únicas:</strong> {new Set(animals.map(a => a.raca)).size}</p>
                <p><strong>Com Data Nascimento:</strong> {animals.filter(a => a.dataNascimento || a.data_nascimento).length}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Total de Animais</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Array.isArray(animals) ? animals.length : 0}</p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Raças Únicas</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Array.isArray(animals) ? new Set(animals.map(a => a.raca)).size : 0}
                </p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Status</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Array.isArray(animals) && animals.length > 0 ? 'Dados Carregados' : 'Sem Dados'}
                </p>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                🎯 Ações
              </h3>
              <div className="space-y-2 text-sm">
                <p>Teste o boletim com dados reais</p>
                <p>Analise a estrutura dos dados</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Problema
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Receptora:</strong> Não aparece no boletim</p>
                <p><strong>Causa:</strong> Verificar dados e cálculos</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={testBoletim}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🧪 Gerar Boletim de Teste
            </button>
            
            <button
              onClick={analyzeAnimals}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔍 Analisar Dados
            </button>
            
            <button
              onClick={loadAnimals}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Recarregar Dados
            </button>
            
            <a
              href="/contabilidade"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
            >
              👀 Voltar para Contabilidade
            </a>
          </div>
        </div>

        {/* Lista de Animais */}
        {animals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📋 Animais Cadastrados ({animals.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Série/RG</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Raça</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sexo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data Nascimento</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(animals) && animals.length > 0 ? animals.map((animal) => {
                    const identificacao = `${animal.serie || 'N/A'}-${animal.rg || 'N/A'}`
                    const dataNasc = animal.dataNascimento || animal.data_nascimento || 'Não informado'
                    
                    return (
                      <tr key={identificacao} className="border-b">
                        <td className="px-4 py-2">{identificacao}</td>
                        <td className="px-4 py-2">{animal.raca || 'Não informado'}</td>
                        <td className="px-4 py-2">{animal.sexo || 'Não informado'}</td>
                        <td className="px-4 py-2">{dataNasc}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {animal.situacao || 'Ativo'}
                          </span>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        Nenhum animal encontrado. Carregue alguns animais primeiro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultados da Análise */}
        {testResults && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔍 Resultados da Análise
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">📊 Resumo</h3>
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
                  <p><strong>Total:</strong> {testResults.total} animais</p>
                  <p><strong>Com Data:</strong> {testResults.comDataNascimento.length}</p>
                  <p><strong>Sem Data:</strong> {testResults.semDataNascimento.length}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">🏷️ Por Raça</h3>
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
                  {Object.entries(testResults.racas).map(([raca, count]) => (
                    <p key={raca}><strong>{raca}:</strong> {count} animais</p>
                  ))}
                </div>
              </div>
            </div>

            {testResults.semDataNascimento.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">⚠️ Animais Sem Data de Nascimento</h3>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  {testResults.semDataNascimento.map((animal, index) => (
                    <p key={index} className="text-sm text-red-700 dark:text-red-300">
                      {animal.serie} {animal.rg} - {animal.raca}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">📅 Idades Calculadas</h3>
              <div className="space-y-4">
                {Object.entries(testResults.idades).map(([raca, animais]) => (
                  <div key={raca} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{raca}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {animais.map((animal, index) => (
                        <p key={index} className="text-gray-700 dark:text-gray-300">
                          {animal.serie} {animal.rg}: {animal.idadeMeses} meses
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
