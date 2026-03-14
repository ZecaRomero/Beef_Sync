/**
 * Script para debugar dados genÃ©ticos de um animal via API
 * Execute: node debug-animal-api.js SERIE RG
 * Exemplo: node debug-animal-api.js CJCJ 15668
 */

const http = require('http')

async function debugAnimal(serie, rg) {
  try {
    console.log(`\nðÅ¸â€ Buscando dados do animal: ${serie} ${rg}\n`)
    
    // Primeiro buscar o ID do animal
    const verificarUrl = `http://localhost:3020/api/animals/verificar?serie=${encodeURIComponent(serie)}&rg=${encodeURIComponent(rg)}`
    
    console.log('ðÅ¸â€œ¡ Buscando ID do animal...')
    
    const verificarData = await new Promise((resolve, reject) => {
      http.get(verificarUrl, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      }).on('error', reject)
    })
    
    if (!verificarData.success || !verificarData.data?.id) {
      console.log('âÅ’ Animal nÃ£o encontrado')
      return
    }
    
    const animalId = verificarData.data.id
    console.log(`âÅ“â€¦ Animal encontrado! ID: ${animalId}`)
    console.log('')
    
    // Buscar dados completos do animal
    const animalUrl = `http://localhost:3020/api/animals/${animalId}`
    
    console.log('ðÅ¸â€œ¡ Buscando dados completos...')
    
    const animalData = await new Promise((resolve, reject) => {
      http.get(animalUrl, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      }).on('error', reject)
    })
    
    if (!animalData.success || !animalData.data) {
      console.log('âÅ’ Erro ao buscar dados do animal')
      return
    }
    
    const animal = animalData.data
    
    console.log('ðÅ¸â€œâ€¹ Dados do Animal:')
    console.log('ââ€â‚¬'.repeat(50))
    console.log(`ID: ${animal.id}`)
    console.log(`SÃ©rie/RG: ${animal.serie} ${animal.rg}`)
    console.log(`Nome: ${animal.nome || 'NÃ£o informado'}`)
    console.log('')
    console.log('ðÅ¸§¬ Dados GenÃ©ticos (valores brutos do banco):')
    console.log('ââ€â‚¬'.repeat(50))
    console.log(`abczg: ${animal.abczg ?? 'NULL'}`)
    console.log(`deca: ${animal.deca ?? 'NULL'}`)
    console.log(`iqg: ${animal.iqg ?? 'NULL'}`)
    console.log(`genetica_2: ${animal.genetica_2 ?? 'NULL'}`)
    console.log(`pt_iqg: ${animal.pt_iqg ?? 'NULL'}`)
    console.log(`decile_2: ${animal.decile_2 ?? 'NULL'}`)
    console.log(`situacao_abcz: ${animal.situacao_abcz || 'NULL'}`)
    console.log(`situacaoAbcz: ${animal.situacaoAbcz || 'NULL'}`)
    console.log('')
    console.log('âÅ“â€¦ Valores que DEVERIAM ser exibidos:')
    console.log('ââ€â‚¬'.repeat(50))
    console.log(`iABCZ: ${animal.abczg ?? 'NÃ£o informado'}`)
    console.log(`DECA: ${animal.deca ?? 'NÃ£o informado'}`)
    console.log(`IQG: ${animal.iqg ?? animal.genetica_2 ?? 'NÃ£o informado'}`)
    console.log(`Pt IQG: ${animal.pt_iqg ?? animal.decile_2 ?? 'NÃ£o informado'}`)
    console.log(`SituaÃ§Ã£o ABCZ: ${animal.situacao_abcz || animal.situacaoAbcz || 'NÃ£o informado'}`)
    console.log('')
    
    // Verificar se hÃ¡ mapeamento incorreto
    console.log('âÅ¡ ï¸  DIAGNÃâ€œSTICO:')
    console.log('ââ€â‚¬'.repeat(50))
    
    if (animal.iqg === null && animal.genetica_2 !== null) {
      console.log('âÅ’ PROBLEMA: IQG estÃ¡ NULL mas genetica_2 tem valor!')
      console.log(`   SoluÃ§Ã£o: Copiar genetica_2 (${animal.genetica_2}) para iqg`)
    }
    
    if (animal.pt_iqg === null && animal.decile_2 !== null) {
      console.log('âÅ’ PROBLEMA: pt_iqg estÃ¡ NULL mas decile_2 tem valor!')
      console.log(`   SoluÃ§Ã£o: Copiar decile_2 (${animal.decile_2}) para pt_iqg`)
    }
    
    if (animal.iqg !== null && animal.genetica_2 !== null && animal.iqg !== animal.genetica_2) {
      console.log('âÅ¡ ï¸  AVISO: iqg e genetica_2 tÃªm valores diferentes!')
      console.log(`   iqg: ${animal.iqg}`)
      console.log(`   genetica_2: ${animal.genetica_2}`)
    }
    
    console.log('')
    
  } catch (error) {
    console.error('âÅ’ Erro:', error.message)
    console.error('')
    console.error('ðÅ¸â€™¡ Certifique-se de que o servidor estÃ¡ rodando em http://localhost:3020')
  }
}

const serie = process.argv[2]
const rg = process.argv[3]

if (!serie || !rg) {
  console.log('âÅ’ Uso: node debug-animal-api.js SERIE RG')
  console.log('Exemplo: node debug-animal-api.js CJCJ 15668')
  process.exit(1)
}

debugAnimal(serie, rg).then(() => process.exit(0))
