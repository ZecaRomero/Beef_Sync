const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function adicionarDataChegada() {
  console.log('🔧 ADICIONANDO CAMPO DATA DE CHEGADA\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar se a coluna já existe
    console.log('\n📊 1. Verificando se coluna data_chegada existe...');
    const colunaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'animais' 
        AND column_name = 'data_chegada'
      )
    `);

    if (colunaExiste.rows[0].exists) {
      console.log('✅ Coluna data_chegada já existe');
    } else {
      console.log('⚠️ Coluna não existe. Criando...');
      
      // 2. Adicionar coluna data_chegada
      await pool.query(`
        ALTER TABLE animais 
        ADD COLUMN data_chegada DATE
      `);
      
      console.log('✅ Coluna data_chegada criada');
    }

    // 3. Verificar se a coluna data_dg_prevista existe
    console.log('\n📊 2. Verificando se coluna data_dg_prevista existe...');
    const colunaDGExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'animais' 
        AND column_name = 'data_dg_prevista'
      )
    `);

    if (colunaDGExiste.rows[0].exists) {
      console.log('✅ Coluna data_dg_prevista já existe');
    } else {
      console.log('⚠️ Coluna não existe. Criando...');
      
      // 4. Adicionar coluna data_dg_prevista
      await pool.query(`
        ALTER TABLE animais 
        ADD COLUMN data_dg_prevista DATE
      `);
      
      console.log('✅ Coluna data_dg_prevista criada');
    }

    // 5. Criar função para calcular data DG automaticamente
    console.log('\n📊 3. Criando trigger para calcular data DG...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION calcular_data_dg()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.data_chegada IS NOT NULL THEN
          NEW.data_dg_prevista := NEW.data_chegada + INTERVAL '15 days';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 6. Criar trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_calcular_data_dg ON animais;
      
      CREATE TRIGGER trigger_calcular_data_dg
      BEFORE INSERT OR UPDATE OF data_chegada ON animais
      FOR EACH ROW
      EXECUTE FUNCTION calcular_data_dg();
    `);

    console.log('✅ Trigger criado para calcular data DG automaticamente');

    // 7. Criar tabela de alertas se não existir
    console.log('\n📊 4. Criando tabela de alertas...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alertas_dg (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animais(id) ON DELETE CASCADE,
        data_chegada DATE NOT NULL,
        data_dg_prevista DATE NOT NULL,
        dias_restantes INTEGER,
        alerta_enviado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabela alertas_dg criada');

    // 8. Criar índices
    console.log('\n📊 5. Criando índices...');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_animais_data_chegada ON animais(data_chegada);
      CREATE INDEX IF NOT EXISTS idx_animais_data_dg_prevista ON animais(data_dg_prevista);
      CREATE INDEX IF NOT EXISTS idx_alertas_dg_animal_id ON alertas_dg(animal_id);
      CREATE INDEX IF NOT EXISTS idx_alertas_dg_data_dg_prevista ON alertas_dg(data_dg_prevista);
    `);

    console.log('✅ Índices criados');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuração concluída!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Coluna data_chegada adicionada');
    console.log('   ✅ Coluna data_dg_prevista adicionada');
    console.log('   ✅ Trigger automático criado (DG = Chegada + 15 dias)');
    console.log('   ✅ Tabela de alertas criada');
    console.log('   ✅ Índices criados');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Recarregue a página de cadastro de animais');
    console.log('   2. Verá o campo "Data de Chegada"');
    console.log('   3. Ao preencher, a data do DG será calculada automaticamente');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

adicionarDataChegada();
