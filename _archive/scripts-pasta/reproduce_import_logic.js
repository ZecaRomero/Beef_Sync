
// Simulação da lógica de importação de texto
// Baseado em pages/api/import/texto-simples.js

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
      
      // Se não tem tabs suficientes, tentar espaços duplos
      if (cols.length <= 1) {
        cols = linhas[0].split(/\s{2,}/).map(c => c.trim());
        separador = 'spaces';
      }
      
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
        console.log('🗺️ Mapa de colunas detectado:', mapaColunas);
      }
    } else {
       dadosLinhas = linhas;
    }

    const dadosProcessados = [];

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

         // Validação extra: Se touroIA parece ser uma data (erro de deslocamento), limpar
         if (touroIA && (touroIA.includes('/') || /^\d{1,2}\/\d{1,2}/.test(touroIA))) {
             console.log(`  ⚠️ Touro inválido detectado (parece data): "${touroIA}". Limpando para reprocessar.`);
             touroIA = '';
         }

         if (!touroIA && (mapaColunas.separador === 'spaces' || usouFallbackEspacos)) {
            if (local && local.length > 2 && !local.includes('/') && isNaN(local.replace(/\s/g, '')) && /[a-zA-Z]{2,}/.test(local)) {
               if (!/^(PIQUETE|LOCAL|PASTO|RETIRO|MANGUEIRO|CURRAL)/i.test(local)) {
                   console.log(`  → Touro estava no campo Local (realocando): "${local}"`);
                   touroIA = local;
                   local = ''; 
               }
            }

            if (!touroIA) {
              for (const col of colunas) {
                if (!col || col === serie || col === rg || col === local || col === dataIA || col === dataDG || col === resultado) continue;
                if (col.length > 2 && !col.includes('/') && isNaN(col.replace(/\s/g, '')) && /[a-zA-Z]{2,}/.test(col)) {
                  console.log(`  → Touro não encontrado no índice, tentando usar: "${col}"`);
                  touroIA = col;
                  break; 
                }
              }
            }
         }

         // Fallback para DATA IA se não encontrada no mapa (deslocamento)
         if (!dataIA) {
             for (const col of colunas) {
                 if (col && (col.includes('/') || /^\d{1,2}\/\d{1,2}/.test(col))) {
                     if (col !== dataDG) {
                         console.log(`  → Data IA recuperada de outra coluna: "${col}"`);
                         dataIA = col;
                         break;
                     }
                 }
             }
         }
      }

      console.log(`Linha ${numeroLinha} -> Touro: "${touroIA}" (Bruto: ${JSON.stringify(colunas)})`);
      
      dadosProcessados.push({
        touroIA
      });
    }
    return dadosProcessados;
}

// Teste 1: Dados com tabs perfeitos
console.log('\n--- Teste 1: Tabs perfeitos ---');
const texto1 = `SÉRIE\tRG\tLOCAL\tACASALAMENTOS\tDATA IA
A\t123\tPIQUETE 1\tIDEAL - A3139\t01/01/2024`;
processarTexto(texto1);

// Teste 2: Cabeçalho com tabs, dados com espaços (cenário do erro)
console.log('\n--- Teste 2: Cabeçalho Tabs, Dados Espaços ---');
const texto2 = `SÉRIE\tRG\tLOCAL\tACASALAMENTOS\tDATA IA
A    123    PIQUETE 1    IDEAL - A3139    01/01/2024`;
processarTexto(texto2);

// Teste 3: Cabeçalho com tabs, dados com espaços e colunas vazias
// Ex: Local vazio
console.log('\n--- Teste 3: Dados Espaços com coluna vazia ---');
const texto3 = `SÉRIE\tRG\tLOCAL\tACASALAMENTOS\tDATA IA
A    123        IDEAL - A3139    01/01/2024`;
processarTexto(texto3);

// Teste 4: Cabeçalho com espaços
console.log('\n--- Teste 4: Tudo Espaços ---');
const texto4 = `SÉRIE    RG    LOCAL    ACASALAMENTOS    DATA IA
A    123    PIQUETE 1    IDEAL - A3139    01/01/2024`;
processarTexto(texto4);
