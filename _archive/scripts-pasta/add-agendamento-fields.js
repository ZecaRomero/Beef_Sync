const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function addAgendamentoFields() {
  const client = await pool.connect()
  
  try {
    console.log('�Ÿ”� Adicionando campos de agendamento na tabela destinatarios_relatorios...')
    
    // Verificar se as colunas já existem
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'destinatarios_relatorios' 
      AND column_name IN ('intervalo_dias', 'ultimo_envio', 'proximo_envio', 'ultimos_relatorios', 'agendamento_ativo')
    `)
    
    const existingColumns = checkColumns.rows.map(r => r.column_name)
    
    // Adicionar coluna intervalo_dias
    if (!existingColumns.includes('intervalo_dias')) {
      await client.query(`
        ALTER TABLE destinatarios_relatorios 
        ADD COLUMN intervalo_dias INTEGER DEFAULT NULL
      `)
      console.log('�œ… Coluna intervalo_dias adicionada')
    } else {
      console.log('�„�️  Coluna intervalo_dias já existe')
    }
    
    // Adicionar coluna ultimo_envio
    if (!existingColumns.includes('ultimo_envio')) {
      await client.query(`
        ALTER TABLE destinatarios_relatorios 
        ADD COLUMN ultimo_envio TIMESTAMP DEFAULT NULL
      `)
      console.log('�œ… Coluna ultimo_envio adicionada')
    } else {
      console.log('�„�️  Coluna ultimo_envio já existe')
    }
    
    // Adicionar coluna proximo_envio
    if (!existingColumns.includes('proximo_envio')) {
      await client.query(`
        ALTER TABLE destinatarios_relatorios 
        ADD COLUMN proximo_envio TIMESTAMP DEFAULT NULL
      `)
      console.log('�œ… Coluna proximo_envio adicionada')
    } else {
      console.log('�„�️  Coluna proximo_envio já existe')
    }
    
    // Adicionar coluna ultimos_relatorios (JSONB para armazenar array de relatórios)
    if (!existingColumns.includes('ultimos_relatorios')) {
      await client.query(`
        ALTER TABLE destinatarios_relatorios 
        ADD COLUMN ultimos_relatorios JSONB DEFAULT '[]'::jsonb
      `)
      console.log('�œ… Coluna ultimos_relatorios adicionada')
    } else {
      console.log('�„�️  Coluna ultimos_relatorios já existe')
    }
    
    // Adicionar coluna agendamento_ativo
    if (!existingColumns.includes('agendamento_ativo')) {
      await client.query(`
        ALTER TABLE destinatarios_relatorios 
        ADD COLUMN agendamento_ativo BOOLEAN DEFAULT false
      `)
      console.log('�œ… Coluna agendamento_ativo adicionada')
    } else {
      console.log('�„�️  Coluna agendamento_ativo já existe')
    }
    
    // Criar índice para melhorar performance nas consultas de agendamento
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_destinatarios_proximo_envio 
      ON destinatarios_relatorios(proximo_envio) 
      WHERE agendamento_ativo = true
    `)
    console.log('�œ… Índice criado para otimizar consultas de agendamento')
    
    console.log('�œ… Migração concluída com sucesso!')
    
  } catch (error) {
    console.error('�Œ Erro ao adicionar campos:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

addAgendamentoFields()
  .then(() => {
    console.log('�ŸŽ‰ Migração finalizada!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('�Ÿ’� Erro fatal:', error)
    process.exit(1)
  })
