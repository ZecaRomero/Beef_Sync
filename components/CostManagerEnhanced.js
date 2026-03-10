import React, { useEffect, useState } from 'react'
import {
  PlusIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ChartBarIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function CostManagerEnhanced() {
  const [animals, setAnimals] = useState([])
  const [custos, setCustos] = useState([])
  const [filtros, setFiltros] = useState({
    sexo: '',
    lote: '',
    idadeMin: '',
    idadeMax: '',
    dataInicio: '',
    dataFim: '',
    tipoCusto: ''
  })
  const [agrupamento, setAgrupamento] = useState('animal') // animal, lote, sexo, mes, tipo
  const [showAddCusto, setShowAddCusto] = useState(false)
  const [showAddCustoLote, setShowAddCustoLote] = useState(false)
  const [newCusto, setNewCusto] = useState({
    tipo: '',
    subtipo: '',
    valor: '',
    observacoes: '',
    data: new Date().toISOString().split('T')[0]
  })
  const [selectedAnimals, setSelectedAnimals] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const resAnimals = await fetch('/api/animals')
      if (resAnimals.ok) {
        const data = await resAnimals.json()
        setAnimals(data.data || data || [])
      }

      const resCustos = await fetch('/api/custos')
      if (resCustos.ok) {
        const data = await resCustos.json()
        setCustos(data.data || data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const animaisFiltrados = animals.filter(animal => {
    if (filtros.sexo && animal.sexo !== filtros.sexo) return false
    if (filtros.lote && animal.lote !== filtros.lote) return false
    
    const idade = animal.meses || 0
    if (filtros.idadeMin && idade < parseInt(filtros.idadeMin)) return false
    if (filtros.idadeMax && idade > parseInt(filtros.idadeMax)) return false
    
    return true
  })

  const custosFiltrados = custos.filter(custo => {
    if (filtros.dataInicio && custo.data < filtros.dataInicio) return false
    if (filtros.dataFim && custo.data > filtros.dataFim) return false
    if (filtros.tipoCusto && custo.tipo !== filtros.tipoCusto) return false
    
    return true
  })

  const getCustosAnimal = (animalId) => {
    return custosFiltrados.filter(c => c.animal_id === animalId)
  }

  const getTotalCustos = (animalId) => {
    return getCustosAnimal(animalId).reduce((sum, c) => sum + parseFloat(c.valor || 0), 0)
  }

  const agruparPorAnimal = () => animaisFiltrados.map(a => ({ key: a.id, label: a.nome || a.serie, total: getTotalCustos(a.id), animais: [a] }))
  const agruparPorSexo = () => []
  const agruparPorLote = () => []
  const agruparPorMes = () => []
  const agruparPorTipo = () => []

  const getDadosAgrupados = () => {
    switch (agrupamento) {
      case 'sexo':
        return agruparPorSexo()
      case 'lote':
        return agruparPorLote()
      case 'mes':
        return agruparPorMes()
      case 'tipo':
        return agruparPorTipo()
      default:
        return agruparPorAnimal()
    }
  }

  return (
    <div className="p-4">
      <p className="text-gray-600 dark:text-gray-400">CostManagerEnhanced (em desenvolvimento)</p>
    </div>
  )
}
