// Exportador Excel simplificado e robusto para estoque de sêmen

export const exportSemenToExcel = async (semenStock, filteredStock, periodData = null) => {
  try {
    // Importar ExcelJS dinamicamente
    const ExcelJS = (await import('exceljs')).default;
    
    // Criar workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BeefSync - Sistema de Gestão Pecuária';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Verificar se filteredStock é um objeto com abas separadas ou array simples
    const hasSeparatedTabs = filteredStock && typeof filteredStock === 'object' && !Array.isArray(filteredStock);
    // Entradas: apenas entradas que ainda têm doses disponíveis (não esgotadas)
    const entradas = hasSeparatedTabs ? filteredStock.entradas : (filteredStock || []).filter(s => {
      const dosesDisponiveis = parseInt(s.dosesDisponiveis || s.doses_disponiveis || 0);
      return (s.tipoOperacao === 'entrada' || s.tipo_operacao === 'entrada') && dosesDisponiveis > 0;
    });
    const saidas = hasSeparatedTabs ? filteredStock.saidas : (filteredStock || []).filter(s => s.tipoOperacao === 'saida' || s.tipo_operacao === 'saida');
    const estoqueReal = hasSeparatedTabs ? filteredStock.estoqueReal : (filteredStock || []).filter(s => {
      const dosesDisponiveis = parseInt(s.dosesDisponiveis || s.doses_disponiveis || 0);
      return (s.tipoOperacao === 'entrada' || s.tipo_operacao === 'entrada') && dosesDisponiveis > 0;
    });
    
    // Criar 3 abas separadas
    const entradasSheet = workbook.addWorksheet('📥 Entradas', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
      }
    });
    
    const saidasSheet = workbook.addWorksheet('📤 Saídas', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
      }
    });
    
    const estoqueSheet = workbook.addWorksheet('📦 Estoque Real', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
      }
    });
    
    // Criar cada aba com seus dados
    createSheetWithData(entradasSheet, 'ENTRADAS', entradas, semenStock, periodData);
    createSheetWithData(saidasSheet, 'SAÍDAS', saidas, semenStock, periodData);
    createSheetWithData(estoqueSheet, 'ESTOQUE REAL', estoqueReal, semenStock, periodData);

    // ===== GERAR E BAIXAR ARQUIVO =====
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

// ===== FUNÇÕES AUXILIARES =====

// Função auxiliar para garantir números válidos
const safeNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// Formatar data para Excel como texto (evita ######## e problemas de locale)
const formatDateForExcel = (val) => {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return '';
  }
};

