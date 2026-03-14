/**
 * Gera relatÃ³rio de estoque de sÃªmen formatado para impressÃ£o
 * Layout: BEEF-SYNC - CONTROLE DE ESTOQUE DE SÃÅ MEN BOVINO
 * Com tÃ­tulo, subtÃ­tulo, caixas de resumo e tabela
 */

const formatDate = (val) => {
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

const safeNum = (v) => {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const formatMoney = (v) => {
  const n = safeNum(v);
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export function generateSemenPrintHTML(data, tipo = 'SAÃ�DAS') {
  const isSaida = tipo === 'SAÃ�DAS';
  const now = new Date();
  const dataStr = now.toLocaleDateString('pt-BR');
  const horaStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const totalTouros = new Set(data.map(s => s.nomeTouro || s.nome_touro || '')).size;
  const totalDoses = data.reduce((acc, s) => acc + safeNum(s.quantidadeDoses || s.quantidade_doses), 0);
  const disponiveis = isSaida ? 0 : data.reduce((acc, s) => acc + safeNum(s.dosesDisponiveis || s.doses_disponiveis), 0);

  const colunas = isSaida
    ? ['Nome do Touro', 'RG/Registro', 'RaÃ§a', 'LocalizaÃ§Ã£o', 'Tipo', 'Destino', 'NÂº NF', 'Valor (R$)', 'Data Compra', 'Qtd Doses', 'DisponÃ­veis', 'Usadas']
    : ['Nome do Touro', 'RG/Registro', 'RaÃ§a', 'LocalizaÃ§Ã£o', 'Rack', 'BotijÃ£o', 'Caneca', 'Tipo', 'Fornecedor', 'NÂº NF', 'Valor (R$)', 'Data Compra', 'Qtd Doses', 'DisponÃ­veis', 'Usadas'];

  const linhas = data.map(s => {
    const isS = s.tipoOperacao === 'saida' || s.tipo_operacao === 'saida';
    const loc = isS ? `SaÃ­da ââ€ â€™ ${s.destino || 'N/A'}` : (s.localizacao || '');
    const tipo = isS ? `SaÃ­da ${s.destino || ''}` : 'Entrada';
    const qtd = safeNum(s.quantidadeDoses || s.quantidade_doses);
    const disp = safeNum(s.dosesDisponiveis || s.doses_disponiveis);
    const usadas = safeNum(s.dosesUsadas || s.doses_usadas);

    if (isSaida) {
      return [
        s.nomeTouro || s.nome_touro || '',
        s.rgTouro || s.rg_touro || s.rg || '',
        s.raca || '',
        loc,
        tipo,
        s.destino || '',
        s.numeroNF || s.numero_nf || '',
        formatMoney(s.valorCompra || s.valor_compra),
        formatDate(s.dataCompra || s.data_compra),
        qtd,
        disp,
        usadas
      ];
    }
    return [
      s.nomeTouro || s.nome_touro || '',
      s.rgTouro || s.rg_touro || s.rg || '',
      s.raca || '',
      s.localizacao || '',
      s.rackTouro || s.rack_touro || '',
      s.botijao || '',
      s.caneca || '',
      tipo,
      s.fornecedor || '',
      s.numeroNF || s.numero_nf || '',
      formatMoney(s.valorCompra || s.valor_compra),
      formatDate(s.dataCompra || s.data_compra),
      qtd,
      disp,
      usadas
    ];
  });

  const thCells = colunas.map(c => `<th>${c}</th>`).join('');
  const trRows = linhas.map(row => {
    const tds = row.map(cell => `<td>${cell}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>BEEF-SYNC - Estoque de SÃªmen - ${tipo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11px; color: #333; padding: 20px; }
    .report-header {
      background: #1F4E79;
      color: white;
      text-align: center;
      padding: 16px;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 0;
    }
    .report-subtitle {
      text-align: center;
      padding: 8px;
      background: #f3f4f6;
      font-size: 11px;
      color: #4b5563;
      margin-bottom: 12px;
    }
    .stats-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .stat-box {
      flex: 1;
      min-width: 100px;
      padding: 12px 16px;
      text-align: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      border-radius: 4px;
    }
    .stat-box.touros { background: #4472C4; }
    .stat-box.total-dose { background: #00B050; }
    .stat-box.disponiveis { background: #00B050; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th {
      background: #1F4E79;
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-size: 10px;
      font-weight: bold;
      border: 1px solid #1a3d5c;
    }
    td {
      padding: 8px;
      border: 1px solid #e5e7eb;
      font-size: 10px;
    }
    tr:nth-child(even) { background: #f9fafb; }
    .page-footer {
      text-align: center;
      margin-top: 16px;
      font-size: 10px;
      color: #6b7280;
    }
    @media print {
      @page { size: A4 landscape; margin: 2cm; }
      body { padding: 0; }
      .report-header, .stat-box, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="report-header">BEEF-SYNC - CONTROLE DE ESTOQUE DE SÃÅ MEN BOVINO - ${tipo}</div>
  <div class="report-subtitle">RelatÃ³rio gerado em ${dataStr} Ã s ${horaStr} | Total de registros: ${data.length}</div>
  
  <div class="stats-row">
    <div class="stat-box touros">ðÅ¸�â€š Touros<br>${totalTouros}</div>
    <div class="stat-box total-dose">ðÅ¸â€œ¦ Total Dose<br>${totalDoses}</div>
    <div class="stat-box disponiveis">âÅ“â€œ DisponÃ­veis<br>${disponiveis}</div>
  </div>

  <table>
    <thead><tr>${thCells}</tr></thead>
    <tbody>${trRows}</tbody>
  </table>

  <div class="page-footer">Beef-Sync - Sistema de GestÃ£o PecuÃ¡ria</div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;
}

export function openSemenPrintReport(data, tipo = 'SAÃ�DAS') {
  if (!data || data.length === 0) {
    if (typeof alert === 'function') alert('Nenhum dado para imprimir');
    return;
  }
  const html = generateSemenPrintHTML(data, tipo);
  const win = window.open('', '_blank');
  if (!win) {
    if (typeof alert === 'function') alert('Permita pop-ups para imprimir o relatÃ³rio.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
