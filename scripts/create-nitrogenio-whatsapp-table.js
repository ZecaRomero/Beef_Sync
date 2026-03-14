require('dotenv').config()
const { Pool } = require('pg')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
}

async function createNitrogenioWhatsAppTable() {
  const pool = new Pool(dbConfig)
  
  try {
    console.log('🔧 Criando tabela nitrogenio_whatsapp_contatos...')
    
    // Criar tabela de contatos WhatsApp para nitrogênio
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nitrogenio_whatsapp_contatos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        whatsapp VARCHAR(20) NOT NULL UNIQUE,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar índice
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_nitrogenio_whatsapp_ativo 
      ON nitrogenio_whatsapp_contatos(ativo)
    `)

    console.log('✅ Tabela nitrogenio_whatsapp_contatos criada com sucesso!')
    
    // Adicionar coluna notificacao_enviada_2dias na tabela abastecimento_nitrogenio
    console.log('🔧 Adicionando coluna notificacao_enviada_2dias...')
    
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'abastecimento_nitrogenio' 
          AND column_name = 'notificacao_enviada_2dias'
        ) THEN
          ALTER TABLE abastecimento_nitrogenio 
          ADD COLUMN notificacao_enviada_2dias BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `)

    console.log('✅ Coluna notificacao_enviada_2dias adicionada com sucesso!')
    
    // Verificar estrutura
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'nitrogenio_whatsapp_contatos'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📊 Estrutura da tabela nitrogenio_whatsapp_contatos:')
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
    await pool.end()
    console.log('\n✅ Script executado com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao executar script:', error)
    await pool.end()
    process.exit(1)
  }
}

createNitrogenioWhatsAppTable()

