import React, { useState, useEffect } from 'react'
import { 
  CheckIcon,
  PrinterIcon,
  DocumentTextIcon,
  BeakerIcon,
  MapPinIcon,
  HashtagIcon,
  PlusIcon,
  MinusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

export default function SemenCollectionManager() {
  const [touros, setTouros] = useState([])
  const [selectedTouros, setSelectedTouros] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    localizacao: '',
    status: 'Disponivel'
  })

  useEffect(() => {
    loadTouros()
  }, [])

  const loadTouros = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/estoque-semen')
      if (response.ok) {
        const data = await response.json()
        setTouros(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar touros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTouroSelect = (touro, isSelected) => {
    if (isSelected) {
      setSelectedTouros(prev => [...prev, {
        ...touro,
        dosesToCollect: 5 // Quantidade padrão
      }])
    } else {
      setSelectedTouros(prev => prev.filter(t => t.id !== touro.id))
    }
  }

  const updateDosesToCollect = (touroId, doses) => {
    setSelectedTouros(prev => prev.map(t => 
      t.id === touroId ? { ...t, dosesToCollect: Math.max(1, doses) } : t
    ))
  }

  const filteredTouros = touros.filter(touro => {
    const matchesSearch = !filters.search || 
      touro.nome_touro?.toLowerCase().includes(filters.search.toLowerCase()) ||
      touro.rg_touro?.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesLocation = !filters.localizacao || 
      touro.localizacao?.toLowerCase().includes(filters.localizacao.toLowerCase())
    
    const matchesStatus = !filters.status || touro.status === filters.status

    return matchesSearch && matchesLocation && matchesStatus
  })

  const generateReport = () => {
    if (selectedTouros.length === 0) {
      alert('⚠️ Selecione pelo menos um touro para gerar o relatório')
      return
    }
    setShowReport(true)
  }

  const printReport = () => {
    window.print()
  }

  const exportToExcel = async () => {
    try {
      const reportData = {
        title: 'Relatório de Coleta de Sêmen',
        date: new Date().toLocaleDateString('pt-BR'),
        touros: selectedTouros.map(touro => ({
          nome: touro.nome_touro,
          rg: touro.rg_touro,
          raca: touro.raca,
          localizacao: touro.localizacao,
          rack: touro.rack || 'N/A',
          dosesToCollect: touro.dosesToCollect,
          observacoes: ''
        }))
      }

      const response = await fetch('/api/reports/semen-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `coleta-semen-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('✅ Relatório exportado com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('❌ Erro ao exportar relatório')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando touros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BeakerIcon className="h-8 w-8 mr-3 text-blue-600" />
            Coleta de Sêmen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Selecione os touros para coleta e gere o relatório de trabalho
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowReport(true)}
            leftIcon={<EyeIcon className="h-4 w-4" />}
            disabled={selectedTouros.length === 0}
          >
            Visualizar ({selectedTouros.length})
          </Button>
          <Button
            variant="primary"
            onClick={generateReport}
            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
            disabled={selectedTouros.length === 0}
          >
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtros de Pesquisa
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Buscar Touro"
              placeholder="Nome ou RG do touro..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <Input
              label="Localização"
              placeholder="Piquete, curral..."
              value={filters.localizacao}
              onChange={(e) => setFilters(prev => ({ ...prev, localizacao: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="Disponivel">Disponível</option>
                <option value="Indisponivel">Indisponível</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Selected Touros Summary */}
      {selectedTouros.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Touros Selecionados ({selectedTouros.length})
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedTouros.map(touro => (
                <div key={touro.id} className="p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {touro.nome_touro}
                    </h4>
                    <button
                      onClick={() => handleTouroSelect(touro, false)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    RG: {touro.rg_touro} | {touro.localizacao}
                  </p>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Doses:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={touro.dosesToCollect}
                      onChange={(e) => updateDosesToCollect(touro.id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Total de doses a coletar: {selectedTouros.reduce((sum, t) => sum + t.dosesToCollect, 0)}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Touros List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Touros Disponíveis ({filteredTouros.length})
          </h3>
        </CardHeader>
        <CardBody>
          {filteredTouros.length === 0 ? (
            <div className="text-center py-8">
              <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum touro encontrado com os filtros aplicados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTouros.map(touro => {
                const isSelected = selectedTouros.some(t => t.id === touro.id)
                return (
                  <div
                    key={touro.id}
                    className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                    onClick={() => handleTouroSelect(touro, !isSelected)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {touro.nome_touro}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center">
                                <HashtagIcon className="h-4 w-4 mr-1" />
                                RG: {touro.rg_touro}
                              </span>
                              <span className="flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {touro.localizacao}
                              </span>
                              {touro.rack && (
                                <span>Rack: {touro.rack}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          touro.status === 'Disponivel' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {touro.status}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Doses: {touro.doses_disponiveis || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Report Modal */}
      <Modal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        title="Relatório de Coleta de Sêmen"
        size="xl"
      >
        <SemenCollectionReport 
          touros={selectedTouros}
          onPrint={printReport}
          onExport={exportToExcel}
        />
      </Modal>
    </div>
  )
}

// Componente do Relatório
function SemenCollectionReport({ touros, onPrint, onExport }) {
  const currentDate = new Date().toLocaleDateString('pt-BR')
  const currentTime = new Date().toLocaleTimeString('pt-BR')
  const totalDoses = touros.reduce((sum, t) => sum + t.dosesToCollect, 0)

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="text-center border-b pb-4 print:border-black semen-report-header">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          RELATÓRIO DE COLETA DE SÊMEN
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Data: {currentDate} | Hora: {currentTime}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 text-center semen-report-summary print:keep-together">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{touros.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Touros</p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{totalDoses}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Doses</p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(totalDoses / touros.length)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Média/Touro</p>
        </div>
      </div>

      {/* Touros Table */}
      <div className="overflow-x-auto semen-report-table">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Nome do Touro
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                RG
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Raça
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Localização
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Rack
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                Doses a Coletar
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Observações
              </th>
            </tr>
          </thead>
          <tbody>
            {touros.map((touro, index) => (
              <tr key={touro.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium">
                  {touro.nome_touro}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  {touro.rg_touro}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  {touro.raca || 'N/A'}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  {touro.localizacao}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  {touro.rack || 'N/A'}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-bold bg-blue-50">
                  {touro.dosesToCollect}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  {/* Espaço para observações manuais */}
                  <div className="h-6 border-b border-dotted border-gray-300 observation-lines"></div>
                </td>
              </tr>
            ))}
            {/* Linha de Total */}
            <tr className="bg-blue-100 dark:bg-blue-900/30 font-bold">
              <td colSpan="5" className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">
                TOTAL:
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center bg-blue-200 dark:bg-blue-800">
                {totalDoses}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 space-y-4 semen-report-signatures print:keep-together">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-medium mb-2">Responsável pela Coleta:</p>
            <div className="border-b border-dotted border-gray-400 h-8 signature-line"></div>
          </div>
          <div>
            <p className="font-medium mb-2">Data/Hora da Coleta:</p>
            <div className="border-b border-dotted border-gray-400 h-8 signature-line"></div>
          </div>
        </div>
        
        <div>
          <p className="font-medium mb-2">Observações Gerais:</p>
          <div className="space-y-2">
            <div className="border-b border-dotted border-gray-400 h-6 observation-lines"></div>
            <div className="border-b border-dotted border-gray-400 h-6 observation-lines"></div>
            <div className="border-b border-dotted border-gray-400 h-6 observation-lines"></div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Beef-Sync - Sistema de Gestão Pecuária</p>
          <p>Relatório gerado em {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 print:hidden">
        <Button
          variant="secondary"
          onClick={onPrint}
          leftIcon={<PrinterIcon className="h-4 w-4" />}
        >
          Imprimir
        </Button>
        <Button
          variant="primary"
          onClick={onExport}
          leftIcon={<DocumentTextIcon className="h-4 w-4" />}
        >
          Exportar Excel
        </Button>
      </div>
    </div>
  )
}