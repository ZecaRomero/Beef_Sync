/**
 * Script para desativar o modo de manutenção
 * Execute: node desativar-manutencao.js
 */

const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85'
})

async function desativarManutencao() {
  try {
    console.log('🔧 Desativando modo de manutenção...')
    
    // Desativar modo de manutenção
    await pool.query(`
      UPDATE system_settings 
      SET value = 'false' 
      WHERE key = 'maintenance_mode'
    `)
    
    // Desativar bloqueio de acesso
    await pool.query(`
      UPDATE system_settings 
      SET value = 'false' 
      WHERE key = 'block_access'
    `)
    
    console.log('✅ Modo de manutenção desativado com sucesso!')
    console.log('✅ Bloqueio de acesso removido!')
    console.log('\n📱 Agora você pode acessar o sistema pelo celular normalmente.')
    
  } catch (error) {
    console.error('❌ Erro ao desativar manutenção:', error.message)
  } finally {
    await pool.end()
  }
}

desativarManutencao()
