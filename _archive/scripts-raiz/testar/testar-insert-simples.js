/**
 * Teste simples de INSERT para identificar o problema
 */

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
  user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function testarInsert() {
  const client = await pool.connect()
  
  try {
    console.log('≈∏ß™ Testando INSERT simples...\n')
    
    // Dados de teste com o RG problem√°tico
    const dadosAnimal = {
      nome: 'Animal Teste',
      serie: 'Lc CJCJ',
      rg: '17039',
      tatuagem: null,
      sexo: 'Macho',
      raca: 'Nelore',
      data_nascimento: null,
      hora_nascimento: null,
      peso: null,
      cor: null,
      tipo_nascimento: null,
      dificuldade_parto: null,
      meses: null,
      situacao: 'Ativo',
      pai: null,
      mae: null,
      avo_materno: null,
      receptora: null,
      is_fiv: false,
      custo_total: 0,
      valor_venda: null,
      valor_real: null,
      veterinario: null,
      abczg: null,
      deca: null,
      observacoes: 'Teste de importa√ß√£o'
    }
    
    console.log('≈∏‚Äú‚Äπ Dados a serem inseridos:')
    console.log(JSON.stringify(dadosAnimal, null, 2))
    
    const query = `
      INSERT INTO animais (
        nome, serie, rg, tatuagem, sexo, raca, data_nascimento, hora_nascimento,
        peso, cor, tipo_nascimento, dificuldade_parto, meses, situacao,
        pai, mae, avo_materno, receptora, is_fiv, custo_total, valor_venda, valor_real,
        veterinario, abczg, deca, observacoes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `
    
    const values = [
      dadosAnimal.nome,
      dadosAnimal.serie,
      dadosAnimal.rg,
      dadosAnimal.tatuagem,
      dadosAnimal.sexo,
      dadosAnimal.raca,
      dadosAnimal.data_nascimento,
      dadosAnimal.hora_nascimento,
      dadosAnimal.peso,
      dadosAnimal.cor,
      dadosAnimal.tipo_nascimento,
      dadosAnimal.dificuldade_parto,
      dadosAnimal.meses,
      dadosAnimal.situacao,
      dadosAnimal.pai,
      dadosAnimal.mae,
      dadosAnimal.avo_materno,
      dadosAnimal.receptora,
      dadosAnimal.is_fiv,
      dadosAnimal.custo_total,
      dadosAnimal.valor_venda,
      dadosAnimal.valor_real,
      dadosAnimal.veterinario,
      dadosAnimal.abczg,
      dadosAnimal.deca,
      dadosAnimal.observacoes
    ]
    
    console.log('\n≈∏‚Äúù Executando INSERT...')
    console.log('Query:', query.replace(/\s+/g, ' ').trim())
    console.log('Valores:', values.slice(0, 5), '...')
    
    await client.query('BEGIN')
    
    const result = await client.query(query, values)
    
    console.log('\n‚≈ì‚Ä¶ INSERT executado com sucesso!')
    console.log('Animal criado:', result.rows[0])
    
    await client.query('ROLLBACK')
    console.log('\n≈∏ßπ Teste revertido (ROLLBACK)')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('\n‚ù≈í Erro ao executar INSERT:')
    console.error('C√≥digo:', error.code)
    console.error('Mensagem:', error.message)
    console.error('Posi√ß√£o:', error.position)
    console.error('Detalhe:', error.detail)
    console.error('Dica:', error.hint)
    console.error('Onde:', error.where)
    console.error('\nStack completo:')
    console.error(error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

testarInsert()
