const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false
})

async function testConnection() {
  try {
    console.log('Tentando conectar ao PostgreSQL...')
    console.log('Config:', {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'beef_sync',
      user: process.env.DB_USER || 'postgres'
    })
    
    const client = await pool.connect()
    console.log('✓ Conexão estabelecida com sucesso!')
    
    const result = await client.query('SELECT NOW() as timestamp, version(), current_database(), current_user')
    console.log('✓ Query executada com sucesso!')
    console.log('Timestamp:', result.rows[0].timestamp)
    console.log('Versão:', result.rows[0].version)
    console.log('Database:', result.rows[0].current_database)
    console.log('User:', result.rows[0].current_user)
    
    client.release()
    await pool.end()
    
    console.log('\n✓ Teste concluído com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('✗ Erro ao conectar:', error.message)
    console.error('Código:', error.code)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testConnection()
