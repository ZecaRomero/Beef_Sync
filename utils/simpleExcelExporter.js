// Exportador Excel simplificado e robusto para estoque de sÃªmen

export const exportSemenToExcel = async (semenStock, filteredStock, periodData = null) => {
  try {
    // Importar ExcelJS dinamicamente
    const ExcelJS = (await import('exceljs')).default;
    
    // Criar workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BeefSync - Sistema de GestÃ£o PecuÃ¡ria';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Verificar se filteredStock Ã© um objeto com abas separadas ou array simples
    const hasSeparatedTabs = filteredStock && typeof filteredStock === 'object' && !Array.isArray(filteredStock);
    // Entradas: apenas entradas que ainda tÃªm doses disponÃ­veis (nÃ£o esgotadas)
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
    const entradasSheet = workbook.addWorksheet('ðÅ¸â€œ¥ Entradas', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
      }
    });
    
    const saidasSheet = workbook.addWorksheet('ðÅ¸â€œ¤ SaÃ­das', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
      }
    });
    
    const estoqueSheet = workbook.addWorksheet('ðÅ¸â€œ¦ Estoque Real', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 }
      }
    });
    
    // Criar cada aba com seus dados
    createSheetWithData(entradasSheet, 'ENTRADAS', entradas, semenStock, periodData);
    createSheetWithData(saidasSheet, 'SAÃ�DAS', saidas, semenStock, periodData);
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

// ===== FUNÃâ€¡Ãâ€¢ES AUXILIARES =====

// FunÃ§Ã£o auxiliar para garantir nÃºmeros vÃ¡lidos
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

// FunÃ§Ã£o para criar uma aba completa com dados
function createSheetWithData(worksheet, title, data, allSemenStock, periodData = null) {
  const isSaidaTab = title === 'SAÃ�DAS';
  
  // ===== CABEÃâ€¡ALHOS DA TABELA =====
  // Definir colunas primeiro para usar na mesclagem do cabeÃ§alho
  const headers = [
    { header: 'Nome do Touro', key: 'nomeTouro', width: 30 },
    { header: 'RG/Registro', key: 'rgTouro', width: 15 },
    { header: 'RaÃ§a', key: 'raca', width: 15 },
    { header: 'LocalizaÃ§Ã£o', key: 'localizacao', width: 20 },
    { header: 'Rack', key: 'rackTouro', width: 10 },
    { header: 'BotijÃ£o', key: 'botijao', width: 10 },
    { header: 'Caneca', key: 'caneca', width: 10 },
    { header: 'Tipo', key: 'tipoOperacao', width: 12 },
    { header: 'Fornecedor', key: 'fornecedor', width: 25 },
    // Destino apenas para saÃ­das
    ...(isSaidaTab ? [{ header: 'Destino', key: 'destino', width: 20 }] : []),
    { header: 'NÂº NF', key: 'numeroNF', width: 15 },
    { header: 'Valor (R$)', key: 'valorCompra', width: 15 },
    { header: 'Data Compra', key: 'dataCompra', width: 18 },
    { header: 'Qtd Doses', key: 'quantidadeDoses', width: 12 },
    { header: 'DisponÃ­veis', key: 'dosesDisponiveis', width: 12 },
    { header: 'Usadas', key: 'dosesUsadas', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'ObservaÃ§Ãµes', key: 'observacoes', width: 25 },
    { header: 'Criado em', key: 'created_at', width: 18 },
    { header: 'Atualizado', key: 'updated_at', width: 18 }
  ];

  const endCol = headers.length;

  // ===== CABEÃâ€¡ALHO PRINCIPAL (PRIMEIRA CÃâ€°LULA MESCLADA) =====
  // Mesclar atÃ© a coluna Q (17) ou atÃ© o final se for menor, para garantir consistÃªncia visual
  // O usuÃ¡rio pediu especificamente "ATÃâ€° COLUNA Q"
  const mergeEndCol = Math.min(endCol, 17); 
  
  // Garantir que nÃ£o tentamos mesclar se nÃ£o houver colunas suficientes (embora improvÃ¡vel)
  if (mergeEndCol > 1) {
      worksheet.mergeCells(1, 1, 1, mergeEndCol);
      worksheet.mergeCells(2, 1, 2, mergeEndCol);
  }

  const titleCell = worksheet.getCell('A1');
  titleCell.value = `BEEF-SYNC - CONTROLE DE ESTOQUE DE SÃÅ MEN BOVINO - ${title}`;
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

  // ===== INFORMAÃâ€¡Ãâ€¢ES DO RELATÃâ€œRIO =====
  const currentDate = new Date();
  let infoText = `RelatÃ³rio gerado em ${currentDate.toLocaleDateString('pt-BR')} Ã s ${currentDate.toLocaleTimeString('pt-BR')} | Total de registros: ${data.length}`;
  if (periodData && periodData.usePeriod && periodData.startDate && periodData.endDate) {
    const startDate = new Date(periodData.startDate).toLocaleDateString('pt-BR');
    const endDate = new Date(periodData.endDate).toLocaleDateString('pt-BR');
    infoText += ` | PerÃ­odo: ${startDate} atÃ© ${endDate}`;
  }
  const infoCell = worksheet.getCell('A2');
  infoCell.value = infoText;
  infoCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF4B5563' } };
  infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  worksheet.getRow(2).height = 22;

  // ===== PAINEL DE ESTATÃ�STICAS (LAYOUT PERSONALIZADO) =====
  const stats = calculateStatsForTab(data, title);
  addCustomStatsPanel(worksheet, stats, 3, headers);

  // Aplicar cabeÃ§alhos (apÃ³s os cards de resumo)
  const headerRow = worksheet.getRow(4); // Linha 4 (imediatamente apÃ³s painel na linha 3)
  headers.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    
    // Estilo do cabeÃ§alho - Azul Escuro conforme imagem
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
    // Para saÃ­das, mostrar destino na coluna de localizaÃ§Ã£o ao invÃ©s da localizaÃ§Ã£o fÃ­sica
    const isSaida = (semen.tipoOperacao === 'saida' || semen.tipo_operacao === 'saida');
    const localizacaoDisplay = isSaida 
      ? `ðÅ¸â€œ¤ SaÃ­da ââ€ â€™ ${semen.destino || 'N/A'}` 
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
    const rowColor = null; // Fundo branco padrÃ£o conforme imagem, exceto status
    
    // Aplicar dados e formataÃ§Ã£o
    rowData.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      
      // Encontrar a chave da coluna para formataÃ§Ã£o correta
      const colKey = headers[colIndex].key;
      
      // FormataÃ§Ã£o especÃ­fica
      applyColumnFormatting(cell, colKey, value, semen.status, index, semen);
      
      // Aplicar cor da linha APÃâ€œS todas as formataÃ§Ãµes (exceto coluna de status)
      if (colKey !== 'status' && rowColor && !cell.fill) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
      }
    });
    
    row.height = 25;
  });

  // ===== CONFIGURAÃâ€¡Ãâ€¢ES FINAIS =====
  // Filtros automÃ¡ticos
  if (data.length > 0) {
    worksheet.autoFilter = {
      from: 'A4',
      to: { row: data.length + 4, col: headers.length }
    };
  }

  // Congelar painÃ©is (cabeÃ§alho fixo) - Adicionar activeCell para estabilidade
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 4 }
  ];
}

