const databaseService = require('./services/databaseService.js');

async function testarImportacaoBent() {
  try {
    console.log('🧪 Testando importação de animais BENT...');
    
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
      observacoes: 'Teste de importação BENT'
    };
    
    console.log('📝 Tentando criar animal BENT de teste...');
    const resultado = await databaseService.criarAnimal(animalTeste);
    
    if (resultado._duplicate) {
      console.log('⚠️ Animal já existe:', resultado._duplicateMessage);
    } else {
      console.log('✅ Animal BENT criado com sucesso:', resultado.serie + '-' + resultado.rg);
    }
    
    // Verificar se foi salvo
    const animaisBent = await databaseService.buscarAnimais({ serie: 'BENT' });
    console.log('🔍 Animais BENT após teste:', animaisBent.length);
    
    if (animaisBent.length > 0) {
      console.log('📋 Animais BENT encontrados:');
      animaisBent.forEach((animal, i) => {
        console.log(`  ${i+1}. ${animal.serie}-${animal.rg} (${animal.sexo}) - ${animal.situacao}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar importação:', error.message);
    console.error('Stack:', error.stack);
  }
}

testarImportacaoBent();