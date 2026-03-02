/**
 * Script para criar tabela de histórico do Boletim Defesa
 * Registra todas as alterações de quantidades
 */

const { query } = require('../lib/database')

async function criarTabelaHistorico() {
  try {
    console.log('📋 Criando tabela boletim_defesa_historico...\n')

    await query(`
      CREATE TABLE IF NOT EXISTS boletim_defesa_historico (
        id SERIAL PRIMARY KEY,
        fazenda_id INTEGER NOT NULL REFERENCES boletim_defesa_fazendas(id) ON DELETE CASCADE,
        fazenda_nome VARCHAR(255) NOT NULL,
        faixa VARCHAR(20) NOT NULL,
        faixa_label VARCHAR(50) NOT NULL,
        sexo CHAR(1) NOT NULL,
        sexo_label VARCHAR(20) NOT NULL,
        valor_anterior INTEGER NOT NULL DEFAULT 0,
        valor_novo INTEGER NOT NULL DEFAULT 0,
        usuario VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_boletim_defesa_historico_fazenda 
      ON boletim_defesa_historico(fazenda_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_boletim_defesa_historico_created 
      ON boletim_defesa_historico(created_at DESC)
    `)

    console.log('✅ Tabela boletim_defesa_historico criada com sucesso!')
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}

criarTabelaHistorico()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
