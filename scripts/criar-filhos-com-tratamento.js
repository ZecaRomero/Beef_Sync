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
    console.log('🔍 Buscando filhos faltantes...\n')
    
    // Buscar filhos faltantes
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
    
    console.log(`📊 Total de filhos faltantes: ${filhosResult.rows.length}\n`)
    
    let filhosCriados = 0
    let erros = 0
    
    for (const filho of filhosResult.rows) {
      try {
        // Determinar situação
        let situacao = 'Ativo'
        if (filho.tipo === 'VENDA') {
          situacao = 'Vendido'
        } else if (filho.tipo === 'MORTE/BAIXA') {
          situacao = 'Morto'
        }
        
        // Truncar campos
        const serieFilho = String(filho.serie || '').substring(0, 10)
        const rgFilho = String(filho.rg || '').substring(0, 10)
        const serieMaeFilho = filho.serie_mae ? String(filho.serie_mae).substring(0, 10) : null
        const rgMaeFilho = filho.rg_mae ? String(filho.rg_mae).substring(0, 10) : null
        const nomeFilho = `${serieFilho} ${rgFilho}`.substring(0, 100)
        
        // Criar o filho
        const insertFilho = await client.query(`
          INSERT INTO animais (
            serie, rg, nome, sexo, raca, situacao,
            serie_mae, rg_mae, data_nascimento,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, 'Nelore', $5,
            $6, $7, $8,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING id
        `, [
          serieFilho,
          rgFilho,
          nomeFilho,
          'Macho', // Sexo padrão válido
          situacao,
          serieMaeFilho,
          rgMaeFilho,
          filho.data_baixa ? new Date(new Date(filho.data_baixa).getTime() - 365 * 24 * 60 * 60 * 1000) : null
        ])
        
        filhosCriados++
        if (filhosCriados % 100 === 0) {
          console.log(`✅ ${filhosCriados} filhos criados...`)
        }
        
      } catch (error) {
        erros++
        console.error(`❌ Erro ao criar filho ${filho.serie} ${filho.rg}:`, error.message)
        console.error(`   Serie: "${filho.serie}" (${filho.serie?.length} chars)`)
        console.error(`   RG: "${filho.rg}" (${filho.rg?.length} chars)`)
        console.error(`   Serie Mãe: "${filho.serie_mae}" (${filho.serie_mae?.length} chars)`)
        console.error(`   RG Mãe: "${filho.rg_mae}" (${filho.rg_mae?.length} chars)`)
        
        // Parar após 5 erros para análise
        if (erros >= 5) {
          console.log('\n⚠️ Parando após 5 erros para análise')
          break
        }
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ Filhos criados: ${filhosCriados}`)
    console.log(`❌ Erros: ${erros}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

criar()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })
