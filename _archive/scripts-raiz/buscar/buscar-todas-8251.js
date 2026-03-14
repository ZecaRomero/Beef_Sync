const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function buscarTodas() {
  try {
    console.log('🔍 Buscando todas as 8251...\n')

    const result = await pool.query(`
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
        data_dg,
        veterinario_dg,
        resultado_dg,
        created_at
      FROM animais 
      WHERE rg = '8251'
      ORDER BY id
    `)

    console.log(`📊 Total: ${result.rows.length} animais\n`)

    result.rows.forEach((a, i) => {
      console.log(`${i + 1}. ID ${a.id} - ${a.nome}`)
      console.log(`   Série: ${a.serie}, RG: ${a.rg}`)
      console.log(`   Raça: ${a.raca}`)
      console.log(`   Situação: ${a.situacao}`)
      console.log(`   Fornecedor: ${a.fornecedor || 'Não informado'}`)
      console.log(`   DG: ${a.data_dg ? new Date(a.data_dg).toLocaleDateString('pt-BR') + ' - ' + a.resultado_dg : 'NÃO TEM'}`)
      console.log(`   Criado: ${new Date(a.created_at).toLocaleString('pt-BR')}`)
      console.log('')
    })

    // Identificar qual é a receptora da MINEREMBRYO
    const minerembryo = result.rows.find(a => 
      a.fornecedor && a.fornecedor.toUpperCase().includes('MINEREMBRYO')
    )

    if (minerembryo) {
      console.log('✅ Receptora MINEREMBRYO identificada:')
      console.log(`   ID: ${minerembryo.id}`)
      console.log(`   Nome: ${minerembryo.nome}`)
      console.log(`   Esta é a que deve ser usada na tela de DG!\n`)
    }

    // Verificar se alguma tem DG
    const comDG = result.rows.filter(a => a.data_dg)
    if (comDG.length > 0) {
      console.log(`📋 ${comDG.length} animal(is) com DG:`)
      comDG.forEach(a => {
        console.log(`   - ID ${a.id}: ${a.resultado_dg} em ${new Date(a.data_dg).toLocaleDateString('pt-BR')}`)
      })
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

buscarTodas()
