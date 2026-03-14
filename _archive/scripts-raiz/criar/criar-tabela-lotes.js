const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function criarTabelaLotes() {
  console.log('🔧 CRIANDO TABELA DE LOTES\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar se a tabela já existe
    console.log('\n📊 1. Verificando se tabela lotes existe...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Tabela lotes já existe');
      
      // Verificar estrutura
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'lotes'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Estrutura atual:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      
      return;
    }

    console.log('⚠️ Tabela lotes não existe. Criando...');

    // 2. Criar sequência se não existir
    console.log('\n📊 2. Criando sequência lotes_seq...');
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS lotes_seq START WITH 1
    `);
    console.log('✅ Sequência criada');

    // 3. Criar tabela lotes
    console.log('\n📊 3. Criando tabela lotes...');
    await pool.query(`
      CREATE TABLE lotes (
        id INTEGER PRIMARY KEY DEFAULT nextval('lotes_seq'),
        tipo VARCHAR(50) NOT NULL,
        descricao TEXT,
        data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_fim TIMESTAMP,
        status VARCHAR(20) DEFAULT 'ativo',
        total_registros INTEGER DEFAULT 0,
        registros_sucesso INTEGER DEFAULT 0,
        registros_erro INTEGER DEFAULT 0,
        detalhes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela lotes criada');

    // 4. Criar índices
    console.log('\n📊 4. Criando índices...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_lotes_tipo ON lotes(tipo);
      CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);
      CREATE INDEX IF NOT EXISTS idx_lotes_data_inicio ON lotes(data_inicio);
    `);
    console.log('✅ Índices criados');

    // 5. Verificar criação
    console.log('\n📊 5. Verificando criação...');
    const verify = await pool.query(`
      SELECT COUNT(*) as count FROM lotes
    `);
    console.log(`✅ Tabela criada com sucesso! Total de registros: ${verify.rows[0].count}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tabela de lotes criada com sucesso!');
    console.log('\n💡 Agora a API deve funcionar normalmente.');

  } catch (error) {
    console.error('\n❌ Erro ao criar tabela:', error);
    console.error('Detalhes:', error.message);
  } finally {
    await pool.end();
  }
}

criarTabelaLotes();
