const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function gerarRelatorioCSV() {
  console.log('📊 GERANDO RELATÓRIO CSV DE RGs FALTANTES\n');
  console.log('='.repeat(60));

  try {
    // Buscar todas as séries
    const seriesResult = await pool.query(`
      SELECT DISTINCT serie 
      FROM animais 
      WHERE serie IS NOT NULL 
      ORDER BY serie
    `);
    
    const series = seriesResult.rows.map(r => r.serie);
    console.log(`✅ Encontradas ${series.length} séries`);

    // Criar CSV
    let csvContent = 'Série;RG Faltante;Identificação Completa\n';
    let totalFaltantes = 0;

    for (const serie of series) {
      // Buscar todos os RGs desta série
      const rgsResult = await pool.query(`
        SELECT rg
        FROM animais 
        WHERE serie = $1 
        ORDER BY CAST(rg AS INTEGER)
      `, [serie]);

      const animais = rgsResult.rows;
      if (animais.length === 0) continue;

      // Converter RGs para números
      const rgsNumericos = animais
        .map(a => parseInt(a.rg))
        .filter(rg => !isNaN(rg))
        .sort((a, b) => a - b);

      if (rgsNumericos.length === 0) continue;

      const menorRG = rgsNumericos[0];
      const maiorRG = rgsNumericos[rgsNumericos.length - 1];

      // Verificar RGs faltantes
      for (let rg = menorRG; rg <= maiorRG; rg++) {
        if (!rgsNumericos.includes(rg)) {
          csvContent += `${serie};${rg};${serie}-${rg}\n`;
          totalFaltantes++;
        }
      }

      console.log(`✅ ${serie}: ${animais.length} animais`);
    }

    // Salvar CSV
    const nomeArquivo = `relatorio-rgs-faltantes-${new Date().toISOString().slice(0, 10)}.csv`;
    fs.writeFileSync(nomeArquivo, csvContent, 'utf8');

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Relatório CSV salvo: ${nomeArquivo}`);
    console.log(`📊 Total de RGs faltantes: ${totalFaltantes}`);
    console.log('\n💡 Abra o arquivo no Excel:');
    console.log('   1. Clique duas vezes no arquivo');
    console.log('   2. Ou abra o Excel e vá em Arquivo > Abrir');
    console.log('   3. Selecione "Todos os arquivos" e escolha o CSV');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

gerarRelatorioCSV();
