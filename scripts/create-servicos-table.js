#!/usr/bin/env node

/**
 * Script para criar tabela de serviÃ§os/custos cadastrados
 */

require('dotenv').config()
const { Pool } = require('pg')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
}

async function createServicosTable() {
  const pool = new Pool(dbConfig)
  
  try {
    console.log('ðÅ¸â€�§ Criando tabela de serviÃ§os cadastrados...')
    
    await pool.query(`
      -- Tabela de tipos de serviÃ§os/custos cadastrados
      CREATE TABLE IF NOT EXISTS tipos_servicos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        valor_padrao DECIMAL(12,2) NOT NULL,
        aplicavel_macho BOOLEAN DEFAULT true,
        aplicavel_femea BOOLEAN DEFAULT true,
        descricao TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ã�ndices para performance
      CREATE INDEX IF NOT EXISTS idx_tipos_servicos_categoria ON tipos_servicos(categoria);
      CREATE INDEX IF NOT EXISTS idx_tipos_servicos_ativo ON tipos_servicos(ativo);

      -- Inserir alguns serviÃ§os padrÃ£o
      INSERT INTO tipos_servicos (nome, categoria, valor_padrao, aplicavel_macho, aplicavel_femea, descricao)
      VALUES 
        ('Exame AndrolÃ³gico', 'VeterinÃ¡rios', 165.00, true, false, 'Exame reprodutivo para machos'),
        ('DiagnÃ³stico de Prenhez', 'VeterinÃ¡rios', 80.00, false, true, 'Ultrassom ou palpaÃ§Ã£o para diagnÃ³stico de gestaÃ§Ã£o'),
        ('InseminaÃ§Ã£o Artificial', 'ReproduÃ§Ã£o', 60.00, false, true, 'Procedimento de IA'),
        ('TransferÃªncia de EmbriÃ£o', 'ReproduÃ§Ã£o', 250.00, false, true, 'Procedimento de TE'),
        ('Consulta VeterinÃ¡ria', 'VeterinÃ¡rios', 120.00, true, true, 'Consulta veterinÃ¡ria geral'),
        ('Vacina ObrigatÃ³ria ABCZ', 'Medicamentos', 36.90, true, true, 'Vacinas obrigatÃ³rias para registro'),
        ('VermÃ­fugo', 'Medicamentos', 18.00, true, true, 'Tratamento parasitÃ¡rio'),
        ('CastraÃ§Ã£o', 'Manejo', 45.00, true, false, 'Procedimento de castraÃ§Ã£o'),
        ('Descorna', 'Manejo', 30.00, true, true, 'Procedimento de descorna'),
        ('Casqueamento', 'Manejo', 40.00, true, true, 'Casqueamento para venda ou exposiÃ§Ã£o'),
        ('AnÃ¡lise DNA Paternidade', 'DNA', 40.00, true, true, 'Teste de paternidade'),
        ('AnÃ¡lise DNA GenÃ´mica', 'DNA', 80.00, true, true, 'Teste genÃ´mico completo'),
        ('AntibiÃ³tico Tratamento', 'Medicamentos', 50.00, true, true, 'Tratamento com antibiÃ³ticos'),
        ('Ultrassonografia', 'VeterinÃ¡rios', 100.00, false, true, 'Exame de ultrassom reprodutivo'),
        ('Cirurgia Geral', 'VeterinÃ¡rios', 300.00, true, true, 'Procedimento cirÃºrgico geral'),
        ('Exame Laboratorial', 'VeterinÃ¡rios', 80.00, true, true, 'Exames laboratoriais diversos'),
        ('Brinco IdentificaÃ§Ã£o', 'Manejo', 15.00, true, true, 'Brinco de identificaÃ§Ã£o eletrÃ´nico')
      ON CONFLICT DO NOTHING;
    `)
    
    console.log('âÅ“â€¦ Tabela tipos_servicos criada com sucesso!')
    console.log('ðÅ¸â€œÅ  20 serviÃ§os padrÃ£o inseridos')
    console.log('')
    console.log('ðÅ¸Å½¯ Categorias disponÃ­veis:')
    console.log('   - VeterinÃ¡rios')
    console.log('   - ReproduÃ§Ã£o')
    console.log('   - Medicamentos')
    console.log('   - Manejo')
    console.log('   - DNA')
    
    await pool.end()
    process.exit(0)
    
  } catch (error) {
    console.error('â�Å’ Erro ao criar tabela:', error.message)
    await pool.end()
    process.exit(1)
  }
}

createServicosTable()

