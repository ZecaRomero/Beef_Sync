const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function verificarDG8251() {
  try {
    console.log('🔍 Verificando DG da receptora 8251...\n')

    // Buscar animal 8251
    const animal = await pool.query(`
      SELECT 
        id,
        rg,
        brinco,
        letra,
        serie,
        fornecedor,
        data_te,
        data_dg,
        resultado_dg,
        veterinario_dg,
        observacoes
      FROM animais 
      WHERE rg = '8251' OR brinco = '8251'
      ORDER BY id DESC
      LIMIT 1
    `)

    if (animal.rows.length === 0) {
      console.log('❌ Animal 8251 não encontrado!')
      return
    }

    const a = animal.rows[0]
    console.log('📋 Dados do Animal 8251:')
    console.log('─────────────────────────────────────')
    console.log(`ID: ${a.id}`)
    console.log(`RG: ${a.rg}`)
    console.log(`Brinco: ${a.brinco}`)
    console.log(`Letra: ${a.letra}`)
    console.log(`Série: ${a.serie}`)
    console.log(`Fornecedor: ${a.fornecedor}`)
    console.log(`Data TE: ${a.data_te ? new Date(a.data_te).toLocaleDateString('pt-BR') : 'Não informada'}`)
    console.log(`Data DG: ${a.data_dg ? new Date(a.data_dg).toLocaleDateString('pt-BR') : 'NÃO TEM DG ❌'}`)
    console.log(`Resultado DG: ${a.resultado_dg || 'Não informado'}`)
    console.log(`Veterinário: ${a.veterinario_dg || 'Não informado'}`)
    console.log(`Observações: ${a.observacoes || 'Nenhuma'}`)
    console.log('─────────────────────────────────────\n')

    // Verificar se tem DG
    if (!a.data_dg) {
      console.log('⚠️ PROBLEMA: Animal 8251 NÃO tem data_dg no banco!')
      console.log('Isso significa que o salvamento não funcionou.\n')
    } else {
      console.log('✅ Animal 8251 TEM DG salvo no banco!')
      console.log(`Status: ${a.resultado_dg}\n`)
    }

    // Buscar na tabela de transferências de embriões
    const te = await pool.query(`
      SELECT 
        id,
        animal_id,
        data_te,
        data_dg,
        resultado_dg,
        veterinario,
        observacoes
      FROM transferencias_embriao
      WHERE animal_id = $1
      ORDER BY data_te DESC
      LIMIT 1
    `, [a.id])

    if (te.rows.length > 0) {
      const t = te.rows[0]
      console.log('📋 Dados na tabela transferencias_embriao:')
      console.log('─────────────────────────────────────')
      console.log(`ID TE: ${t.id}`)
      console.log(`Animal ID: ${t.animal_id}`)
      console.log(`Data TE: ${t.data_te ? new Date(t.data_te).toLocaleDateString('pt-BR') : 'Não informada'}`)
      console.log(`Data DG: ${t.data_dg ? new Date(t.data_dg).toLocaleDateString('pt-BR') : 'NÃO TEM DG ❌'}`)
      console.log(`Resultado DG: ${t.resultado_dg || 'Não informado'}`)
      console.log(`Veterinário: ${t.veterinario || 'Não informado'}`)
      console.log(`Observações: ${t.observacoes || 'Nenhuma'}`)
      console.log('─────────────────────────────────────\n')
    } else {
      console.log('⚠️ Não encontrado na tabela transferencias_embriao\n')
    }

    // Buscar todos os animais da MINEREMBRYO com DG
    const minerembryo = await pool.query(`
      SELECT 
        rg,
        brinco,
        letra,
        data_dg,
        resultado_dg
      FROM animais 
      WHERE fornecedor ILIKE '%MINEREMBRYO%'
      AND data_dg IS NOT NULL
      ORDER BY rg, brinco
    `)

    console.log(`📊 Total de animais MINEREMBRYO com DG: ${minerembryo.rows.length}`)
    if (minerembryo.rows.length > 0) {
      console.log('\nAnimais MINEREMBRYO com DG salvo:')
      minerembryo.rows.forEach(r => {
        console.log(`  - ${r.rg || r.brinco || r.letra}: ${r.resultado_dg} (${new Date(r.data_dg).toLocaleDateString('pt-BR')})`)
      })
    }

    // Buscar todos os animais da MINEREMBRYO SEM DG
    const semDG = await pool.query(`
      SELECT 
        rg,
        brinco,
        letra,
        data_te
      FROM animais 
      WHERE fornecedor ILIKE '%MINEREMBRYO%'
      AND data_dg IS NULL
      ORDER BY rg, brinco
    `)

    console.log(`\n📊 Total de animais MINEREMBRYO SEM DG: ${semDG.rows.length}`)
    if (semDG.rows.length > 0) {
      console.log('\nAnimais MINEREMBRYO pendentes de DG:')
      semDG.rows.slice(0, 10).forEach(r => {
        console.log(`  - ${r.rg || r.brinco || r.letra} (TE: ${r.data_te ? new Date(r.data_te).toLocaleDateString('pt-BR') : 'sem TE'})`)
      })
      if (semDG.rows.length > 10) {
        console.log(`  ... e mais ${semDG.rows.length - 10} receptoras`)
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

verificarDG8251()