// Função para criar uma aba completa com dados
function createSheetWithData(worksheet, title, data, allSemenStock, periodData = null) {
  const isSaidaTab = title === 'SAÍDAS';
  
  // ===== CABEÇALHOS DA TABELA =====
  // Definir colunas primeiro para usar na mesclagem do cabeçalho
  const headers = [
    { header: 'Nome do Touro', key: 'nomeTouro', width: 30 },
    { header: 'RG/Registro', key: 'rgTouro', width: 15 },
    { header: 'Raça', key: 'raca', width: 15 },
    { header: 'Localização', key: 'localizacao', width: 20 },
    { header: 'Rack', key: 'rackTouro', width: 10 },
    { header: 'Botijão', key: 'botijao', width: 10 },
    { header: 'Caneca', key: 'caneca', width: 10 },
    { header: 'Tipo', key: 'tipoOperacao', width: 12 },
    { header: 'Fornecedor', key: 'fornecedor', width: 25 },
    // Destino apenas para saídas
    ...(isSaidaTab ? [{ header: 'Destino', key: 'destino', width: 20 }] : []),
    { header: 'Nº NF', key: 'numeroNF', width: 15 },
    { header: 'Valor (R$)', key: 'valorCompra', width: 15 },
    { header: 'Data Compra', key: 'dataCompra', width: 18 },
    { header: 'Qtd Doses', key: 'quantidadeDoses', width: 12 },
    { header: 'Disponíveis', key: 'dosesDisponiveis', width: 12 },
    { header: 'Usadas', key: 'dosesUsadas', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Observações', key: 'observacoes', width: 25 },
    { header: 'Criado em', key: 'created_at', width: 18 },
    { header: 'Atualizado', key: 'updated_at', width: 18 }
  ];

  const endCol = headers.length;

  // ===== CABEÇALHO PRINCIPAL (PRIMEIRA CÉLULA MESCLADA) =====
  // Mesclar até a coluna Q (17) ou até o final se for menor, para garantir consistência visual
  // O usuário pediu especificamente "ATÉ COLUNA Q"
  const mergeEndCol = Math.min(endCol, 17); 
  
  // Garantir que não tentamos mesclar se não houver colunas suficientes (embora improvável)
  if (mergeEndCol > 1) {
      worksheet.mergeCells(1, 1, 1, mergeEndCol);
      worksheet.mergeCells(2, 1, 2, mergeEndCol);
  }

  const titleCell = worksheet.getCell('A1');
  titleCell.value = `BEEF-SYNC - CONTROLE DE ESTOQUE DE SÊMEN BOVINO - ${title}`;
  titleCell.font = { 
    name: 'Calibri', 
    size: 20, 
    bold: true, 
    color: { argb: 'FFFFFFFF' } 
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E79' } // Azul escuro
  };
  worksheet.getRow(1).height = 45;

  // ===== INFORMAÇÕES DO RELATÓRIO =====
  const currentDate = new Date();
  let infoText = `Relatório gerado em ${currentDate.toLocaleDateString('pt-BR')} às ${currentDate.toLocaleTimeString('pt-BR')} | Total de registros: ${data.length}`;
  if (periodData && periodData.usePeriod && periodData.startDate && periodData.endDate) {
    const startDate = new Date(periodData.startDate).toLocaleDateString('pt-BR');
    const endDate = new Date(periodData.endDate).toLocaleDateString('pt-BR');
    infoText += ` | Período: ${startDate} até ${endDate}`;
  }
  const infoCell = worksheet.getCell('A2');
  infoCell.value = infoText;
  infoCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF4B5563' } };
  infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  worksheet.getRow(2).height = 22;

  // ===== PAINEL DE ESTATÍSTICAS (LAYOUT PERSONALIZADO) =====
  const stats = calculateStatsForTab(data, title);
  addCustomStatsPanel(worksheet, stats, 3, headers);

  // Aplicar cabeçalhos (após os cards de resumo)
  const headerRow = worksheet.getRow(4); // Linha 4 (imediatamente após painel na linha 3)
  headers.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    
    // Estilo do cabeçalho - Azul Escuro conforme imagem
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FFFFFF' } }, // Bordas brancas entre colunas
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FFFFFF' } }
    };
    
    // Definir largura da coluna
    worksheet.getColumn(index + 1).width = col.width;
  });
  headerRow.height = 30;

  // ===== DADOS =====
  data.forEach((semen, index) => {
    const row = worksheet.getRow(index + 5);
    // Para saídas, mostrar destino na coluna de localização ao invés da localização física
    const isSaida = (semen.tipoOperacao === 'saida' || semen.tipo_operacao === 'saida');
    const localizacaoDisplay = isSaida 
      ? `📤 Saída → ${semen.destino || 'N/A'}` 
      : (semen.localizacao || '');
    
    // Construir array de dados baseado nas colunas definidas
    const rowData = [
      semen.nomeTouro || semen.nome_touro || semen.serie || '',
      semen.rgTouro || semen.rg_touro || semen.rg || '',
      semen.raca || '',
      localizacaoDisplay,
      isSaida ? '' : (semen.rackTouro || semen.rack_touro || ''),
      isSaida ? '' : (semen.botijao || ''),
      isSaida ? '' : (semen.caneca || ''),
      formatTipoOperacao(semen.tipoOperacao || semen.tipo_operacao),
      semen.fornecedor || '',
      ...(isSaidaTab ? [semen.destino || ''] : []), // Destino
      semen.numeroNF || semen.numero_nf || '',
      safeNumber(semen.valorCompra || semen.valor_compra),
      formatDateForExcel(semen.dataCompra || semen.data_compra),
      safeNumber(semen.quantidadeDoses || semen.quantidade_doses),
      safeNumber(semen.dosesDisponiveis || semen.doses_disponiveis),
      safeNumber(semen.dosesUsadas || semen.doses_usadas),
      formatStatus(semen.status),
      (semen.observacoes || '').toString().slice(0, 500),
      formatDateForExcel(semen.created_at),
      formatDateForExcel(semen.updated_at)
    ];

    // Determinar cor da linha baseada no status
    const dosesDisponiveis = safeNumber(semen.dosesDisponiveis || semen.doses_disponiveis);
    const isEsgotado = dosesDisponiveis === 0 && (semen.tipoOperacao || semen.tipo_operacao) === 'entrada';
    const rowColor = null; // Fundo branco padrão conforme imagem, exceto status
    
    // Aplicar dados e formatação
    rowData.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      
      // Encontrar a chave da coluna para formatação correta
      const colKey = headers[colIndex].key;
      
      // Formatação específica
      applyColumnFormatting(cell, colKey, value, semen.status, index, semen);
      
      // Aplicar cor da linha APÓS todas as formatações (exceto coluna de status)
      if (colKey !== 'status' && rowColor && !cell.fill) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
      }
    });
    
    row.height = 25;
  });

  // ===== CONFIGURAÇÕES FINAIS =====
  // Filtros automáticos
  if (data.length > 0) {
    worksheet.autoFilter = {
      from: 'A4',
      to: { row: data.length + 4, col: headers.length }
    };
  }

  // Congelar painéis (cabeçalho fixo) - Adicionar activeCell para estabilidade
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 4 }
  ];
}

