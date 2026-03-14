
import React, { useEffect, useState } from 'react'

import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, DocumentArrowDownIcon } from './ui/Icons'
import animalDataManager from '../services/animalDataManager'
import * as XLSX from 'xlsx'
import { exportToExcelWithFormatting } from '../utils/excelExporter'
import NascimentosStatistics from './reports/NascimentosStatistics'

export default function BirthManager({ onNewBirth, onEditBirth }) {
  const [births, setBirths] = useState([])
  const [receptoras, setReceptoras] = useState([])
  const [filters, setFilters] = useState({
    touro: '',
    sexo: '',
    status: '',
    mes: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Estados para seleção múltipla
  const [selectedBirths, setSelectedBirths] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Carregar dados
  useEffect(() => {
    loadBirths()
    loadReceptoras()
  }, [])

  const loadBirths = async () => {
    try {
      const response = await fetch('/api/births')
      if (response.ok) {
        const data = await response.json()
        // Garantir que data seja sempre um array
        const birthsArray = Array.isArray(data) ? data : (data.data || [])
        setBirths(birthsArray)
      } else {
        console.error('Erro ao carregar nascimentos')
        setBirths([])
      }
    } catch (error) {
      console.error('Erro ao carregar nascimentos:', error)
      setBirths([])
    }
  }

  const loadReceptoras = async () => {
    try {
      const animals = await animalDataManager.getAllAnimals()
      const list = Array.isArray(animals) ? animals : []
      const receptorasAtivas = list.filter(a =>
        a && a.raca === 'Receptora' && a.situacao === 'Ativo'
      )
      setReceptoras(receptorasAtivas)
    } catch (e) {
      console.error('Erro ao carregar receptoras:', e)
      setReceptoras([])
    }
  }

  const saveBirths = (newBirths) => {
    setBirths(newBirths)
  }

  // Funções para seleção múltipla
  const handleSelectBirth = (birthId) => {
    setSelectedBirths(prev => {
      if (prev.includes(birthId)) {
        return prev.filter(id => id !== birthId)
      } else {
        return [...prev, birthId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedBirths([])
    } else {
      setSelectedBirths(paginatedBirths.map(birth => birth.id))
    }
    setSelectAll(!selectAll)
  }

  const handleDeleteSelected = () => {
    if (selectedBirths.length === 0) {
      alert('Selecione pelo menos um registro para excluir')
      return
    }
    setShowDeleteModal(true)
  }

  const confirmDeleteSelected = async () => {
    try {
      let successCount = 0
      let errorCount = 0

      for (const id of selectedBirths) {
        try {
          const response = await fetch(`/api/births/${id}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
          console.error(`Erro ao excluir nascimento ${id}:`, error)
        }
      }

      // Atualizar a lista removendo os itens excluídos
      const updatedBirths = (births || []).filter(birth => !selectedBirths.includes(birth.id))
      saveBirths(updatedBirths)
      setSelectedBirths([])
      setSelectAll(false)
      setShowDeleteModal(false)

      if (errorCount === 0) {
        alert(`✅ ${successCount} registro(s) excluído(s) com sucesso!`)
      } else {
        alert(`⚠️ ${successCount} registro(s) excluído(s), ${errorCount} erro(s) encontrado(s).`)
      }
    } catch (error) {
      console.error('Erro na exclusão múltipla:', error)
      alert('❌ Erro na exclusão múltipla. Tente novamente.')
    }
  }

  const handleDeleteSingle = async (birthId) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        const response = await fetch(`/api/births/${birthId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          const updatedBirths = (births || []).filter(birth => birth.id !== birthId)
          saveBirths(updatedBirths)
          setSelectedBirths(prev => prev.filter(id => id !== birthId))
          alert('Registro excluído com sucesso!')
        } else {
          const errorData = await response.json()
          alert(`Erro ao excluir: ${errorData.message}`)
        }
      } catch (error) {
        console.error('Erro ao excluir nascimento:', error)
        alert('Erro ao excluir nascimento. Tente novamente.')
      }
    }
  }

  // Sistema carrega dados reais do banco de dados PostgreSQL via API

  // Filtrar nascimentos
  const filteredBirths = (births || []).filter(birth => {
    // Verificar se birth existe e tem as propriedades necessárias
    if (!birth || typeof birth !== 'object') return false
    
    const matchesSearch =
      (birth.receptora?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (birth.touro?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (birth.observacao?.toLowerCase().includes(searchTerm.toLowerCase()) || false)

    const matchesFilters =
      (!filters.touro || (birth.touro?.includes(filters.touro) || false)) &&
      (!filters.sexo || birth.sexo === filters.sexo) &&
      (!filters.status || birth.status === filters.status) &&
      (!filters.mes || (birth.nascimento?.includes(filters.mes) || false) || (birth.data?.includes(filters.mes) || false)) &&
      (!filters.ano || (birth.nascimento?.includes(`/${filters.ano}`) || false) || (birth.data?.includes(`/${filters.ano}`) || false))

    return matchesSearch && matchesFilters
  })

  // Paginação
  const totalPages = Math.ceil(filteredBirths.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBirths = filteredBirths.slice(startIndex, endIndex)

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // Atualizar estado do "selecionar todos" baseado na seleção individual
  useEffect(() => {
    if (paginatedBirths.length > 0) {
      const allSelected = paginatedBirths.every(birth => selectedBirths.includes(birth.id))
      setSelectAll(allSelected)
    }
  }, [selectedBirths, paginatedBirths])

  // Estatísticas detalhadas
  const stats = {
    total: (births || []).length,
    nascidos: (births || []).filter(b => b.status === 'nascido').length,
    partoPrevisto: (births || []).filter(b => b.status === 'parto_previsto').length,
    machos: (births || []).filter(b => b.sexo === 'M' && b.status === 'nascido').length,
    femeas: (births || []).filter(b => b.sexo === 'F' && b.status === 'nascido').length,
    mortos: (births || []).filter(b => b.status === 'morto').length,
    abortos: (births || []).filter(b => b.status === 'aborto').length,
    cio: (births || []).filter(b => b.status === 'cio').length,
    gestantes: (births || []).filter(b => b.status === 'gestante' || b.status === 'parto_previsto').length,
    atrasadas: (births || []).filter(b => b.status === 'gestante_atrasada').length,
    descartes: (births || []).filter(b => b.descarte === true).length,
    totalPerdas: (births || []).filter(b => ['morto', 'aborto', 'cio'].includes(b.status)).length,
    custoTotalDNA: (births || []).reduce((acc, b) => acc + (parseFloat(b.custoDNA) || 0), 0),
    fiv: (births || []).filter(b => b.tipoCobertura === 'FIV').length,
    ia: (births || []).filter(b => b.tipoCobertura === 'IA').length
  }

  // Estatísticas por touro
  const statsByTouro = (births || []).reduce((acc, birth) => {
    if (!acc[birth.touro]) {
      acc[birth.touro] = { total: 0, machos: 0, femeas: 0, nascidos: 0 }
    }
    acc[birth.touro].total++
    if (birth.status === 'nascido') {
      acc[birth.touro].nascidos++
      if (birth.sexo === 'M') acc[birth.touro].machos++
      if (birth.sexo === 'F') acc[birth.touro].femeas++
    }
    return acc
  }, {})

  const getStatusColor = (status) => {
    switch (status) {
      case 'nascido': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'parto_previsto': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'morto': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'aborto': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'gestante': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'gestante_atrasada': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'nascido': return 'Nascido'
      case 'parto_previsto': return 'Parto previsto'
      case 'morto': return 'Morto'
      case 'aborto': return 'Aborto'
      case 'cio': return 'Cio'
      case 'gestante': return 'Gestante'
      case 'gestante_atrasada': return 'Atrasada'
      default: return status
    }
  }

  // Função para exportar para Excel com formatação profissional
  const exportToExcel = () => {
    try {
      // Preparar dados principais
      const dataToExport = (births || []).map(birth => [
        birth.receptora,
        birth.doador,
        birth.rg,
        birth.prevParto,
        birth.nascimento,
        birth.tatuagem,
        birth.cc,
        birth.ps1,
        birth.ps2,
        birth.sexo === 'M' ? 'Macho' : birth.sexo === 'F' ? 'Fêmea' : '',
        getStatusLabel(birth.status),
        birth.touro,
        birth.data,
        birth.observacao,
        birth.tipoCobertura,
        birth.custoDNA ? `R$ ${parseFloat(birth.custoDNA).toFixed(2)}` : '',
        birth.descarte ? 'SIM' : 'NÃO',
        birth.morte
      ])

      // Cabeçalhos da planilha principal
      const headers = [
        'Receptora', 'Doador', 'RG', 'Prev Parto', 'Nascimento', 'Tatuagem',
        'CC', 'PS1', 'PS2', 'Sexo', 'Status', 'Touro', 'Data Real',
        'Observações', 'Tipo Cobertura', 'Custo DNA', 'Descarte', 'Morte'
      ]

      // Criar workbook
      const wb = XLSX.utils.book_new()

      // Planilha principal com formatação
      const wsData = [headers, ...dataToExport]
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Definir larguras das colunas
      const colWidths = [
        { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 8 },
        { wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 8 }
      ]
      ws['!cols'] = colWidths

      // Aplicar formatação ao cabeçalho
      const headerRange = XLSX.utils.decode_range(ws['!ref'])
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellAddress]) continue

        ws[cellAddress].s = {
          fill: { fgColor: { rgb: "1F4E79" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      }

      // Aplicar formatação às células de dados
      for (let row = 1; row <= headerRange.e.r; row++) {
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!ws[cellAddress]) continue

          ws[cellAddress].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            },
            font: { sz: 10 }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Nascimentos')

      // Planilha de Resumo formatada
      const resumoHeaders = ['Métrica', 'Valor']
      const resumoData = [
        ['Total de Registros', stats.total],
        ['Nascimentos', stats.nascidos],
        ['Machos', stats.machos],
        ['Fêmeas', stats.femeas],
        ['Perdas Totais', stats.totalPerdas],
        ['Mortos', stats.mortos],
        ['Abortos', stats.abortos],
        ['Cio (Repetiu)', stats.cio],
        ['Atrasadas', stats.atrasadas],
        ['Descartes', stats.descartes],
        ['FIV', stats.fiv],
        ['IA', stats.ia],
        ['Custo Total DNA', `R$ ${stats.custoTotalDNA.toFixed(2)}`]
      ]

      const wsResumoData = [resumoHeaders, ...resumoData]
      const wsResumo = XLSX.utils.aoa_to_sheet(wsResumoData)

      // Formatação da planilha de resumo
      wsResumo['!cols'] = [{ wch: 20 }, { wch: 15 }]

      // Cabeçalho do resumo
      wsResumo['A1'].s = {
        fill: { fgColor: { rgb: "1F4E79" } },
        font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      }
      wsResumo['B1'].s = {
        fill: { fgColor: { rgb: "1F4E79" } },
        font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      }

      // Dados do resumo
      for (let row = 2; row <= resumoData.length + 1; row++) {
        ['A', 'B'].forEach(col => {
          const cellAddress = `${col}${row}`
          if (wsResumo[cellAddress]) {
            wsResumo[cellAddress].s = {
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin" }, bottom: { style: "thin" },
                left: { style: "thin" }, right: { style: "thin" }
              },
              font: { sz: 10 }
            }
          }
        })
      }

      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

      // Planilha de Touros formatada
      const tourosHeaders = ['Touro', 'Total', 'Nascidos', 'Machos', 'Fêmeas', 'Taxa Sucesso']
      const tourosDataArray = Object.entries(statsByTouro).map(([touro, tourosStats]) => [
        touro,
        tourosStats.total,
        tourosStats.nascidos,
        tourosStats.machos,
        tourosStats.femeas,
        tourosStats.total > 0 ? `${(tourosStats.nascidos / tourosStats.total * 100).toFixed(1)}%` : '0%'
      ])

      const wsTourosData = [tourosHeaders, ...tourosDataArray]
      const wsTouros = XLSX.utils.aoa_to_sheet(wsTourosData)

      // Formatação da planilha de touros
      wsTouros['!cols'] = [
        { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 }
      ]

      // Cabeçalho dos touros
      const tourosHeaderRange = XLSX.utils.decode_range(wsTouros['!ref'])
      for (let col = 0; col < tourosHeaders.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (wsTouros[cellAddress]) {
          wsTouros[cellAddress].s = {
            fill: { fgColor: { rgb: "1F4E79" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin" }, bottom: { style: "thin" },
              left: { style: "thin" }, right: { style: "thin" }
            }
          }
        }
      }

      // Dados dos touros
      for (let row = 1; row <= tourosDataArray.length; row++) {
        for (let col = 0; col < tourosHeaders.length; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (wsTouros[cellAddress]) {
            wsTouros[cellAddress].s = {
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin" }, bottom: { style: "thin" },
                left: { style: "thin" }, right: { style: "thin" }
              },
              font: { sz: 10 }
            }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsTouros, 'Por Touro')

      // Salvar arquivo
      const today = new Date()
      const dateStr = isNaN(today.getTime()) ? 'data-invalida' : today.toLocaleDateString('pt-BR').replace(/\//g, '-')
      const fileName = `Planilha_Nascimentos_${dateStr}.xlsx`
      XLSX.writeFile(wb, fileName, {
        bookType: 'xlsx',
        cellStyles: true
      })

      alert('✅ Planilha exportada com sucesso!\n\n📋 3 planilhas criadas:\n• Nascimentos (dados completos)\n• Resumo (estatísticas)\n• Por Touro (performance)\n\n💡 Para aplicar bordas e formatação:\n1. Selecione todos os dados (Ctrl+A)\n2. Vá em "Página Inicial" > "Formatar como Tabela"\n3. Escolha um estilo com bordas\n4. Confirme que a primeira linha contém cabeçalhos')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('❌ Erro ao exportar planilha. Verifique se a biblioteca XLSX está disponível.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas de Nascimentos */}
      <NascimentosStatistics />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            � Plaanilha de Nascimentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Controle completo de nascimentos, gestações e alertas
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => {
              const success = exportToExcelWithFormatting(births, stats, statsByTouro)
              if (success) {
                alert('✅ Planilha FORMATADA exportada com sucesso!\n\n🎨 Formatação aplicada:\n• Cabeçalhos com fundo azul\n• Bordas em todas as células\n• Alinhamento centralizado\n• 3 planilhas organizadas')
              } else {
                alert('❌ Erro ao exportar planilha formatada.')
              }
            }}
            className="btn-primary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Excel Formatado
          </button>
          <button
            onClick={exportToExcel}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Excel Simples
          </button>
          <div className="flex items-center space-x-2">
            {selectedBirths.length > 0 && (
              <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                {selectedBirths.length} selecionado(s)
              </span>
            )}
            <button
              onClick={onNewBirth}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Nascimento
            </button>
          </div>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo de Nascimentos */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            📊 Resumo de Nascimentos
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-green-800 dark:text-green-200">🐄 Nascimentos bem-sucedidos:</span>
              <span className="font-bold text-green-600 dark:text-green-400">{stats.nascidos} animais</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-blue-800 dark:text-blue-200">🐂 Machos nascidos:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{stats.machos} animais</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <span className="text-pink-800 dark:text-pink-200">🐄 Fêmeas nascidas:</span>
              <span className="font-bold text-pink-600 dark:text-pink-400">{stats.femeas} animais</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-purple-800 dark:text-purple-200">💰 Custo total DNA:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">R$ {(stats.custoTotalDNA || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Resumo de Perdas */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            💔 Resumo de Perdas
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-red-800 dark:text-red-200">☠️ Mortos:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{stats.mortos} animais</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-orange-800 dark:text-orange-200">🚫 Abortos:</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{stats.abortos} animais</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-yellow-800 dark:text-yellow-200">🔄 Cio (repetiu):</span>
              <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.cio} animais</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-800 dark:text-gray-200">📊 Total de perdas:</span>
              <span className="font-bold text-gray-600 dark:text-gray-400">{stats.totalPerdas} animais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Receptoras Atrasadas */}
      {stats.atrasadas > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠️ ALERTA: {stats.atrasadas} receptoras NÃO pariram
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                <strong>Receptoras atrasadas:</strong> {
                  (births || []).filter(b => b.status === 'gestante_atrasada')
                    .map(b => `${b.receptora} (${b.touro})`)
                    .join(', ')
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Descartes */}
      {stats.descartes > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                🚨 ATENÇÃO: {stats.descartes} animal(is) para descarte
              </h3>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                <strong>Animais com defeitos:</strong> {
                  (births || []).filter(b => b.descarte === true)
                    .map(b => `${b.receptora} (${b.observacao})`)
                    .join(', ')
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.nascidos}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Nascidos</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {stats.partoPrevisto}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Parto previsto</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.machos}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Machos</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            {stats.femeas}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Fêmeas</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.totalPerdas}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Perdas</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.atrasadas}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Atrasadas</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.descartes}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Descartes</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.fiv}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">FIV</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.ia}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">IA</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            R$ {stats.custoTotalDNA.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">DNA</div>
        </div>
      </div>

      {/* Filtros Avançados */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          🔍 Filtros de Pesquisa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Receptora, touro, observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📅 Período
            </label>
            <div className="flex space-x-2">
              <select
                value={filters.mes}
                onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
                className="input-field flex-1"
              >
                <option value="">Todos os períodos</option>
                <optgroup label="📅 2024">
                  <option value="01/24">Janeiro/2024</option>
                  <option value="02/24">Fevereiro/2024</option>
                  <option value="03/24">Março/2024</option>
                  <option value="04/24">Abril/2024</option>
                  <option value="05/24">Maio/2024</option>
                  <option value="06/24">Junho/2024</option>
                  <option value="07/24">Julho/2024</option>
                  <option value="08/24">Agosto/2024</option>
                  <option value="09/24">Setembro/2024</option>
                  <option value="10/24">Outubro/2024</option>
                  <option value="11/24">Novembro/2024</option>
                  <option value="12/24">Dezembro/2024</option>
                </optgroup>
                <optgroup label="📅 2025">
                  <option value="01/25">Janeiro/2025</option>
                  <option value="02/25">Fevereiro/2025</option>
                  <option value="03/25">Março/2025</option>
                  <option value="04/25">Abril/2025</option>
                  <option value="05/25">Maio/2025</option>
                  <option value="06/25">Junho/2025</option>
                  <option value="jul/25">Julho/2025</option>
                  <option value="08/25">Agosto/2025</option>
                  <option value="09/25">Setembro/2025</option>
                  <option value="10/25">Outubro/2025</option>
                  <option value="11/25">Novembro/2025</option>
                  <option value="12/25">Dezembro/2025</option>
                </optgroup>
                <optgroup label="📅 2026">
                  <option value="01/26">Janeiro/2026</option>
                  <option value="02/26">Fevereiro/2026</option>
                  <option value="03/26">Março/2026</option>
                  <option value="04/26">Abril/2026</option>
                  <option value="05/26">Maio/2026</option>
                  <option value="06/26">Junho/2026</option>
                  <option value="07/26">Julho/2026</option>
                  <option value="08/26">Agosto/2026</option>
                  <option value="09/26">Setembro/2026</option>
                  <option value="10/26">Outubro/2026</option>
                  <option value="11/26">Novembro/2026</option>
                  <option value="12/26">Dezembro/2026</option>
                </optgroup>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📆 Ano
            </label>
            <select
              value={filters.ano || ''}
              onChange={(e) => setFilters({ ...filters, ano: e.target.value })}
              className="input-field"
            >
              <option value="">Todos os anos</option>
              <option value="24">2024</option>
              <option value="25">2025</option>
              <option value="26">2026</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🐂 Touro
            </label>
            <select
              value={filters.touro}
              onChange={(e) => setFilters({ ...filters, touro: e.target.value })}
              className="input-field"
            >
              <option value="">Todos os touros</option>
              {Object.keys(statsByTouro).map(touro => (
                <option key={touro} value={touro}>{touro}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🐄 Sexo
            </label>
            <select
              value={filters.sexo}
              onChange={(e) => setFilters({ ...filters, sexo: e.target.value })}
              className="input-field"
            >
              <option value="">Todos os sexos</option>
              <option value="M">🐂 Macho</option>
              <option value="F">🐄 Fêmea</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              📊 Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">Todos os status</option>
              <option value="nascido">✅ Nascidos</option>
              <option value="parto_previsto">📅 Parto previsto</option>
              <option value="morto">💀 Mortos</option>
              <option value="aborto">🚫 Abortos</option>
              <option value="gestante">🐄 Gestantes</option>
              <option value="gestante_atrasada">⚠️ Atrasadas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🔧 Ações
            </label>
            <button
              onClick={() => {
                setFilters({ touro: '', sexo: '', status: '', mes: '', ano: '' })
                setSearchTerm('')
              }}
              className="btn-secondary w-full"
            >
              🗑️ Limpar Filtros
            </button>
          </div>
        </div>

        {/* Indicador de filtros ativos */}
        {(searchTerm || filters.touro || filters.sexo || filters.status || filters.mes || filters.ano) && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-200">
                🔍 Filtros ativos: {filteredBirths.length} de {births.length} registros
              </span>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                    Busca: "{searchTerm}"
                  </span>
                )}
                {filters.mes && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                    Período: {filters.mes}
                  </span>
                )}
                {filters.ano && (
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded text-xs">
                    Ano: 20{filters.ano}
                  </span>
                )}
                {filters.touro && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs">
                    Touro: {filters.touro.substring(0, 20)}...
                  </span>
                )}
                {filters.sexo && (
                  <span className="px-2 py-1 bg-pink-100 dark:bg-pink-800 text-pink-800 dark:text-pink-200 rounded text-xs">
                    Sexo: {filters.sexo === 'M' ? 'Macho' : 'Fêmea'}
                  </span>
                )}
                {filters.status && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded text-xs">
                    Status: {getStatusLabel(filters.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Nascimentos */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              �  Lista de Nascimentos
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredBirths.length} registros encontrados • Página {currentPage} de {totalPages}
            </div>
          </div>
          
          {/* Barra de Ações em Lote */}
          {selectedBirths.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    {selectedBirths.length} registro(s) selecionado(s)
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBirths([])
                      setSelectAll(false)
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
                  >
                    Limpar seleção
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Excluir Selecionados
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2">Selecionar</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Receptora
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  RG/Prev
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nascimento
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tatuagem
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Sexo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Touro
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Data
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo/DNA
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedBirths.map((birth) => (
                <tr key={birth.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedBirths.includes(birth.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedBirths.includes(birth.id)}
                      onChange={() => handleSelectBirth(birth.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {birth.receptora}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {birth.doador}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {birth.rg}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {birth.prevParto}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {birth.nascimento}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {birth.tatuagem}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      CC: {birth.cc}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${birth.sexo === 'M' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      birth.sexo === 'F' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                      {birth.sexo === 'M' ? '🐂 Macho' : birth.sexo === 'F' ? '🐄 Fêmea' : '-'}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(birth.status)}`}>
                      {getStatusLabel(birth.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-32 truncate">
                      {birth.touro}
                    </div>
                    {birth.descarte && (
                      <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        DESCARTE
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {birth.data}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {birth.tipoCobertura}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      R$ {parseFloat(birth.custoDNA || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditBirth(birth)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSingle(birth.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                        title="Excluir"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredBirths.length)} de {filteredBirths.length} registros
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Anterior
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas por Touro */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Estatísticas por Touro
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(statsByTouro).map(([touro, stats]) => (
            <div key={touro} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 truncate">
                {touro}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total: <span className="font-semibold">{stats.total}</span></div>
                <div>Nascidos: <span className="font-semibold text-green-600">{stats.nascidos}</span></div>
                <div>Machos: <span className="font-semibold text-blue-600">{stats.machos}</span></div>
                <div>Fêmeas: <span className="font-semibold text-pink-600">{stats.femeas}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Confirmação para Exclusão em Lote */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirmar Exclusão
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tem certeza que deseja excluir <strong>{selectedBirths.length}</strong> registro(s) selecionado(s)? 
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Registros que serão excluídos:</strong>
                    <ul className="mt-2 space-y-1">
                      {(births || [])
                        .filter(birth => selectedBirths.includes(birth.id))
                        .slice(0, 5)
                        .map(birth => (
                          <li key={birth.id} className="text-xs">
                            • {birth.receptora} - {birth.touro} ({getStatusLabel(birth.status)})
                          </li>
                        ))}
                      {selectedBirths.length > 5 && (
                        <li className="text-xs font-medium">
                          ... e mais {selectedBirths.length - 5} registro(s)
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteSelected}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Excluir {selectedBirths.length} Registro(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}