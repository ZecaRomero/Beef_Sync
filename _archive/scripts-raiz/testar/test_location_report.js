const fetch = require('node-fetch');

async function testLocationReport() {
  try {
    const reportData = {
      reports: ['location_report'],
      period: {
        startDate: '2025-10-01',
        endDate: '2025-10-31'
      },
      sections: {
        location_report: {
          localizacao_atual: true,
          historico_movimentacoes: true,
          animais_por_piquete: true,
          movimentacoes_recentes: true,
          animais_sem_localizacao: true
        }
      },
      preview: false
    };

    console.log('=== TESTANDO API DE RELATÓRIO DE LOCALIZAÇÃO ===');
    console.log('Enviando requisição para: http://localhost:3020/api/reports/generate');
    console.log('Dados:', JSON.stringify(reportData, null, 2));

    const response = await fetch('http://localhost:3020/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData)
    });

    console.log('\n=== RESPOSTA DA API ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const result = await response.json();
    
    console.log('\n=== RESPOSTA COMPLETA ===');
    console.log(JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n=== DADOS DO RELATÓRIO ===');
      
      if (result.data && result.data.data && result.data.data.location_report) {
        const locationReport = result.data.data.location_report;
        
        // Localização atual
        if (locationReport.localizacao_atual) {
          console.log('\n📍 LOCALIZAÇÃO ATUAL:');
          console.log('Total de animais:', locationReport.localizacao_atual.length);
          
          // Procurar especificamente pelo animal no Piquete 4
          const piquete4Animals = locationReport.localizacao_atual.filter(animal => 
            animal.piquete && animal.piquete.toLowerCase().includes('piquete 4')
          );
          
          console.log('Animais no Piquete 4:', piquete4Animals.length);
          
          if (piquete4Animals.length > 0) {
            piquete4Animals.forEach((animal, index) => {
              console.log(`\n${index + 1}. Animal: ${animal.serie}-${animal.rg}`);
              console.log(`   Raça: ${animal.raca}`);
              console.log(`   Sexo: ${animal.sexo}`);
              console.log(`   Piquete: ${animal.piquete}`);
              console.log(`   Data Entrada: ${animal.data_entrada}`);
              console.log(`   Responsável: ${animal.usuario_responsavel}`);
            });
          } else {
            console.log('❌ PROBLEMA: Nenhum animal do Piquete 4 encontrado no relatório!');
            
            // Mostrar todos os piquetes encontrados
            const piquetes = [...new Set(locationReport.localizacao_atual
              .filter(a => a.piquete)
              .map(a => a.piquete))];
            console.log('\nPiquetes encontrados no relatório:', piquetes);
          }
        }
        
        // Animais por piquete
        if (locationReport.animais_por_piquete) {
          console.log('\n📊 ANIMAIS POR PIQUETE:');
          locationReport.animais_por_piquete.forEach(piquete => {
            console.log(`${piquete.piquete}: ${piquete.total_animais} animais`);
          });
        }
        
        // Estatísticas
        if (locationReport.estatisticas) {
          console.log('\n📈 ESTATÍSTICAS:');
          console.log('Total de animais:', locationReport.estatisticas.total_animais);
          console.log('Animais localizados:', locationReport.estatisticas.animais_localizados);
          console.log('Animais sem localização:', locationReport.estatisticas.animais_sem_localizacao);
          console.log('Total de piquetes:', locationReport.estatisticas.total_piquetes);
        }
        
      } else {
        console.log('❌ ERRO: Dados de location_report não encontrados na resposta');
      }
    } else {
      console.log('❌ ERRO NA API:', result);
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

testLocationReport();