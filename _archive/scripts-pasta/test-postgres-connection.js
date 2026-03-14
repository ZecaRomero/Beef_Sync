#!/usr/bin/env node

/**
 * Script para testar diferentes configurações de conexão PostgreSQL
 */

const { Pool } = require('pg');

async function testPostgresConnection() {
  console.log('�Ÿ”� Testando diferentes configurações de PostgreSQL...\n');

  // Configurações para testar
  const configs = [
    {
      name: 'Configuração do .env',
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'estoque_semen',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'jcromero85',
      }
    },
    {
      name: 'Configuração padrão PostgreSQL',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'jcromero85',
      }
    },
    {
      name: 'Sem senha (trust)',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`�Ÿ“‹ Testando: ${name}`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${config.password ? '***' : 'não definida'}`);

    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT version(), current_database(), current_user');
      
      console.log('   �œ… SUCESSO!');
      console.log(`   �Ÿ“Š Versão: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      console.log(`   �Ÿ—„️  Database: ${result.rows[0].current_database}`);
      console.log(`   �Ÿ‘� User: ${result.rows[0].current_user}`);
      
      client.release();
      await pool.end();
      
      console.log('\n�ŸŽ‰ Configuração funcionando encontrada!\n');
      
      // Testar se o banco específico existe
      if (config.database !== 'estoque_semen') {
        console.log('�Ÿ”� Verificando se o banco "estoque_semen" existe...');
        const testPool = new Pool({ ...config, database: 'postgres' });
        try {
          const testClient = await testPool.connect();
          const dbCheck = await testClient.query(
            "SELECT 1 FROM pg_database WHERE datname = 'estoque_semen'"
          );
          
          if (dbCheck.rows.length === 0) {
            console.log('�š�️  Banco "estoque_semen" não existe. Criando...');
            await testClient.query('CREATE DATABASE estoque_semen');
            console.log('�œ… Banco "estoque_semen" criado com sucesso!');
          } else {
            console.log('�œ… Banco "estoque_semen" já existe!');
          }
          
          testClient.release();
          await testPool.end();
        } catch (error) {
          console.log(`�Œ Erro ao verificar/criar banco: ${error.message}`);
        }
      }
      
      return config;
      
    } catch (error) {
      console.log(`   �Œ FALHOU: ${error.message}`);
      await pool.end();
    }
    
    console.log('');
  }

  console.log('�Œ Nenhuma configuração funcionou. Verifique:');
  console.log('   - Se o PostgreSQL está rodando');
  console.log('   - Se as credenciais estão corretas');
  console.log('   - Se o arquivo pg_hba.conf permite conexões');
  
  return null;
}

// Executar se chamado diretamente
if (require.main === module) {
  testPostgresConnection()
    .then((config) => {
      if (config) {
        console.log('�œ� Use esta configuração no seu .env:');
        console.log(`DB_HOST=${config.host}`);
        console.log(`DB_PORT=${config.port}`);
        console.log(`DB_NAME=${config.database}`);
        console.log(`DB_USER=${config.user}`);
        if (config.password) {
          console.log(`DB_PASSWORD=${config.password}`);
        }
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('�Ÿ’� Erro inesperado:', error.message);
      process.exit(1);
    });
}

module.exports = { testPostgresConnection };