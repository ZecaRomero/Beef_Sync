const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function verificarDuplicatas() {
  try {
    console.log('🔍 Buscando todas as receptoras 8251...\n')

    // Buscar todos os animais com 8251
    const animais = await pool.query(`
      SELECT 
        id,
        nome,
        serie,
        rg,
        tatuagem,
        sexo,
        raca,
        situacao,
        fornecedor,
        data_te,
        data_dg,
        veterinario_dg,
        resultado_dg,
        created_at
      FROM animais 
      WHERE rg = '8251' OR tatuagem LIKE '%8251%'
      ORDER BY id
    `)

    console.log(`📊 Total de animais encontrados: ${animais.rows.length}\n`)

    animais.rows.forEach((a, index) => {
      console.log(`${index + 1}. Animal ID ${a.id}`)
      console.log(`   Nome: ${a.nome}`)
      console.log(`   Série: ${a.serie}`)
      console.log(`   RG: ${a.rg}`)
      console.log(`   Tatuagem: ${a.tatuagem || 'Não informada'}`)
      console.log(`   Sexo: ${a.sexo}`)
      console.log(`   Raça: ${a.raca}`)
      console.log(`   Situação: ${a.situacao}`)
      console.log(`   Fornecedor: ${a.fornecedor || 'Não informado'}`)
      console.log(`   Data TE: ${a.data_te ? new Date(a.data_te).toLocaleDateString('pt-BR') : 'Não informada'}`)
      console.log(`   Data DG: ${a.data_dg ? new Date(a.data_dg).toLocaleDateString('pt-BR') : 'NÃO TEM ❌'}`)
      console.log(`   Resultado DG: ${a.resultado_dg || 'Não informado'}`)
      console.log(`   Veterinário: ${a.veterinario_dg || 'Não informado'}`)
      console.log(`   Criado em: ${new Date(a.created_at).toLocaleString('pt-BR')}`)
      console.log('   ─────────────────────────────────────\n')
    })

    // Identificar qual é a receptora correta
    const receptoras = animais.rows.filter(a => 
      a.raca === 'Receptora' || 
      a.fornecedor?.toUpperCase().includes('MINEREMBRYO')
    )

    console.log(`\n📋 Receptoras (raça=Receptora ou fornecedor=MINEREMBRYO): ${receptoras.length}`)
    receptoras.forEach(r => {
      console.log(`   - ID ${r.id}: ${r.nome} (${r.serie} ${r.rg})`)
    })

    // Verificar qual tem TE
    const comTE = animais.rows.filter(a => a.data_te)
    console.log(`\n📋 Animais com Data TE: ${comTE.length}`)
    comTE.forEach(r => {
      console.log(`   - ID ${r.id}: ${r.nome} - TE em ${new Date(r.data_te).toLocaleDateString('pt-BR')}`)
    })

    // Sugestão de qual manter
    console.log('\n💡 SUGESTÃO:')
    if (receptoras.length > 1) {
      console.log('   Existem múltiplas receptoras 8251!')
      console.log('   Recomendo manter apenas a que tem:')
      console.log('   1. Fornecedor = MINEREMBRYO')
      console.log('   2. Data TE preenchida')
      console.log('   3. Raça = Receptora')
      
      const correta = receptoras.find(r => 
        r.fornecedor?.toUpperCase().includes('MINEREMBRYO') && r.data_te
      )
      
      if (correta) {
        console.log(`\n   ✅ Receptora correta: ID ${correta.id} (${correta.nome})`)
        console.log(`      Criada em: ${new Date(correta.created_at).toLocaleString('pt-BR')}`)
        
        const outras = animais.rows.filter(a => a.id !== correta.id)
        if (outras.length > 0) {
          console.log(`\n   ⚠️ Outras ${outras.length} devem ser removidas ou ter RG alterado:`)
          outras.forEach(o => {
            console.log(`      - ID ${o.id}: ${o.nome} (${o.raca})`)
          })
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

verificarDuplicatas()
