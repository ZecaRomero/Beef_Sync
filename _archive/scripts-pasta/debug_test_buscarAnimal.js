
const dbService = require('../services/databaseService');

async function test() {
    try {
        console.log('Testing buscarAnimalPorId with "16207" (RG)...');
        // dbService might be the instance directly or have .default depending on export
        // Based on grep: module.exports = databaseService;
        
        const service = dbService.default || dbService;
        
        const animal = await service.buscarAnimalPorId("16207");
        if (animal) {
            console.log('✅ Found animal:', animal.serie, animal.rg, 'ID:', animal.id);
        } else {
            console.log('❌ Animal not found with "16207"');
        }
        
        console.log('Testing buscarAnimalPorId with ID 1175...');
        const animalId = await service.buscarAnimalPorId(1175);
        if (animalId) {
             console.log('✅ Found animal by ID:', animalId.serie, animalId.rg, 'ID:', animalId.id);
        } else {
             console.log('❌ Animal not found by ID 1175');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    }
    process.exit(0);
}
test();
