const fetch = require('node-fetch');

async function checkDatabaseData() {
  try {
    console.log('🔍 Verificando dados no banco...');
    
    // Verificar animais
    const animalsResponse = await fetch('http://localhost:3020/api/animals');
    if (animalsResponse.ok) {
      const animals = await animalsResponse.json();
      console.log('🐄 Total de animais:', animals.data?.length || 0);
      
      if (animals.data && animals.data.length > 0) {
        const firstAnimal = animals.data[0];
        console.log('📅 Primeiro animal criado em:', firstAnimal.created_at);
        console.log('📅 Último animal atualizado em:', firstAnimal.updated_at);
        
        // Mostrar datas de criação dos primeiros 5 animais
        console.log('\n📅 Datas de criação dos primeiros 5 animais:');
        animals.data.slice(0, 5).forEach((animal, index) => {
          console.log(`${index + 1}. ${animal.serie}-${animal.rg}: ${animal.created_at}`);
        });
      }
    }

    // Verificar nascimentos
    const birthsResponse = await fetch('http://localhost:3020/api/births');
    if (birthsResponse.ok) {
      const births = await birthsResponse.json();
      console.log('\n👶 Total de nascimentos:', births.data?.length || 0);
      
      if (births.data && births.data.length > 0) {
        console.log('📅 Datas de nascimento:');
        births.data.slice(0, 5).forEach((birth, index) => {
          console.log(`${index + 1}. ${birth.data_nascimento}`);
        });
      }
    }

    // Verificar localizações
    const locationsResponse = await fetch('http://localhost:3020/api/localizacoes');
    if (locationsResponse.ok) {
      const locations = await locationsResponse.json();
      console.log('\n📍 Total de localizações:', locations.data?.length || 0);
      
      if (locations.data && locations.data.length > 0) {
        console.log('📅 Datas de entrada:');
        locations.data.slice(0, 5).forEach((location, index) => {
          console.log(`${index + 1}. ${location.data_entrada}`);
        });
      }
    }

    // Testar com período mais amplo
    console.log('\n🔍 Testando relatório com período mais amplo (2024-2025)...');
    
    const wideResponse = await fetch('http://localhost:3020/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['location_report'],
        period: {
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        },
        preview: true
      })
    });

    if (wideResponse.ok) {
      const wideData = await wideResponse.json();
      console.log('📋 Preview com período amplo:', JSON.stringify(wideData.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  }
}

checkDatabaseData();