// FunÃ§Ã£o para calcular estatÃ­sticas por aba
function calculateStatsForTab(data, title) {
  if (title === 'SAÃ�DAS') {
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
  const darkGreenColor = 'FF006100'; // Verde escuro (para DisponÃ­veis na imagem parece escuro, mas vamos usar verde padrÃ£o com texto branco ou similar)
  const redColor = 'FFC00000'; // Vermelho
  
  // === BLOCO 1: TOUROS (Colunas A-C) ===
  // Mesclar A3:C3
  sheet.mergeCells(`A${startRow}:C${startRow}`);
  const tourosCell = sheet.getCell(`A${startRow}`);
  tourosCell.value = `ðÅ¸�â€š Touros\n${stats.totalTouros}`;
  tourosCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  tourosCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blueColor } };
  tourosCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  tourosCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // === BLOCO 2: LOCALIZAÃâ€¡ÃÆ’O (Colunas D-G) ===
  // Mesclar D3:G3
  sheet.mergeCells(`D${startRow}:G${startRow}`);
  const locCell = sheet.getCell(`D${startRow}`);
  locCell.value = 'LocalizaÃ§Ã£o';
  locCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  locCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkBlueColor } }; // Azul diferente na imagem
  locCell.alignment = { horizontal: 'center', vertical: 'middle' };
  locCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // === BLOCO 3: TOTAL DOSE (Coluna H) ===
  // Mesclar verticalmente H3:H3 (jÃ¡ Ã© uma cÃ©lula, mas vamos formatar como bloco)
  // Na imagem parece ocupar uma coluna. Vamos usar a coluna H (Tipo).
  const totalDoseLabelCell = sheet.getCell(`H${startRow}`);
  totalDoseLabelCell.value = `ðÅ¸â€œ¦ Total\nDose\n${stats.totalDoses}`;
  totalDoseLabelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  totalDoseLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: greenColor } };
  totalDoseLabelCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  totalDoseLabelCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // === BLOCO 4: ESPAÃâ€¡O VERDE (Colunas I-L) ===
  for (let c = 9; c <= 12; c++) { // I=9, L=12
    const cell = sheet.getRow(startRow).getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: greenColor } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
  }

  // === BLOCO 5: DISPONÃ�VEIS (Coluna M) ===
  // Assumindo coluna M (Qtd Doses) ou N (DisponÃ­veis) para o bloco "DisponÃ­veis"
  // Vamos usar a coluna "DisponÃ­veis" se existir, ou M se nÃ£o.
  // No nosso novo layout, Qtd Doses Ã© M, DisponÃ­veis Ã© N.
  // Vamos colocar o bloco DisponÃ­veis na coluna M (13) para deixar espaÃ§o.
  const dispCell = sheet.getRow(startRow).getCell(13); // M
  dispCell.value = `âËœâ€˜\nDisponÃ­veis\n${stats.dosesDisponiveis}`;
  dispCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  dispCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: greenColor } }; // Usar cor VERDE padrÃ£o
  dispCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  dispCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // === BLOCO 6: ESPAÃâ€¡O VERMELHO (Restante) ===
  // Preencher atÃ© o final das colunas com vermelho
  for (let c = 14; c <= headers.length; c++) {
    const cell = sheet.getRow(startRow).getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: redColor } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
  }
}

function applyColumnFormatting(cell, colKey, value, status, rowIndex, semen) {
  // Determinar se estÃ¡ esgotado baseado nas doses disponÃ­veis
  const dosesDisponiveis = semen.dosesDisponiveis || semen.doses_disponiveis || 0;
  const isEsgotado = dosesDisponiveis === 0 && (semen.tipoOperacao || semen.tipo_operacao) === 'entrada';
  
  // FormataÃ§Ã£o por chave da coluna
  if (colKey === 'valorCompra') {
      cell.numFmt = 'R$ #,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
  } else if (['dataCompra', 'created_at', 'updated_at'].includes(colKey)) {
      // Datas jÃ¡ vÃªm formatadas como texto (dd/mm/yyyy HH:mm) - sem numFmt
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
  } else if (['quantidadeDoses', 'dosesDisponiveis', 'dosesUsadas'].includes(colKey)) {
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centralizado conforme imagem
  } else if (colKey === 'status') {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      // Aplicar formataÃ§Ã£o baseada no status real
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
  
  // Bordas finas cinza claro para todas as cÃ©lulas
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
  };
}

// Remover funÃ§Ãµes antigas nÃ£o utilizadas
// function addStatsPanel...


function formatTipoOperacao(tipo) {
  switch (tipo) {
    case 'entrada': return 'ðÅ¸â€œ¥ Entrada';
    case 'saida': return 'ðÅ¸â€œ¤ SaÃ­da';
    default: return tipo || '';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'disponivel': return 'âÅ“â€¦ DisponÃ­vel';
    case 'esgotado': return 'â�Å’ Esgotado';
    case 'vencido': return 'âÅ¡ ï¸� Vencido';
    default: return status || '';
  }
}

export default { exportSemenToExcel };
