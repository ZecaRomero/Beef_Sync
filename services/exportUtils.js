import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Cache para dados de exportação
const exportCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const exportToExcel = async (data, filename = 'beef_sync_export') => {
  try {
    // Criar um novo workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Detalhes dos Animais')


    // Definir as colunas com cabeçalhos incluindo dados de morte
    worksheet.columns = [
      { header: 'Série', key: 'Série', width: 10 },
      { header: 'RG', key: 'RG', width: 12 },
      { header: 'Raça', key: 'Raça', width: 15 },
      { header: 'Sexo', key: 'Sexo', width: 10 },
      { header: 'Idade (meses)', key: 'Idade (meses)', width: 12 },
      { header: 'Situação', key: 'Situação', width: 12 },
      { header: 'Custo Total', key: 'Custo Total (R$)', width: 15 },
      { header: 'Data Nascimento', key: 'Data Nascimento', width: 15 },
      { header: 'Peso', key: 'Peso', width: 10 },
      { header: 'Observações', key: 'Observações', width: 20 },
      { header: 'Data Cadastro', key: 'Data Cadastro', width: 15 },
      // Dados específicos de morte
      { header: 'Data da Morte', key: 'Data da Morte', width: 15 },
      { header: 'Causa da Morte', key: 'Causa da Morte', width: 15 },
      { header: 'Valor da Perda (R$)', key: 'Valor da Perda (R$)', width: 15 },
      { header: 'Observações da Morte', key: 'Observações da Morte', width: 20 }
    ]

    // Adicionar os dados
    data.forEach(row => {
      worksheet.addRow(row)
    })

    // Estilizar o cabeçalho (linha 1) - Fundo roxo com texto branco
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7030A0' } // Roxo
      }
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      }
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    })

    // Estilizar as linhas de dados - Fundo cinza claro com texto centralizado
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' } // Cinza claro
          }
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          }
          
          // Formatação específica por tipo de dado
          const columnKey = cell.$col$row.split('$')[0]
          
          // Formatar números monetários
          if (columnKey === 'Custo Total (R$)' || columnKey === 'Valor da Perda (R$)') {
            if (cell.value && cell.value !== 'N/A' && typeof cell.value === 'number') {
              cell.numFmt = '#,##0.00'
            }
          }
          
          // Formatar datas
          if (columnKey === 'Data Nascimento' || columnKey === 'Data Cadastro' || columnKey === 'Data da Morte') {
            if (cell.value && cell.value !== 'N/A') {
              // Se for uma string de data, manter como texto
              // Se for um objeto Date, formatar
              if (cell.value instanceof Date) {
                cell.numFmt = 'dd/mm/yyyy'
              }
            }
          }
          
          // Formatar números inteiros
          if (columnKey === 'Idade (meses)' || columnKey === 'Peso') {
            if (cell.value && cell.value !== 'N/A' && typeof cell.value === 'number') {
              cell.numFmt = '0'
            }
          }
        })
      }
    })

    // Gerar o buffer do arquivo
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Criar um blob e fazer download
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error)
    return false
  }
}

export const formatAnimalDataForExport = async (animals) => {
  // Verificar cache primeiro
  const cacheKey = `animals_${animals.length}_${Date.now() - (Date.now() % CACHE_DURATION)}`
  if (exportCache.has(cacheKey)) {
    console.log('📦 Dados de exportação carregados do cache')
    return exportCache.get(cacheKey)
  }

  // Buscar dados de mortes para animais mortos (apenas no servidor)
  let databaseService = null
  if (typeof window === 'undefined') {
    try {
      databaseService = (await import('./databaseService.js')).default
    } catch (error) {
      console.warn('Erro ao importar databaseService:', error)
    }
  }
  
  const animalsWithDeathData = await Promise.all(
    animals.map(async (animal) => {
      let deathData = null
      
      // Buscar dados de morte apenas se estiver no servidor e o animal estiver morto
      if (typeof window === 'undefined' && animal.situacao === 'Morto' && databaseService) {
        try {
          const mortes = await databaseService.buscarMortes({ animalId: animal.id })
          if (mortes.length > 0) {
            deathData = mortes[0]
          }
        } catch (error) {
          console.warn('Erro ao buscar dados de morte:', error)
        }
      }
      
      return {
        'Série': animal.serie,
        'RG': animal.rg,
        'Raça': animal.raca,
        'Sexo': animal.sexo,
        'Idade (meses)': animal.meses,
        'Situação': animal.situacao,
        'Custo Total (R$)': parseFloat(animal.custo_total || 0),
        'Data Nascimento': animal.data_nascimento ? new Date(animal.data_nascimento) : 'N/A',
        'Peso': animal.peso || 'N/A',
        'Observações': animal.observacoes || 'N/A',
        'Data Cadastro': animal.created_at ? new Date(animal.created_at) : 'N/A',
        // Dados específicos de morte
        'Data da Morte': deathData?.data_morte ? new Date(deathData.data_morte) : 'N/A',
        'Causa da Morte': deathData?.causa_morte || 'N/A',
        'Valor da Perda (R$)': deathData?.valor_perda ? parseFloat(deathData.valor_perda) : 'N/A',
        'Observações da Morte': deathData?.observacoes || 'N/A'
      }
    })
  )
  
  // Armazenar no cache
  exportCache.set(cacheKey, animalsWithDeathData)
  
  // Limpar cache antigo
  setTimeout(() => {
    exportCache.delete(cacheKey)
  }, CACHE_DURATION)
  
  return animalsWithDeathData
}

