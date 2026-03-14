require('dotenv').config()
const { query, initDatabase } = require('../lib/database')

async function verificarFornecedores() {
  try {
    console.log('🔗 Conectando ao banco de dados...')
    initDatabase()
    
    console.log('\n📊 Fornecedores cadastrados:')
    const result = await query(`
      SELECT id, nome, cnpj_cpf, tipo, municipio 
      FROM fornecedores_destinatarios 
      ORDER BY id DESC 
      LIMIT 20
    `)
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum fornecedor encontrado no banco!')
    } else {
      result.rows.forEach(f => {
        console.log(`\nID: ${f.id}`)
        console.log(`  Nome: ${f.nome}`)
        console.log(`  CNPJ/CPF: ${f.cnpj_cpf || '(não informado)'}`)
        console.log(`  Tipo: ${f.tipo}`)
        console.log(`  Município: ${f.municipio || '(não informado)'}`)
        if (f.cnpj_cpf) {
          const cnpjLimpo = f.cnpj_cpf.replace(/[.\-\/\s]/g, '')
          console.log(`  CNPJ limpo: ${cnpjLimpo}`)
        }
      })
    }
    
    // Buscar especificamente pelo CNPJ mencionado
    console.log('\n🔍 Buscando CNPJ específico: 44017440001018')
    const busca = await query(`
      SELECT id, nome, cnpj_cpf, tipo 
      FROM fornecedores_destinatarios 
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(cnpj_cpf, '.', ''), '-', ''), '/', ''), ' ', '') = $1
    `, ['44017440001018'])
    
    if (busca.rows.length > 0) {
      console.log('✅ Encontrado!')
      busca.rows.forEach(f => {
        console.log(`  Nome: ${f.nome} | CNPJ: ${f.cnpj_cpf} | Tipo: ${f.tipo}`)
      })
    } else {
      console.log('❌ Não encontrado no banco!')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

verificarFornecedores()

