const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function verificarAnimaisSemAvo() {
  const client = await pool.connect()
  
  try {
    // Contar animais sem avô materno mas com mãe cadastrada
    const result = await client.query(`
      SELECT COUNT(*) as total
      FROM animais 
      WHERE (avo_materno IS NULL OR avo_materno = '')
      AND mae IS NOT NULL
      AND mae != ''
    `)
    
    console.log(`�Ÿ“Š Animais sem avô materno mas com mãe: ${result.rows[0].total}`)
    
    // Buscar alguns exemplos
    const exemplos = await client.query(`
      SELECT id, serie, rg, mae, avo_materno
      FROM animais 
      WHERE (avo_materno IS NULL OR avo_materno = '')
      AND mae IS NOT NULL
      AND mae != ''
      LIMIT 10
    `)
    
    console.log('\n�Ÿ“‹ Exemplos de animais sem avô materno:')
    exemplos.rows.forEach((animal, index) => {
      console.log(`${index + 1}. ${animal.serie}-${animal.rg}: Mãe = "${animal.mae}"`)
    })
    
    // Para o animal específico CJCJ-16173, verificar se podemos encontrar o avô materno
    // através de outros animais que têm a mesma mãe
    const animalEspecifico = await client.query(`
      SELECT id, serie, rg, mae, avo_materno
      FROM animais 
      WHERE serie = 'CJCJ' AND rg = '16173'
    `)
    
    if (animalEspecifico.rows.length > 0) {
      const animal = animalEspecifico.rows[0]
      console.log(`\n�Ÿ”� Verificando animal específico: ${animal.serie}-${animal.rg}`)
      console.log(`   Mãe: ${animal.mae}`)
      
      // Buscar outros animais com a mesma mãe que T�ŠM avô materno
      if (animal.mae) {
        const match = animal.mae.match(/([A-Za-z]+)[\s\/\-]*(\d+)/)
        if (match) {
          const maeSerie = match[1]
          const maeRg = match[2]
          
          const irmaos = await client.query(`
            SELECT id, serie, rg, avo_materno
            FROM animais 
            WHERE mae LIKE $1
            AND (avo_materno IS NOT NULL AND avo_materno != '')
            LIMIT 5
          `, [`%${maeSerie}%${maeRg}%`])
          
          if (irmaos.rows.length > 0) {
            console.log(`\n�œ… Encontrados ${irmaos.rows.length} irmãos com avô materno:`)
            irmaos.rows.forEach((irmao, index) => {
              console.log(`   ${index + 1}. ${irmao.serie}-${irmao.rg}: "${irmao.avo_materno}"`)
            })
            
            // Usar o avô materno do primeiro irmão
            const avoMaterno = irmaos.rows[0].avo_materno
            console.log(`\n�Ÿ’� Atualizando ${animal.serie}-${animal.rg} com avô materno: "${avoMaterno}"`)
            
            await client.query(`
              UPDATE animais 
              SET avo_materno = $1, updated_at = CURRENT_TIMESTAMP 
              WHERE id = $2
            `, [avoMaterno, animal.id])
            
            console.log('�œ… Animal atualizado!')
          } else {
            console.log('\n�š�️ Nenhum irmão com avô materno encontrado')
          }
        }
      }
    }
    
  } catch (error) {
    console.error('�Œ Erro:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

verificarAnimaisSemAvo()
  .then(() => {
    console.log('\n�œ… Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n�Œ Erro fatal:', error)
    process.exit(1)
  })

