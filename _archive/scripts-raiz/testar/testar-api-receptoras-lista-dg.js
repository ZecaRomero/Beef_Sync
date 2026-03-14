const fetch = require('node-fetch')

async function testarAPI() {
  try {
    console.log('🔍 Testando API /api/receptoras/lista-dg...\n')

    const response = await fetch('http://localhost:3020/api/receptoras/lista-dg?incluirComDG=true')
    const result = await response.json()

    console.log(`Status: ${response.status}`)
    console.log(`Total de receptoras: ${result.data?.length || 0}\n`)

    // Buscar a 8251
    const r8251 = result.data?.find(r => r.rg === '8251' || r.numero === '8251')

    if (r8251) {
      console.log('📋 Dados da 8251 retornados pela API:')
      console.log('─────────────────────────────────────')
      console.log(`RG: ${r8251.rg}`)
      console.log(`Letra: ${r8251.letra}`)
      console.log(`Série: ${r8251.serie}`)
      console.log(`Fornecedor: ${r8251.fornecedor}`)
      console.log(`Data TE: ${r8251.dataTE}`)
      console.log(`Data DG: ${r8251.dataDG || 'NÃO TEM ❌'}`)
      console.log(`Resultado DG: ${r8251.resultadoDG || 'Não informado'}`)
      console.log(`Veterinário: ${r8251.veterinario || 'Não informado'}`)
      console.log(`Animal ID: ${r8251.animalId}`)
      console.log('─────────────────────────────────────\n')

      if (!r8251.dataDG) {
        console.log('⚠️ PROBLEMA: API não está retornando o DG da 8251!')
        console.log('O DG está no banco mas a API não está buscando.\n')
      } else {
        console.log('✅ API está retornando o DG da 8251 corretamente!\n')
      }
    } else {
      console.log('❌ 8251 não encontrada na resposta da API!\n')
    }

    // Contar receptoras da MINEREMBRYO
    const minerembryo = result.data?.filter(r => 
      r.fornecedor && r.fornecedor.toUpperCase().includes('MINEREMBRYO')
    ) || []

    console.log(`📊 MINEREMBRYO: ${minerembryo.length} receptoras`)
    
    const comDG = minerembryo.filter(r => r.dataDG)
    const prenhas = minerembryo.filter(r => 
      r.resultadoDG && (
        r.resultadoDG.toUpperCase().includes('P') ||
        r.resultadoDG.toUpperCase().includes('POSITIVO') ||
        r.resultadoDG.toUpperCase().includes('PRENHA')
      )
    )
    const vazias = minerembryo.filter(r => 
      r.resultadoDG && (
        r.resultadoDG.toUpperCase().includes('V') ||
        r.resultadoDG.toUpperCase().includes('NEGATIVO') ||
        r.resultadoDG.toUpperCase().includes('VAZIA')
      )
    )
    const pendentes = minerembryo.filter(r => !r.dataDG)

    console.log(`  - Com DG: ${comDG.length}`)
    console.log(`  - Prenhas: ${prenhas.length}`)
    console.log(`  - Vazias: ${vazias.length}`)
    console.log(`  - Pendentes: ${pendentes.length}`)

    if (vazias.length > 0) {
      console.log('\n  Receptoras vazias:')
      vazias.forEach(r => {
        console.log(`    - ${r.rg || r.numero || r.letra}`)
      })
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testarAPI()
