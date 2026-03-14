#!/usr/bin/env node

/**
 * Script de configuração inicial do Beef Sync
 * Configura o banco de dados e dados iniciais
 */

require('dotenv').config();
const { testConnection, createTables, query, closePool } = require('../lib/database');

async function setupInicial() {
  console.log('🚀 CONFIGURAÇÃO INICIAL DO BEEF SYNC');
  console.log('=' .repeat(40));

  try {
    // 1. Testar conexão
    console.log('\n1️⃣ Testando conexão com PostgreSQL...');
    const connectionResult = await testConnection();
    
    if (!connectionResult.success) {
      console.log('❌ Falha na conexão:', connectionResult.error);
      console.log('\n🔧 Verifique:');
      console.log('   - Se o PostgreSQL está rodando');
      console.log('   - Se as credenciais no .env estão corretas');
      console.log('   - Se o banco de dados existe');
      return false;
    }
    
    console.log('✅ Conexão estabelecida com sucesso');

    // 2. Criar estrutura
    console.log('\n2️⃣ Criando estrutura do banco...');
    await createTables();
    console.log('✅ Estrutura criada com sucesso');

    // 3. Inserir dados iniciais
    console.log('\n3️⃣ Inserindo dados iniciais...');
    
    // Naturezas de operação
    await query(`
      INSERT INTO naturezas_operacao (nome, tipo, ativo) VALUES
      ('Compra de Animais', 'entrada', true),
      ('Venda de Animais', 'saida', true),
      ('Transferência Entre Propriedades', 'saida', true),
      ('Recebimento de Transferência', 'entrada', true),
      ('Compra de Sêmen', 'entrada', true),
      ('Venda de Sêmen', 'saida', true)
      ON CONFLICT DO NOTHING
    `);

    // Protocolos reprodutivos básicos
    await query(`
      INSERT INTO protocolos_reprodutivos (nome, descricao, tipo, duracao_dias, ativo) VALUES
      ('IATF Básico', 'Protocolo básico de IATF com 9 dias', 'IATF', 9, true),
      ('Sincronização de Cio', 'Protocolo para sincronização de cio natural', 'Sincronização', 21, true),
      ('Preparação para TE', 'Protocolo de preparação de receptoras para TE', 'TE', 7, true)
      ON CONFLICT DO NOTHING
    `);

    // Notificação de boas-vindas
    await query(`
      INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, lida) VALUES
      ('sistema', 'Bem-vindo ao Beef Sync!', 'Sistema configurado com sucesso. Você pode começar a cadastrar seus animais e gerenciar seu rebanho.', 'medium', false)
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Dados iniciais inseridos');

    // 4. Verificar configuração
    console.log('\n4️⃣ Verificando configuração...');
    
    const verificacoes = await Promise.all([
      query('SELECT COUNT(*) as total FROM naturezas_operacao'),
      query('SELECT COUNT(*) as total FROM protocolos_reprodutivos'),
      query('SELECT COUNT(*) as total FROM notificacoes')
    ]);

    console.log(`   📋 Naturezas de operação: ${verificacoes[0].rows[0].total}`);
    console.log(`   🧬 Protocolos reprodutivos: ${verificacoes[1].rows[0].total}`);
    console.log(`   🔔 Notificações: ${verificacoes[2].rows[0].total}`);

    console.log('\n' + '='.repeat(40));
    console.log('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute: npm run dev');
    console.log('   2. Acesse: http://localhost:3000');
    console.log('   3. Comece cadastrando seus animais');
    console.log('   4. Configure seu estoque de sêmen');
    console.log('');
    console.log('🔍 Para verificar o sistema: npm run system:check');
    console.log('📚 Consulte o README.md para mais informações');

    return true;

  } catch (error) {
    console.error('\n💥 Erro durante a configuração:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('   - Verifique as configurações do .env');
    console.log('   - Confirme se o PostgreSQL está rodando');
    console.log('   - Verifique as permissões do usuário do banco');
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
      console.error('💥 Erro na configuração:', error.message);
      process.exit(1);
    });
}

module.exports = { setupInicial };