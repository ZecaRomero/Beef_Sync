require('dotenv').config();
const { query } = require('../lib/database');

async function addParentColumns() {
  try {
    console.log('�Ÿ”„ Iniciando migração para adicionar colunas de genealogia...');

    const columns = [
      'serie_pai',
      'rg_pai',
      'serie_mae',
      'rg_mae'
    ];

    for (const col of columns) {
      console.log(`Verificando coluna ${col}...`);
      await query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = '${col}') THEN
            ALTER TABLE animais ADD COLUMN ${col} VARCHAR(20);
            RAISE NOTICE 'Coluna ${col} adicionada.';
          ELSE
            RAISE NOTICE 'Coluna ${col} já existe.';
          END IF;
        END $$;
      `);
    }

    console.log('�œ… Migração concluída com sucesso!');
  } catch (error) {
    console.error('�Œ Erro durante a migração:', error);
  } finally {
    process.exit(0);
  }
}

addParentColumns();
