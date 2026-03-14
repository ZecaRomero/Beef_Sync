
import React, { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/router'

export default function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  // Dados para busca
  const searchData = [
    // Páginas
    { type: 'page', title: 'Dashboard', description: 'Página inicial', url: '/', icon: '🏠' },
    { type: 'page', title: 'Animais', description: 'Gerenciar rebanho', url: '/animals', icon: '🐄' },
    { type: 'page', title: 'Nascimentos', description: 'Controle de nascimentos', url: '/nascimentos', icon: '🐄' },
    { type: 'page', title: 'Custos Individuais', description: 'Custos por animal', url: '/custos', icon: '💰' },
    { type: 'page', title: 'Gestações', description: 'Controle reprodutivo', url: '/gestacao', icon: '🤱' },
    { type: 'page', title: 'Relatórios', description: 'Análises e relatórios', url: '/reports', icon: '📊' },
    { type: 'page', title: 'Lançamento no APP', description: 'Histórico de operações do sistema', url: '/relatorios-lotes', icon: '📦' },
    { type: 'page', title: 'Teste de Lotes', description: 'Demonstração do sistema de lotes', url: '/teste-lotes', icon: '🔬' },
    { type: 'page', title: 'Histórico de Ocorrências', description: 'Registrar eventos dos animais', url: '/historico', icon: '📋' },
    { type: 'page', title: 'Estoque de Sêmen', description: 'Controle de material genético', url: '/estoque-semen', icon: '🧬' },
    { type: 'page', title: 'Relatórios de Histórico', description: 'Relatórios específicos por tipo', url: '/relatorios-historico', icon: '📈' },
    { type: 'page', title: 'Configurações', description: 'Configurações do sistema', url: '/settings', icon: '⚙️' },
    { type: 'page', title: 'Editor de Protocolos', description: 'Editar medicamentos e protocolos', url: '/protocol-editor', icon: '💊' },
    
    // Funcionalidades
    { type: 'action', title: 'Cadastrar Animal', description: 'Adicionar novo animal', action: () => router.push('/animals'), icon: '➕' },
    { type: 'action', title: 'Novo Nascimento', description: 'Registrar nascimento', action: () => router.push('/nascimentos'), icon: '🐄' },
    { type: 'action', title: 'Aplicar Protocolo', description: 'Aplicar protocolo sanitário', action: () => router.push('/custos'), icon: '💉' },
    { type: 'action', title: 'Preços de Mercado', description: 'Ver cotações atuais', action: () => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' }), icon: '📈' },
    
    // Animais serão carregados dinamicamente dos dados reais
    
    // Medicamentos
    { type: 'medicine', title: 'PANACOXX', description: 'Medicamento - R$ 9,10', url: '/protocol-editor', icon: '💊' },
    { type: 'medicine', title: 'BOVILIS', description: 'Vacina - R$ 0,61', url: '/protocol-editor', icon: '💊' },
    { type: 'medicine', title: 'DNA VIRGEM', description: 'Exame - R$ 50,00', url: '/protocol-editor', icon: '🧬' },
    { type: 'medicine', title: 'DNA GENOMICA', description: 'Exame - R$ 80,00', url: '/protocol-editor', icon: '🧬' },
    
    // Relatórios
    { type: 'report', title: 'Custos por Categoria', description: 'Análise de custos', url: '/reports', icon: '📊' },
    { type: 'report', title: 'ROI por Animal', description: 'Retorno sobre investimento', url: '/reports', icon: '📈' },
    { type: 'report', title: 'Nascimentos por Touro', description: 'Performance reprodutiva', url: '/reports', icon: '📋' }
  ]

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + K para abrir busca
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }
      
      // ESC para fechar
      if (event.key === 'Escape') {
        setIsOpen(false)
        setSearchTerm('')
        setSelectedIndex(0)
      }
      
      // Navegação com setas
      if (isOpen && results.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setSelectedIndex(prev => (prev + 1) % results.length)
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        } else if (event.key === 'Enter') {
          event.preventDefault()
          handleSelectResult(results[selectedIndex])
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, results, selectedIndex])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim() && typeof window !== 'undefined') {
      // Carregar animais reais do localStorage
      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      const births = JSON.parse(localStorage.getItem('birthData') || '[]')
      
      // Adicionar animais reais aos dados de busca
      const realAnimals = animals.map(animal => ({
        type: 'animal',
        title: `${animal.serie} ${animal.rg}`,
        description: `${animal.raca} - ${animal.situacao}`,
        url: '/animals',
        icon: '🐄'
      }))
      
      // Adicionar nascimentos reais
      const realBirths = births.map(birth => ({
        type: 'birth',
        title: birth.receptora,
        description: `${birth.touro} - ${birth.status}`,
        url: '/nascimentos',
        icon: '🐄'
      }))
      
      // Combinar todos os dados
      const allSearchData = [...searchData, ...realAnimals, ...realBirths]
      
      const filtered = allSearchData.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 8) // Máximo 8 resultados
      
      setResults(filtered)
      setSelectedIndex(0)
    } else {
      setResults([])
      setSelectedIndex(0)
    }
  }, [searchTerm])

  const handleSelectResult = (result) => {
    if (result.action) {
      result.action()
    } else if (result.url) {
      router.push(result.url)
    }
    setIsOpen(false)
    setSearchTerm('')
    setSelectedIndex(0)
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'page': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'action': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'animal': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'medicine': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'report': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'page': return 'Página'
      case 'action': return 'Ação'
      case 'animal': return 'Animal'
      case 'medicine': return 'Medicamento'
      case 'report': return 'Relatório'
      default: return 'Item'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-gray-600 dark:text-gray-400"
      >
        <span>🔍</span>
        <span className="text-sm">Buscar...</span>
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          Ctrl+K
        </kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header de busca */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Digite para buscar páginas, animais, medicamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                ESC
              </kbd>
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {result.description}
                    </p>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500">
                    →
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente buscar por "animais", "custos", "nascimentos" ou "relatórios"
              </p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Busca Rápida
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Digite para encontrar páginas, animais, medicamentos e mais
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
                  <span>Navegar</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                  <span>Selecionar</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
                  <span>Fechar</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {results.length > 0 ? `${results.length} resultados` : 'Digite para buscar'}
            </span>
            <span>
              Dica: Use Ctrl+K para abrir a busca rapidamente
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}