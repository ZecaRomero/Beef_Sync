import { query } from '../../../lib/database'

// Endpoint de debug para verificar a NF 4346
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('🔍 Buscando NF 4346 no banco de dados...')
    
    // Buscar NF 4346
    const nfResult = await query(`
      SELECT 
        nf.*,
        pg_typeof(nf.itens) as tipo_coluna_itens
      FROM notas_fiscais nf
      WHERE nf.numero_nf = $1 OR nf.numero_nf LIKE $2
      ORDER BY nf.id DESC
      LIMIT 5
    `, ['4346', '%4346%'])
    
    console.log(`📋 Encontradas ${nfResult.rows?.length || 0} notas fiscais`)
    
    if (nfResult.rows?.length === 0) {
      // Buscar todas as NFs para ver quais existem
      const todasNFs = await query(`
        SELECT numero_nf, tipo, fornecedor, cnpj_origem_destino, data_compra, data
        FROM notas_fiscais
        WHERE tipo = 'entrada'
        ORDER BY numero_nf DESC
        LIMIT 20
      `)
      
      return res.status(200).json({
        encontrada: false,
        mensagem: 'NF 4346 não encontrada',
        nfs_similares: todasNFs.rows,
        sugestao: 'Verifique se o número da NF está correto ou se existe no banco'
      })
    }
    
    // Processar cada NF encontrada
    const nfsDetalhadas = await Promise.all(nfResult.rows.map(async (nf) => {
      let itens = []
      let erroParse = null
      let itensDaTabela = []
      
      try {
        // Primeiro, tentar buscar do campo JSONB itens
        if (nf.itens) {
          if (typeof nf.itens === 'string') {
            itens = JSON.parse(nf.itens)
          } else if (Array.isArray(nf.itens)) {
            itens = nf.itens
          } else if (nf.itens && typeof nf.itens === 'object') {
            itens = Array.isArray(nf.itens.itens) ? nf.itens.itens : Object.values(nf.itens)
          }
        }
        
        // Se não encontrou itens no campo JSONB, buscar da tabela notas_fiscais_itens
        if ((!itens || itens.length === 0) && nf.id) {
          try {
            const itensTabelaResult = await query(`
              SELECT 
                nfi.*,
                nfi.dados_item
              FROM notas_fiscais_itens nfi
              WHERE nfi.nota_fiscal_id = $1
              ORDER BY nfi.id
            `, [nf.id])
            
            itensDaTabela = itensTabelaResult.rows || []
            
            if (itensDaTabela.length > 0) {
              itens = itensDaTabela.map(row => {
                let dadosItem = row.dados_item
                if (typeof dadosItem === 'string') {
                  try {
                    dadosItem = JSON.parse(dadosItem)
                  } catch (e) {
                    dadosItem = {}
                  }
                }
                return dadosItem
              })
            }
          } catch (e) {
            console.warn(`Erro ao buscar itens da tabela para NF ${nf.id}:`, e.message)
          }
        }
      } catch (e) {
        erroParse = e.message
      }
      
      return {
        id: nf.id,
        numero_nf: nf.numero_nf,
        tipo: nf.tipo,
        fornecedor: nf.fornecedor,
        cnpj_origem_destino: nf.cnpj_origem_destino,
        data_compra: nf.data_compra,
        data: nf.data,
        valor_total: nf.valor_total,
        tipo_coluna_itens: nf.tipo_coluna_itens,
        itens_raw: nf.itens,
        itens_processados: itens,
        quantidade_itens: Array.isArray(itens) ? itens.length : 0,
        quantidade_itens_tabela: itensDaTabela.length,
        erro_parse: erroParse,
        itens_detalhados: Array.isArray(itens) ? itens.map((item, idx) => ({
          indice: idx,
          item_completo: item,
          sexo: item.sexo || item.sexo_animal || item.sexoAnimal || 'N/A',
          raca: item.raca || item.raca_animal || item.racaAnimal || 'N/A',
          meses: item.meses || null,
          era: item.era || null,
          quantidade: item.quantidade || 1
        })) : []
      }
    }))
    
    return res.status(200).json({
      encontrada: true,
      quantidade: nfResult.rows.length,
      nfs: nfsDetalhadas
    })
    
  } catch (error) {
    console.error('❌ Erro ao buscar NF 4346:', error)
    return res.status(500).json({
      erro: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

