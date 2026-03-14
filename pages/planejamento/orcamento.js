import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  CurrencyDollarIcon,
  PlusIcon
} from '../../components/ui/Icons'

export default function BudgetPlanning() {
  const [mounted, setMounted] = useState(false)
  const [budgets, setBudgets] = useState([])
  const [showNewBudget, setShowNewBudget] = useState(false)
  const [newBudget, setNewBudget] = useState({
    category: '',
    description: '',
    planned: '',
    spent: '',
    month: new Date().toISOString().slice(0, 7)
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    loadBudgets()
  }, [mounted])

  const loadBudgets = async () => {
    try {
      if (typeof window === 'undefined') return

      const savedBudgets = localStorage.getItem('budgets')
      if (savedBudgets) {
        setBudgets(JSON.parse(savedBudgets))
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
    }
  }

  const handleAddBudget = () => {
    if (!newBudget.category.trim()) return
    
    const budget = {
      id: Date.now(),
      category: newBudget.category,
      description: newBudget.description,
      planned: parseFloat(newBudget.planned) || 0,
      spent: parseFloat(newBudget.spent) || 0,
      month: newBudget.month
    }
    
    const updatedBudgets = [...budgets, budget]
    setBudgets(updatedBudgets)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('budgets', JSON.stringify(updatedBudgets))
    }
    
    setNewBudget({
      category: '',
      description: '',
      planned: '',
      spent: '',
      month: new Date().toISOString().slice(0, 7)
    })
    setShowNewBudget(false)
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthBudgets = budgets.filter(b => b.month === currentMonth)
  
  const totalPlanned = monthBudgets.reduce((sum, b) => sum + b.planned, 0)
  const totalSpent = monthBudgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalPlanned - totalSpent
  const percentageSpent = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando orçamento...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            Planejamento Orçamentário
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Controle de despesas de {new Date(currentMonth + '-01').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button onClick={() => setShowNewBudget(true)} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Novo Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Orçado</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlanned)}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gasto</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalSpent)}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Restante</p>
          <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalRemaining)}
          </p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">% Gasto</p>
          <p className="text-2xl font-bold text-purple-600">{percentageSpent.toFixed(1)}%</p>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progresso do Orçamento</h3>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              percentageSpent >= 100 ? 'bg-red-500' :
              percentageSpent >= 80 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
          ></div>
        </div>
      </Card>

      {/* Budget Items */}
      <div className="space-y-4">
        {monthBudgets.map(budget => {
          const percentage = budget.planned > 0 ? (budget.spent / budget.planned) * 100 : 0
          return (
            <Card key={budget.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {budget.category}
                  </h3>
                  {budget.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {budget.description}
                    </p>
                  )}
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  percentage >= 100 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                  percentage >= 80 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                }`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full ${
                    percentage >= 100 ? 'bg-red-500' :
                    percentage >= 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Orçado</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(budget.planned)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Gasto</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(budget.spent)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Diferença</p>
                  <p className={`font-semibold ${budget.spent <= budget.planned ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(budget.planned - budget.spent)}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* New Budget Modal */}
      {showNewBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Novo Item Orçamentário
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria *
                </label>
                <input
                  type="text"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
            placeholder="Ex: Manutenção"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newBudget.description}
                  onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
                  placeholder="Detalhes da despesa..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Orçado (R$)
                  </label>
                  <input
                    type="number"
                    value={newBudget.planned}
                    onChange={(e) => setNewBudget({ ...newBudget, planned: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gasto (R$)
                  </label>
                  <input
                    type="number"
                    value={newBudget.spent}
                    onChange={(e) => setNewBudget({ ...newBudget, spent: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mês
                </label>
                <input
                  type="month"
                  value={newBudget.month}
                  onChange={(e) => setNewBudget({ ...newBudget, month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowNewBudget(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddBudget}
                className="flex-1"
              >
                Adicionar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
