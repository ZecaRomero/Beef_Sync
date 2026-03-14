/**
 * Script para debugar dados genéticos de um animal
 * Execute: node debug-animal-genetica.js SERIE RG
 * Exemplo: node debug-animal-genetica.js CJCJ 15668
 */

const { query } = require('./lib/database')

async function debugAnimal(serie, rg) {
  try {
    console.log(`\n🔍 Buscando dados do animal: ${serie} ${rg}\n`)
    
    const result = await query(
      `SELECT 
        id, serie, rg, nome,
        abczg, deca, iqg, pt_iqg,
        genetica_2, decile_2,
        situacao_abcz
      FROM animais 
      WHERE serie = $1 AND rg = $2`,
      [serie, rg]
    )
    
    if (result.rows.length === 0) {
      console.log('❌ Animal não encontrado')
      return
    }
    
    const animal = result.rows[0]
    
    console.log('📋 Dados do Animal:')
    console.log('─'.repeat(50))
    console.log(`ID: ${animal.id}`)
    console.log(`Série/RG: ${animal.serie} ${animal.rg}`)
    console.log(`Nome: ${animal.nome || 'Não informado'}`)
    console.log('')
    console.log('🧬 Dados Genéticos:')
    console.log('─'.repeat(50))
    console.log(`iABCZ (abczg): ${animal.abczg ?? 'NULL'}`)
    console.log(`DECA (deca): ${animal.deca ?? 'NULL'}`)
    console.log(`IQG (iqg): ${animal.iqg ?? 'NULL'}`)
    console.log(`IQG (genetica_2): ${animal.genetica_2 ?? 'NULL'}`)
    console.log(`Pt IQG (pt_iqg): ${animal.pt_iqg ?? 'NULL'}`)
    console.log(`Pt IQG (decile_2): ${animal.decile_2 ?? 'NULL'}`)
    console.log(`Situação ABCZ: ${animal.situacao_abcz || 'Não informado'}`)
    console.log('')
    console.log('✅ Valores que serão exibidos:')
    console.log('─'.repeat(50))
    console.log(`iABCZ: ${animal.abczg ?? 'Não informado'}`)
    console.log(`DECA: ${animal.deca ?? 'Não informado'}`)
    console.log(`IQG: ${animal.iqg ?? animal.genetica_2 ?? 'Não informado'}`)
    console.log(`Pt IQG: ${animal.pt_iqg ?? animal.decile_2 ?? 'Não informado'}`)
    console.log(`Situação ABCZ: ${animal.situacao_abcz || 'Não informado'}`)
    console.log('')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    process.exit(0)
  }
}

const serie = process.argv[2]
const rg = process.argv[3]

if (!serie || !rg) {
  console.log('❌ Uso: node debug-animal-genetica.js SERIE RG')
  console.log('Exemplo: node debug-animal-genetica.js CJCJ 15668')
  process.exit(1)
}

debugAnimal(serie, rg)