export const exportCostsToExcel = async (animals, filename = 'beef_sync_custos') => {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Custos')

    worksheet.columns = [
      { header: 'Animal ID', key: 'Animal ID', width: 10 },
      { header: 'Animal', key: 'Animal', width: 15 },
      { header: 'Raça', key: 'Raça', width: 12 },
      { header: 'Tipo Custo', key: 'Tipo Custo', width: 15 },
      { header: 'Subtipo', key: 'Subtipo', width: 12 },
      { header: 'Valor (R$)', key: 'Valor (R$)', width: 12 },
      { header: 'Data', key: 'Data', width: 12 },
      { header: 'Observações', key: 'Observações', width: 20 },
      { header: 'Fornecedor', key: 'Fornecedor', width: 15 },
      { header: 'Destino', key: 'Destino', width: 15 }
    ]

    const costsData = []
    animals.forEach(animal => {
      if (animal.custos && animal.custos.length > 0) {
        animal.custos.forEach(custo => {
          costsData.push({
            'Animal ID': animal.id,
            'Animal': `${animal.serie} ${animal.rg}`,
            'Raça': animal.raca,
            'Tipo Custo': custo.tipo,
            'Subtipo': custo.subtipo || 'N/A',
            'Valor (R$)': custo.valor,
            'Data': custo.data,
            'Observações': custo.observacoes || 'N/A',
            'Fornecedor': custo.fornecedor || 'N/A',
            'Destino': custo.destino || 'N/A'
          })
        })
      }
    })

    costsData.forEach(row => {
      worksheet.addRow(row)
    })

    // Aplicar formatação padrão com bordas e centralização
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7030A0' } // Roxo
      }
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      }
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    })

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' } // Cinza claro
          }
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          }
          
          // Formatar números monetários
          if (cell.$col$row.includes('Valor (R$)')) {
            if (cell.value && cell.value !== 'N/A' && typeof cell.value === 'number') {
              cell.numFmt = '#,##0.00'
            }
          }
        })
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('Erro ao exportar custos para Excel:', error)
    return false
  }
}

export const exportReportToExcel = async (reportData, filename = 'beef_sync_relatorio') => {
  try {
    const workbook = new ExcelJS.Workbook()
    
    // Aba 1: Resumo Geral
    const resumoSheet = workbook.addWorksheet('Resumo')
    resumoSheet.columns = [
      { header: 'Indicador', key: 'Indicador', width: 20 },
      { header: 'Valor', key: 'Valor', width: 15 }
    ]

    const resumoData = [
      { 'Indicador': 'Total de Animais', 'Valor': reportData.totalAnimais },
      { 'Indicador': 'Animais Ativos', 'Valor': reportData.animaisAtivos },
      { 'Indicador': 'Animais Vendidos', 'Valor': reportData.animaisVendidos },
      { 'Indicador': 'Custo Total (R$)', 'Valor': reportData.custoTotal.toFixed(2) },
      { 'Indicador': 'Receita Total (R$)', 'Valor': reportData.receitaTotal.toFixed(2) },
      { 'Indicador': 'Lucro Total (R$)', 'Valor': reportData.lucroTotal.toFixed(2) }
    ]

    resumoData.forEach(row => {
      resumoSheet.addRow(row)
    })

    // Aplicar formatação ao resumo
    const resumoHeaderRow = resumoSheet.getRow(1)
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
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    resumoSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          }
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('Erro ao exportar relatório para Excel:', error)
    return false
  }
}

