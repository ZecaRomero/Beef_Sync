// Usando fetch nativo do Node.js 18+

async function checkAnimalData() {
  try {
    const response = await fetch('http://localhost:3020/api/animals');
    const animals = await response.json();
    
    console.log('🔍 Dados dos animais da API:');
    animals.forEach((animal, index) => {
      console.log(`\nAnimal ${index + 1}:`);
      console.log(`  ID: ${animal.id}`);
      console.log(`  Série: ${animal.serie}`);
      console.log(`  RG: ${animal.rg}`);
      console.log(`  Sexo: "${animal.sexo}"`);
      console.log(`  Raça: "${animal.raca}"`);
      console.log(`  Peso: ${animal.peso}`);
      console.log(`  Meses: ${animal.meses}`);
      console.log(`  Situação: ${animal.situacao}`);
    });
    
    // Verificar valores únicos de sexo
    const sexosUnicos = [...new Set(animals.map(a => a.sexo))];
    console.log('\n🔍 Valores únicos de sexo:', sexosUnicos);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkAnimalData();
