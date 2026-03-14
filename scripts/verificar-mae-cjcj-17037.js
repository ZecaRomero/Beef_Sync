/**
 * Script para verificar os dados da mãe da CJCJ 17037
 */
const { query } = require('../lib/database')

async function verificarMae() {
  try {
    console.log('🔍 Verificando dados da CJCJ 17037...\n')
    
    // Buscar animal
    const animal = await query(
      `SELECT id, serie, rg, nome, mae, serie_mae, rg_mae
       FROM animais
       WHERE serie = 'CJCJ' AND rg = '17037'
       LIMIT 1`
    )
    
    if (animal.rows.length === 0) {
      console.log('❌ Animal CJCJ 17037 não encontrado')
      process.exit(1)
    }
    
    const a = animal.rows[0]
    console.log('📋 Dados do animal:')
    console.log(`   ID: ${a.id}`)
    console.log(`   Série: ${a.serie}`)
    console.log(`   RG: ${a.rg}`)
    console.log(`   Nome: ${a.nome || 'Não informado'}`)
    console.log(`   Mãe: ${a.mae || 'Não informado'}`)
    console.log(`   Série Mãe: ${a.serie_mae || 'Não informado'}`)
    console.log(`   RG Mãe: ${a.rg_mae || 'Não informado'}`)
    
    // Buscar coletas por nome da mãe
    console.log('\n🔍 Buscando coletas por nome "MANERA SANT ANNA"...')
    const coletas1 = await query(
      `SELECT COUNT(*) as total, doadora_nome
       FROM coleta_fiv
       WHERE UPPER(doadora_nome) LIKE '%MANERA%'
       GROUP BY doadora_nome`
    )
    console.log(`   Encontradas: ${coletas1.rows.length} variações`)
    coletas1.rows.forEach(row => {
      console.log(`   - "${row.doadora_nome}": ${row.total} coletas`)
    })
    
    // Buscar coletas por CJCJ 16013
    console.log('\n🔍 Buscando coletas por "CJCJ 16013"...')
    const coletas2 = await query(
      `SELECT COUNT(*) as total
       FROM coleta_fiv
       WHERE UPPER(doadora_nome) LIKE '%CJCJ%16013%'`
    )
    console.log(`   Encontradas: ${coletas2.rows[0]?.total || 0} coletas`)
    
    // Verificar se precisa atualizar os campos serie_mae e rg_mae
    if (!a.serie_mae || !a.rg_mae) {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO:')
      console.log('   Os campos serie_mae e rg_mae não estão preenchidos!')
      console.log('   A busca de coletas FIV usa esses campos quando disponíveis.')
      console.log('\n💡 SOLUÇÃO:')
      console.log('   Execute o seguinte comando SQL para corrigir:')
      console.log(`   UPDATE animais SET serie_mae = 'CJCJ', rg_mae = '16013' WHERE id = ${a.id};`)
    } else {
      console.log('\n✅ Campos serie_mae e rg_mae estão preenchidos corretamente')
    }
    
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

verificarMae()
