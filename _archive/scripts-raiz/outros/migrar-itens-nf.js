/**
 * Script para migrar itens de notas fiscais do campo JSONB para a tabela separada
 */

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:jcromero85@localhost:5432/beef_sync'
})

async function migrarItensNF() {
  console.log('🔄 MIGRANDO ITENS DE NOTAS FISCAIS\n')
  console.log('=' .repeat(80))
  
  const client = await pool.connect()
  
  try {
    // 1. Buscar todas as NFs que têm itens no campo JSONB mas não na tabela
    const nfs = await client.query(`
      SELECT 
        id,
        numero_nf,
        tipo,
        itens
      FROM notas_fiscais
      WHERE itens IS NOT NULL
      ORDER BY id
    `)
    
    console.log(`\n📋 Encontradas ${nfs.rows.length} notas fiscais com campo itens\n`)
    console.log('-'.repeat(80))
    
    let migradas = 0
    let erros = 0
    let semItens = 0
    let jaExistentes = 0
    
    for (const nf of nfs.rows) {
      try {
        // Verificar se já tem itens na tabela
        const itensExistentes = await client.query(`
          SELECT COUNT(*) as total
          FROM notas_fiscais_itens
          WHERE nota_fiscal_id = $1
        `, [nf.id])
        
        const totalExistentes = parseInt(itensExistentes.rows[0].total)
        
        if (totalExistentes > 0) {
          console.log(`✓ NF ${nf.numero_nf}: Já tem ${totalExistentes} itens na tabela`)
          jaExistentes++
          continue
        }
        
        // Parsear itens do JSONB
        let itensArray = []
        try {
          const itensJSON = typeof nf.itens === 'string' ? JSON.parse(nf.itens) : nf.itens
          itensArray = Array.isArray(itensJSON) ? itensJSON : (itensJSON.itens || [])
        } catch (e) {
          console.error(`❌ NF ${nf.numero_nf}: Erro ao parsear itens:`, e.message)
          erros++
          continue
        }
        
        if (itensArray.length === 0) {
          console.log(`⚠️  NF ${nf.numero_nf}: Campo itens vazio`)
          semItens++
          continue
        }
        
        // Inserir itens na tabela
        let itensInseridos = 0
        for (const item of itensArray) {
          try {
            await client.query(`
              INSERT INTO notas_fiscais_itens (nota_fiscal_id, dados_item)
              VALUES ($1, $2)
            `, [nf.id, JSON.stringify(item)])
            itensInseridos++
          } catch (e) {
            console.error(`   ❌ Erro ao inserir item:`, e.message)
          }
        }
        
        if (itensInseridos > 0) {
          console.log(`✅ NF ${nf.numero_nf}: ${itensInseridos} itens migrados`)
          migradas++
        }
        
      } catch (error) {
        console.error(`❌ NF ${nf.numero_nf}: Erro ao processar:`, error.message)
        erros++
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('\n📊 RESUMO DA MIGRAÇÃO:')
    console.log(`   ✅ NFs migradas: ${migradas}`)
    console.log(`   ✓  NFs já existentes: ${jaExistentes}`)
    console.log(`   ⚠️  NFs sem itens: ${semItens}`)
    console.log(`   ❌ Erros: ${erros}`)
    console.log(`   📋 Total processadas: ${nfs.rows.length}`)
    
    console.log('\n✅ Migração concluída!')
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error('\nDetalhes:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar
migrarItensNF()
