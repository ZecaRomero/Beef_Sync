/**
 * Script para verificar quantidades nas notas fiscais
 */

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:jcromero85@localhost:5432/beef_sync'
})

async function verificarNFQuantidade() {
  console.log('🔍 VERIFICANDO QUANTIDADES NAS NOTAS FISCAIS\n')
  console.log('=' .repeat(80))
  
  try {
    // 1. Buscar NFs recentes
    const nfs = await pool.query(`
      SELECT 
        id,
        numero_nf,
        tipo,
        data_compra,
        data,
        fornecedor,
        destino,
        valor_total,
        natureza_operacao
      FROM notas_fiscais
      ORDER BY COALESCE(data_compra, data, created_at) DESC
      LIMIT 10
    `)
    
    console.log(`\n📋 ÚLTIMAS ${nfs.rows.length} NOTAS FISCAIS:\n`)
    console.log('-'.repeat(80))
    
    for (const nf of nfs.rows) {
      console.log(`\n📄 NF: ${nf.numero_nf} (${nf.tipo})`)
      console.log(`   Data: ${nf.data_compra || nf.data}`)
      console.log(`   ${nf.tipo === 'entrada' ? 'Fornecedor' : 'Destino'}: ${nf.fornecedor || nf.destino}`)
      console.log(`   Valor Total: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)}`)
      console.log(`   Natureza: ${nf.natureza_operacao || 'N/A'}`)
      
      // Buscar itens desta NF
      const itens = await pool.query(`
        SELECT dados_item
        FROM notas_fiscais_itens
        WHERE nota_fiscal_id = $1
      `, [nf.id])
      
      if (itens.rows.length > 0) {
        console.log(`   📦 ${itens.rows.length} itens encontrados:`)
        
        let totalAnimais = 0
        let totalMachos = 0
        let totalFemeas = 0
        let totalValor = 0
        
        itens.rows.forEach((row, idx) => {
          try {
            const item = typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
            
            const qtd = parseInt(item.quantidade) || 
                        parseInt(item.quantidadeAnimais) || 
                        parseInt(item.qtd) ||
                        (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
            
            const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
            const valorItem = qtd * valorUnit
            
            const sexo = String(item.sexo || '').trim()
            const sexoLower = sexo.toLowerCase()
            
            const isMacho = sexoLower === 'macho' || sexoLower === 'm' || sexoLower.startsWith('macho')
            const isFemea = sexoLower === 'fêmea' || sexoLower === 'femea' || sexoLower === 'f' || sexoLower.startsWith('fêmea') || sexoLower.startsWith('femea')
            
            totalAnimais += qtd
            totalValor += valorItem
            
            if (isMacho && !isFemea) {
              totalMachos += qtd
            } else if (isFemea && !isMacho) {
              totalFemeas += qtd
            }
            
            if (idx < 3) { // Mostrar apenas os 3 primeiros
              console.log(`      ${idx + 1}. Qtd: ${qtd}, Sexo: "${sexo}", Valor Unit: R$ ${valorUnit.toFixed(2)}, Raça: ${item.raca || 'N/A'}`)
            }
          } catch (e) {
            console.error(`      ❌ Erro ao processar item ${idx + 1}:`, e.message)
          }
        })
        
        if (itens.rows.length > 3) {
          console.log(`      ... e mais ${itens.rows.length - 3} itens`)
        }
        
        console.log(`\n   📊 TOTAIS:`)
        console.log(`      Total de Animais: ${totalAnimais}`)
        console.log(`      Machos: ${totalMachos}`)
        console.log(`      Fêmeas: ${totalFemeas}`)
        console.log(`      Valor Calculado: R$ ${totalValor.toFixed(2)}`)
        console.log(`      Valor NF: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)}`)
        
        if (totalAnimais === 0) {
          console.log(`      ⚠️  PROBLEMA: Quantidade total é ZERO!`)
        }
      } else {
        console.log(`   ⚠️  Nenhum item encontrado na tabela notas_fiscais_itens`)
        
        // Tentar buscar do campo JSONB
        const nfCompleta = await pool.query(`
          SELECT itens FROM notas_fiscais WHERE id = $1
        `, [nf.id])
        
        if (nfCompleta.rows.length > 0 && nfCompleta.rows[0].itens) {
          try {
            const itensJSON = typeof nfCompleta.rows[0].itens === 'string' 
              ? JSON.parse(nfCompleta.rows[0].itens) 
              : nfCompleta.rows[0].itens
            
            const itensArray = Array.isArray(itensJSON) ? itensJSON : (itensJSON.itens || [])
            console.log(`   📦 ${itensArray.length} itens encontrados no campo JSONB`)
            
            if (itensArray.length > 0) {
              let totalAnimais = 0
              itensArray.forEach((item, idx) => {
                const qtd = parseInt(item.quantidade) || parseInt(item.quantidadeAnimais) || parseInt(item.qtd) || 1
                totalAnimais += qtd
                if (idx < 3) {
                  console.log(`      ${idx + 1}. Qtd: ${qtd}, Sexo: ${item.sexo || 'N/A'}, Raça: ${item.raca || 'N/A'}`)
                }
              })
              console.log(`      Total de Animais (JSONB): ${totalAnimais}`)
            }
          } catch (e) {
            console.error(`   ❌ Erro ao parsear itens JSONB:`, e.message)
          }
        }
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
verificarNFQuantidade()
