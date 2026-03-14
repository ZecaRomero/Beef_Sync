require('dotenv').config()
const { query, initDatabase } = require('../lib/database')

async function createFornecedoresTable() {
  try {
    console.log('🔗 Conectando ao banco de dados...')
    initDatabase()
    
    console.log('📊 Criando tabela fornecedores_destinatarios...')
    
    await query(`
      CREATE TABLE IF NOT EXISTS fornecedores_destinatarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('fornecedor', 'destinatario')),
        endereco VARCHAR(300),
        municipio VARCHAR(100),
        estado VARCHAR(2),
        cnpj_cpf VARCHAR(20),
        telefone VARCHAR(20),
        email VARCHAR(100),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nome, tipo, cnpj_cpf)
      )
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores_destinatarios(nome)
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo ON fornecedores_destinatarios(tipo)
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores_destinatarios(cnpj_cpf)
    `)
    
    console.log('✅ Tabela fornecedores_destinatarios criada com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message)
    process.exit(1)
  }
}

createFornecedoresTable()