// Função para formatar dados completos de animais com localização para exportação
export const formatAnimalDataWithLocationForExport = (animals, getLocalizacaoAtual) => {
  const animalsWithFullData = animals.map((animal) => {
    const localizacaoAtual = getLocalizacaoAtual ? getLocalizacaoAtual(animal.id) : null
    
    // Fallback: Se não tem histórico de localização, usa o pasto_atual do cadastro
    const piqueteAtual = localizacaoAtual?.piquete || animal.pasto_atual || animal.pastoAtual || 'Não localizado'
    
    // Determinar data de entrada (se for fallback, usa data de criação ou nascimento)
    let dataEntrada = 'N/A'
    if (localizacaoAtual?.data_entrada) {
      dataEntrada = new Date(localizacaoAtual.data_entrada).toLocaleDateString('pt-BR')
    } else if (animal.pasto_atual || animal.pastoAtual) {
      const dataRef = animal.created_at || animal.data_nascimento
      if (dataRef) {
        dataEntrada = new Date(dataRef).toLocaleDateString('pt-BR')
      }
    }
    
    const motivoMovimentacao = localizacaoAtual?.motivo_movimentacao || 
      ((animal.pasto_atual || animal.pastoAtual) ? 'Cadastro Inicial' : 'N/A')
      
    return {
      'Série': animal.serie || 'N/A',
      'RG': animal.rg || 'N/A',
      'Raça': animal.raca || 'N/A',
      'Sexo': animal.sexo || 'N/A',
      'Data Nascimento': animal.data_nascimento 
        ? new Date(animal.data_nascimento).toLocaleDateString('pt-BR') 
        : 'N/A',
      'Idade (meses)': animal.meses || 0,
      'Piquete': piqueteAtual,
      'Data Entrada Piquete': dataEntrada,
      'Motivo Movimentação': motivoMovimentacao,
      'Pat (Pai)': animal.pai || 'N/A',
      'Mãe': animal.mae || 'N/A',
      'Receptora': animal.receptora || 'N/A',
      'Tatuagem': animal.tatuagem || 'N/A',
      'Peso': animal.peso ? parseFloat(animal.peso) : 'N/A',
      'Cor': animal.cor || 'N/A',
      'Tipo Nascimento': animal.tipo_nascimento || 'N/A',
      'Dificuldade Parto': animal.dificuldade_parto || 'N/A',
      'FIV': animal.is_fiv ? 'Sim' : 'Não',
      'Situação': animal.situacao || 'N/A',
      'Custo Total (R$)': parseFloat(animal.custo_total || 0),
      'Valor Venda (R$)': animal.valor_venda ? parseFloat(animal.valor_venda) : 'N/A',
      'Valor Real (R$)': animal.valor_real ? parseFloat(animal.valor_real) : 'N/A',
      'Veterinário': animal.veterinario || 'N/A',
      'ABCZG': animal.abczg || 'N/A',
      'DECA': animal.deca || 'N/A',
      'Observações': animal.observacoes || 'N/A',
      'Data Cadastro': animal.created_at 
        ? new Date(animal.created_at).toLocaleDateString('pt-BR') 
        : 'N/A'
    }
  })
  
  return animalsWithFullData
}

// Função para exportar animais com localização completa para Excel
export const exportAnimalsWithLocationToExcel = async (animals, getLocalizacaoAtual, filename = 'animais_localizacao', piqueteFiltro = null, camposSelecionados = null) => {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Animais e Localização')

    // Definir todos os campos disponíveis
    const todosOsCampos = [
      { header: 'Série', key: 'Série', width: 12 },
      { header: 'RG', key: 'RG', width: 12 },
      { header: 'Raça', key: 'Raça', width: 15 },
      { header: 'Sexo', key: 'Sexo', width: 10 },
      { header: 'Data Nascimento', key: 'Data Nascimento', width: 15 },
      { header: 'Idade (meses)', key: 'Idade (meses)', width: 12 },
      { header: 'Piquete', key: 'Piquete', width: 15 },
      { header: 'Data Entrada Piquete', key: 'Data Entrada Piquete', width: 18 },
      { header: 'Motivo Movimentação', key: 'Motivo Movimentação', width: 20 },
      { header: 'Pat (Pai)', key: 'Pat (Pai)', width: 15 },
      { header: 'Mãe', key: 'Mãe', width: 15 },
      { header: 'Receptora', key: 'Receptora', width: 15 },
      { header: 'Tatuagem', key: 'Tatuagem', width: 12 },
      { header: 'Peso', key: 'Peso', width: 10 },
      { header: 'Cor', key: 'Cor', width: 12 },
      { header: 'Tipo Nascimento', key: 'Tipo Nascimento', width: 15 },
      { header: 'Dificuldade Parto', key: 'Dificuldade Parto', width: 15 },
      { header: 'FIV', key: 'FIV', width: 8 },
      { header: 'Situação', key: 'Situação', width: 12 },
      { header: 'Custo Total (R$)', key: 'Custo Total (R$)', width: 15 },
      { header: 'Valor Venda (R$)', key: 'Valor Venda (R$)', width: 15 },
      { header: 'Valor Real (R$)', key: 'Valor Real (R$)', width: 15 },
      { header: 'Veterinário', key: 'Veterinário', width: 15 },
      { header: 'ABCZG', key: 'ABCZG', width: 12 },
      { header: 'DECA', key: 'DECA', width: 12 },
      { header: 'Observações', key: 'Observações', width: 30 },
      { header: 'Data Cadastro', key: 'Data Cadastro', width: 15 }
    ]

    // Filtrar campos selecionados se especificado
    const camposParaExportar = camposSelecionados && camposSelecionados.length > 0
      ? todosOsCampos.filter(campo => camposSelecionados.includes(campo.header))
      : todosOsCampos

    // Definir colunas apenas com campos selecionados
    worksheet.columns = camposParaExportar

    // Formatar dados
    const formattedData = formatAnimalDataWithLocationForExport(animals, getLocalizacaoAtual)
    
    // Adicionar dados apenas com campos selecionados
    formattedData.forEach(row => {
      const rowData = {}
      camposParaExportar.forEach(campo => {
        rowData[campo.key] = row[campo.key] || ''
      })
      worksheet.addRow(rowData)
    })

    // Estilizar cabeçalho
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7030A0' } // Roxo
      }
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      }
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    })

    // Estilizar linhas de dados
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' } // Cinza claro
          }
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          }
          
          // Formatar números monetários
          const header = worksheet.getRow(1).getCell(cell.col).value
          if (header && (header.includes('(R$)'))) {
            if (cell.value && cell.value !== 'N/A' && typeof cell.value === 'number') {
              cell.numFmt = '#,##0.00'
            }
          }
        })
      }
    })

    // Gerar o buffer do arquivo
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Criar um blob e fazer download
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('Erro ao exportar animais com localização para Excel:', error)
    return false
  }
}

