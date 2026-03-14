const { query } = require('../lib/database');

/**
 * Script para testar e verificar dados de localizaÃ§Ã£o nos relatÃ³rios
 */

async function verificarDados() {
  console.log('ğÅ¸â€ Verificando dados para teste de localizaÃ§Ã£o...\n');

  try {
    // 1. Verificar animais cadastrados
    console.log('1ï¸âÆ’£ Verificando animais cadastrados...');
    const animais = await query(`
      SELECT id, serie, rg, raca, situacao 
      FROM animais 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (animais.rows.length === 0) {
      console.log('âÅ’ Nenhum animal cadastrado no sistema');
      console.log('   Cadastre alguns animais primeiro!\n');
      return;
    }
    
    console.log(`âÅ“â€¦ ${animais.rows.length} animais encontrados (mostrando Ãºltimos 5):`);
    animais.rows.forEach(a => {
      console.log(`   - ${a.serie}-${a.rg} | ${a.raca} | ${a.situacao}`);
    });
    console.log('');

    // 2. Verificar localizaÃ§Ãµes existentes
    console.log('2ï¸âÆ’£ Verificando localizaÃ§Ãµes cadastradas...');
    const localizacoes = await query(`
      SELECT 
        l.*,
        a.serie,
        a.rg,
        a.raca
      FROM localizacoes_animais l
      JOIN animais a ON l.animal_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);
    
    if (localizacoes.rows.length === 0) {
      console.log('âÅ¡ ï¸ Nenhuma localizaÃ§Ã£o cadastrada');
      console.log('   Vou criar algumas localizaÃ§Ãµes de teste...\n');
      
      // Criar localizaÃ§Ãµes de teste
      await criarLocalizacoesTest(animais.rows);
    } else {
      console.log(`âÅ“â€¦ ${localizacoes.rows.length} localizaÃ§Ãµes encontradas:`);
      localizacoes.rows.forEach(l => {
        const atual = l.data_saida ? 'âÅ’' : 'âÅ“â€¦';
        console.log(`   ${atual} ${l.serie}-${l.rg} | ${l.piquete} | Entrada: ${formatarData(l.data_entrada)}`);
      });
      console.log('');
    }

    // 3. Verificar lotes no sistema
    console.log('3ï¸âÆ’£ Verificando lotes com animais...');
    const lotes = await query(`
      SELECT 
        numero_lote,
        modulo,
        tipo_operacao,
        descricao,
        data_criacao
      FROM lotes_operacoes
      WHERE modulo = 'ANIMAIS'
      ORDER BY data_criacao DESC
      LIMIT 5
    `);
    
    if (lotes.rows.length === 0) {
      console.log('âÅ¡ ï¸ Nenhum lote de animais encontrado');
      console.log('   Os lotes sÃ£o criados automaticamente ao cadastrar/editar animais\n');
    } else {
      console.log(`âÅ“â€¦ ${lotes.rows.length} lotes de animais encontrados:`);
      lotes.rows.forEach(l => {
        console.log(`   - ${l.numero_lote} | ${l.tipo_operacao} | ${formatarData(l.data_criacao)}`);
      });
      console.log('');
    }

    // 4. InstruÃ§Ãµes finais
    console.log('ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€');
    console.log('ğÅ¸â€œâ€¹ COMO TESTAR NO APP:');
    console.log('ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€ââ€');
    console.log('');
    console.log('1. Acesse: http://localhost:3000/relatorios-lotes');
    console.log('2. Procure por lotes do mÃ³dulo "ANIMAIS"');
    console.log('3. Clique na seta (ââ€“¼) para expandir os detalhes');
    console.log('4. VocÃª verÃ¡ a seÃ§Ã£o "ğÅ¸â€œ LocalizaÃ§Ã£o Atual"');
    console.log('');
    console.log('ğÅ¸â€™¡ Dica: Use o filtro "MÃ³dulo" e selecione "ANIMAIS"');
    console.log('');

  } catch (error) {
    console.error('âÅ’ Erro ao verificar dados:', error.message);
  }
}

async function criarLocalizacoesTest(animais) {
  console.log('ğÅ¸â€œ Criando localizaÃ§Ãµes de teste...\n');

  const piquetes = ['Piquete 1', 'Piquete 2', 'Piquete 3', 'Piquete Central', 'Piquete Norte'];
  const motivos = [
    'RotaÃ§Ã£o de pastagem',
    'Manejo sanitÃ¡rio',
    'SeparaÃ§Ã£o por categoria',
    'ObservaÃ§Ã£o veterinÃ¡ria',
    'PreparaÃ§Ã£o para venda'
  ];

  try {
    for (let i = 0; i < Math.min(3, animais.length); i++) {
      const animal = animais[i];
      const piquete = piquetes[i % piquetes.length];
      const motivo = motivos[i % motivos.length];
      
      // Criar histÃ³rico de movimentaÃ§Ãµes
      const dataAntiga = new Date();
      dataAntiga.setDate(dataAntiga.getDate() - 30);
      
      const dataMedia = new Date();
      dataMedia.setDate(dataMedia.getDate() - 15);
      
      const dataAtual = new Date();
      dataAtual.setDate(dataAtual.getDate() - 5);

      // LocalizaÃ§Ã£o antiga (jÃ¡ saiu)
      await query(`
        INSERT INTO localizacoes_animais (
          animal_id, piquete, data_entrada, data_saida, 
          motivo_movimentacao, usuario_responsavel
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        animal.id,
        'Piquete Antigo',
        dataAntiga.toISOString().split('T')[0],
        dataMedia.toISOString().split('T')[0],
        'Teste - movimentaÃ§Ã£o antiga',
        'Sistema Teste'
      ]);

      // LocalizaÃ§Ã£o atual (ainda estÃ¡)
      await query(`
        INSERT INTO localizacoes_animais (
          animal_id, piquete, data_entrada, 
          motivo_movimentacao, usuario_responsavel, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        animal.id,
        piquete,
        dataAtual.toISOString().split('T')[0],
        motivo,
        'Sistema Teste',
        `Animal ${animal.serie}-${animal.rg} em boas condiÃ§Ãµes`
      ]);

      console.log(`âÅ“â€¦ LocalizaÃ§Ã£o criada: ${animal.serie}-${animal.rg} ââ€ â€™ ${piquete}`);
    }

    console.log('\nâÅ“â€¦ LocalizaÃ§Ãµes de teste criadas com sucesso!\n');

  } catch (error) {
    console.error('âÅ’ Erro ao criar localizaÃ§Ãµes:', error.message);
  }
}

function formatarData(data) {
  if (!data) return 'N/A';
  return new Date(data).toLocaleDateString('pt-BR');
}

// Executar verificaÃ§Ã£o
verificarDados()
  .then(() => {
    console.log('âÅ“â€¦ VerificaÃ§Ã£o concluÃ­da!');
    process.exit(0);
  })
  .catch(error => {
    console.error('âÅ’ Erro:', error);
    process.exit(1);
  });

