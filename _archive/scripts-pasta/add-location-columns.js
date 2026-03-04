
require('dotenv').config();
const { query, closePool } = require('../lib/database');

async function addLocationColumns() {
  console.log('🚀 Iniciando migração de colunas de localização...');

  try {
    // Verificar e adicionar colunas na tabela animais
    console.log('📦 Verificando tabela animais...');
    
    await query(`
      DO $$ 
      BEGIN
        -- Adicionar local_nascimento
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'local_nascimento') THEN
          ALTER TABLE animais ADD COLUMN local_nascimento VARCHAR(100);
          RAISE NOTICE 'Coluna local_nascimento adicionada';
        ELSE
          RAISE NOTICE 'Coluna local_nascimento já existe';
        END IF;

        -- Adicionar pasto_atual
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'pasto_atual') THEN
          ALTER TABLE animais ADD COLUMN pasto_atual VARCHAR(100);
          RAISE NOTICE 'Coluna pasto_atual adicionada';
        ELSE
          RAISE NOTICE 'Coluna pasto_atual já existe';
        END IF;
      END $$;
    `);

    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await closePool();
  }
}

addLocationColumns();
