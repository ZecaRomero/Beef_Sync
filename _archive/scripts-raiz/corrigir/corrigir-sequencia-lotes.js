const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function corrigirSequencia() {
  console.log('🔧 CORRIGINDO SEQUÊNCIA DE LOTES\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar se a sequência existe
    console.log('\n📊 1. Verificando sequência lotes_seq...');
    const seqExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename = 'lotes_seq'
      )
    `);
    
    if (!seqExists.rows[0].exists) {
      console.log('⚠️ Sequência lotes_seq não existe. Criando...');
      await pool.query(`CREATE SEQUENCE IF NOT EXISTS lotes_seq START WITH 1`);
      console.log('✅ Sequência criada');
    } else {
      console.log('✅ Sequência existe');
    }

    // 2. Verificar valor atual da sequência
    console.log('\n📊 2. Verificando valor atual da sequência...');
    const currentVal = await pool.query(`SELECT last_value FROM lotes_seq`);
    console.log(`   Valor atual: ${currentVal.rows[0].last_value}`);

    // 3. Verificar maior ID na tabela lotes
    console.log('\n📊 3. Verificando maior ID na tabela lotes...');
    const maxId = await pool.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM lotes`);
    const maxIdValue = maxId.rows[0].max_id;
    console.log(`   Maior ID na tabela: ${maxIdValue}`);

    // 4. Ajustar sequência para o próximo valor válido
    const nextVal = Math.max(maxIdValue + 1, 1); // Garantir que seja no mínimo 1
    console.log(`\n📊 4. Ajustando sequência para: ${nextVal}`);
    
    await pool.query(`SELECT setval('lotes_seq', $1, false)`, [nextVal]);
    console.log('✅ Sequência ajustada com sucesso!');

    // 5. Verificar novo valor
    console.log('\n📊 5. Verificando novo valor...');
    const newVal = await pool.query(`SELECT last_value FROM lotes_seq`);
    console.log(`   Novo valor: ${newVal.rows[0].last_value}`);

    // 6. Testar próximo valor
    console.log('\n📊 6. Testando próximo valor...');
    const nextValue = await pool.query(`SELECT nextval('lotes_seq')`);
    console.log(`   Próximo valor gerado: ${nextValue.rows[0].nextval}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sequência corrigida com sucesso!');
    console.log('\n💡 Agora a API deve funcionar normalmente.');

  } catch (error) {
    console.error('\n❌ Erro ao corrigir sequência:', error);
    console.error('Detalhes:', error.message);
  } finally {
    await pool.end();
  }
}

corrigirSequencia();
