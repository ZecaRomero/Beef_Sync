
const { format } = require('date-fns');

// Mock helpers
function converterDataSimples(texto) {
  if (!texto) return null;
  const str = String(texto).trim();
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (match) {
    let [, dia, mes, ano] = match;
    if (ano.length === 2) {
      const anoNum = parseInt(ano);
      ano = anoNum >= 50 ? `19${ano}` : `20${ano}`;
    }
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return null;
}

// Logic extracted from texto-simples.js
function processarTexto(texto) {
  const linhas = texto.split('\n').filter(l => l.trim());
  
  // Remover cabeçalho se tiver
  const primeiraLinha = linhas[0].toUpperCase();
  const temCabecalho = primeiraLinha.includes('SÉRIE') || primeiraLinha.includes('SERIE') || primeiraLinha.includes('LOCAL') || primeiraLinha.includes('ACASALAMENTO') || primeiraLinha.includes('TOURO');
  
  let mapaColunas = null;
  let dadosLinhas = linhas;

  console.log('Tem cabeçalho?', temCabecalho);
  console.log('Primeira linha:', primeiraLinha);

  if (temCabecalho) {
    dadosLinhas = linhas.slice(1);
    
    // Tentar mapear colunas pelo cabeçalho
    let cols = linhas[0].split('\t').map(c => c.trim());
    let separador = '\t';
    
    if (cols.length <= 1) {
      cols = linhas[0].split(/\s{2,}/).map(c => c.trim());
      separador = 'spaces';
    }
    
    console.log('Colunas detectadas no header:', cols);
    console.log('Separador:', separador);

    const colsNaoVazias = cols.filter(c => c);
    
    if (colsNaoVazias.length >= 2) {
      mapaColunas = { separador };
      cols.forEach((col, idx) => {
        if (!col) return;
        const c = col.toUpperCase();
        if (c.includes('SÉRIE') || c.includes('SERIE')) mapaColunas.serie = idx;
        else if (c === 'RG') mapaColunas.rg = idx;
        else if (c.includes('LOCAL') || c.includes('PIQUETE')) mapaColunas.local = idx;
        else if (c.includes('TOURO') || c.includes('ACASALAMENTO') || c.includes('REPRODUTOR')) mapaColunas.touro = idx;
        else if (c.includes('DATA I.A') || c.includes('DATA IA')) mapaColunas.dataIA = idx;
        else if (c.includes('DATA DG') || c.includes('DIAG') || c.includes('PREVISAO')) mapaColunas.dataDG = idx;
        else if (c.includes('RESULT')) mapaColunas.resultado = idx;
      });
      console.log('🗺️ Mapa de colunas:', mapaColunas);
    }
  } else {
     dadosLinhas = linhas;
  }

  const resultados = [];

  for (let i = 0; i < dadosLinhas.length; i++) {
    const linha = dadosLinhas[i].trim();
    if (!linha) continue;

    const numeroLinha = i + (temCabecalho ? 2 : 1);
    let colunas = [];

    let usouFallbackEspacos = false;

    if (mapaColunas && mapaColunas.separador === '\t') {
      colunas = linha.split('\t').map(c => c.trim());
      
      if (colunas.length <= 1) {
        const colsEspacos = linha.split(/\s{2,}/).map(c => c.trim());
        if (colsEspacos.length > colunas.length) {
          console.log(`  ⚠️ Linha ${numeroLinha}: Tabs não encontrados, usando espaços.`);
          colunas = colsEspacos;
          usouFallbackEspacos = true;
        }
      }
    } else if (mapaColunas && mapaColunas.separador === 'spaces') {
      colunas = linha.split(/\s{2,}/).map(c => c.trim());
    } else {
      colunas = linha.split('\t').map(c => c.trim()).filter(c => c);
      if (colunas.length === 1) {
        colunas = linha.split(/\s{2,}/).map(c => c.trim()).filter(c => c);
      }
    }
    
    console.log(`Linha ${numeroLinha} colunas:`, colunas);

    let serie = '';
    let rg = '';
    let local = '';
    let touroIA = '';
    let dataIA = null;
    let dataDG = null;
    let resultado = '';

    if (mapaColunas) {
      serie = colunas[mapaColunas.serie] || '';
      rg = colunas[mapaColunas.rg] || '';
      if (mapaColunas.local !== undefined) local = colunas[mapaColunas.local] || '';
      if (mapaColunas.touro !== undefined) touroIA = colunas[mapaColunas.touro] || '';
      if (mapaColunas.dataIA !== undefined) dataIA = colunas[mapaColunas.dataIA];
      if (mapaColunas.dataDG !== undefined) dataDG = colunas[mapaColunas.dataDG];
      if (mapaColunas.resultado !== undefined) resultado = colunas[mapaColunas.resultado];

      // Se estamos usando espaços (ou fallback) e não encontramos o touro no índice esperado,
      // tentar procurar em outras colunas (pode ter havido deslocamento por colunas vazias)
      if (!touroIA && (mapaColunas.separador === 'spaces' || usouFallbackEspacos)) {
        
        // 1. Verificar se o campo 'local' capturou o touro por engano (deslocamento à esquerda)
        if (local && local.length > 2 && !local.includes('/') && isNaN(local.replace(/\s/g, '')) && /[a-zA-Z]{2,}/.test(local)) {
           // Heurística: Piquetes geralmente têm "Piquete", "Local" ou são curtos. Touros são nomes.
           if (!/^(PIQUETE|LOCAL|PASTO|RETIRO|MANGUEIRO|CURRAL)/i.test(local)) {
               console.log(`  → Touro estava no campo Local (realocando): "${local}"`);
               touroIA = local;
               local = ''; // Reset local, será preenchido com padrão depois
           }
        }

        // 2. Se ainda não achou, varrer todas as colunas não utilizadas
        if (!touroIA) {
          for (const col of colunas) {
            if (!col || col === serie || col === rg || col === local || col === dataIA || col === dataDG || col === resultado) continue;
            
            // Critérios para ser touro: texto longo, ou "DA/DE/DO", ou hífen, ou não numérico e não data
            // E que tenha pelo menos 3 letras
            if (col.length > 2 && !col.includes('/') && isNaN(col.replace(/\s/g, '')) && /[a-zA-Z]{2,}/.test(col)) {
              console.log(`  → Touro não encontrado no índice, tentando usar: "${col}"`);
              touroIA = col;
              break; 
            }
          }
        }
      }
    }

    resultados.push({ serie, rg, touroIA });
  }
  
  return resultados;
}

// Test Case 6: Empty Local column causing shift
console.log('\n--- TESTE 6: Local vazio causando deslocamento (Touro no lugar do Local) ---');
// Header: SERIE, RG, LOCAL, TOURO
// Data: 123, 456, Touro A (Local was empty so spaces collapsed)
const texto6 = `SÉRIE\tRG\tLOCAL\tACASALAMENTO
123    456    Touro A`; 
console.table(processarTexto(texto6));
