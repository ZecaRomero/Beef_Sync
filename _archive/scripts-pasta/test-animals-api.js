const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAnimalsAPI() {
  try {
    console.log('🔍 Testando API /api/animals...');
    
    const response = await fetch('http://localhost:3020/api/animals');
    if (response.ok) {
      const animals = await response.json();
      console.log('\n📊 Total de animais da API:', animals.length);
      
      // Verificar animais por raça
      const breeds = {};
      animals.forEach(animal => {
        const raca = animal.raca || 'Não informado';
        breeds[raca] = (breeds[raca] || 0) + 1;
      });
      
      console.log('\n📋 Animais por raça:');
      Object.entries(breeds).forEach(([raca, count]) => {
        console.log('  -', raca + ':', count, 'animais');
      });
      
      // Verificar animais Nelore especificamente
      const neloreAnimals = animals.filter(a => a.raca === 'Nelore');
      console.log('\n🔍 Animais Nelore encontrados:', neloreAnimals.length);
      neloreAnimals.forEach(animal => {
        console.log('  -', animal.serie, animal.rg, '(' + animal.peso + 'kg)');
      });
      
    } else {
      console.log('❌ Erro na API:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAnimalsAPI();