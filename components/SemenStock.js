
import React, { useEffect, useState } from 'react'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PrinterIcon
} from './ui/Icons'
import { useAutocomplete } from '../hooks/useAutocomplete'
// ExcelJS serÃ¡ importado dinamicamente na funÃ§Ã£o de exportaÃ§Ã£o
import DatabaseSync from './DatabaseSync'
import { ViewSemenModal, EditSemenModal } from './SemenModals'
import { AddEntradaModal, AddSaidaModal } from './SemenEntradaSaidaModals'
import TransferirLocalizacaoModal from './semen/TransferirLocalizacaoModal'

export default function SemenStock() {
  const [semenStock, setSemenStock] = useState([])
  const [showAddEntradaModal, setShowAddEntradaModal] = useState(false)
  const [showAddSaidaModal, setShowAddSaidaModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSemen, setSelectedSemen] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportType, setExportType] = useState('complete') // 'complete' ou 'current_view'
  const [activeTab, setActiveTab] = useState('entradas') // 'entradas', 'saidas' ou 'estoque'
  const [exportPeriod, setExportPeriod] = useState({
    startDate: '',
    endDate: '',
    usePeriod: false
  })
  const [filters, setFilters] = useState({
    touro: '',
    fornecedor: '',
    localizacao: '',
    status: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Tipo de material: 'semen' ou 'embriao'
  const [tipoMaterial, setTipoMaterial] = useState('semen')

  // Retirada de sÃªmen
  const [retirarItens, setRetirarItens] = useState({}) // { [id]: quantidade }

  // Modal de transferir localizaÃ§Ã£o
  const [showTransferirModal, setShowTransferirModal] = useState(false)
  const [semenParaTransferir, setSemenParaTransferir] = useState(null)

  // ImportaÃ§Ã£o Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  const [isImporting, setIsImporting] = useState(false)
  const [localizacaoImport, setLocalizacaoImport] = useState('RANCHARIA')
  const [fornecedorImport, setFornecedorImport] = useState('')

  const [newSemen, setNewSemen] = useState({
    nomeTouro: '',
    rgTouro: '',
    raca: '',
    localizacao: '',
    rackTouro: '',
    botijao: '',
    caneca: '',
    tipoOperacao: 'entrada', // entrada ou saida
    fornecedor: '',
    destino: '',
    numeroNF: '',
    valorCompra: '',
    dataCompra: new Date().toISOString().split('T')[0],
    quantidadeDoses: '',
    dosesDisponiveis: '',
    observacoes: '',
    certificado: '',
    dataValidade: '',
    origem: '',
    linhagem: ''
  })

  const { data: acSemen } = useAutocomplete('estoque_semen')

  // Carregar dados
  useEffect(() => {
    loadSemenStock()
  }, [])

  const loadSemenStock = async () => {
    try {
      const response = await fetch('/api/semen')
      if (response.ok) {
        const responseData = await response.json()
        const data = responseData.data || responseData
        setSemenStock(data || [])
      } else {
        setSemenStock([])
      }
    } catch (error) {
      console.error('Erro ao carregar estoque de sÃªmen:', error)
      setSemenStock([])
    }
  }

  const handleAddSemen = async (dadosRecebidos = null) => {
    // Se recebeu dados dos modais, usar eles; senÃ£o usar newSemen
    const semenData = dadosRecebidos || { ...newSemen }
    const tipoOperacao = semenData.tipoOperacao || (activeTab === 'entradas' ? 'entrada' : 'saida')
    
    // ValidaÃ§Ã£o especÃ­fica para saÃ­da
    if (tipoOperacao === 'saida') {
      if (!semenData.entradaId) {
        alert('Selecione um sÃªmen disponÃ­vel para registrar a saÃ­da')
        return
      }
      if (!semenData.quantidadeDoses || parseInt(semenData.quantidadeDoses) <= 0) {
        alert('Informe a quantidade de doses para saÃ­da')
        return
      }
      if (parseInt(semenData.quantidadeDoses) > parseInt(semenData.maxDoses)) {
        alert(`Quantidade nÃ£o pode ser maior que ${semenData.maxDoses} doses disponÃ­veis`)
        return
      }
      if (!semenData.destino) {
        alert('Informe o destino da saÃ­da')
        return
      }
    }

    // ValidaÃ§Ã£o para entrada - verificar se campos estÃ£o preenchidos (nÃ£o vazios e nÃ£o apenas espaÃ§os)
    const camposObrigatorios = []
    
    // FunÃ§Ã£o auxiliar para verificar se um campo estÃ¡ realmente preenchido
    const isFieldEmpty = (value) => {
      return !value || (typeof value === 'string' && value.trim() === '')
    }
    
    if (isFieldEmpty(semenData.nomeTouro)) camposObrigatorios.push('Nome do Touro')
    if (isFieldEmpty(semenData.localizacao)) camposObrigatorios.push('LocalizaÃ§Ã£o')
    if (isFieldEmpty(semenData.quantidadeDoses) || parseInt(semenData.quantidadeDoses) <= 0) {
      camposObrigatorios.push('Quantidade de Doses')
    }
    
    if (tipoOperacao === 'entrada') {
      if (isFieldEmpty(semenData.fornecedor)) camposObrigatorios.push('Fornecedor')
      if (isFieldEmpty(semenData.valorCompra) || parseFloat(semenData.valorCompra) <= 0) {
        camposObrigatorios.push('Valor da Compra')
      }
    }
    
    if (camposObrigatorios.length > 0) {
      alert(`Preencha os campos obrigatÃ³rios: ${camposObrigatorios.join(', ')}`)
      return
    }

    try {
      const response = await fetch('/api/semen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...semenData,
          dosesDisponiveis: tipoOperacao === 'entrada' ? semenData.quantidadeDoses : undefined,
          // Garantir que campos vazios sejam null ou valores padrÃ£o
          rgTouro: semenData.rgTouro || null,
          raca: semenData.raca || null,
          rackTouro: semenData.rackTouro || null,
          botijao: semenData.botijao || null,
          caneca: semenData.caneca || null,
          destino: semenData.destino || null,
          numeroNF: semenData.numeroNF || null,
          certificado: semenData.certificado || null,
          dataValidade: semenData.dataValidade && semenData.dataValidade.trim() !== '' ? semenData.dataValidade : null,
          origem: semenData.origem || null,
          linhagem: semenData.linhagem || null,
          observacoes: semenData.observacoes || null
        })
      })

      if (response.ok) {
        resetForm()
        setShowAddEntradaModal(false)
        setShowAddSaidaModal(false)
        alert(`${tipoOperacao === 'entrada' ? 'SÃªmen adicionado ao estoque' : 'SaÃ­da de sÃªmen registrada'} com sucesso!`)
        loadSemenStock()
      } else {
        const errorData = await response.json()
        
        // Melhorar mensagem de erro para o usuÃ¡rio
        let errorMessage = errorData.message || 'Erro desconhecido'
        
        // Tratar erro especÃ­fico de doses excedidas
        if (errorMessage.includes('excede doses disponÃ­veis')) {
          const match = errorMessage.match(/Quantidade solicitada \((\d+)\) excede doses disponÃ­veis \((\d+)\)/)
          if (match) {
            const [, solicitada, disponivel] = match
            errorMessage = `NÃ£o Ã© possÃ­vel registrar saÃ­da de ${solicitada} doses.\nApenas ${disponivel} doses estÃ£o disponÃ­veis para este sÃªmen.`
          }
        }
        
        alert(`Erro ao ${tipoOperacao === 'entrada' ? 'adicionar' : 'registrar saÃ­da de'} sÃªmen:\n\n${errorMessage}`)
      }
    } catch (error) {
      console.error('Erro ao processar sÃªmen:', error)
      alert('Erro ao processar sÃªmen. Tente novamente.')
    }
  }

  const resetForm = () => {
    setNewSemen({
      nomeTouro: '',
      rgTouro: '',
      raca: '',
      localizacao: '',
      rackTouro: '',
      botijao: '',
      caneca: '',
      tipoOperacao: activeTab === 'entradas' ? 'entrada' : 'saida',
      fornecedor: '',
      destino: '',
      numeroNF: '',
      valorCompra: '',
      dataCompra: new Date().toISOString().split('T')[0],
      quantidadeDoses: '',
      dosesDisponiveis: '',
      observacoes: '',
      certificado: '',
      dataValidade: '',
      origem: '',
      linhagem: '',
      entradaId: null,
      maxDoses: 0
    })
  }

  const handleDeleteSemen = async (semenId) => {
    if (confirm('Tem certeza que deseja excluir este sÃªmen do estoque?')) {
      try {
        const response = await fetch(`/api/semen/${semenId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setSemenStock(prev => prev.filter(s => s.id !== semenId))
          alert('SÃªmen excluÃ­do com sucesso!')
        } else {
          const errorData = await response.json()
          alert(`Erro ao excluir sÃªmen: ${errorData.message}`)
        }
      } catch (error) {
        console.error('Erro ao excluir sÃªmen:', error)
        alert('Erro ao excluir sÃªmen. Tente novamente.')
      }
    }
  }

  const handleTransferirParaSemen = async (semenId, nomeTouro) => {
    if (!confirm(`Transferir "${nomeTouro}" para o Estoque de SÃªmen?\n\nO item deixarÃ¡ de aparecer em EmbriÃµes e passarÃ¡ a aparecer em SÃªmen.`)) return
    try {
      const response = await fetch('/api/semen/transferir', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: semenId, tipo: 'semen' })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        loadSemenStock()
        alert(`"${nomeTouro}" transferido para o Estoque de SÃªmen com sucesso!`)
      } else {
        alert(`Erro ao transferir: ${data.message}`)
      }
    } catch (e) {
      console.error('Erro ao transferir para sÃªmen:', e)
      alert('Erro ao transferir. Tente novamente.')
    }
  }

  const handleTransferirParaEmbriao = async (semenId, nomeTouro) => {
    if (!confirm(`Transferir "${nomeTouro}" para o MÃ³dulo de EmbriÃµes?\n\nO item deixarÃ¡ de aparecer em SÃªmen e passarÃ¡ a aparecer em EmbriÃµes.`)) return
    try {
      const response = await fetch('/api/semen/transferir', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: semenId, tipo: 'embriao' })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        loadSemenStock()
        alert(`"${nomeTouro}" transferido para o MÃ³dulo de EmbriÃµes com sucesso!`)
      } else {
        alert(`Erro ao transferir: ${data.message}`)
      }
    } catch (e) {
      console.error('Erro ao transferir para embriÃµes:', e)
      alert('Erro ao transferir. Tente novamente.')
    }
  }

  // FunÃ§Ãµes para exclusÃ£o mÃºltipla
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(paginatedStock.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    const confirmMessage = `Tem certeza que deseja excluir ${selectedItems.length} item(s) do estoque?\n\nEsta aÃ§Ã£o nÃ£o pode ser desfeita.`
    
    if (confirm(confirmMessage)) {
      try {
        let successCount = 0
        let errorCount = 0

        for (const id of selectedItems) {
          try {
            const response = await fetch(`/api/semen/${id}`, {
              method: 'DELETE'
            })

            if (response.ok) {
              successCount++
            } else {
              errorCount++
            }
          } catch (error) {
            errorCount++
          }
        }

        // Atualizar a lista removendo os itens excluÃ­dos
        setSemenStock(prev => prev.filter(s => !selectedItems.includes(s.id)))
        setSelectedItems([])
        setShowBulkDeleteModal(false)

        if (errorCount === 0) {
          alert(`âÅ“â€¦ ${successCount} item(s) excluÃ­do(s) com sucesso!`)
        } else {
          alert(`âÅ¡ ï¸� ${successCount} item(s) excluÃ­do(s), ${errorCount} erro(s) encontrado(s).`)
        }
      } catch (error) {
        console.error('Erro na exclusÃ£o mÃºltipla:', error)
        alert('â�Å’ Erro na exclusÃ£o mÃºltipla. Tente novamente.')
      }
    }
  }

  const handleUseDose = async (semenId, quantidadeUsada = 1) => {
    try {
      const response = await fetch(`/api/semen/${semenId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantidadeUsada })
      })

      if (response.ok) {
        const updatedSemen = await response.json()
        setSemenStock(prev => 
          prev.map(s => s.id === semenId ? updatedSemen : s)
        )
        alert('Dose utilizada com sucesso!')
      } else {
        const errorData = await response.json()
        alert(`Erro ao usar dose: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro ao usar dose:', error)
      alert('Erro ao usar dose. Tente novamente.')
    }
  }

  const handleEditSemen = async (updatedData) => {
    try {
      const response = await fetch(`/api/semen/${selectedSemen.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        const updatedSemen = await response.json()
        setSemenStock(prev => 
          prev.map(s => s.id === selectedSemen.id ? updatedSemen : s)
        )
        setShowEditModal(false)
        setSelectedSemen(null)
        alert('SÃªmen atualizado com sucesso!')
      } else {
        const errorData = await response.json()
        alert(`Erro ao atualizar sÃªmen: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar sÃªmen:', error)
      alert('Erro ao atualizar sÃªmen. Tente novamente.')
    }
  }

  // Filtrar estoque por aba ativa
  const filteredStock = (Array.isArray(semenStock) ? semenStock : []).filter(semen => {
    if (!semen) return false

    // Filtrar por tipo de material (semen ou embriao)
    // tipo explÃ­cito no banco tem precedÃªncia; sem tipo, usa detecÃ§Ã£o pelo nome
    const tipoItem = semen.tipo
    const nome = (semen.nome_touro || semen.nomeTouro || '').toUpperCase()
    const isEmbriao = tipoItem === 'embriao' ||
      (!tipoItem && (nome.includes(' X ') || nome.includes('ACASALAMENTO')))
    if (tipoMaterial === 'semen' && isEmbriao) return false
    if (tipoMaterial === 'embriao' && !isEmbriao) return false

    // Filtrar por tipo de operaÃ§Ã£o baseado na aba ativa
    const dosesDisponiveis = semen.dosesDisponiveis || semen.doses_disponiveis || 0
    const isEntrada = semen.tipoOperacao === 'entrada' || semen.tipo_operacao === 'entrada'
    let matchesTab = false
    if (activeTab === 'entradas') {
      matchesTab = isEntrada && dosesDisponiveis > 0
    } else if (activeTab === 'saidas') {
      matchesTab = semen.tipoOperacao === 'saida' || semen.tipo_operacao === 'saida'
    } else if (activeTab === 'estoque') {
      matchesTab = isEntrada && dosesDisponiveis > 0
    }

    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      (semen.nomeTouro || semen.nome_touro || '').toLowerCase().includes(searchLower) ||
      (semen.rgTouro || semen.rg_touro || '').toLowerCase().includes(searchLower) ||
      (semen.fornecedor || '').toLowerCase().includes(searchLower)

    const matchesFilters =
      (!filters.touro || (semen.nomeTouro || semen.nome_touro || '').toLowerCase().includes(filters.touro.toLowerCase())) &&
      (!filters.fornecedor || (semen.fornecedor || '').toLowerCase().includes(filters.fornecedor.toLowerCase())) &&
      (!filters.localizacao || (semen.localizacao || '').toLowerCase().includes(filters.localizacao.toLowerCase())) &&
      (!filters.status || semen.status === filters.status)

    return matchesTab && matchesSearch && matchesFilters
  })

  // PaginaÃ§Ã£o
  const totalPages = Math.ceil(filteredStock.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStock = filteredStock.slice(startIndex, startIndex + itemsPerPage)

  // EstatÃ­sticas ââ‚¬â€� baseadas apenas em entradas do tipo de material selecionado
  const todasEntradas = (Array.isArray(semenStock) ? semenStock : []).filter(s => {
    const isEnt = s.tipoOperacao === 'entrada' || s.tipo_operacao === 'entrada'
    if (!isEnt) return false
    const n = (s.nome_touro || s.nomeTouro || '').toUpperCase()
    const isEmb = s.tipo === 'embriao' || (!s.tipo && (n.includes(' X ') || n.includes('ACASALAMENTO')))
    return tipoMaterial === 'embriao' ? isEmb : !isEmb
  })

  const stats = {
    total: todasEntradas.length,
    disponivel: todasEntradas.filter(s => s.status === 'disponivel').length,
    esgotado: todasEntradas.filter(s => s.status === 'esgotado').length,
    totalDoses: todasEntradas.reduce((acc, s) => acc + parseInt(s.quantidade_doses || s.quantidadeDoses || 0), 0),
    dosesDisponiveis: todasEntradas.reduce((acc, s) => acc + parseInt(s.doses_disponiveis || s.dosesDisponiveis || 0), 0),
    dosesUsadas: todasEntradas.reduce((acc, s) => acc + parseInt(s.doses_usadas || s.dosesUsadas || 0), 0),
    valorTotal: todasEntradas.reduce((acc, s) => acc + parseFloat(s.valor_compra || s.valorCompra || 0), 0),
    fornecedores: [...new Set(todasEntradas.map(s => s.fornecedor).filter(Boolean))].length
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponivel': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'esgotado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'vencido': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'disponivel': return 'DisponÃ­vel'
      case 'esgotado': return 'Esgotado'
      case 'vencido': return 'Vencido'
      default: return status
    }
  }

  // Filtrar dados por perÃ­odo se necessÃ¡rio
  const filterByPeriod = (data, startDate, endDate) => {
    if (!startDate || !endDate) return data;
    
    return data.filter(s => {
      const rawDate = s.dataCompra || s.data_compra || s.created_at;
      if (!rawDate) return false;
      
      // Converter para string YYYY-MM-DD para comparaÃ§Ã£o segura independente de fuso horÃ¡rio
      let dateStr = '';
      if (typeof rawDate === 'string') {
        dateStr = rawDate.split('T')[0].substring(0, 10);
      } else if (rawDate instanceof Date) {
        try {
          dateStr = rawDate.toISOString().split('T')[0];
        } catch (e) {
          return false;
        }
      }
      
      return dateStr >= startDate && dateStr <= endDate;
    });
  }

  // Imprimir relatÃ³rio no formato BEEF-SYNC (layout para impressÃ£o)
  const handlePrintReport = async () => {
    const data = selectedItems.length > 0
      ? (semenStock || []).filter(s => selectedItems.includes(s.id))
      : filteredStock;
    if (data.length === 0) {
      alert('âÅ¡ ï¸� Nenhum dado para imprimir');
      return;
    }
    const tipo = activeTab === 'saidas' ? 'SAÃ�DAS' : activeTab === 'entradas' ? 'ENTRADAS' : 'ESTOQUE REAL';
    const { openSemenPrintReport } = await import('../utils/semenPrintReport');
    openSemenPrintReport(data, tipo);
  };

  // Exportar apenas os itens selecionados
  const exportSelectedToExcel = async () => {
    if (selectedItems.length === 0) {
      alert('âÅ¡ ï¸� Selecione pelo menos um item para exportar');
      return;
    }
    const selected = (semenStock || []).filter(s => selectedItems.includes(s.id));
    if (selected.length === 0) {
      alert('âÅ¡ ï¸� Nenhum item selecionado encontrado no estoque');
      return;
    }
    try {
      const { exportSemenToExcel } = await import('../utils/simpleExcelExporter');
      const entradas = selected.filter(s => (s.tipoOperacao === 'entrada' || s.tipo_operacao === 'entrada'));
      const saidas = selected.filter(s => s.tipoOperacao === 'saida' || s.tipo_operacao === 'saida');
      const estoqueReal = selected.filter(s => {
        const doses = parseInt(s.dosesDisponiveis || s.doses_disponiveis || 0);
        return (s.tipoOperacao === 'entrada' || s.tipo_operacao === 'entrada') && doses > 0;
      });
      await exportSemenToExcel(selected, { entradas, saidas, estoqueReal }, null);
      alert(`âÅ“â€¦ ${selected.length} item(ns) exportado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar selecionados:', error);
      alert('â�Å’ Erro ao exportar: ' + error.message);
    }
  }

  // Exportar para Excel com formataÃ§Ã£o profissional
  const exportToExcel = async (periodData = null) => {
    try {
      const { exportSemenToExcel } = await import('../utils/simpleExcelExporter');
      
      let stockToExport;
      
      // Decidir qual conjunto de dados exportar
      if (exportType === 'current_view') {
        // Exportar EXATAMENTE o que estÃ¡ sendo visto (filtrado)
        stockToExport = filteredStock;
        console.log('ðÅ¸â€œÅ  Exportando visualizaÃ§Ã£o atual:', stockToExport.length, 'registros');
      } else {
        // Exportar TUDO (padrÃ£o)
        stockToExport = semenStock;
        
        // Aplicar filtro de perÃ­odo se fornecido (apenas se nÃ£o for visualizaÃ§Ã£o atual)
        if (periodData && periodData.usePeriod && periodData.startDate && periodData.endDate) {
          stockToExport = filterByPeriod(semenStock, periodData.startDate, periodData.endDate);
        }
        console.log('ðÅ¸â€œÅ  Exportando completo:', stockToExport.length, 'registros');
      }
      
      // Separar dados por tipo para exportaÃ§Ã£o
      // Entradas: apenas entradas que ainda tÃªm doses disponÃ­veis (nÃ£o esgotadas)
      const entradas = (Array.isArray(stockToExport) ? stockToExport : []).filter(s => {
        const dosesDisponiveis = s.dosesDisponiveis || s.doses_disponiveis || 0;
        return (s.tipoOperacao === 'entrada' || s.tipo_operacao === 'entrada') && dosesDisponiveis > 0;
      });
      const saidas = (Array.isArray(stockToExport) ? stockToExport : []).filter(s => 
        s.tipoOperacao === 'saida' || s.tipo_operacao === 'saida'
      );
      const estoqueReal = (Array.isArray(stockToExport) ? stockToExport : []).filter(s => {
        const dosesDisponiveis = s.dosesDisponiveis || s.doses_disponiveis || 0;
        return (s.tipoOperacao === 'entrada' || s.tipo_operacao === 'entrada') && dosesDisponiveis > 0;
      });
      
      await exportSemenToExcel(stockToExport, { entradas, saidas, estoqueReal }, periodData);
      
      const tipoMsg = exportType === 'current_view' ? '\nðÅ¸â€�� Filtro: VisualizaÃ§Ã£o Atual (Filtros da Tela)' : '';
      const periodoMsg = periodData && periodData.usePeriod 
        ? `\nðÅ¸â€œâ€¦ PerÃ­odo: ${new Date(periodData.startDate).toLocaleDateString('pt-BR')} atÃ© ${new Date(periodData.endDate).toLocaleDateString('pt-BR')}`
        : '';
      
      alert(`âÅ“â€¦ Estoque de sÃªmen exportado com sucesso!${periodoMsg}\n\nðÅ¸â€œÅ  Arquivo gerado com 3 abas separadas:\nââ‚¬¢ Entradas (apenas com doses disponÃ­veis)\nââ‚¬¢ SaÃ­das\nââ‚¬¢ Estoque Real`);
      
      // Fechar modal se estiver aberto
      setShowExportModal(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('â�Å’ Erro ao exportar estoque: ' + error.message);
    }
  }

  // ââ€�â‚¬ââ€�â‚¬ Retirada de SÃªmen ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬
  const handleRetirarChange = (id, value) => {
    const qtde = Math.max(0, parseInt(value) || 0)
    setRetirarItens(prev => ({ ...prev, [id]: qtde }))
  }

  const totalItensRetirada = Object.values(retirarItens).filter(v => v > 0).length
  const totalDosesRetirada = Object.values(retirarItens).reduce((a, b) => a + (b || 0), 0)

  const exportarRetirada = async () => {
    const itens = Object.entries(retirarItens)
      .filter(([, qtde]) => qtde > 0)
      .map(([id, qtde]) => {
        const semen = (Array.isArray(semenStock) ? semenStock : []).find(s => s.id === parseInt(id))
        if (!semen) return null
        return {
          'Touro': semen.nome_touro || semen.nomeTouro || '',
          'RG': semen.rg_touro || semen.rgTouro || '',
          'RaÃ§a': semen.raca || '',
          'Rack': semen.rack_touro || semen.rackTouro || '',
          'BotijÃ£o': semen.botijao || '',
          'Caneca': semen.caneca || '',
          'LocalizaÃ§Ã£o': semen.localizacao || '',
          'Doses DisponÃ­veis': semen.doses_disponiveis || semen.dosesDisponiveis || 0,
          'Qtde a Retirar': qtde,
          'ObservaÃ§Ãµes': semen.observacoes || '',
        }
      })
      .filter(Boolean)

    if (itens.length === 0) {
      alert('Nenhum item marcado para retirada.')
      return
    }

    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(itens)
      ws['!cols'] = [
        { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 22 },
      ]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Retirada de SÃªmen')
      const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
      XLSX.writeFile(wb, `Retirada_Semen_${date}.xlsx`)
      alert(`âÅ“â€¦ RelatÃ³rio de retirada exportado!\n\n${itens.length} touros ââ‚¬¢ ${totalDosesRetirada} doses marcadas`)
    } catch (err) {
      alert('Erro ao gerar relatÃ³rio: ' + err.message)
    }
  }

  const limparRetirada = () => setRetirarItens({})

  // ââ€�â‚¬ââ€�â‚¬ ImportaÃ§Ã£o Excel ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬ââ€�â‚¬
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportFile(file)
    setImportPreview([])
    try {
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      setImportPreview(rows.slice(0, 11)) // cabeÃ§alho + 10 linhas
    } catch (err) {
      console.error('Erro no preview:', err)
    }
  }

  const handleImportExcel = async () => {
    if (!importFile) {
      alert('Selecione um arquivo Excel (.xlsx ou .xls)')
      return
    }
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('localizacao', localizacaoImport)
      formData.append('fornecedor', fornecedorImport)
      formData.append('tipoMaterial', tipoMaterial)

      const response = await fetch('/api/semen/import-excel', { method: 'POST', body: formData })
      const result = await response.json()

      if (response.ok) {
        const errosMsg = result.erros?.length ? `\n\nAtenÃ§Ã£o ââ‚¬â€� ${result.erros.length} linha(s) com erro:\n${result.erros.slice(0, 5).join('\n')}` : ''
        alert(`âÅ“â€¦ ${result.message}${errosMsg}`)
        setShowImportModal(false)
        setImportFile(null)
        setImportPreview([])
        loadSemenStock()
      } else {
        alert(`â�Å’ Erro: ${result.error}\n${result.details || ''}`)
      }
    } catch (err) {
      alert('Erro ao importar: ' + err.message)
    } finally {
      setIsImporting(false)
    }
  }

  // Abrir modal de exportaÃ§Ã£o
  const handleExportClick = () => {
    // Inicializar perÃ­odo com mÃªs atual
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setExportType('complete'); // Resetar para completo por padrÃ£o
    setExportPeriod({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
      usePeriod: false
    });
    setShowExportModal(true);
  }

  return (
    <div className="space-y-6">
      {/* SincronizaÃ§Ã£o de Dados */}
      <DatabaseSync />

      {/* Seletor de tipo de material */}
      <div className="flex space-x-2">
        <button
          onClick={() => { setTipoMaterial('semen'); setCurrentPage(1); setRetirarItens({}) }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
            tipoMaterial === 'semen'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }`}
        >
          ðÅ¸§¬ SÃªmen
        </button>
        <button
          onClick={() => { setTipoMaterial('embriao'); setCurrentPage(1); setRetirarItens({}) }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
            tipoMaterial === 'embriao'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400'
          }`}
        >
          ðÅ¸§¬ EmbriÃµes
        </button>
      </div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            {tipoMaterial === 'embriao' ? 'ðÅ¸§¬ Estoque de EmbriÃµes' : 'ðÅ¸§¬ Estoque de SÃªmen'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {tipoMaterial === 'embriao'
              ? 'Controle de embriÃµes (acasalamentos) do rebanho'
              : 'Controle completo do material genÃ©tico do rebanho'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 rotate-180" />
            Importar Excel
          </button>
          <button
            onClick={handleExportClick}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Exportar Excel
          </button>
          <button
            onClick={handlePrintReport}
            className="btn-secondary flex items-center"
            title="Imprimir relatÃ³rio no formato BEEF-SYNC"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Imprimir
          </button>
        {/* Abas de Entrada, SaÃ­da e Estoque Real */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('entradas')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'entradas'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            ðÅ¸â€œ¥ Entradas
          </button>
          <button
            onClick={() => setActiveTab('saidas')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'saidas'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            ðÅ¸â€œ¤ SaÃ­das
          </button>
          <button
            onClick={() => setActiveTab('estoque')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'estoque'
                ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            ðÅ¸â€œ¦ Estoque Real
          </button>
        </div>

        {/* BotÃµes de AÃ§Ã£o */}
        <div className="flex space-x-3">
          {activeTab === 'entradas' && (
            <button
              onClick={() => setShowAddEntradaModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Adicionar Entrada
            </button>
          )}
          {activeTab === 'saidas' && (
            <button
              onClick={() => setShowAddSaidaModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Registrar SaÃ­da
            </button>
          )}
        </div>
        </div>
      </div>

      {/* EstatÃ­sticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Touros</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.disponivel}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">DisponÃ­veis</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.esgotado}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Esgotados</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.totalDoses}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Doses</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.dosesDisponiveis}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">DisponÃ­veis</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.dosesUsadas}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Usadas</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            R$ {stats.valorTotal.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Investido</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.fornecedores}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Fornecedores</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ðÅ¸â€�� Filtros de Pesquisa
        </h3>
        <datalist id="datalist-semen-touro">{(acSemen?.nome_touro || []).map((v, i) => <option key={i} value={v} />)}</datalist>
        <datalist id="datalist-semen-fornecedor">{(acSemen?.fornecedor || []).map((v, i) => <option key={i} value={v} />)}</datalist>
        <datalist id="datalist-semen-localizacao">{(acSemen?.localizacao || []).map((v, i) => <option key={i} value={v} />)}</datalist>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <input
              type="text"
              list="datalist-semen-touro"
              placeholder="Nome do touro, RG, fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Touro
            </label>
            <input
              type="text"
              list="datalist-semen-touro"
              placeholder="Nome do touro"
              value={filters.touro}
              onChange={(e) => setFilters({ ...filters, touro: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fornecedor
            </label>
            <input
              type="text"
              list="datalist-semen-fornecedor"
              placeholder="Nome do fornecedor"
              value={filters.fornecedor}
              onChange={(e) => setFilters({ ...filters, fornecedor: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              LocalizaÃ§Ã£o
            </label>
            <input
              type="text"
              list="datalist-semen-localizacao"
              placeholder="LocalizaÃ§Ã£o"
              value={filters.localizacao}
              onChange={(e) => setFilters({ ...filters, localizacao: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">Todos</option>
              <option value="disponivel">DisponÃ­vel</option>
              <option value="esgotado">Esgotado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Estoque */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Estoque de SÃªmen ({filteredStock.length} registros)
            </h3>
            {totalItensRetirada > 0 && (
              <div className="flex items-center space-x-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  ðÅ¸§Å  {totalItensRetirada} touro(s) ââ‚¬¢ {totalDosesRetirada} dose(s) marcadas para retirada
                </span>
                <button
                  onClick={exportarRetirada}
                  className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg font-medium"
                >
                  ðÅ¸â€œ¥ Exportar Retirada
                </button>
                <button
                  onClick={limparRetirada}
                  className="text-xs text-yellow-700 dark:text-yellow-300 underline"
                >
                  Limpar
                </button>
              </div>
            )}
            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedItems.length} item(s) selecionado(s)
                </span>
                <button
                  onClick={exportSelectedToExcel}
                  className="btn-primary flex items-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Exportar Selecionados
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="btn-danger flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Excluir Selecionados
                </button>
              </div>
            )}
          </div>
        </div>
        
        {filteredStock.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">ðÅ¸§¬</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum sÃªmen encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {semenStock.length === 0 
                ? 'Comece adicionando sÃªmen ao seu estoque'
                : 'Tente ajustar os filtros de pesquisa'
              }
            </p>
            <button
              onClick={() => setShowAddEntradaModal(true)}
              className="btn-primary"
            >
              Adicionar Primeiro SÃªmen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === paginatedStock.length && paginatedStock.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Touro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    LocalizaÃ§Ã£o
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Doses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  {activeTab !== 'saidas' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                      Retirar (doses)
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    AÃ§Ãµes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedStock.map((semen) => (
                  <tr key={semen.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(semen.id)}
                        onChange={(e) => handleSelectItem(semen.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {semen.nomeTouro || semen.nome_touro || semen.serie || 'Sem nome'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          RG: {semen.rgTouro || semen.rg_touro || semen.rg || 'N/A'} ââ‚¬¢ {semen.raca || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Para saÃ­das, mostrar destino ao invÃ©s de localizaÃ§Ã£o fÃ­sica */}
                      {(semen.tipoOperacao === 'saida' || semen.tipo_operacao === 'saida') ? (
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            <span className="text-orange-600 dark:text-orange-400 font-medium">ðÅ¸â€œ¤ SaÃ­da</span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Destino: {semen.destino || 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {semen.localizacao || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {(semen.rackTouro || semen.rack_touro) && `Rack: ${semen.rackTouro || semen.rack_touro}`}
                            {(semen.rackTouro || semen.rack_touro) && semen.botijao && ' ââ‚¬¢ '}
                            {semen.botijao && `BotijÃ£o: ${semen.botijao}`}
                            {((semen.rackTouro || semen.rack_touro) || semen.botijao) && semen.caneca && ' ââ‚¬¢ '}
                            {semen.caneca && `Caneca: ${semen.caneca}`}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {activeTab === 'saidas' 
                          ? `${semen.quantidade_doses || semen.quantidadeDoses} doses` 
                          : `${semen.doses_disponiveis || semen.dosesDisponiveis} / ${semen.quantidade_doses || semen.quantidadeDoses}`
                        }
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {activeTab === 'saidas' 
                          ? `Destino: ${semen.destino || 'N/A'}`
                          : `Usadas: ${semen.doses_usadas ?? semen.dosesUsadas ?? 0}`
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(semen.status)}`}>
                        {getStatusLabel(semen.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      R$ {parseFloat(semen.valorCompra || semen.valor_compra || 0).toFixed(2)}
                    </td>
                    {activeTab !== 'saidas' && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={semen.doses_disponiveis || semen.dosesDisponiveis || 0}
                            value={retirarItens[semen.id] || ''}
                            onChange={(e) => handleRetirarChange(semen.id, e.target.value)}
                            placeholder="0"
                            className="w-20 px-2 py-1 text-sm border border-yellow-300 dark:border-yellow-700 rounded-lg text-center focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSemenParaTransferir(semen)
                              setShowTransferirModal(true)
                            }}
                            title="Transferir LocalizaÃ§Ã£o"
                            className="p-1.5 rounded-lg text-purple-600 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 items-center">
                        {tipoMaterial === 'semen' && (
                          <button
                            type="button"
                            onClick={() => handleTransferirParaEmbriao(semen.id, semen.nome_touro || semen.nomeTouro)}
                            title="Transferir para MÃ³dulo de EmbriÃµes"
                            className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
                          >
                            <ArrowLeftIcon className="h-4 w-4" />
                          </button>
                        )}
                        {tipoMaterial === 'embriao' && (
                          <button
                            type="button"
                            onClick={() => handleTransferirParaSemen(semen.id, semen.nome_touro || semen.nomeTouro)}
                            title="Transferir para Estoque de SÃªmen"
                            className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
                          >
                            <ArrowRightIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSemenParaTransferir(semen)
                            setShowTransferirModal(true)
                          }}
                          title="Transferir LocalizaÃ§Ã£o"
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSemen(semen)
                            setShowViewModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSemen(semen)
                            setShowEditModal(true)
                          }}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSemen(semen.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
        )}

        {/* PaginaÃ§Ã£o */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredStock.length)} de {filteredStock.length} registros
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  PÃ¡gina {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  PrÃ³xima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modais de Entrada e SaÃ­da */}
      <AddEntradaModal
        showModal={showAddEntradaModal}
        setShowModal={setShowAddEntradaModal}
        newSemen={newSemen}
        setNewSemen={setNewSemen}
        handleAddSemen={handleAddSemen}
      />

      <AddSaidaModal
        showModal={showAddSaidaModal}
        setShowModal={setShowAddSaidaModal}
        newSemen={newSemen}
        setNewSemen={setNewSemen}
        handleAddSemen={handleAddSemen}
        semenStock={semenStock}
        tipoMaterial={tipoMaterial}
      />

      {/* Modal de ExportaÃ§Ã£o com PerÃ­odo */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  ðÅ¸â€œÅ  Exportar para Excel
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  âÅ“â€¢
                </button>
              </div>
              
              <div className="space-y-4">
                {/* SeleÃ§Ã£o do Tipo de RelatÃ³rio */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de RelatÃ³rio
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="exportType"
                        value="complete"
                        checked={exportType === 'complete'}
                        onChange={() => setExportType('complete')}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                          RelatÃ³rio Completo
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          Exporta todos os registros do banco de dados (permite filtro por data)
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="exportType"
                        value="current_view"
                        checked={exportType === 'current_view'}
                        onChange={() => setExportType('current_view')}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                          VisualizaÃ§Ã£o Atual
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          Exporta apenas o que vocÃª estÃ¡ vendo agora ({filteredStock.length} registros), respeitando filtros de busca, touro, etc.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* OpÃ§Ãµes de PerÃ­odo (apenas para relatÃ³rio completo) */}
                <div className={`transition-opacity duration-300 ${exportType === 'current_view' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="usePeriod"
                      checked={exportPeriod.usePeriod}
                      onChange={(e) => setExportPeriod({ ...exportPeriod, usePeriod: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      disabled={exportType === 'current_view'}
                    />
                    <label htmlFor="usePeriod" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Filtrar por perÃ­odo (Data de Compra/Entrada)
                    </label>
                  </div>

                  {exportPeriod.usePeriod && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          value={exportPeriod.startDate}
                          onChange={(e) => setExportPeriod({ ...exportPeriod, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Data Final
                        </label>
                        <input
                          type="date"
                          value={exportPeriod.endDate}
                          onChange={(e) => setExportPeriod({ ...exportPeriod, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  {exportType === 'current_view'
                    ? `ðÅ¸â€œâ€¹ Exportando ${filteredStock.length} registros filtrados na tela`
                    : exportPeriod.usePeriod 
                      ? `ðÅ¸â€œâ€¦ Exportando registros de ${exportPeriod.startDate ? new Date(exportPeriod.startDate).toLocaleDateString('pt-BR') : '...'} atÃ© ${exportPeriod.endDate ? new Date(exportPeriod.endDate).toLocaleDateString('pt-BR') : '...'}`
                      : 'ðÅ¸â€œÅ¡ Exportando base completa de sÃªmen'
                  }
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (exportPeriod.usePeriod && (!exportPeriod.startDate || !exportPeriod.endDate)) {
                      alert('âÅ¡ ï¸� Por favor, selecione ambas as datas para filtrar por perÃ­odo.');
                      return;
                    }
                    if (exportPeriod.usePeriod && new Date(exportPeriod.startDate) > new Date(exportPeriod.endDate)) {
                      alert('âÅ¡ ï¸� A data inicial nÃ£o pode ser maior que a data final.');
                      return;
                    }
                    exportToExcel(exportPeriod.usePeriod ? exportPeriod : null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de VisualizaÃ§Ã£o */}
      <ViewSemenModal
        showModal={showViewModal}
        setShowModal={setShowViewModal}
        selectedSemen={selectedSemen}
      />

      {/* Modal de EdiÃ§Ã£o */}
      <EditSemenModal
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        selectedSemen={selectedSemen}
        handleEditSemen={handleEditSemen}
      />

      {/* Modal de Transferir LocalizaÃ§Ã£o */}
      <TransferirLocalizacaoModal
        isOpen={showTransferirModal}
        onClose={() => {
          setShowTransferirModal(false)
          setSemenParaTransferir(null)
        }}
        registro={semenParaTransferir}
        onSuccess={() => {
          loadSemenStock()
        }}
      />

      {/* Modal de ConfirmaÃ§Ã£o para ExclusÃ£o MÃºltipla */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <TrashIcon className="h-6 w-6 mr-3 text-red-600" />
                Confirmar ExclusÃ£o MÃºltipla
              </h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">
                  VocÃª estÃ¡ prestes a excluir <strong>{selectedItems.length}</strong> item(s) do estoque de sÃªmen.
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  âÅ¡ ï¸� Esta aÃ§Ã£o nÃ£o pode ser desfeita!
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Itens selecionados:</strong>
                </p>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {selectedItems.map(id => {
                    const item = (Array.isArray(semenStock) ? semenStock : []).find(s => s.id === id)
                    return (
                      <div key={id} className="text-sm text-gray-700 dark:text-gray-300 py-1">
                        ââ‚¬¢ {item?.nomeTouro || item?.nome_touro || item?.serie || 'Sem nome'} ({item?.raca || 'N/A'})
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn-danger flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir {selectedItems.length} Item(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ImportaÃ§Ã£o Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">ðÅ¸â€œ¤ Importar Estoque de SÃªmen</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Importe sua planilha Excel com as colunas: COD RACK, TOURO, RAÃâ€¡A, BOTIJÃÆ’O, CANECA, OBS, ESTOQUE
                </p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportPreview([]) }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">âÅ“â€¢</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Upload de arquivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arquivo Excel (.xlsx / .xls)
                </label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl cursor-pointer bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <span className="text-3xl mb-1">ðÅ¸â€œ�</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {importFile ? importFile.name : 'Clique para selecionar o arquivo'}
                  </span>
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {/* Campos adicionais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    LocalizaÃ§Ã£o (aplicada a todos)
                  </label>
                  <input
                    type="text"
                    value={localizacaoImport}
                    onChange={e => setLocalizacaoImport(e.target.value)}
                    placeholder="Ex: RANCHARIA"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fornecedor (aplicado a todos)
                  </label>
                  <input
                    type="text"
                    value={fornecedorImport}
                    onChange={e => setFornecedorImport(e.target.value)}
                    placeholder="Ex: Central Peixes Touros"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Preview da planilha */}
              {importPreview.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PrÃ©-visualizaÃ§Ã£o ({importPreview.length - 1} linhas de dados detectadas):
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-48">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          {(importPreview[0] || []).map((h, i) => (
                            <th key={i} className="px-2 py-1 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {String(h || '')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(1).map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-2 py-1 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                {String(cell || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                <strong>Mapeamento automÃ¡tico de colunas:</strong> O sistema detecta as colunas pelos cabeÃ§alhos.
                A coluna <strong>ESTOQUE</strong> define a quantidade de doses disponÃ­veis.
                O campo <strong>TOURO</strong> no formato "NOME - RG" separa automaticamente o nome e o RG.
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => { setShowImportModal(false); setImportFile(null); setImportPreview([]) }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportExcel}
                disabled={!importFile || isImporting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center"
              >
                {isImporting ? (
                  <><span className="animate-spin mr-2">â�³</span> Importando...</>
                ) : (
                  <><DocumentArrowDownIcon className="h-4 w-4 mr-2 rotate-180" /> Importar Agora</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}