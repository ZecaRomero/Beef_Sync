#!/usr/bin/env node

/**
 * Script de configuraÃ§Ã£o inicial do Beef Sync
 * Configura o banco de dados e dados iniciais
 */

require('dotenv').config();
const { testConnection, createTables, query, closePool } = require('../lib/database');

async function setupInicial() {
  console.log('ðÅ¸Å¡â‚¬ CONFIGURAÃâ€¡ÃÆ’O INICIAL DO BEEF SYNC');
  console.log('=' .repeat(40));

  try {
    // 1. Testar conexÃ£o
    console.log('\n1ï¸�âÆ’£ Testando conexÃ£o com PostgreSQL...');
    const connectionResult = await testConnection();
    
    if (!connectionResult.success) {
      console.log('â�Å’ Falha na conexÃ£o:', connectionResult.error);
      console.log('\nðÅ¸â€�§ Verifique:');
      console.log('   - Se o PostgreSQL estÃ¡ rodando');
      console.log('   - Se as credenciais no .env estÃ£o corretas');
      console.log('   - Se o banco de dados existe');
      return false;
    }
    
    console.log('âÅ“â€¦ ConexÃ£o estabelecida com sucesso');

    // 2. Criar estrutura
    console.log('\n2ï¸�âÆ’£ Criando estrutura do banco...');
    await createTables();
    console.log('âÅ“â€¦ Estrutura criada com sucesso');

    // 3. Inserir dados iniciais
    console.log('\n3ï¸�âÆ’£ Inserindo dados iniciais...');
    
    // Naturezas de operaÃ§Ã£o
    await query(`
      INSERT INTO naturezas_operacao (nome, tipo, ativo) VALUES
      ('Compra de Animais', 'entrada', true),
      ('Venda de Animais', 'saida', true),
      ('TransferÃªncia Entre Propriedades', 'saida', true),
      ('Recebimento de TransferÃªncia', 'entrada', true),
      ('Compra de SÃªmen', 'entrada', true),
      ('Venda de SÃªmen', 'saida', true)
      ON CONFLICT DO NOTHING
    `);

    // Protocolos reprodutivos bÃ¡sicos
    await query(`
      INSERT INTO protocolos_reprodutivos (nome, descricao, tipo, duracao_dias, ativo) VALUES
      ('IATF BÃ¡sico', 'Protocolo bÃ¡sico de IATF com 9 dias', 'IATF', 9, true),
      ('SincronizaÃ§Ã£o de Cio', 'Protocolo para sincronizaÃ§Ã£o de cio natural', 'SincronizaÃ§Ã£o', 21, true),
      ('PreparaÃ§Ã£o para TE', 'Protocolo de preparaÃ§Ã£o de receptoras para TE', 'TE', 7, true)
      ON CONFLICT DO NOTHING
    `);

    // NotificaÃ§Ã£o de boas-vindas
    await query(`
      INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, lida) VALUES
      ('sistema', 'Bem-vindo ao Beef Sync!', 'Sistema configurado com sucesso. VocÃª pode comeÃ§ar a cadastrar seus animais e gerenciar seu rebanho.', 'medium', false)
      ON CONFLICT DO NOTHING
    `);

    console.log('âÅ“â€¦ Dados iniciais inseridos');

    // 4. Verificar configuraÃ§Ã£o
    console.log('\n4ï¸�âÆ’£ Verificando configuraÃ§Ã£o...');
    
    const verificacoes = await Promise.all([
      query('SELECT COUNT(*) as total FROM naturezas_operacao'),
      query('SELECT COUNT(*) as total FROM protocolos_reprodutivos'),
      query('SELECT COUNT(*) as total FROM notificacoes')
    ]);

    console.log(`   ðÅ¸â€œâ€¹ Naturezas de operaÃ§Ã£o: ${verificacoes[0].rows[0].total}`);
    console.log(`   ðÅ¸§¬ Protocolos reprodutivos: ${verificacoes[1].rows[0].total}`);
    console.log(`   ðÅ¸â€�â€� NotificaÃ§Ãµes: ${verificacoes[2].rows[0].total}`);

    console.log('\n' + '='.repeat(40));
    console.log('ðÅ¸Å½â€° CONFIGURAÃâ€¡ÃÆ’O CONCLUÃ�DA COM SUCESSO!');
    console.log('');
    console.log('ðÅ¸â€œâ€¹ PrÃ³ximos passos:');
    console.log('   1. Execute: npm run dev');
    console.log('   2. Acesse: http://localhost:3000');
    console.log('   3. Comece cadastrando seus animais');
    console.log('   4. Configure seu estoque de sÃªmen');
    console.log('');
    console.log('ðÅ¸â€�� Para verificar o sistema: npm run system:check');
    console.log('ðÅ¸â€œÅ¡ Consulte o README.md para mais informaÃ§Ãµes');

    return true;

  } catch (error) {
    console.error('\nðÅ¸â€™¥ Erro durante a configuraÃ§Ã£o:', error.message);
    console.log('\nðÅ¸â€�§ PossÃ­veis soluÃ§Ãµes:');
    console.log('   - Verifique as configuraÃ§Ãµes do .env');
    console.log('   - Confirme se o PostgreSQL estÃ¡ rodando');
    console.log('   - Verifique as permissÃµes do usuÃ¡rio do banco');
    return false;
  } finally {
    await closePool();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupInicial()
    .then((sucesso) => {
      process.exit(sucesso ? 0 : 1);
    })
    .catch((error) => {
      console.error('ðÅ¸â€™¥ Erro na configuraÃ§Ã£o:', error.message);
      process.exit(1);
    });
}

module.exports = { setupInicial };