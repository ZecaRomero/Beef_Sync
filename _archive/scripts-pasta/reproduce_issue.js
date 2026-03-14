
// Simulation of texto-simples.js logic

const texto = `SÉRIE	RG	LOCAL	ACASALAMENTO	DATA IA	DATA DG	RESULT
123	456	Piquete 1	TOURO TESTE	01/01/2024	01/02/2024	P
789	012	Piquete 2		01/01/2024	01/02/2024	N
345	678	Piquete 3	OUTRO TOURO	01/01/2024	01/02/2024	P`;

// Case 2: Spaces instead of tabs (common in some copy-pastes or text editors)
const textoSpaces = `SÉRIE     RG     LOCAL     ACASALAMENTO     DATA IA     DATA DG     RESULT
123       456    Piquete 1  TOURO TESTE      01/01/2024  01/02/2024  P
789       012    Piquete 2                   01/01/2024  01/02/2024  N
345       678    Piquete 3  OUTRO TOURO      01/01/2024  01/02/2024  P`;

function processText(texto, label) {
    console.log(`\n--- Processing: ${label} ---`);
    const linhas = texto.split('\n').filter(l => l.trim());
    
    // Remover cabeçalho se tiver
    const primeiraLinha = linhas[0].toUpperCase();
    const temCabecalho = primeiraLinha.includes('SÉRIE') || primeiraLinha.includes('SERIE') || primeiraLinha.includes('LOCAL') || primeiraLinha.includes('ACASALAMENTO') || primeiraLinha.includes('TOURO');
    
    let mapaColunas = null;
    let dadosLinhas = linhas;

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
      
      console.log('Header cols detected:', cols);
      console.log('Separator detected:', separador);

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
    }

    const dadosProcessados = [];
    
    for (let i = 0; i < dadosLinhas.length; i++) {
      const linha = dadosLinhas[i].trim(); // Note: trim() removes leading/trailing spaces but not internal tabs/spaces
      if (!linha) continue;

      let colunas = [];

      if (mapaColunas && mapaColunas.separador === '\t') {
        // Se temos mapa com TAB, usar split TAB preservando vazios
        colunas = linha.split('\t').map(c => c.trim());
      } else if (mapaColunas && mapaColunas.separador === 'spaces') {
        colunas = linha.split(/\s{2,}/).map(c => c.trim());
      } else {
        // Fallback
        colunas = linha.split('\t').map(c => c.trim()).filter(c => c);
      }

      console.log(`Linha ${i+1} colunas (${colunas.length}):`, colunas);

      let touroIA = '';
      if (mapaColunas) {
        if (mapaColunas.touro !== undefined) touroIA = colunas[mapaColunas.touro] || '';
      }

      console.log(`  -> Touro extraído: '${touroIA}'`);
      
      if (!touroIA) console.log('  ⚠️ FALHA: Touro não encontrado!');
    }
}

processText(texto, 'Tabs');
processText(textoSpaces, 'Spaces');
