/**
 * Script para debugar a NF 4346 e verificar os dados dos itens
 */
const { query } = require('../lib/database')

async function debugNF4346() {
  try {
    console.log('🔍 Buscando NF 4346...')
    
    // Buscar a NF
    const nfResult = await query(`
      SELECT * FROM notas_fiscais 
      WHERE CAST(numero_nf AS TEXT) = '4346'
      ORDER BY id DESC
      LIMIT 1
    `)
    
    if (nfResult.rows.length === 0) {
      console.log('❌ NF 4346 não encontrada!')
      return
    }
    
    const nf = nfResult.rows[0]
    console.log('✅ NF 4346 encontrada:', {
      id: nf.id,
      numero_nf: nf.numero_nf,
      tipo: nf.tipo,
      data: nf.data,
      data_compra: nf.data_compra,
      cnpj_origem_destino: nf.cnpj_origem_destino
    })
    
    // Buscar itens
    const itensResult = await query(`
      SELECT * FROM notas_fiscais_itens 
      WHERE nota_fiscal_id = $1
      ORDER BY id
    `, [nf.id])
    
    console.log(`\n📦 Total de itens encontrados: ${itensResult.rows.length}`)
    
    itensResult.rows.forEach((row, index) => {
      console.log(`\n--- Item ${index + 1} ---`)
      console.log('ID:', row.id)
      console.log('Tipo Produto:', row.tipo_produto)
      
      let dadosItem = {}
      try {
        dadosItem = typeof row.dados_item === 'string' 
          ? JSON.parse(row.dados_item) 
          : row.dados_item
        
        console.log('Dados do Item (JSON):', JSON.stringify(dadosItem, null, 2))
        console.log('Sexo:', dadosItem.sexo)
        console.log('Quantidade:', dadosItem.quantidade)
        console.log('Era:', dadosItem.era)
        console.log('ModoCadastro:', dadosItem.modoCadastro)
        console.log('Raça:', dadosItem.raca)
        
        // Calcular quantidade total
        const quantidade = dadosItem.modoCadastro === 'categoria' && dadosItem.quantidade
          ? parseInt(dadosItem.quantidade) || 0
          : 1
        
        console.log('Quantidade calculada:', quantidade)
        
      } catch (e) {
        console.error('Erro ao parsear dados_item:', e.message)
        console.log('Dados_item raw:', row.dados_item)
      }
    })
    
    // Calcular total de animais
    const totalAnimais = itensResult.rows.reduce((total, row) => {
      try {
        const dadosItem = typeof row.dados_item === 'string' 
          ? JSON.parse(row.dados_item) 
          : row.dados_item
        
        if (dadosItem.modoCadastro === 'categoria' && dadosItem.quantidade) {
          return total + (parseInt(dadosItem.quantidade) || 0)
        }
        return total + 1
      } catch (e) {
        return total + 1
      }
    }, 0)
    
    console.log(`\n📊 Total de animais calculado: ${totalAnimais}`)
    
    // Contar por sexo
    const porSexo = { femeas: 0, machos: 0 }
    itensResult.rows.forEach(row => {
      try {
        const dadosItem = typeof row.dados_item === 'string' 
          ? JSON.parse(row.dados_item) 
          : row.dados_item
        
        const quantidade = dadosItem.modoCadastro === 'categoria' && dadosItem.quantidade
          ? parseInt(dadosItem.quantidade) || 0
          : 1
        
        const sexo = String(dadosItem.sexo || '').toLowerCase().trim()
        if (sexo === 'femea' || sexo === 'fêmea' || sexo === 'f' || sexo.includes('femea')) {
          porSexo.femeas += quantidade
        } else if (sexo === 'macho' || sexo === 'm' || sexo.includes('macho')) {
          porSexo.machos += quantidade
        }
      } catch (e) {
        // Ignorar erros
      }
    })
    
    console.log(`\n👥 Por Sexo:`)
    console.log(`   Fêmeas: ${porSexo.femeas}`)
    console.log(`   Machos: ${porSexo.machos}`)
    
  } catch (error) {
    console.error('❌ Erro ao debugar NF 4346:', error)
  } finally {
    process.exit(0)
  }
}

debugNF4346()

