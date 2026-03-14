const { pool } = require('./lib/database')

async function criarTabelaHistoricoImportacoes() {
  try {
    console.log('🔄 Criando tabela importacoes_historico...')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS importacoes_historico (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL,
        descricao TEXT,
        registros INTEGER DEFAULT 0,
        usuario VARCHAR(255),
        status VARCHAR(50) DEFAULT 'sucesso',
        data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        detalhes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Tabela importacoes_historico criada com sucesso!')

    // Criar índices para melhor performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_historico_data 
      ON importacoes_historico(data_importacao DESC)
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_historico_tipo 
      ON importacoes_historico(tipo)
    `)

    console.log('✅ Índices criados com sucesso!')

    // Inserir alguns dados de exemplo
    await pool.query(`
      INSERT INTO importacoes_historico (tipo, descricao, registros, usuario, status)
      VALUES 
        ('Animais', 'Importação de planilha Excel - Lote 2024', 150, 'Admin', 'sucesso'),
        ('IA', 'Inseminação Artificial - Janeiro/2024', 45, 'Admin', 'sucesso'),
        ('Genética', 'Dados iABCZ e DECA', 200, 'Sistema', 'sucesso'),
        ('Piquetes', 'Atualização de localização', 89, 'Admin', 'sucesso'),
        ('Pesagens', 'Pesagem mensal - Fevereiro', 150, 'Admin', 'sucesso')
    `)

    console.log('✅ Dados de exemplo inseridos!')
    console.log('✨ Migração concluída com sucesso!')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    process.exit(1)
  }
}

criarTabelaHistoricoImportacoes()
