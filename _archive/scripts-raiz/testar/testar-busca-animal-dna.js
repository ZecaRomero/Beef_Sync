const { query } = require('./lib/database')

async function testarBuscaAnimal() {
  try {
    console.log('🔍 Testando busca de dados do animal para PDF...\n')

    // Buscar um animal de teste
    const animalResult = await query(`
      SELECT 
        id,
        serie,
        rg,
        nome,
        raca,
        sexo,
        data_nascimento,
        serie_pai,
        rg_pai,
        nome_pai,
        serie_mae,
        rg_mae,
        nome_mae
      FROM animais 
      WHERE id IN (1611, 1612)
      LIMIT 1
    `)

    if (animalResult.rows.length === 0) {
      console.log('❌ Nenhum animal encontrado')
      process.exit(1)
    }

    const animal = animalResult.rows[0]
    
    console.log('✅ Dados do Animal:\n')
    console.log(`ID: ${animal.id}`)
    console.log(`Série: ${animal.serie}`)
    console.log(`RG: ${animal.rg}`)
    console.log(`Nome: ${animal.nome}`)
    console.log(`Raça: ${animal.raca}`)
    console.log(`Sexo: ${animal.sexo}`)
    console.log(`Data Nascimento: ${animal.data_nascimento}`)
    
    // Calcular meses
    if (animal.data_nascimento) {
      const hoje = new Date()
      const nascimento = new Date(animal.data_nascimento)
      const diffTime = Math.abs(hoje - nascimento)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const meses = Math.floor(diffDays / 30)
      console.log(`Meses: ${meses}`)
    }
    
    console.log(`\nPai:`)
    console.log(`  Série: ${animal.serie_pai || 'N/A'}`)
    console.log(`  RG: ${animal.rg_pai || 'N/A'}`)
    console.log(`  Nome: ${animal.nome_pai || 'N/A'}`)
    
    console.log(`\nMãe:`)
    console.log(`  Série: ${animal.serie_mae || 'N/A'}`)
    console.log(`  RG: ${animal.rg_mae || 'N/A'}`)
    console.log(`  Nome: ${animal.nome_mae || 'N/A'}`)
    
    // Determinar raça automaticamente
    let racaAuto = animal.raca || 'NELORE'
    if (animal.serie) {
      const serie = animal.serie.toUpperCase()
      if (serie.startsWith('CJCJ') || serie.startsWith('CJCA') || serie.startsWith('CJCS')) {
        racaAuto = 'NELORE'
      }
    }
    console.log(`\nRaça Automática: ${racaAuto}`)
    
    console.log('\n✅ Teste concluído!')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    process.exit(0)
  }
}

testarBuscaAnimal()
