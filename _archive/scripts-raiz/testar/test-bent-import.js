const databaseService = require('./services/databaseService.js');

async function testarImportacaoBent() {
  try {
    console.log('≈∏ß™ Testando importa√ß√£o de animais BENT...');
    
    // Dados de teste para animais BENT
    const animalTeste = {
      nome: null,
      serie: 'BENT',
      rg: '001',
      tatuagem: null,
      sexo: 'Macho',
      raca: 'Nelore',
      data_nascimento: '2023-01-15',
      hora_nascimento: null,
      peso: null,
      cor: null,
      tipo_nascimento: null,
      dificuldade_parto: null,
      meses: 22,
      situacao: 'Ativo',
      pai: 'CJCJ 123 TOURO TESTE',
      mae: 'CJCJ 456 VACA TESTE',
      receptora: null,
      is_fiv: false,
      custo_total: 0,
      valor_venda: null,
      valor_real: null,
      veterinario: null,
      abczg: null,
      deca: null,
      observacoes: 'Teste de importa√ß√£o BENT'
    };
    
    console.log('≈∏‚Äúù Tentando criar animal BENT de teste...');
    const resultado = await databaseService.criarAnimal(animalTeste);
    
    if (resultado._duplicate) {
      console.log('‚≈°†Ô∏è Animal j√° existe:', resultado._duplicateMessage);
    } else {
      console.log('‚≈ì‚Ä¶ Animal BENT criado com sucesso:', resultado.serie + '-' + resultado.rg);
    }
    
    // Verificar se foi salvo
    const animaisBent = await databaseService.buscarAnimais({ serie: 'BENT' });
    console.log('≈∏‚Äùç Animais BENT ap√≥s teste:', animaisBent.length);
    
    if (animaisBent.length > 0) {
      console.log('≈∏‚Äú‚Äπ Animais BENT encontrados:');
      animaisBent.forEach((animal, i) => {
        console.log(`  ${i+1}. ${animal.serie}-${animal.rg} (${animal.sexo}) - ${animal.situacao}`);
      });
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro ao testar importa√ß√£o:', error.message);
    console.error('Stack:', error.stack);
  }
}

testarImportacaoBent();