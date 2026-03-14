// Utilitário especializado para exportação de estoque de sêmen com formatação profissional

export const exportSemenToExcel = async (semenStock, filteredStock) => {
  // Verificar se estamos no browser
  if (typeof window === 'undefined') {
    throw new Error('Esta função só pode ser executada no browser');
  }
  try {
    // Importar ExcelJS dinamicamente
    const ExcelJS = (await import('exceljs')).default;
    
    // Criar workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BeefSync - Sistema de Gestão Pecuária';
    workbook.lastModifiedBy = 'BeefSync';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.company = 'BeefSync';
    workbook.subject = 'Relatório de Estoque de Sêmen';
    workbook.keywords = 'sêmen, estoque, bovinos, genética';
    
    // ===== ABA PRINCIPAL - ESTOQUE DETALHADO =====
    const mainSheet = workbook.addWorksheet('📊 Estoque Detalhado', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.7, right: 0.7,
          top: 0.75, bottom: 0.75,
          header: 0.3, footer: 0.3
        }
      }
    });

    // Cabeçalho principal com logo/título
    mainSheet.mergeCells('A1:Y2');
    const titleCell = mainSheet.getCell('A1');
    titleCell.value = '🧬 BEEF-SYNC - CONTROLE DE ESTOQUE DE SÊMEN BOVINO';
    titleCell.font = { 
      name: 'Calibri', 
      size: 20, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    titleCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    titleCell.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: 'FF1F4E79' } },
        { position: 1, color: { argb: 'FF2563EB' } }
      ]
    };
    mainSheet.getRow(1).height = 45;
    mainSheet.getRow(2).height = 5;

    // Informações do relatório
    const currentDate = new Date();
    const stats = calculateStats(semenStock);
    
    mainSheet.mergeCells('A3:Y3');
    const infoCell = mainSheet.getCell('A3');
    infoCell.value = `📅 Relatório gerado em ${currentDate.toLocaleDateString('pt-BR')} às ${currentDate.toLocaleTimeString('pt-BR')} | 👤 Usuário: Sistema | 📊 Registros: ${filteredStock.length}`;
    infoCell.font = { 
      name: 'Calibri', 
      size: 11, 
      italic: true, 
      color: { argb: 'FF4B5563' } 
    };
    infoCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    infoCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };
    mainSheet.getRow(3).height = 22;

    // Painel de estatísticas
    addStatsPanel(mainSheet, stats, 4);

    // Cabeçalhos da tabela
    const headers = [
      { key: 'nomeTouro', header: 'Nome do Touro', width: 22 },
      { key: 'rgTouro', header: 'RG/Registro', width: 16 },
      { key: 'raca', header: 'Raça', width: 15 },
      { key: 'localizacao', header: 'Localização', width: 18 },
      { key: 'rackTouro', header: 'Rack', width: 12 },
      { key: 'botijao', header: 'Botijão', width: 12 },
      { key: 'caneca', header: 'Caneca', width: 12 },
      { key: 'tipoOperacao', header: 'Tipo', width: 12 },
      { key: 'fornecedor', header: 'Fornecedor', width: 22 },
      { key: 'destino', header: 'Destino', width: 20 },
      { key: 'numeroNF', header: 'Nº NF', width: 14 },
      { key: 'valorCompra', header: 'Valor (R$)', width: 16 },
      { key: 'dataCompra', header: 'Data Compra', width: 16 },
      { key: 'quantidadeDoses', header: 'Qtd Doses', width: 14 },
      { key: 'dosesDisponiveis', header: 'Disponíveis', width: 14 },
      { key: 'dosesUsadas', header: 'Usadas', width: 12 },
      { key: 'certificado', header: 'Certificado', width: 18 },
      { key: 'dataValidade', header: 'Validade', width: 16 },
      { key: 'origem', header: 'Origem', width: 20 },
      { key: 'linhagem', header: 'Linhagem', width: 20 },
      { key: 'observacoes', header: 'Observações', width: 35 },
      { key: 'status', header: 'Status', width: 14 },
      { key: 'created_at', header: 'Criado em', width: 16 },
      { key: 'updated_at', header: 'Atualizado', width: 16 }
    ];

    // Aplicar cabeçalhos
    const headerRow = mainSheet.getRow(8);
    headers.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      
      // Estilo do cabeçalho
      cell.font = { 
        name: 'Calibri', 
        size: 11, 
        bold: true, 
        color: { argb: 'FFFFFFFF' } 
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E79' }
      };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true 
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      // Definir largura da coluna
      mainSheet.getColumn(index + 1).width = col.width;
    });
    headerRow.height = 35;

    // Adicionar dados
    filteredStock.forEach((semen, index) => {
      const row = mainSheet.getRow(index + 9);
      const rowData = [
        semen.nomeTouro || semen.nome_touro || semen.serie || '',
        semen.rgTouro || semen.rg_touro || semen.rg || '',
        semen.raca || '',
        semen.localizacao || '',
        semen.rackTouro || semen.rack_touro || '',
        semen.botijao || '',
        semen.caneca || '',
        formatTipoOperacao(semen.tipoOperacao || semen.tipo_operacao),
        semen.fornecedor || '',
        semen.destino || '',
        semen.numeroNF || semen.numero_nf || '',
        parseFloat(semen.valorCompra || semen.valor_compra || 0),
        semen.dataCompra || semen.data_compra ? new Date(semen.dataCompra || semen.data_compra) : '',
        semen.quantidadeDoses || semen.quantidade_doses || 0,
        semen.dosesDisponiveis || semen.doses_disponiveis || 0,
        semen.dosesUsadas || semen.doses_usadas || 0,
        semen.certificado || '',
        semen.dataValidade || semen.data_validade ? new Date(semen.dataValidade || semen.data_validade) : '',
        semen.origem || '',
        semen.linhagem || '',
        semen.observacoes || '',
        formatStatus(semen.status),
        semen.created_at ? new Date(semen.created_at) : '',
        semen.updated_at ? new Date(semen.updated_at) : ''
      ];

      // Aplicar dados e formatação
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        
        // Formatação específica por tipo
        applyColumnFormatting(cell, colIndex, value, semen.status);
        
        // Cor de fundo alternada
        if (index % 2 === 0) {
          if (!cell.fill || cell.fill.type !== 'pattern') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          }
        }
        
        // Bordas
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
      
      row.height = 28;
    });

    // ===== ABA RESUMO EXECUTIVO =====
    const summarySheet = workbook.addWorksheet('📈 Resumo Executivo');
    createSummarySheet(summarySheet, stats, semenStock);

    // ===== ABA ANÁLISE POR TOURO =====
    const touroSheet = workbook.addWorksheet('🐂 Análise por Touro');
    createTouroAnalysisSheet(touroSheet, semenStock);

    // Configurações finais da planilha principal
    mainSheet.autoFilter = {
      from: 'A8',
      to: `X${filteredStock.length + 8}`
    };

    mainSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 8 }
    ];

    // Gerar e baixar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BeefSync_Estoque_Semen_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Erro ao exportar:', error);
    throw error;
  }
};