// Função para calcular estatísticas por aba
function calculateStatsForTab(data, title) {
  if (title === 'SAÍDAS') {
    return {
      totalTouros: new Set(data.map(s => s.nomeTouro || s.nome_touro)).size,
      totalDoses: data.reduce((acc, s) => acc + safeNumber(s.quantidadeDoses || s.quantidade_doses), 0),
      dosesDisponiveis: 0,
      dosesUsadas: data.reduce((acc, s) => acc + safeNumber(s.quantidadeDoses || s.quantidade_doses), 0),
      dosesEsgotadas: 0,
      valorTotal: data.reduce((acc, s) => acc + safeNumber(s.valorCompra || s.valor_compra), 0),
      fornecedores: new Set(data.map(s => s.fornecedor).filter(Boolean)).size
    };
  }
  
  // Para ENTRADAS e ESTOQUE REAL
  return {
    totalTouros: new Set(data.map(s => s.nomeTouro || s.nome_touro)).size,
    totalDoses: data.reduce((acc, s) => acc + safeNumber(s.quantidadeDoses || s.quantidade_doses), 0),
    dosesDisponiveis: data.reduce((acc, s) => acc + safeNumber(s.dosesDisponiveis || s.doses_disponiveis), 0),
    dosesUsadas: data.reduce((acc, s) => acc + safeNumber(s.dosesUsadas || s.doses_usadas), 0),
    dosesEsgotadas: data.filter(s => {
      const disponiveis = safeNumber(s.dosesDisponiveis || s.doses_disponiveis);
      return disponiveis === 0;
    }).length,
    valorTotal: data.reduce((acc, s) => acc + safeNumber(s.valorCompra || s.valor_compra), 0),
    fornecedores: new Set(data.map(s => s.fornecedor).filter(Boolean)).size
  };
}

