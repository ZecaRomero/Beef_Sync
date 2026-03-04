const fetch = require('node-fetch');

async function createTestData() {
  try {
    console.log('🔍 Criando dados de teste...');
    
    // Criar alguns animais de teste
    const animals = [
      {
        serie: 'BF',
        rg: '001',
        raca: 'Nelore',
        sexo: 'Macho',
        data_nascimento: '2023-01-15',
        situacao: 'Ativo',
        peso_atual: 450,
        pai: 'Touro 1',
        mae: 'Vaca 1'
      },
      {
        serie: 'BF',
        rg: '002',
        raca: 'Angus',
        sexo: 'Fêmea',
        data_nascimento: '2023-02-20',
        situacao: 'Ativo',
        peso_atual: 380,
        pai: 'Touro 2',
        mae: 'Vaca 2'
      },
      {
        serie: 'BF',
        rg: '003',
        raca: 'Nelore',
        sexo: 'Fêmea',
        data_nascimento: '2023-03-10',
        situacao: 'Ativo',
        peso_atual: 420,
        pai: 'Touro 1',
        mae: 'Vaca 3'
      }
    ];

    console.log('🐄 Criando animais...');
    for (const animal of animals) {
      try {
        const response = await fetch('http://localhost:3020/api/animals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(animal)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Animal ${animal.serie}-${animal.rg} criado com sucesso`);
        } else {
          const error = await response.text();
          console.log(`❌ Erro ao criar animal ${animal.serie}-${animal.rg}:`, error);
        }
      } catch (error) {
        console.log(`❌ Erro ao criar animal ${animal.serie}-${animal.rg}:`, error.message);
      }
    }

    // Criar alguns nascimentos
    console.log('\n👶 Criando nascimentos...');
    const births = [
      {
        data_nascimento: '2025-01-15',
        sexo: 'Macho',
        peso: 35,
        pai: 'Touro 1',
        mae: 'Vaca 4',
        dificuldade_parto: 'Normal'
      },
      {
        data_nascimento: '2025-01-20',
        sexo: 'Fêmea',
        peso: 32,
        pai: 'Touro 2',
        mae: 'Vaca 5',
        dificuldade_parto: 'Normal'
      }
    ];

    for (const birth of births) {
      try {
        const response = await fetch('http://localhost:3020/api/births', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(birth)
        });

        if (response.ok) {
          console.log(`✅ Nascimento de ${birth.sexo} criado com sucesso`);
        } else {
          const error = await response.text();
          console.log(`❌ Erro ao criar nascimento:`, error);
        }
      } catch (error) {
        console.log(`❌ Erro ao criar nascimento:`, error.message);
      }
    }

    // Aguardar um pouco e testar o relatório
    console.log('\n⏳ Aguardando e testando relatório...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const reportResponse = await fetch('http://localhost:3020/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['monthly_summary', 'births_analysis'],
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        },
        preview: true
      })
    });

    if (reportResponse.ok) {
      const reportData = await reportResponse.json();
      console.log('📊 Preview do relatório com dados:', JSON.stringify(reportData, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTestData();