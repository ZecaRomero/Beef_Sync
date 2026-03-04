/**
 * Script para verificar se animais têm campo de nota fiscal
 */

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:jcromero85@localhost:5432/beef_sync'
})

async function verificarCampoNF() {
  console.log('🔍 VERIFICANDO CAMPO DE NOTA FISCAL NOS ANIMAIS\n')
  console.log('=' .repeat(80))
  
  try {
    // 1. Verificar estrutura da tabela animais
    const colunas = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'animais'
      AND column_name LIKE '%nota%'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 COLUNAS RELACIONADAS A NOTA FISCAL:\n')
    console.log('-'.repeat(80))
    
    if (colunas.rows.length === 0) {
      console.log('⚠️  Nenhuma coluna relacionada a nota fiscal encontrada!')
    } else {
      colunas.rows.forEach(col => {
        console.log(`  ${col.column_name.padEnd(30)} | ${col.data_type}`)
      })
    }
    
    // 2. Verificar quantos animais têm NF preenchida
    const comNF = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE numero_nf IS NOT NULL) as com_nf,
        COUNT(*) FILTER (WHERE numero_nf IS NULL) as sem_nf,
        COUNT(*) as total
      FROM animais
    `)
    
    console.log('\n📊 ESTATÍSTICAS:\n')
    console.log('-'.repeat(80))
    console.log(`  Total de animais: ${comNF.rows[0].total}`)
    console.log(`  Com NF preenchida: ${comNF.rows[0].com_nf}`)
    console.log(`  Sem NF: ${comNF.rows[0].sem_nf}`)
    
    // 3. Mostrar exemplos de animais com NF
    const exemplos = await pool.query(`
      SELECT serie, rg, numero_nf, sexo, raca
      FROM animais
      WHERE numero_nf IS NOT NULL
      ORDER BY id DESC
      LIMIT 10
    `)
    
    if (exemplos.rows.length > 0) {
      console.log('\n📋 EXEMPLOS DE ANIMAIS COM NF:\n')
      console.log('-'.repeat(80))
      exemplos.rows.forEach((animal, idx) => {
        console.log(`  ${idx + 1}. ${animal.serie}-${animal.rg} | NF: ${animal.numero_nf} | ${animal.sexo} | ${animal.raca}`)
      })
    }
    
    // 4. Contar animais por NF
    const porNF = await pool.query(`
      SELECT 
        numero_nf,
        COUNT(*) as quantidade,
        COUNT(*) FILTER (WHERE sexo = 'Macho') as machos,
        COUNT(*) FILTER (WHERE sexo = 'Fêmea' OR sexo = 'Femea') as femeas
      FROM animais
      WHERE numero_nf IS NOT NULL
      GROUP BY numero_nf
      ORDER BY quantidade DESC
      LIMIT 10
    `)
    
    if (porNF.rows.length > 0) {
      console.log('\n📊 TOP 10 NFs COM MAIS ANIMAIS:\n')
      console.log('-'.repeat(80))
      porNF.rows.forEach((nf, idx) => {
        console.log(`  ${idx + 1}. NF ${nf.numero_nf}: ${nf.quantidade} animais (${nf.machos}M + ${nf.femeas}F)`)
      })
    }
    
    // 5. Verificar NFs específicas do relatório
    const nfsEspecificas = ['2141', '4397', '4396', '050.558.282', '2076', '231', '229']
    
    console.log('\n🔍 VERIFICANDO NFs ESPECÍFICAS DO RELATÓRIO:\n')
    console.log('-'.repeat(80))
    
    for (const nf of nfsEspecificas) {
      const animais = await pool.query(`
        SELECT COUNT(*) as total
        FROM animais
        WHERE numero_nf = $1 OR numero_nf = $2
      `, [nf, nf.replace(/^0+/, '')])  // Tentar com e sem zeros à esquerda
      
      const total = parseInt(animais.rows[0].total)
      if (total > 0) {
        console.log(`  ✅ NF ${nf}: ${total} animais encontrados`)
      } else {
        console.log(`  ⚠️  NF ${nf}: 0 animais encontrados`)
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ Verificação concluída!')
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error('\nDetalhes:', error)
  } finally {
    await pool.end()
  }
}

// Executar
verificarCampoNF()
