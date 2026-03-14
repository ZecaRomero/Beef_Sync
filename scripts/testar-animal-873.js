/**
 * Script para testar se o animal 873 (CJCJ 16974) Ã© encontrado pelo databaseService
 * Execute: node scripts/testar-animal-873.js
 */
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const databaseService = require('../services/databaseService')

async function main() {
  console.log('ðÅ¸â€�� Testando busca do animal 873...')
  console.log('   DB config:', process.env.DATABASE_URL ? 'DATABASE_URL (connection string)' : `DB_HOST=${process.env.DB_HOST || 'localhost'}, DB_NAME=${process.env.DB_NAME || 'beef_sync'}`)
  console.log('')

  try {
    // 1. Testar conexÃ£o
    const conn = await databaseService.testConnection()
    if (!conn.success) {
      console.error('â�Å’ Falha na conexÃ£o:', conn.error)
      process.exit(1)
    }
    console.log('âÅ“â€¦ ConexÃ£o OK:', conn.database, '-', conn.user)

    // 2. Buscar por ID
    const animal = await databaseService.buscarAnimalPorId(873)
    if (animal) {
      console.log('âÅ“â€¦ Animal 873 encontrado:', animal.serie, animal.rg, '-', animal.nome)
    } else {
      console.log('â�Å’ Animal 873 NÃÆ’O encontrado por buscarAnimalPorId')
      
      // 3. Tentar busca direta via query
      const { query } = require('../lib/database')
      const r = await query('SELECT id, serie, rg, nome FROM animais WHERE id = 873')
      if (r.rows.length > 0) {
        console.log('   âÅ¡ ï¸� Mas query direta encontrou:', r.rows[0])
      } else {
        console.log('   âÅ¡ ï¸� Query direta tambÃ©m nÃ£o encontrou - banco diferente?')
      }
    }

    // 4. Buscar histÃ³rico (como a API faz)
    const historico = await databaseService.buscarHistoricoAnimal(873)
    if (historico) {
      console.log('âÅ“â€¦ buscarHistoricoAnimal(873) OK')
    } else {
      console.log('â�Å’ buscarHistoricoAnimal(873) retornou null')
    }
  } catch (err) {
    console.error('â�Å’ Erro:', err.message)
    console.error(err.stack)
    process.exit(1)
  }

  console.log('')
  console.log('ConcluÃ­do.')
  process.exit(0)
}

main()
