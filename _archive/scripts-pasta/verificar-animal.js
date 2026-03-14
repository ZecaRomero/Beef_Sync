const { query, pool } = require('../lib/database')

async function verificarAnimal(idOuRg) {
  const client = await pool.connect()
  
  try {
    console.log(`�Ÿ”� Verificando animal: ${idOuRg}`)
    
    // Tentar como ID numérico primeiro
    const id = parseInt(idOuRg, 10)
    
    let result
    if (!isNaN(id)) {
      console.log(`�Ÿ“‹ Buscando por ID: ${id}`)
      result = await query(
        `SELECT id, serie, rg, nome, data_nascimento, situacao, created_at, updated_at 
         FROM animais 
         WHERE id = $1`,
        [id]
      )
    } else {
      console.log(`�Ÿ“‹ Buscando por RG: ${idOuRg}`)
      result = await query(
        `SELECT id, serie, rg, nome, data_nascimento, situacao, created_at, updated_at 
         FROM animais 
         WHERE rg = $1 OR serie = $1`,
        [idOuRg]
      )
    }
    
    if (result.rows.length === 0) {
      console.log(`�Œ Animal não encontrado`)
      
      // Buscar animais próximos
      if (!isNaN(id)) {
        const proximos = await query(
          `SELECT id, serie, rg, nome 
           FROM animais 
           WHERE id BETWEEN $1 AND $2 
           ORDER BY ABS(id - $3)
           LIMIT 10`,
          [id - 50, id + 50, id]
        )
        
        if (proximos.rows.length > 0) {
          console.log(`\n�Ÿ’� Animais com IDs próximos:`)
          proximos.rows.forEach(a => {
            console.log(`   ID: ${a.id} | ${a.serie}-${a.rg} | ${a.nome || 'sem nome'}`)
          })
        }
      }
      
      // Buscar por RG similar
      const rgSimilar = await query(
        `SELECT id, serie, rg, nome 
         FROM animais 
         WHERE rg LIKE $1 OR serie LIKE $1
         LIMIT 10`,
        [`%${idOuRg}%`]
      )
      
      if (rgSimilar.rows.length > 0) {
        console.log(`\n�Ÿ’� Animais com RG/Série similar:`)
        rgSimilar.rows.forEach(a => {
          console.log(`   ID: ${a.id} | ${a.serie}-${a.rg} | ${a.nome || 'sem nome'}`)
        })
      }
      
      // Estatísticas gerais
      const stats = await query('SELECT COUNT(*) as total, MIN(id) as min_id, MAX(id) as max_id FROM animais')
      console.log(`\n�Ÿ“Š Estatísticas do banco:`)
      console.log(`   Total de animais: ${stats.rows[0].total}`)
      console.log(`   ID mínimo: ${stats.rows[0].min_id}`)
      console.log(`   ID máximo: ${stats.rows[0].max_id}`)
      
      return null
    }
    
    const animal = result.rows[0]
    console.log(`\n�œ… Animal encontrado:`)
    console.log(`   ID: ${animal.id}`)
    console.log(`   Série: ${animal.serie}`)
    console.log(`   RG: ${animal.rg}`)
    console.log(`   Nome: ${animal.nome || 'Não informado'}`)
    console.log(`   Data de Nascimento: ${animal.data_nascimento || 'Não informado'}`)
    console.log(`   Situação: ${animal.situacao || 'Não informado'}`)
    console.log(`   Criado em: ${animal.created_at}`)
    console.log(`   Atualizado em: ${animal.updated_at}`)
    
    // Verificar informações de DNA
    const dna = await query(
      'SELECT laboratorio_dna, data_envio_dna, custo_dna FROM animais WHERE id = $1',
      [animal.id]
    )
    
    if (dna.rows[0]?.laboratorio_dna) {
      console.log(`\n�Ÿ�� Informações de DNA:`)
      console.log(`   Laboratório: ${dna.rows[0].laboratorio_dna}`)
      console.log(`   Data de Envio: ${dna.rows[0].data_envio_dna}`)
      console.log(`   Custo: R$ ${parseFloat(dna.rows[0].custo_dna || 0).toFixed(2)}`)
    }
    
    return animal
  } catch (error) {
    console.error('�Œ Erro ao verificar animal:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const idOuRg = process.argv[2] || '17836'
  
  verificarAnimal(idOuRg)
    .then(() => {
      console.log('\n�œ… Verificação concluída')
      process.exit(0)
    })
    .catch((error) => {
      console.error('�Œ Erro:', error)
      process.exit(1)
    })
}

module.exports = { verificarAnimal }