// Função para exportar animais com localização completa para PDF
export const exportAnimalsWithLocationToPDF = async (animals, getLocalizacaoAtual, filename = 'animais_localizacao', piqueteFiltro = null, camposSelecionados = null) => {
  try {
    // Inicialização robusta do jsPDF
    const JsPDFClass = jsPDF.jsPDF || jsPDF
    const doc = new JsPDFClass({ orientation: 'landscape' })
    
    // Título do Relatório
    doc.setFontSize(18)
    doc.setTextColor(37, 99, 235) // Azul
    doc.text('Relatório de Localização de Animais', 14, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100) // Cinza
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28)
    if (piqueteFiltro) {
      doc.text(`Filtro de Piquete: ${piqueteFiltro}`, 14, 34)
    }

    // Definir colunas e dados
    const todosOsCampos = [
      { header: 'Série', dataKey: 'Série' },
      { header: 'RG', dataKey: 'RG' },
      { header: 'Raça', dataKey: 'Raça' },
      { header: 'Sexo', dataKey: 'Sexo' },
      { header: 'Nascimento', dataKey: 'Data Nascimento' },
      { header: 'Idade', dataKey: 'Idade (meses)' },
      { header: 'Piquete', dataKey: 'Piquete' },
      { header: 'Entrada', dataKey: 'Data Entrada Piquete' },
      { header: 'Motivo', dataKey: 'Motivo Movimentação' },
      { header: 'Peso', dataKey: 'Peso' },
      { header: 'Situação', dataKey: 'Situação' }
    ]

    let columns = todosOsCampos
    if (camposSelecionados && camposSelecionados.length > 0) {
      columns = camposSelecionados.map(campo => {
        return { header: campo, dataKey: campo }
      })
    }

    // Formatar dados
    const formattedData = formatAnimalDataWithLocationForExport(animals, getLocalizacaoAtual)
    
    // Preparar dados para o autotable
    const tableData = formattedData.map(row => {
      const newRow = {}
      columns.forEach(col => {
        newRow[col.dataKey] = row[col.dataKey]
      })
      return newRow
    })

    // Executar autoTable de forma robusta
    const runAutoTable = typeof autoTable === 'function' ? autoTable : autoTable.default
    
    if (typeof runAutoTable !== 'function') {
      throw new Error('Falha ao carregar plugin de tabela PDF')
    }

    runAutoTable(doc, {
      startY: 40,
      head: [columns.map(c => c.header)],
      body: tableData.map(row => columns.map(c => row[c.dataKey])),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [112, 48, 160], textColor: 255 }, // Roxo
      alternateRowStyles: { fillColor: [242, 242, 242] },
      margin: { top: 40 },
      didDrawPage: function (data) {
        const str = 'Página ' + doc.internal.getNumberOfPages()
        doc.setFontSize(8)
        const pageSize = doc.internal.pageSize
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
        doc.text(str, data.settings.margin.left, pageHeight - 10)
      }
    })

    doc.save(`${filename}.pdf`)
    return true
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error)
    alert(`Erro ao gerar PDF: ${error.message}`) // Feedback visual direto
    return false
  }
}