const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function criar() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('🔍 Identificando mães e filhos faltantes...\n')
    
    // 1. Buscar todas as mães únicas que têm baixas mas não estão cadastradas
    const maesResult = await client.query(`
      SELECT DISTINCT b.serie_mae, b.rg_mae
      FROM baixas b
      WHERE b.serie_mae IS NOT NULL 
        AND b.rg_mae IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM animais a 
          WHERE UPPER(TRIM(a.serie)) = UPPER(TRIM(b.serie_mae))
            AND TRIM(a.rg::text) = TRIM(b.rg_mae::text)
        )
      ORDER BY b.serie_mae, b.rg_mae
    `)
    
    console.log(`📊 Mães faltantes: ${maesResult.rows.length}\n`)
    
    let maesCriadas = 0
    
    for (const mae of maesResult.rows) {
      // Criar a mãe
      const insertMae = await client.query(`
        INSERT INTO animais (
          serie, rg, nome, sexo, raca, situacao, 
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'Fêmea', 'Nelore', 'Ativo',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id
      `, [mae.serie_mae, mae.rg_mae, `Doadora ${mae.serie_mae} ${mae.rg_mae}`])
      
      maesCriadas++
      console.log(`✅ Mãe criada: ${mae.serie_mae} ${mae.rg_mae} (ID: ${insertMae.rows[0].id})`)
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ Total de mães criadas: ${maesCriadas}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    // 2. Buscar todos os filhos únicos que têm baixas mas não estão cadastrados
    const filhosResult = await client.query(`
      SELECT DISTINCT b.serie, b.rg, b.serie_mae, b.rg_mae, b.tipo, b.data_baixa
      FROM baixas b
      WHERE b.serie IS NOT NULL 
        AND b.rg IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM animais a 
          WHERE UPPER(TRIM(a.serie)) = UPPER(TRIM(b.serie))
            AND TRIM(a.rg::text) = TRIM(b.rg::text)
        )
      ORDER BY b.serie, b.rg
    `)
    
    console.log(`📊 Filhos faltantes: ${filhosResult.rows.length}\n`)
    
    let filhosCriados = 0
    
    for (const filho of filhosResult.rows) {
      // Determinar situação baseado no tipo de baixa
      let situacao = 'Ativo'
      if (filho.tipo === 'VENDA') {
        situacao = 'Vendido'
      } else if (filho.tipo === 'MORTE/BAIXA') {
        situacao = 'Morto'
      }
      
      // Criar o filho - truncar todos os campos para evitar erros
      const serieFilho = String(filho.serie || '').substring(0, 10)
      const rgFilho = String(filho.rg || '').substring(0, 10)
      const serieMaeFilho = filho.serie_mae ? String(filho.serie_mae).substring(0, 10) : null
      const rgMaeFilho = filho.rg_mae ? String(filho.rg_mae).substring(0, 10) : null
      const nomeFilho = `${serieFilho} ${rgFilho}`.substring(0, 100)
      
      const insertFilho = await client.query(`
        INSERT INTO animais (
          serie, rg, nome, sexo, raca, situacao,
          serie_mae, rg_mae, data_nascimento,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'Não informado', 'Nelore', $4,
          $5, $6, $7,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id
      `, [
        serieFilho,
        rgFilho,
        nomeFilho,
        situacao,
        serieMaeFilho,
        rgMaeFilho,
        filho.data_baixa ? new Date(new Date(filho.data_baixa).getTime() - 365 * 24 * 60 * 60 * 1000) : null // Estimar nascimento 1 ano antes da baixa
      ])
      
      filhosCriados++
      console.log(`✅ Filho criado: ${serieFilho} ${rgFilho} (ID: ${insertFilho.rows[0].id}) | Mãe: ${serieMaeFilho || 'N/A'} ${rgMaeFilho || 'N/A'} | ${situacao}`)
    }
    
    await client.query('COMMIT')
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ CRIAÇÃO CONCLUÍDA!`)
    console.log(`📊 Mães criadas: ${maesCriadas}`)
    console.log(`📊 Filhos criados: ${filhosCriados}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    // Atualizar animal_id nas baixas
    console.log(`\n🔄 Atualizando animal_id nas baixas...`)
    const updateResult = await client.query(`
      UPDATE baixas b
      SET animal_id = a.id
      FROM animais a
      WHERE UPPER(TRIM(a.serie)) = UPPER(TRIM(b.serie))
        AND TRIM(a.rg::text) = TRIM(b.rg::text)
        AND b.animal_id IS NULL
    `)
    console.log(`✅ ${updateResult.rowCount} baixas atualizadas com animal_id`)
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao criar mães e filhos:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

criar()
  .then(() => {
    console.log('\n✨ Script finalizado')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Erro fatal:', error)
    process.exit(1)
  })