function addCustomStatsPanel(sheet, stats, startRow, headers) {
  // Altura da linha do painel
  sheet.getRow(startRow).height = 40;
  
  // Cores
  const blueColor = 'FF4472C4'; // Azul claro
  const darkBlueColor = 'FF2F75B5'; // Azul mais escuro
  const greenColor = 'FF00B050'; // Verde
  const darkGreenColor = 'FF006100'; // Verde escuro (para Disponíveis na imagem parece escuro, mas vamos usar verde padrão com texto branco ou similar)
  const redColor = 'FFC00000'; // Vermelho
  
  // === BLOCO 1: TOUROS (Colunas A-C) ===
  // Mesclar A3:C3
  sheet.mergeCells(`A${startRow}:C${startRow}`);
  const tourosCell = sheet.getCell(`A${startRow}`);
  tourosCell.value = `🐂 Touros\n${stats.totalTouros}`;
  tourosCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  tourosCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blueColor } };
  tourosCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  tourosCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // === BLOCO 2: LOCALIZAÇÃO (Colunas D-G) ===
  // Mesclar D3:G3
  sheet.mergeCells(`D${startRow}:G${startRow}`);
  const locCell = sheet.getCell(`D${startRow}`);
  locCell.value = 'Localização';
  locCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  locCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkBlueColor } }; // Azul diferente na imagem
  locCell.alignment = { horizontal: 'center', vertical: 'middle' };
  locCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // === BLOCO 3: TOTAL DOSE (Coluna H) ===
  // Mesclar verticalmente H3:H3 (já é uma célula, mas vamos formatar como bloco)
  // Na imagem parece ocupar uma coluna. Vamos usar a coluna H (Tipo).
  const totalDoseLabelCell = sheet.getCell(`H${startRow}`);
  totalDoseLabelCell.value = `📦 Total\nDose\n${stats.totalDoses}`;
  totalDoseLabelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  totalDoseLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: greenColor } };
  totalDoseLabelCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  totalDoseLabelCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // === BLOCO 4: ESPAÇO VERDE (Colunas I-L) ===
  for (let c = 9; c <= 12; c++) { // I=9, L=12
    const cell = sheet.getRow(startRow).getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: greenColor } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
  }

  // === BLOCO 5: DISPONÍVEIS (Coluna M) ===
  // Assumindo coluna M (Qtd Doses) ou N (Disponíveis) para o bloco "Disponíveis"
  // Vamos usar a coluna "Disponíveis" se existir, ou M se não.
  // No nosso novo layout, Qtd Doses é M, Disponíveis é N.
  // Vamos colocar o bloco Disponíveis na coluna M (13) para deixar espaço.
  const dispCell = sheet.getRow(startRow).getCell(13); // M
  dispCell.value = `☑\nDisponíveis\n${stats.dosesDisponiveis}`;
  dispCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  dispCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: greenColor } }; // Usar cor VERDE padrão
  dispCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  dispCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // === BLOCO 6: ESPAÇO VERMELHO (Restante) ===
  // Preencher até o final das colunas com vermelho
  for (let c = 14; c <= headers.length; c++) {
    const cell = sheet.getRow(startRow).getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: redColor } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
  }
}

function applyColumnFormatting(cell, colKey, value, status, rowIndex, semen) {
  // Determinar se está esgotado baseado nas doses disponíveis
  const dosesDisponiveis = semen.dosesDisponiveis || semen.doses_disponiveis || 0;
  const isEsgotado = dosesDisponiveis === 0 && (semen.tipoOperacao || semen.tipo_operacao) === 'entrada';
  
  // Formatação por chave da coluna
  if (colKey === 'valorCompra') {
      cell.numFmt = 'R$ #,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
  } else if (['dataCompra', 'created_at', 'updated_at'].includes(colKey)) {
      // Datas já vêm formatadas como texto (dd/mm/yyyy HH:mm) - sem numFmt
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
  } else if (['quantidadeDoses', 'dosesDisponiveis', 'dosesUsadas'].includes(colKey)) {
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centralizado conforme imagem
  } else if (colKey === 'status') {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      // Aplicar formatação baseada no status real
      if (status === 'disponivel' || dosesDisponiveis > 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        cell.font = { color: { argb: 'FF065F46' }, bold: true };
      } else if (status === 'esgotado' || isEsgotado) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
        cell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
  } else {
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
  }
  
  // Bordas finas cinza claro para todas as células
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
  };
}

// Remover funções antigas não utilizadas
// function addStatsPanel...


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

export default { exportSemenToExcel };
