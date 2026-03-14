const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'estoque_semen',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
})

async function addCamposIA() {
  const client = await pool.connect()
  try {
    console.log('Adicionando campos para importação de IA...')
    
    // Verificar e adicionar numero_ia
    const checkNumeroIA = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'numero_ia'
    `)
    if (checkNumeroIA.rows.length === 0) {
      await client.query('ALTER TABLE inseminacoes ADD COLUMN numero_ia INTEGER')
      console.log('�œ… Coluna numero_ia adicionada')
    } else {
      console.log('�œ… Coluna numero_ia já existe')
    }

    // Verificar e adicionar rg_touro (RG do touro usado na IA)
    const checkRgTouro = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'rg_touro'
    `)
    if (checkRgTouro.rows.length === 0) {
      await client.query('ALTER TABLE inseminacoes ADD COLUMN rg_touro VARCHAR(50)')
      console.log('�œ… Coluna rg_touro adicionada')
    } else {
      console.log('�œ… Coluna rg_touro já existe')
    }

    // Verificar e adicionar numero_dg (número do diagnóstico de gestação - 1ª DG da 1ª IA, etc.)
    const checkNumeroDG = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'numero_dg'
    `)
    if (checkNumeroDG.rows.length === 0) {
      await client.query('ALTER TABLE inseminacoes ADD COLUMN numero_dg INTEGER')
      console.log('�œ… Coluna numero_dg adicionada')
    } else {
      console.log('�œ… Coluna numero_dg já existe')
    }

    // Verificar e adicionar data_dg (data do diagnóstico de gestação)
    const checkDataDG = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'data_dg'
    `)
    if (checkDataDG.rows.length === 0) {
      await client.query('ALTER TABLE inseminacoes ADD COLUMN data_dg DATE')
      console.log('�œ… Coluna data_dg adicionada')
    } else {
      console.log('�œ… Coluna data_dg já existe')
    }

    // Verificar e adicionar resultado_dg (resultado do diagnóstico - prenha, não prenha)
    const checkResultadoDG = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'resultado_dg'
    `)
    if (checkResultadoDG.rows.length === 0) {
      await client.query('ALTER TABLE inseminacoes ADD COLUMN resultado_dg VARCHAR(20)')
      console.log('�œ… Coluna resultado_dg adicionada')
    } else {
      console.log('�œ… Coluna resultado_dg já existe')
    }

    console.log('�œ… Todos os campos foram adicionados/verificados com sucesso!')
  } catch (error) {
    console.error('�Œ Erro ao adicionar campos:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

addCamposIA()
  .then(() => {
    console.log('Script executado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erro ao executar script:', error)
    process.exit(1)
  })
