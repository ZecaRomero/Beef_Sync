require('dotenv').config()
const { query } = require('./lib/database')

async function corrigirIncricoes() {
  try {
    console.log('🔧 Corrigindo incrições das Notas Fiscais...\n')
    
    // Buscar todas as NFs sem incrição ou com incrição inválida
    const result = await query(`
      SELECT 
        id, 
        numero_nf, 
        tipo, 
        incricao, 
        fornecedor,
        destino,
        cnpj_origem_destino
      FROM notas_fiscais
      WHERE incricao IS NULL 
         OR incricao = '' 
         OR (UPPER(incricao) != 'SANT ANNA' AND UPPER(incricao) != 'PARDINHO')
    `)
    
    console.log(`📋 Total de NFs para corrigir: ${result.rows.length}\n`)
    
    if (result.rows.length === 0) {
      console.log('✅ Todas as NFs já possuem incrição válida!')
      return
    }
    
    const cnpjPardinho = '18978214000445'
    let corrigidas = 0
    let erros = 0
    
    for (const nf of result.rows) {
      try {
        let novaIncricao = 'SANT ANNA' // Padrão
        
        // Verificar se é Pardinho pelo CNPJ
        if (nf.cnpj_origem_destino) {
          const cnpjNormalizado = nf.cnpj_origem_destino.replace(/[.\-\/\s]/g, '').trim()
          if (cnpjNormalizado === cnpjPardinho) {
            novaIncricao = 'PARDINHO'
          }
        }
        
        // Verificar se é Pardinho pelo nome do fornecedor/destino
        const fornecedorUpper = (nf.fornecedor || '').toUpperCase()
        const destinoUpper = (nf.destino || '').toUpperCase()
        
        if (fornecedorUpper.includes('PARDINHO') || destinoUpper.includes('PARDINHO')) {
          novaIncricao = 'PARDINHO'
        }
        
        // Atualizar NF
        await query(
          `UPDATE notas_fiscais 
           SET incricao = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [novaIncricao, nf.id]
        )
        
        console.log(`✅ NF ${nf.numero_nf} (${nf.tipo}) → Incrição: ${novaIncricao}`)
        corrigidas++
        
      } catch (error) {
        console.error(`❌ Erro ao corrigir NF ${nf.numero_nf}:`, error.message)
        erros++
      }
    }
    
    console.log(`\n📊 Resumo:`)
    console.log(`  ✅ NFs corrigidas: ${corrigidas}`)
    if (erros > 0) {
      console.log(`  ❌ Erros: ${erros}`)
    }
    
    console.log('\n✅ Correção concluída!')
    console.log('💡 Agora você pode sincronizar as NFs novamente')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    process.exit(0)
  }
}

corrigirIncricoes()
