#!/usr/bin/env node

/**
 * Script para remover tabelas de equipamentos e insumos do PostgreSQL
 * Execute: node scripts/remove-equipamentos-insumos.js
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

async function removeEquipamentosInsumosTables() {
  const pool = new Pool(dbConfig)
  const client = await pool.connect()
  
  try {
    console.log('🗑️  Removendo tabelas de equipamentos e insumos...')
    
    // Remover tabelas relacionadas a equipamentos e insumos
    const tables = [
      'equipamentos',
      'insumos',
      'movimentacoes_equipamentos',
      'movimentacoes_insumos',
      'estoque_equipamentos',
      'estoque_insumos'
    ]
    
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
        console.log(`✅ Tabela ${table} removida`)
      } catch (error) {
        console.log(`ℹ️  Tabela ${table} não existe ou já foi removida`)
      }
    }
    
    // Remover índices relacionados
    const indices = [
      'idx_equipamentos_status',
      'idx_equipamentos_categoria',
      'idx_insumos_status',
      'idx_insumos_categoria',
      'idx_movimentacoes_equipamentos_equipamento_id',
      'idx_movimentacoes_insumos_insumo_id'
    ]
    
    for (const index of indices) {
      try {
        await client.query(`DROP INDEX IF EXISTS ${index}`)
        console.log(`✅ Índice ${index} removido`)
      } catch (error) {
        // Ignorar erros de índice não existente
      }
    }
    
    // Remover tipos/enums relacionados
    const types = [
      'tipo_equipamento',
      'tipo_insumo',
      'status_equipamento',
      'status_insumo'
    ]
    
    for (const type of types) {
      try {
        await client.query(`DROP TYPE IF EXISTS ${type} CASCADE`)
        console.log(`✅ Tipo ${type} removido`)
      } catch (error) {
        // Ignorar erros de tipo não existente
      }
    }
    
    console.log('\n✅ Processo concluído com sucesso!')
    console.log('📊 Tabelas de equipamentos e insumos foram removidas do banco de dados.')
    
  } catch (error) {
    console.error('❌ Erro ao remover tabelas:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar o script
if (require.main === module) {
  removeEquipamentosInsumosTables()
    .then(() => {
      console.log('\n🎉 Script finalizado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { removeEquipamentosInsumosTables }

