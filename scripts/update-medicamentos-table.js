require('dotenv').config()
const { Pool } = require('pg')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
}

async function updateMedicamentosTable() {
  const pool = new Pool(dbConfig)
  
  try {
    console.log('🔧 Atualizando estrutura da tabela medicamentos...\n')
    
    // Adicionar colunas que faltam
    await pool.query(`
      DO $$ 
      BEGIN
        -- Princípio Ativo
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'principio_ativo') THEN
          ALTER TABLE medicamentos ADD COLUMN principio_ativo VARCHAR(200);
          RAISE NOTICE 'Coluna principio_ativo adicionada';
        END IF;
        
        -- Categoria
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'categoria') THEN
          ALTER TABLE medicamentos ADD COLUMN categoria VARCHAR(100);
          RAISE NOTICE 'Coluna categoria adicionada';
        END IF;
        
        -- Fabricante
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'fabricante') THEN
          ALTER TABLE medicamentos ADD COLUMN fabricante VARCHAR(200);
          RAISE NOTICE 'Coluna fabricante adicionada';
        END IF;
        
        -- Lote
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'lote') THEN
          ALTER TABLE medicamentos ADD COLUMN lote VARCHAR(100);
          RAISE NOTICE 'Coluna lote adicionada';
        END IF;
        
        -- Data de Vencimento
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'data_vencimento') THEN
          ALTER TABLE medicamentos ADD COLUMN data_vencimento DATE;
          RAISE NOTICE 'Coluna data_vencimento adicionada';
        END IF;
        
        -- Quantidade Estoque
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'quantidade_estoque') THEN
          ALTER TABLE medicamentos ADD COLUMN quantidade_estoque DECIMAL(12,2) DEFAULT 0;
          RAISE NOTICE 'Coluna quantidade_estoque adicionada';
        END IF;
        
        -- Quantidade Mínima
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'quantidade_minima') THEN
          ALTER TABLE medicamentos ADD COLUMN quantidade_minima DECIMAL(12,2) DEFAULT 0;
          RAISE NOTICE 'Coluna quantidade_minima adicionada';
        END IF;
        
        -- Prescrição Veterinária
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'prescricao_veterinaria') THEN
          ALTER TABLE medicamentos ADD COLUMN prescricao_veterinaria BOOLEAN DEFAULT false;
          RAISE NOTICE 'Coluna prescricao_veterinaria adicionada';
        END IF;
        
        -- Carência Leite
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'carencia_leite') THEN
          ALTER TABLE medicamentos ADD COLUMN carencia_leite INTEGER;
          RAISE NOTICE 'Coluna carencia_leite adicionada';
        END IF;
        
        -- Carência Carne
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'carencia_carne') THEN
          ALTER TABLE medicamentos ADD COLUMN carencia_carne INTEGER;
          RAISE NOTICE 'Coluna carencia_carne adicionada';
        END IF;
        
        -- Indicações
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'indicacoes') THEN
          ALTER TABLE medicamentos ADD COLUMN indicacoes TEXT;
          RAISE NOTICE 'Coluna indicacoes adicionada';
        END IF;
        
        -- Dosagem
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'dosagem') THEN
          ALTER TABLE medicamentos ADD COLUMN dosagem TEXT;
          RAISE NOTICE 'Coluna dosagem adicionada';
        END IF;
        
        -- Via de Aplicação
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'via_aplicacao') THEN
          ALTER TABLE medicamentos ADD COLUMN via_aplicacao VARCHAR(100);
          RAISE NOTICE 'Coluna via_aplicacao adicionada';
        END IF;
        
        -- Observações (se ainda não existir, já que pode ter o campo descricao)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'observacoes') THEN
          ALTER TABLE medicamentos ADD COLUMN observacoes TEXT;
          RAISE NOTICE 'Coluna observacoes adicionada';
        END IF;
      END $$;
    `)
    
    console.log('✅ Estrutura da tabela atualizada com sucesso!')
    
    // Mostrar estrutura final
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'medicamentos' 
      ORDER BY ordinal_position
    `)
    
    console.log('\n📊 Nova estrutura da tabela:')
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })
    
    await pool.end()
  } catch (error) {
    console.error('❌ Erro:', error.message)
    await pool.end()
    process.exit(1)
  }
}

updateMedicamentosTable()

