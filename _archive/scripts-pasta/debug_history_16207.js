
const dbService = require('../services/databaseService');

async function testHistory() {
    try {
        console.log('Testing buscarHistoricoAnimal with "16207" (RG)...');
        
        // Handle export variations
        const service = dbService.default || dbService;
        
        // This simulates what happens when visiting /animals/16207?history=true
        const animal = await service.buscarHistoricoAnimal("16207");
        
        if (animal) {
            console.log('�œ… Found animal history:', animal.serie, animal.rg, 'ID:', animal.id);
            console.log('   - Pesagens:', animal.pesagens?.length);
            console.log('   - Inseminações:', animal.inseminacoes?.length);
            console.log('   - Custos:', animal.custos?.length);
            console.log('   - Gestações:', animal.gestacoes?.length);
        } else {
            console.log('�Œ Animal history not found with "16207"');
        }

    } catch (e) {
        console.error('�Œ Error:', e);
    }
    process.exit(0);
}
testHistory();