// Funções auxiliares
function calculateStats(semenStock) {
  const entradas = semenStock.filter(s => (s.tipoOperacao || s.tipo_operacao) === 'entrada');
  const saidas = semenStock.filter(s => (s.tipoOperacao || s.tipo_operacao) === 'saida');
  
  return {
    totalTouros: new Set(entradas.map(s => s.nomeTouro || s.nome_touro)).size,
    totalEntradas: entradas.length,
    totalSaidas: saidas.length,
    totalDoses: entradas.reduce((acc, s) => acc + (s.quantidadeDoses || s.quantidade_doses || 0), 0),
    dosesDisponiveis: entradas.reduce((acc, s) => acc + (s.dosesDisponiveis || s.doses_disponiveis || 0), 0),
    dosesUsadas: entradas.reduce((acc, s) => acc + (s.dosesUsadas || s.doses_usadas || 0), 0),
    valorTotal: entradas.reduce((acc, s) => acc + parseFloat(s.valorCompra || s.valor_compra || 0), 0),
    fornecedores: new Set(entradas.map(s => s.fornecedor).filter(Boolean)).size,
    disponivel: entradas.filter(s => s.status === 'disponivel').length,
    esgotado: entradas.filter(s => s.status === 'esgotado').length
  };
}

function addStatsPanel(sheet, stats, startRow) {
  // Painel de estatísticas com 4 colunas
  const panels = [
    { title: '🐂 Touros', value: stats.totalTouros, color: 'FF3B82F6' },
    { title: '📦 Total Doses', value: stats.totalDoses.toLocaleString('pt-BR'), color: 'FF10B981' },
    { title: '✅ Disponíveis', value: stats.dosesDisponiveis.toLocaleString('pt-BR'), color: 'FF059669' },
    { title: '💰 Valor Total', value: `R$ ${stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'FFDC2626' }
  ];

  panels.forEach((panel, index) => {
    const startCol = index * 6 + 1;
    const endCol = startCol + 5;
    
    // Mesclar células para o painel
    sheet.mergeCells(startRow, startCol, startRow + 1, endCol);
    const cell = sheet.getCell(startRow, startCol);
    
    cell.value = `${panel.title}\n${panel.value}`;
    cell.font = { 
      name: 'Calibri', 
      size: 14, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    cell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true 
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: panel.color }
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } }
    };
  });
  
  sheet.getRow(startRow).height = 35;
  sheet.getRow(startRow + 1).height = 10;
}

function applyColumnFormatting(cell, colIndex, value, status) {
  // Formatação por tipo de coluna
  switch (colIndex) {
    case 11: // Valor
      cell.numFmt = 'R$ #,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      break;
    case 12: case 17: case 22: case 23: // Datas
      cell.numFmt = 'dd/mm/yyyy';
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      break;
    case 13: case 14: case 15: // Números
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      break;
    case 21: // Status
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (status === 'disponivel') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        cell.font = { color: { argb: 'FF065F46' }, bold: true };
      } else if (status === 'esgotado') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
        cell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
      break;
    case 20: // Observações
      cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
      break;
    default:
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
  }
}

function formatTipoOperacao(tipo) {
  switch (tipo) {
    case 'entrada': return '📥 Entrada';
    case 'saida': return '📤 Saída';
    default: return tipo || '';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'disponivel': return '✅ Disponível';
    case 'esgotado': return '❌ Esgotado';
    case 'vencido': return '⚠️ Vencido';
    default: return status || '';
  }
}

function createSummarySheet(sheet, stats, semenStock) {
  // Título
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '📈 RESUMO EXECUTIVO - ESTOQUE DE SÊMEN';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1F4E79' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } };
  sheet.getRow(1).height = 30;

  // Estatísticas principais
  const summaryData = [
    ['Métrica', 'Valor', 'Descrição'],
    ['Total de Touros', stats.totalTouros, 'Número único de touros no estoque'],
    ['Total de Doses', stats.totalDoses.toLocaleString('pt-BR'), 'Quantidade total de doses adquiridas'],
    ['Doses Disponíveis', stats.dosesDisponiveis.toLocaleString('pt-BR'), 'Doses ainda disponíveis para uso'],
    ['Doses Utilizadas', stats.dosesUsadas.toLocaleString('pt-BR'), 'Doses já utilizadas'],
    ['Valor Total Investido', `R$ ${stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor total investido em sêmen'],
    ['Fornecedores Ativos', stats.fornecedores, 'Número de fornecedores diferentes'],
    ['Entradas Disponíveis', stats.disponivel, 'Entradas com doses disponíveis'],
    ['Entradas Esgotadas', stats.esgotado, 'Entradas sem doses disponíveis']
  ];

  summaryData.forEach((row, index) => {
    const excelRow = sheet.getRow(index + 3);
    row.forEach((value, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      cell.value = value;
      
      if (index === 0) { // Cabeçalho
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      } else if (colIndex === 1) { // Valores
        cell.font = { bold: true, color: { argb: 'FF059669' } };
        cell.alignment = { horizontal: 'right' };
      }
      
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    });
  });

  // Definir larguras
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 40;
}

function createTouroAnalysisSheet(sheet, semenStock) {
  // Título
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '🐂 ANÁLISE DETALHADA POR TOURO';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1F4E79' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } };
  sheet.getRow(1).height = 30;

  // Agrupar dados por touro
  const entradas = semenStock.filter(s => (s.tipoOperacao || s.tipo_operacao) === 'entrada');
  const touroData = {};
  
  entradas.forEach(semen => {
    const nome = semen.nomeTouro || semen.nome_touro || 'Sem nome';
    if (!touroData[nome]) {
      touroData[nome] = {
        nome,
        raca: semen.raca || '',
        totalDoses: 0,
        dosesDisponiveis: 0,
        dosesUsadas: 0,
        valorTotal: 0,
        entradas: 0
      };
    }
    
    touroData[nome].totalDoses += semen.quantidadeDoses || semen.quantidade_doses || 0;
    touroData[nome].dosesDisponiveis += semen.dosesDisponiveis || semen.doses_disponiveis || 0;
    touroData[nome].dosesUsadas += semen.dosesUsadas || semen.doses_usadas || 0;
    touroData[nome].valorTotal += parseFloat(semen.valorCompra || semen.valor_compra || 0);
    touroData[nome].entradas += 1;
  });

  // Cabeçalhos
  const headers = ['Nome do Touro', 'Raça', 'Entradas', 'Total Doses', 'Disponíveis', 'Usadas', 'Valor Total', 'Eficiência'];
  const headerRow = sheet.getRow(3);
  
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // Dados dos touros
  Object.values(touroData).forEach((touro, index) => {
    const row = sheet.getRow(index + 4);
    const eficiencia = touro.totalDoses > 0 ? ((touro.dosesUsadas / touro.totalDoses) * 100).toFixed(1) + '%' : '0%';
    
    const rowData = [
      touro.nome,
      touro.raca,
      touro.entradas,
      touro.totalDoses,
      touro.dosesDisponiveis,
      touro.dosesUsadas,
      touro.valorTotal,
      eficiencia
    ];

    rowData.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      
      if (colIndex === 6) { // Valor
        cell.numFmt = 'R$ #,##0.00';
      } else if ([2, 3, 4, 5].includes(colIndex)) { // Números
        cell.numFmt = '#,##0';
      }
      
      cell.alignment = { 
        horizontal: [2, 3, 4, 5, 6, 7].includes(colIndex) ? 'right' : 'left',
        vertical: 'middle' 
      };
      
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    });
  });

  // Larguras das colunas
  const widths = [25, 15, 12, 15, 15, 12, 18, 15];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

export default { exportSemenToExcel };