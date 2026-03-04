const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function verificarRGsFaltantes() {
  console.log('🔍 VERIFICANDO RGs FALTANTES POR SÉRIE\n');
  console.log('='.repeat(80));

  try {
    // 1. Buscar todas as séries
    console.log('\n📊 1. Buscando séries cadastradas...');
    const seriesResult = await pool.query(`
      SELECT DISTINCT serie 
      FROM animais 
      WHERE serie IS NOT NULL 
      ORDER BY serie
    `);
    
    const series = seriesResult.rows.map(r => r.serie);
    console.log(`✅ Encontradas ${series.length} séries: ${series.join(', ')}`);

    const relatorio = {
      data_analise: new Date().toISOString(),
      total_series: series.length,
      series_analisadas: []
    };

    // 2. Para cada série, verificar RGs faltantes
    for (const serie of series) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📋 Analisando série: ${serie}`);
      console.log('='.repeat(80));

      // Buscar todos os RGs desta série
      const rgsResult = await pool.query(`
        SELECT rg, id, nome, sexo, situacao, created_at
        FROM animais 
        WHERE serie = $1 
        ORDER BY CAST(rg AS INTEGER)
      `, [serie]);

      const animais = rgsResult.rows;
      console.log(`✅ Total de animais: ${animais.length}`);

      if (animais.length === 0) continue;

      // Converter RGs para números
      const rgsNumericos = animais
        .map(a => parseInt(a.rg))
        .filter(rg => !isNaN(rg))
        .sort((a, b) => a - b);

      if (rgsNumericos.length === 0) {
        console.log('⚠️ Nenhum RG numérico encontrado nesta série');
        continue;
      }

      const menorRG = rgsNumericos[0];
      const maiorRG = rgsNumericos[rgsNumericos.length - 1];

      console.log(`📊 Menor RG: ${menorRG}`);
      console.log(`📊 Maior RG: ${maiorRG}`);
      console.log(`📊 Intervalo: ${maiorRG - menorRG + 1} números`);

      // Verificar RGs faltantes
      const faltantes = [];
      for (let rg = menorRG; rg <= maiorRG; rg++) {
        if (!rgsNumericos.includes(rg)) {
          faltantes.push(rg);
        }
      }

      const serieInfo = {
        serie: serie,
        total_animais: animais.length,
        menor_rg: menorRG,
        maior_rg: maiorRG,
        intervalo_total: maiorRG - menorRG + 1,
        rgs_faltantes: faltantes,
        total_faltantes: faltantes.length,
        percentual_completo: ((animais.length / (maiorRG - menorRG + 1)) * 100).toFixed(2),
        primeiro_animal: {
          rg: animais[0].rg,
          nome: animais[0].nome,
          data: animais[0].created_at
        },
        ultimo_animal: {
          rg: animais[animais.length - 1].rg,
          nome: animais[animais.length - 1].nome,
          data: animais[animais.length - 1].created_at
        }
      };

      relatorio.series_analisadas.push(serieInfo);

      if (faltantes.length > 0) {
        console.log(`\n⚠️ ATENÇÃO: ${faltantes.length} RGs faltantes!`);
        console.log(`📊 Percentual de completude: ${serieInfo.percentual_completo}%`);
        
        // Mostrar os primeiros 20 faltantes
        const mostrar = faltantes.slice(0, 20);
        console.log(`\n🔴 RGs faltantes (mostrando ${mostrar.length} de ${faltantes.length}):`);
        
        // Agrupar em intervalos para melhor visualização
        let inicio = mostrar[0];
        let fim = mostrar[0];
        const intervalos = [];

        for (let i = 1; i < mostrar.length; i++) {
          if (mostrar[i] === fim + 1) {
            fim = mostrar[i];
          } else {
            if (inicio === fim) {
              intervalos.push(`${serie}-${inicio}`);
            } else {
              intervalos.push(`${serie}-${inicio} a ${serie}-${fim}`);
            }
            inicio = mostrar[i];
            fim = mostrar[i];
          }
        }
        
        // Adicionar último intervalo
        if (inicio === fim) {
          intervalos.push(`${serie}-${inicio}`);
        } else {
          intervalos.push(`${serie}-${inicio} a ${serie}-${fim}`);
        }

        intervalos.forEach(intervalo => {
          console.log(`   - ${intervalo}`);
        });

        if (faltantes.length > 20) {
          console.log(`   ... e mais ${faltantes.length - 20} RGs faltantes`);
        }
      } else {
        console.log(`\n✅ Sequência completa! Nenhum RG faltante.`);
        console.log(`📊 Percentual de completude: 100%`);
      }

      // Mostrar primeiro e último animal
      console.log(`\n📌 Primeiro animal: ${serie}-${animais[0].rg} (${animais[0].nome || 'Sem nome'})`);
      console.log(`📌 Último animal: ${serie}-${animais[animais.length - 1].rg} (${animais[animais.length - 1].nome || 'Sem nome'})`);
    }

    // 3. Salvar relatório em JSON
    const nomeArquivoJson = `relatorio-rgs-faltantes-${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(nomeArquivoJson, JSON.stringify(relatorio, null, 2));
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Relatório JSON salvo: ${nomeArquivoJson}`);

    // 4. Criar relatório Excel
    console.log('\n📊 Gerando relatório Excel...');
    let XLSX;
    try {
      XLSX = require('xlsx');
    } catch (error) {
      console.log('⚠️ Módulo xlsx não encontrado. Instalando...');
      console.log('   Execute: npm install xlsx');
      console.log('   Ou continue - o relatório JSON foi gerado com sucesso!');
      console.log('\n' + '='.repeat(80));
      console.log(`✅ Relatório JSON salvo: ${nomeArquivoJson}`);
      return;
    }
    
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo
    const resumoData = [
      ['RELATÓRIO DE RGs FALTANTES'],
      ['Data da Análise:', new Date().toLocaleString('pt-BR')],
      ['Total de Séries:', relatorio.total_series],
      [],
      ['Série', 'Total Animais', 'Menor RG', 'Maior RG', 'Intervalo', 'Faltantes', '% Completo']
    ];

    relatorio.series_analisadas.forEach(s => {
      resumoData.push([
        s.serie,
        s.total_animais,
        s.menor_rg,
        s.maior_rg,
        s.intervalo_total,
        s.total_faltantes,
        `${s.percentual_completo}%`
      ]);
    });

    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Aba 2: RGs Faltantes Detalhados
    const faltantesData = [
      ['Série', 'RG Faltante', 'Identificação Completa']
    ];

    relatorio.series_analisadas.forEach(s => {
      if (s.rgs_faltantes.length > 0) {
        s.rgs_faltantes.forEach(rg => {
          faltantesData.push([s.serie, rg, `${s.serie}-${rg}`]);
        });
      }
    });

    const wsFaltantes = XLSX.utils.aoa_to_sheet(faltantesData);
    XLSX.utils.book_append_sheet(wb, wsFaltantes, 'RGs Faltantes');

    // Aba 3: Detalhes por Série
    relatorio.series_analisadas.forEach(s => {
      const serieData = [
        [`SÉRIE: ${s.serie}`],
        [],
        ['Total de Animais:', s.total_animais],
        ['Menor RG:', s.menor_rg],
        ['Maior RG:', s.maior_rg],
        ['Intervalo Total:', s.intervalo_total],
        ['RGs Faltantes:', s.total_faltantes],
        ['% Completo:', `${s.percentual_completo}%`],
        [],
        ['Primeiro Animal:'],
        ['  RG:', s.primeiro_animal.rg],
        ['  Nome:', s.primeiro_animal.nome || 'Sem nome'],
        ['  Data:', new Date(s.primeiro_animal.data).toLocaleString('pt-BR')],
        [],
        ['Último Animal:'],
        ['  RG:', s.ultimo_animal.rg],
        ['  Nome:', s.ultimo_animal.nome || 'Sem nome'],
        ['  Data:', new Date(s.ultimo_animal.data).toLocaleString('pt-BR')],
        []
      ];

      if (s.rgs_faltantes.length > 0) {
        serieData.push(['RGs Faltantes:']);
        s.rgs_faltantes.forEach(rg => {
          serieData.push([`${s.serie}-${rg}`]);
        });
      }

      const wsSerie = XLSX.utils.aoa_to_sheet(serieData);
      XLSX.utils.book_append_sheet(wb, wsSerie, s.serie.substring(0, 31)); // Excel limita a 31 caracteres
    });

    const nomeArquivoExcel = `relatorio-rgs-faltantes-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, nomeArquivoExcel);
    console.log(`✅ Relatório Excel salvo: ${nomeArquivoExcel}`);

    // Resumo final
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RESUMO GERAL');
    console.log('='.repeat(80));
    
    const totalFaltantes = relatorio.series_analisadas.reduce((sum, s) => sum + s.total_faltantes, 0);
    const totalAnimais = relatorio.series_analisadas.reduce((sum, s) => sum + s.total_animais, 0);
    
    console.log(`\n✅ Total de animais cadastrados: ${totalAnimais}`);
    console.log(`⚠️ Total de RGs faltantes: ${totalFaltantes}`);
    
    if (totalFaltantes > 0) {
      console.log(`\n🔴 Séries com RGs faltantes:`);
      relatorio.series_analisadas
        .filter(s => s.total_faltantes > 0)
        .forEach(s => {
          console.log(`   - ${s.serie}: ${s.total_faltantes} faltantes (${s.percentual_completo}% completo)`);
        });
    }

    console.log(`\n📄 Arquivos gerados:`);
    console.log(`   - ${nomeArquivoJson}`);
    console.log(`   - ${nomeArquivoExcel}`);

  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error);
    console.error('Detalhes:', error.message);
  } finally {
    await pool.end();
  }
}

verificarRGsFaltantes();
