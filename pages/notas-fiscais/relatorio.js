import React, { useState, useEffect } from 'react'
import { ChartBarIcon, CalendarIcon, CurrencyDollarIcon, TruckIcon, ArrowDownIcon, ArrowUpIcon, XMarkIcon, DocumentArrowDownIcon } from '../../components/ui/Icons'

export default function RelatorioFiscal() {
  const [mounted, setMounted] = useState(false)
  const [notasFiscais, setNotasFiscais] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  const [nfDetalhes, setNfDetalhes] = useState(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [filtros, setFiltros] = useState({
    dataInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Início do ano
    dataFim: new Date().toISOString().split('T')[0], // Hoje
    tipo: 'todos' // todos, entrada, saida
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadNotasFiscais()
    }
  }, [mounted])

  // Recarregar quando os filtros mudarem (opcional - pode ser removido se quiser apenas atualizar manualmente)
  // useEffect(() => {
  //   if (mounted && notasFiscais.length > 0) {
  //     // Apenas filtrar, não recarregar da API
  //   }
  // }, [filtros])

  const loadNotasFiscais = async () => {
    try {
      if (typeof window === 'undefined') return
      
      setLoading(true)
      console.log('🔄 Buscando notas fiscais da API...')
      const response = await fetch('/api/notas-fiscais')
      
      if (response.ok) {
        const data = await response.json()
        console.log('📥 Resposta da API (primeiros 3 itens):', data.slice ? data.slice(0, 3) : data)
        
        // A API pode retornar { success: true, data: [...] } ou apenas o array
        let nfsData = []
        if (Array.isArray(data)) {
          nfsData = data
        } else if (data.data && Array.isArray(data.data)) {
          nfsData = data.data
        } else if (data.success && Array.isArray(data.data)) {
          nfsData = data.data
        }
        
        console.log(`📊 Total de notas recebidas: ${nfsData.length}`)
        
        // Debug: verificar tipos
        const tiposEncontrados = {}
        nfsData.forEach(nf => {
          const tipo = nf.tipo || 'entrada'
          tiposEncontrados[tipo] = (tiposEncontrados[tipo] || 0) + 1
        })
        console.log('📋 Tipos encontrados:', tiposEncontrados)
        
        // Normalizar os dados para o formato esperado
        const notasNormalizadas = nfsData.map(nf => {
          // Determinar data de emissão (prioridade: data > data_compra > created_at)
          let dataEmissao = nf.data || nf.data_compra || nf.created_at
          
          // Se dataEmissao é uma string, converter para Date
          if (typeof dataEmissao === 'string') {
            dataEmissao = new Date(dataEmissao)
          }
          
          // Garantir que tipo seja 'entrada' ou 'saida'
          const tipo = (nf.tipo === 'saida' || nf.tipo === 'entrada') ? nf.tipo : 'entrada'
          
          const notaNormalizada = {
            id: nf.id,
            numero: String(nf.numero_nf || nf.numeroNF || nf.numero || ''),
            tipo: tipo,
            empresa: nf.destino || nf.fornecedor || '-',
            dataEmissao: dataEmissao,
            valorTotal: parseFloat(nf.valor_total || nf.valorTotal || 0)
          }
          
          // Debug para NF 4393
          if (notaNormalizada.numero === '4393') {
            console.log('🔍 NF 4393 encontrada:', notaNormalizada)
          }
          
          return notaNormalizada
        })
        
        // Debug: contar por tipo
        const entradasCount = notasNormalizadas.filter(n => n.tipo === 'entrada').length
        const saidasCount = notasNormalizadas.filter(n => n.tipo === 'saida').length
        console.log(`✅ ${notasNormalizadas.length} notas fiscais carregadas (${entradasCount} entradas, ${saidasCount} saídas)`)
        
        // Debug: listar todas as saídas
        const saidas = notasNormalizadas.filter(n => n.tipo === 'saida')
        if (saidas.length > 0) {
          console.log('📤 Notas de SAÍDA encontradas:')
          saidas.forEach(s => {
            console.log(`   - NF ${s.numero}: R$ ${s.valorTotal.toFixed(2)} - Data: ${s.dataEmissao}`)
          })
        } else {
          console.log('⚠️ Nenhuma nota de SAÍDA encontrada após normalização!')
        }
        
        setNotasFiscais(notasNormalizadas)
      } else {
        console.error('Erro ao buscar notas fiscais:', response.status)
        // Fallback para localStorage
        const savedData = localStorage.getItem('notasFiscais')
        if (savedData) {
          setNotasFiscais(JSON.parse(savedData))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error)
      // Fallback para localStorage
      const savedData = localStorage.getItem('notasFiscais')
      if (savedData) {
        setNotasFiscais(JSON.parse(savedData))
      }
    } finally {
      setLoading(false)
    }
  }

  const filtrarNotas = () => {
    console.log('🔍 Iniciando filtro com:', {
      totalNotas: notasFiscais.length,
      filtroDataInicio: filtros.dataInicio,
      filtroDataFim: filtros.dataFim,
      filtroTipo: filtros.tipo
    })
    
    const filtradas = notasFiscais.filter(nota => {
      // Normalizar data - pode vir em diferentes formatos
      let dataEmissao
      if (nota.dataEmissao) {
        if (nota.dataEmissao instanceof Date) {
          dataEmissao = nota.dataEmissao
        } else {
          dataEmissao = new Date(nota.dataEmissao)
        }
      } else {
        console.warn('⚠️ Nota sem data:', nota.numero)
        return false // Se não tem data, não incluir
      }
      
      // Verificar se a data é válida
      if (isNaN(dataEmissao.getTime())) {
        console.warn('⚠️ Data inválida para nota:', nota.numero, nota.dataEmissao)
        return false
      }
      
      // Criar datas de comparação (apenas data, sem hora)
      const dataInicio = new Date(filtros.dataInicio + 'T00:00:00')
      const dataFim = new Date(filtros.dataFim + 'T23:59:59')
      
      // Normalizar data de emissão para início do dia para comparação
      const dataEmissaoNormalizada = new Date(dataEmissao)
      dataEmissaoNormalizada.setHours(0, 0, 0, 0)
      
      const dataInicioNormalizada = new Date(dataInicio)
      dataInicioNormalizada.setHours(0, 0, 0, 0)
      
      const dataFimNormalizada = new Date(dataFim)
      dataFimNormalizada.setHours(23, 59, 59, 999)
      
      const dentroDataRange = dataEmissaoNormalizada >= dataInicioNormalizada && dataEmissaoNormalizada <= dataFimNormalizada
      const tipoMatch = filtros.tipo === 'todos' || nota.tipo === filtros.tipo
      
      // Debug para todas as saídas
      if (nota.tipo === 'saida') {
        console.log(`🔍 Filtrando SAÍDA NF ${nota.numero}:`, {
          dataEmissaoOriginal: nota.dataEmissao,
          dataEmissaoNormalizada: dataEmissaoNormalizada.toISOString(),
          dataInicio: dataInicioNormalizada.toISOString(),
          dataFim: dataFimNormalizada.toISOString(),
          dentroDataRange,
          tipo: nota.tipo,
          filtroTipo: filtros.tipo,
          tipoMatch,
          resultado: dentroDataRange && tipoMatch
        })
      }
      
      return dentroDataRange && tipoMatch
    })
    
    // Debug: contar filtradas por tipo
    const entradasFiltradas = filtradas.filter(n => n.tipo === 'entrada').length
    const saidasFiltradas = filtradas.filter(n => n.tipo === 'saida').length
    console.log(`🔍 Notas filtradas: ${filtradas.length} (${entradasFiltradas} entradas, ${saidasFiltradas} saídas)`)
    
    // Listar todas as saídas filtradas
    const saidasFiltradasList = filtradas.filter(n => n.tipo === 'saida')
    if (saidasFiltradasList.length > 0) {
      console.log('✅ Saídas que passaram no filtro:')
      saidasFiltradasList.forEach(s => {
        console.log(`   - NF ${s.numero}: R$ ${s.valorTotal.toFixed(2)}`)
      })
    } else {
      console.log('❌ Nenhuma saída passou no filtro!')
    }
    
    return filtradas
  }

  const carregarDetalhesNF = async (nfId) => {
    try {
      setLoadingDetalhes(true)
      setShowDetalhesModal(true)
      
      const response = await fetch(`/api/notas-fiscais/${nfId}`)
      
      if (response.ok) {
        const data = await response.json()
        setNfDetalhes(data)
        console.log('📄 Detalhes da NF carregados:', data)
      } else {
        console.error('Erro ao buscar detalhes da NF:', response.status)
        setNfDetalhes(null)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da NF:', error)
      setNfDetalhes(null)
    } finally {
      setLoadingDetalhes(false)
    }
  }

  const notasFiltradas = filtrarNotas()
  
  const resumo = {
    totalEntradas: notasFiltradas
      .filter(n => n.tipo === 'entrada')
      .reduce((sum, n) => sum + (n.valorTotal || 0), 0),
    totalSaidas: notasFiltradas
      .filter(n => n.tipo === 'saida')
      .reduce((sum, n) => sum + (n.valorTotal || 0), 0),
    quantidadeEntradas: notasFiltradas.filter(n => n.tipo === 'entrada').length,
    quantidadeSaidas: notasFiltradas.filter(n => n.tipo === 'saida').length
  }

  resumo.saldo = resumo.totalSaidas - resumo.totalEntradas // Vendas - Compras

  const gerarRelatorioExcel = async () => {
    try {
      setExportando(true)
      
      // Importar ExcelJS dinamicamente
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'BeefSync - Sistema de Gestão Pecuária'
      workbook.created = new Date()
      
      // Recalcular notas filtradas e resumo dentro da função
      const notasFiltradasAtual = filtrarNotas()
      
      // Buscar detalhes completos de todas as notas filtradas
      const notasComDetalhes = []
      for (const nota of notasFiltradasAtual) {
        try {
          const response = await fetch(`/api/notas-fiscais/${nota.id}`)
          if (response.ok) {
            const detalhes = await response.json()
            notasComDetalhes.push(detalhes)
          } else {
            notasComDetalhes.push(nota) // Usar dados básicos se não conseguir buscar detalhes
          }
        } catch (error) {
          console.error(`Erro ao buscar detalhes da NF ${nota.numero}:`, error)
          notasComDetalhes.push(nota) // Usar dados básicos
        }
      }

      // Separar entradas e saídas
      const entradas = notasComDetalhes.filter(n => n.tipo === 'entrada')
      const saidas = notasComDetalhes.filter(n => n.tipo === 'saida')

      // ===== ABA RESUMO =====
      const resumoSheet = workbook.addWorksheet('📊 Resumo', {
        pageSetup: {
          paperSize: 9,
          orientation: 'portrait',
          margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
        }
      })

      // Título
      resumoSheet.mergeCells('A1:B1')
      const titleCell = resumoSheet.getCell('A1')
      titleCell.value = 'RELATÓRIO FISCAL - RESUMO'
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE67E22' }
      }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      resumoSheet.getRow(1).height = 30

      // Dados do resumo
      resumoSheet.columns = [
        { header: 'Indicador', key: 'indicador', width: 30 },
        { header: 'Valor', key: 'valor', width: 20 }
      ]

      // Calcular resumo atualizado com base nos detalhes
      const resumoAtual = {
        totalEntradas: entradas.reduce((sum, n) => sum + parseFloat(n.valor_total || 0), 0),
        totalSaidas: saidas.reduce((sum, n) => sum + parseFloat(n.valor_total || 0), 0),
        saldo: 0
      }
      resumoAtual.saldo = resumoAtual.totalSaidas - resumoAtual.totalEntradas

      const resumoData = [
        { indicador: 'Período', valor: `${new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} a ${new Date(filtros.dataFim).toLocaleDateString('pt-BR')}` },
        { indicador: 'Total de Notas', valor: notasFiltradas.length },
        { indicador: 'Notas de Entrada', valor: entradas.length },
        { indicador: 'Notas de Saída (Vendas)', valor: saidas.length },
        { indicador: 'Valor Total Entradas', valor: `R$ ${resumoAtual.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { indicador: 'Valor Total Saídas', valor: `R$ ${resumoAtual.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { indicador: 'Saldo (Vendas - Compras)', valor: `R$ ${resumoAtual.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { indicador: resumoAtual.saldo >= 0 ? 'Lucro' : 'Prejuízo', valor: resumoAtual.saldo >= 0 ? '✅' : '❌' }
      ]

      resumoData.forEach((row, index) => {
        const excelRow = resumoSheet.addRow(row)
        if (index === 0) {
          excelRow.eachCell((cell) => {
            cell.font = { bold: true }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF3F4F6' }
            }
          })
        }
      })

      // Estilizar cabeçalho
      const resumoHeaderRow = resumoSheet.getRow(2)
      resumoHeaderRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        }
        cell.font = {
          color: { argb: 'FFFFFFFF' },
          bold: true
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })
      resumoSheet.getRow(2).height = 25

      // ===== ABA ENTRADAS =====
      if (entradas.length > 0) {
        const entradasSheet = workbook.addWorksheet('📥 Entradas', {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
          }
        })

        entradasSheet.columns = [
          { header: 'Número NF', key: 'numero', width: 15 },
          { header: 'Data', key: 'data', width: 12 },
          { header: 'Fornecedor', key: 'fornecedor', width: 30 },
          { header: 'CNPJ/CPF', key: 'cnpj', width: 18 },
          { header: 'Natureza Operação', key: 'natureza', width: 20 },
          { header: 'Valor Total', key: 'valor', width: 15 },
          { header: 'Qtd Itens', key: 'qtdItens', width: 12 },
          { header: 'Observações', key: 'observacoes', width: 40 }
        ]

        entradas.forEach(nota => {
          entradasSheet.addRow({
            numero: nota.numero_nf || nota.numeroNF || nota.numero,
            data: new Date(nota.data || nota.data_compra || nota.created_at).toLocaleDateString('pt-BR'),
            fornecedor: nota.fornecedor || '-',
            cnpj: nota.cnpj_origem_destino || '-',
            natureza: nota.natureza_operacao || '-',
            valor: parseFloat(nota.valor_total || 0),
            qtdItens: nota.itens ? nota.itens.length : (nota.total_itens || 0),
            observacoes: nota.observacoes || '-'
          })
        })

        // Estilizar cabeçalho
        const entradasHeaderRow = entradasSheet.getRow(1)
        entradasHeaderRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
          }
          cell.font = {
            color: { argb: 'FFFFFFFF' },
            bold: true
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        })
        entradasSheet.getRow(1).height = 25

        // Formatar coluna de valor
        entradasSheet.getColumn('valor').numFmt = 'R$ #,##0.00'
      }

      // ===== ABA SAÍDAS =====
      if (saidas.length > 0) {
        const saidasSheet = workbook.addWorksheet('📤 Saídas (Vendas)', {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
          }
        })

        saidasSheet.columns = [
          { header: 'Número NF', key: 'numero', width: 15 },
          { header: 'Data', key: 'data', width: 12 },
          { header: 'Destino/Comprador', key: 'destino', width: 30 },
          { header: 'CNPJ/CPF', key: 'cnpj', width: 18 },
          { header: 'Natureza Operação', key: 'natureza', width: 20 },
          { header: 'Valor Total', key: 'valor', width: 15 },
          { header: 'Qtd Itens', key: 'qtdItens', width: 12 },
          { header: 'Observações', key: 'observacoes', width: 40 }
        ]

        saidas.forEach(nota => {
          saidasSheet.addRow({
            numero: nota.numero_nf || nota.numeroNF || nota.numero,
            data: new Date(nota.data || nota.data_compra || nota.created_at).toLocaleDateString('pt-BR'),
            destino: nota.destino || '-',
            cnpj: nota.cnpj_origem_destino || '-',
            natureza: nota.natureza_operacao || '-',
            valor: parseFloat(nota.valor_total || 0),
            qtdItens: nota.itens ? nota.itens.length : (nota.total_itens || 0),
            observacoes: nota.observacoes || '-'
          })
        })

        // Estilizar cabeçalho
        const saidasHeaderRow = saidasSheet.getRow(1)
        saidasHeaderRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF3B82F6' }
          }
          cell.font = {
            color: { argb: 'FFFFFFFF' },
            bold: true
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        })
        saidasSheet.getRow(1).height = 25

        // Formatar coluna de valor
        saidasSheet.getColumn('valor').numFmt = 'R$ #,##0.00'
      }

      // ===== ABA ANIMAIS VENDIDOS/COMPRADOS =====
      const animaisVendidos = []
      const animaisComprados = []

      for (const nota of notasComDetalhes) {
        if (nota.itens && nota.itens.length > 0) {
          const itensBovinos = nota.itens.filter(item => 
            item.tipoProduto === 'bovino' || item.tipo_produto === 'bovino'
          )

          itensBovinos.forEach(item => {
            const animalData = {
              numeroNF: nota.numero_nf || nota.numeroNF || nota.numero,
              dataNF: new Date(nota.data || nota.data_compra || nota.created_at).toLocaleDateString('pt-BR'),
              identificacao: item.tatuagem || item.identificacao || `${item.serie || ''} ${item.rg || ''}`.trim() || 'N/A',
              sexo: item.sexo === 'macho' || item.sexo === 'M' ? 'Macho' : item.sexo === 'femea' || item.sexo === 'F' ? 'Fêmea' : item.sexo || 'N/A',
              raca: item.raca || 'N/A',
              era: item.era || 'N/A',
              peso: item.peso ? `${item.peso} kg` : 'N/A',
              valorUnitario: parseFloat(item.valorUnitario || item.valor_unitario || 0),
              fornecedorDestino: nota.tipo === 'entrada' ? (nota.fornecedor || '-') : (nota.destino || '-')
            }

            if (nota.tipo === 'entrada') {
              animaisComprados.push(animalData)
            } else {
              animaisVendidos.push(animalData)
            }
          })
        }
      }

      // Aba Animais Comprados
      if (animaisComprados.length > 0) {
        const animaisCompradosSheet = workbook.addWorksheet('🐂 Animais Comprados', {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
          }
        })

        animaisCompradosSheet.columns = [
          { header: 'NF', key: 'numeroNF', width: 12 },
          { header: 'Data NF', key: 'dataNF', width: 12 },
          { header: 'Identificação', key: 'identificacao', width: 20 },
          { header: 'Sexo', key: 'sexo', width: 10 },
          { header: 'Raça', key: 'raca', width: 15 },
          { header: 'Era', key: 'era', width: 10 },
          { header: 'Peso', key: 'peso', width: 12 },
          { header: 'Valor Unitário', key: 'valorUnitario', width: 15 },
          { header: 'Fornecedor', key: 'fornecedorDestino', width: 30 }
        ]

        animaisComprados.forEach(animal => {
          animaisCompradosSheet.addRow(animal)
        })

        // Estilizar cabeçalho
        const compradosHeaderRow = animaisCompradosSheet.getRow(1)
        compradosHeaderRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
          }
          cell.font = {
            color: { argb: 'FFFFFFFF' },
            bold: true
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        })
        animaisCompradosSheet.getRow(1).height = 25
        animaisCompradosSheet.getColumn('valorUnitario').numFmt = 'R$ #,##0.00'
      }

      // Aba Animais Vendidos
      if (animaisVendidos.length > 0) {
        const animaisVendidosSheet = workbook.addWorksheet('💰 Animais Vendidos', {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
          }
        })

        animaisVendidosSheet.columns = [
          { header: 'NF', key: 'numeroNF', width: 12 },
          { header: 'Data NF', key: 'dataNF', width: 12 },
          { header: 'Identificação', key: 'identificacao', width: 20 },
          { header: 'Sexo', key: 'sexo', width: 10 },
          { header: 'Raça', key: 'raca', width: 15 },
          { header: 'Era', key: 'era', width: 10 },
          { header: 'Peso', key: 'peso', width: 12 },
          { header: 'Valor Unitário', key: 'valorUnitario', width: 15 },
          { header: 'Comprador', key: 'fornecedorDestino', width: 30 }
        ]

        animaisVendidos.forEach(animal => {
          animaisVendidosSheet.addRow(animal)
        })

        // Estilizar cabeçalho
        const vendidosHeaderRow = animaisVendidosSheet.getRow(1)
        vendidosHeaderRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF3B82F6' }
          }
          cell.font = {
            color: { argb: 'FFFFFFFF' },
            bold: true
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        })
        animaisVendidosSheet.getRow(1).height = 25
        animaisVendidosSheet.getColumn('valorUnitario').numFmt = 'R$ #,##0.00'
      }

      // Gerar arquivo
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
      const periodo = `${new Date(filtros.dataInicio).toLocaleDateString('pt-BR').replace(/\//g, '-')}_a_${new Date(filtros.dataFim).toLocaleDateString('pt-BR').replace(/\//g, '-')}`
      link.download = `Relatorio_Fiscal_${periodo}_${dataAtual}.xlsx`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ Relatório Excel gerado com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao gerar relatório Excel:', error)
      alert('Erro ao gerar relatório. Verifique o console para mais detalhes.')
    } finally {
      setExportando(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ChartBarIcon className="w-8 h-8 text-orange-600" />
          Relatório Fiscal
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Análise de entradas e saídas (vendas)</p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas (Vendas)</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadNotasFiscais}
              disabled={loading}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Carregando...' : 'Atualizar'}
            </button>
            <button
              onClick={gerarRelatorioExcel}
              disabled={exportando || notasFiltradas.length === 0}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              {exportando ? 'Gerando...' : 'Gerar Relatório Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ArrowDownIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entradas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {resumo.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">{resumo.quantidadeEntradas} notas</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <ArrowUpIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saídas (Vendas)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {resumo.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">{resumo.quantidadeSaidas} notas</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${resumo.saldo >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              <CurrencyDollarIcon className={`w-6 h-6 ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo (Vendas - Compras)</p>
              <p className={`text-2xl font-bold ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {resumo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">
                {resumo.saldo >= 0 ? 'Lucro' : 'Prejuízo'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Notas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {notasFiltradas.length}
              </p>
              <p className="text-xs text-gray-500">No período</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Notas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notas Fiscais do Período
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando notas fiscais...</p>
          </div>
        ) : notasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma nota fiscal encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ajuste os filtros ou verifique se há notas fiscais cadastradas
            </p>
            {notasFiscais.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Total de notas no sistema: {notasFiscais.length} (fora do período filtrado)
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {notasFiltradas.map((nota) => (
                  <tr key={nota.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => carregarDetalhesNF(nota.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer font-semibold"
                        title="Clique para ver detalhes"
                      >
                        {nota.numero}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nota.tipo === 'entrada' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {nota.tipo === 'entrada' ? 'Entrada' : 'Saída (Venda)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {nota.empresa || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={nota.tipo === 'entrada' ? 'text-green-600' : 'text-blue-600'}>
                        R$ {(nota.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-orange-900 dark:text-orange-200 mb-2">
          📊 Sobre este Relatório
        </h3>
        <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1">
          <li>• <strong>Entradas:</strong> Compras e aquisições registradas via notas fiscais</li>
          <li>• <strong>Saídas (Vendas):</strong> Vendas e transferências registradas como notas fiscais de saída</li>
          <li>• <strong>Saldo:</strong> Diferença entre vendas e compras (receita líquida)</li>
          <li>• <strong>Período:</strong> Baseado na data de emissão das notas fiscais</li>
        </ul>
      </div>

      {/* Modal de Detalhes da Nota Fiscal */}
      {showDetalhesModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setShowDetalhesModal(false)}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalhes da Nota Fiscal
                  </h3>
                  <button
                    onClick={() => setShowDetalhesModal(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {loadingDetalhes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando detalhes...</p>
                  </div>
                ) : nfDetalhes ? (
                  <div className="space-y-6">
                    {/* Informações Gerais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Número da NF
                        </label>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {nfDetalhes.numero_nf || nfDetalhes.numeroNF}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Data
                        </label>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {new Date(nfDetalhes.data || nfDetalhes.data_compra || nfDetalhes.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Tipo
                        </label>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          nfDetalhes.tipo === 'entrada'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {nfDetalhes.tipo === 'entrada' ? 'Entrada' : 'Saída (Venda)'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Valor Total
                        </label>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfDetalhes.valor_total || 0)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {nfDetalhes.tipo === 'entrada' ? 'Fornecedor' : 'Destino/Comprador'}
                        </label>
                        <p className="text-base text-gray-900 dark:text-white">
                          {nfDetalhes.fornecedor || nfDetalhes.destino || 'Não informado'}
                        </p>
                      </div>
                      {nfDetalhes.cnpj_origem_destino && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            CNPJ/CPF
                          </label>
                          <p className="text-base text-gray-900 dark:text-white">
                            {nfDetalhes.cnpj_origem_destino}
                          </p>
                        </div>
                      )}
                      {nfDetalhes.natureza_operacao && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Natureza da Operação
                          </label>
                          <p className="text-base text-gray-900 dark:text-white">
                            {nfDetalhes.natureza_operacao}
                          </p>
                        </div>
                      )}
                      {nfDetalhes.observacoes && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Observações
                          </label>
                          <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                            {nfDetalhes.observacoes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Itens da Nota Fiscal */}
                    {nfDetalhes.itens && nfDetalhes.itens.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                          Itens da Nota Fiscal ({nfDetalhes.itens.length})
                        </h4>
                        
                        {/* Filtrar apenas bovinos para mostrar animais vendidos */}
                        {(() => {
                          const itensBovinos = nfDetalhes.itens.filter(item => item.tipoProduto === 'bovino' || item.tipo_produto === 'bovino')
                          
                          return itensBovinos.length > 0 ? (
                            <div className="mb-4">
                              <h5 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                🐂 Animais {nfDetalhes.tipo === 'entrada' ? 'Comprados' : 'Vendidos'} ({itensBovinos.length})
                              </h5>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                  <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Identificação
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Sexo
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Raça
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Era
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Peso
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Valor Unitário
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {itensBovinos.map((item, index) => (
                                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                          {item.tatuagem || item.identificacao || `${item.serie || ''} ${item.rg || ''}`.trim() || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                          {item.sexo === 'macho' || item.sexo === 'M' ? 'Macho' : item.sexo === 'femea' || item.sexo === 'F' ? 'Fêmea' : item.sexo || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                          {item.raca || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                          {item.era || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                          {item.peso ? `${item.peso} kg` : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.valorUnitario || item.valor_unitario || 0))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : null
                        })()}

                        {/* Outros itens (sêmen, embriões) */}
                        {nfDetalhes.itens.filter(item => (item.tipoProduto !== 'bovino' && item.tipo_produto !== 'bovino')).length > 0 && (
                          <div>
                            <h5 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                              Outros Itens
                            </h5>
                            <div className="space-y-2">
                              {nfDetalhes.itens
                                .filter(item => (item.tipoProduto !== 'bovino' && item.tipo_produto !== 'bovino'))
                                .map((item, index) => (
                                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <strong>Tipo:</strong> {item.tipoProduto || item.tipo_produto || 'N/A'}
                                    </p>
                                    {item.nomeTouro && (
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        <strong>Touro:</strong> {item.nomeTouro}
                                      </p>
                                    )}
                                    {item.quantidadeDoses && (
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        <strong>Quantidade:</strong> {item.quantidadeDoses} doses
                                      </p>
                                    )}
                                    {item.valorUnitario && (
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        <strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.valorUnitario || 0))}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">Erro ao carregar detalhes da nota fiscal</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowDetalhesModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}