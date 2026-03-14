require('dotenv').config()
const { query, initDatabase } = require('../lib/database')

async function removerDuplicado() {
  try {
    console.log('🔗 Conectando ao banco de dados...')
    initDatabase()
    
    console.log('\n📊 Verificando fornecedores duplicados...')
    
    // Buscar todos os fornecedores com nome similar
    const todos = await query(`
      SELECT id, nome, cnpj_cpf, tipo, created_at 
      FROM fornecedores_destinatarios 
      WHERE nome ILIKE '%FAZENDA SANT ANNA%'
      ORDER BY created_at DESC
    `)
    
    console.log(`\nEncontrados ${todos.rows.length} fornecedores com nome similar:`)
    todos.rows.forEach(f => {
      console.log(`\nID: ${f.id}`)
      console.log(`  Nome: ${f.nome}`)
      console.log(`  CNPJ: ${f.cnpj_cpf || '(não informado)'}`)
      console.log(`  Tipo: ${f.tipo}`)
      console.log(`  Criado em: ${f.created_at}`)
    })
    
    // Identificar o duplicado incorreto (o com CNPJ 44.014.440/0010-18)
    const incorreto = todos.rows.find(f => {
      if (!f.cnpj_cpf) return false
      const cnpjLimpo = f.cnpj_cpf.replace(/[.\-\/\s]/g, '')
      return cnpjLimpo === '44014440001018' // CNPJ errado
    })
    
    const correto = todos.rows.find(f => {
      if (!f.cnpj_cpf) return false
      const cnpjLimpo = f.cnpj_cpf.replace(/[.\-\/\s]/g, '')
      return cnpjLimpo === '44017440001018' // CNPJ correto
    })
    
    if (incorreto && correto) {
      console.log(`\n❌ Fornecedor INCORRETO encontrado (ID: ${incorreto.id})`)
      console.log(`✅ Fornecedor CORRETO encontrado (ID: ${correto.id})`)
      
      console.log('\n🗑️ Removendo fornecedor duplicado incorreto...')
      await query('DELETE FROM fornecedores_destinatarios WHERE id = $1', [incorreto.id])
      console.log(`✅ Fornecedor ID ${incorreto.id} removido com sucesso!`)
    } else {
      console.log('\n⚠️ Não foi possível identificar claramente qual é o duplicado.')
      console.log('Por favor, verifique manualmente e remova o registro incorreto.')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

removerDuplicado()

