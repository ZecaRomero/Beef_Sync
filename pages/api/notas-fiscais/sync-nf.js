import { query } from '../../../lib/database'

// Importar databaseService de forma compatível
let databaseService
try {
  const dbServiceModule = require('../../../services/databaseService')
  databaseService = dbServiceModule.default || dbServiceModule
  
  // Verificar se o método existe
  if (!databaseService || typeof databaseService.registrarMovimentacao !== 'function') {
    throw new Error('databaseService.registrarMovimentacao não está disponível')
  }
  
  console.log('✅ databaseService carregado com sucesso')
} catch (importError) {
  console.error('❌ Erro ao carregar databaseService:', importError)
  throw importError
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido' 
    })
  }

  try {
    console.log('📥 Requisição recebida para sincronizar NF:', req.body)
    
    const { numeroNF } = req.body || {}

    if (!numeroNF) {
      console.error('❌ Número da NF não fornecido')
      return res.status(400).json({
        success: false,
        message: 'Número da NF é obrigatório'
      })
    }
    
    console.log(`🔍 Buscando NF ${numeroNF}...`)

    // Buscar a NF
    const nfResult = await query(`
      SELECT * FROM notas_fiscais
      WHERE numero_nf = $1
    `, [numeroNF])

    if (nfResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `NF ${numeroNF} não encontrada`
      })
    }

    const nf = nfResult.rows[0]
    console.log(`✅ NF ${numeroNF} encontrada (ID: ${nf.id})`)

    // Buscar itens da NF
    console.log(`🔍 Buscando itens da NF ${numeroNF} (ID: ${nf.id})...`)
    const itensResult = await query(`
      SELECT dados_item FROM notas_fiscais_itens
      WHERE nota_fiscal_id = $1 AND tipo_produto = 'bovino'
    `, [nf.id])
    
    console.log(`📋 ${itensResult.rows.length} itens encontrados`)

    // Parse seguro dos itens
    const itens = itensResult.rows.map(row => {
      try {
        if (typeof row.dados_item === 'string') {
          return JSON.parse(row.dados_item)
        } else if (typeof row.dados_item === 'object' && row.dados_item !== null) {
          return row.dados_item
        } else {
          console.warn(`⚠️ Item com formato inválido:`, row.dados_item)
          return null
        }
      } catch (parseError) {
        console.error(`❌ Erro ao parsear item da NF ${numeroNF}:`, parseError)
        return null
      }
    }).filter(item => item !== null)

    if (itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: `NF ${numeroNF} não possui itens de bovino válidos`
      })
    }
    
    console.log(`✅ NF ${numeroNF}: ${itens.length} itens encontrados`)

    // Verificar incrição
    const incricao = nf.incricao || ''
    const incricaoUpper = incricao.toUpperCase()
    const incricaoValida = incricaoUpper === 'SANT ANNA' || incricaoUpper === 'PARDINHO'

    console.log(`📋 NF ${numeroNF}:`, {
      tipo: nf.tipo,
      incricao: incricao,
      incricaoValida: incricaoValida,
      fornecedor: nf.fornecedor,
      cnpj: nf.cnpj_origem_destino
    })

    if (!incricaoValida && nf.tipo === 'entrada') {
      return res.status(400).json({
        success: false,
        message: `NF ${numeroNF} não possui incrição válida (SANT ANNA ou PARDINHO). Incrição atual: "${incricao}"`
      })
    }

    // Buscar fornecedor para verificar CNPJ
    let cnpjFornecedor = nf.cnpj_origem_destino
    let nomeFornecedor = nf.fornecedor

    if (!cnpjFornecedor && nomeFornecedor) {
      try {
        const fornecedorResult = await query(`
          SELECT cnpj_cpf, nome FROM fornecedores_destinatarios
          WHERE nome ILIKE $1 AND tipo = 'fornecedor'
          LIMIT 1
        `, [`%${nomeFornecedor}%`])
        
        if (fornecedorResult.rows.length > 0) {
          cnpjFornecedor = fornecedorResult.rows[0].cnpj_cpf
          nomeFornecedor = fornecedorResult.rows[0].nome
        }
      } catch (error) {
        console.error('Erro ao buscar CNPJ do fornecedor:', error)
      }
    }

    // Normalizar CNPJ
    const normalizarCNPJ = (cnpj) => {
      if (!cnpj) return null
      return cnpj.replace(/[.\-\/\s]/g, '').trim()
    }

    const cnpjPardinho = '18978214000445'
    const cnpjFornecedorNormalizado = normalizarCNPJ(cnpjFornecedor)
    const nomeFornecedorUpper = nomeFornecedor?.toUpperCase() || ''
    const ehPardinho = cnpjFornecedorNormalizado === cnpjPardinho || nomeFornecedorUpper.includes('PARDINHO')

    // Verificar se deve registrar
    const deveRegistrarEntrada = nf.tipo === 'entrada' && (ehPardinho || incricaoValida)
    const deveRegistrarSaida = nf.tipo === 'saida'

    if (!deveRegistrarEntrada && !deveRegistrarSaida) {
      return res.status(400).json({
        success: false,
        message: `NF ${numeroNF} não atende aos critérios para registro no boletim contábil`
      })
    }

    // Remover movimentações antigas desta NF
    try {
      await query(
        `DELETE FROM movimentacoes_contabeis 
         WHERE (dados_extras::jsonb->>'numeroNF' = $1 OR dados_extras::jsonb->>'numero_nf' = $1)
         AND tipo = $2`,
        [String(numeroNF), nf.tipo]
      )
      console.log(`🗑️ Movimentações antigas da NF ${numeroNF} removidas`)
    } catch (deleteError) {
      console.warn(`⚠️ Erro ao remover movimentações antigas:`, deleteError.message)
    }

    // Função para calcular meses da era
    function calcularMesesDaEra(era) {
      if (!era) return null
      const eraLower = era.toLowerCase().trim()
      if (eraLower.includes('24/36') || eraLower.includes('24-36')) return 30
      if (eraLower.includes('0') && eraLower.includes('3')) return 1.5
      if (eraLower.includes('3') && eraLower.includes('8')) return 5.5
      if (eraLower.includes('8') && eraLower.includes('12')) return 10
      if (eraLower.includes('12') && eraLower.includes('24')) return 18
      if (eraLower.includes('25') && eraLower.includes('36')) return 30.5
      if (eraLower.includes('acima') || (eraLower.includes('36') && !eraLower.includes('24'))) return 48
      const mesesMatch = era.match(/(\d+)\s*meses?/i)
      if (mesesMatch) return parseInt(mesesMatch[1])
      return null
    }

    // Buscar animais existentes
    const animaisIds = []
    for (const item of itens) {
      if (item.modoCadastro === 'categoria') continue
      
      let serie = ''
      let rg = ''
      if (item.tatuagem) {
        if (item.tatuagem.includes('-')) {
          [serie, rg] = item.tatuagem.split('-')
        } else {
          serie = item.tatuagem.substring(0, 4)
          rg = item.tatuagem.substring(4)
        }
      }

      const animalExistente = await query(`
        SELECT id FROM animais 
        WHERE serie = $1 AND rg = $2
        LIMIT 1
      `, [serie || 'NF', rg || item.tatuagem || '0'])

      if (animalExistente.rows.length > 0) {
        animaisIds.push(animalExistente.rows[0].id)
      }
    }

    // Validar data antes de processar
    const dataMovimento = nf.data || nf.data_compra
    if (!dataMovimento) {
      console.error(`❌ NF ${numeroNF} não possui data válida`)
      return res.status(400).json({
        success: false,
        message: `NF ${numeroNF} não possui data válida`
      })
    }

    // Registrar movimentações
    const periodoAtual = new Date(dataMovimento).toISOString().slice(0, 7)
    let registradas = 0
    const erros = []

    console.log(`📋 Processando ${itens.length} itens da NF ${numeroNF} para período ${periodoAtual}`)
    console.log(`📅 Data de movimento: ${dataMovimento}`)
    console.log(`🏢 Localidade: ${incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA')}`)

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i]
      
      try {
        if (nf.tipo === 'entrada') {
          if (item.modoCadastro === 'categoria') {
            const quantidade = parseInt(item.quantidade) || 1
            const valorUnitario = parseFloat(String(item.valorUnitario || item.valor_unitario || 0).replace(',', '.')) || 0
            const valorTotal = valorUnitario * quantidade
            
            // Identificar sexo corretamente
            const sexoRaw = String(item.sexo || '').trim().toLowerCase()
            const sexoTexto = sexoRaw === 'macho' || sexoRaw === 'm' || sexoRaw.startsWith('macho') ? 'Macho' : 'Fêmea'
            
            console.log(`📝 Item ${i + 1}: ${quantidade} animais (${sexoTexto}) - R$ ${valorTotal.toFixed(2)}`)
            
            const dadosMovimentacao = {
              periodo: periodoAtual,
              tipo: 'entrada',
              subtipo: 'compra',
              dataMovimento: dataMovimento,
              animalId: null,
              valor: valorTotal,
              descricao: `Compra de ${quantidade} bovino(s) via NF ${numeroNF} - ${item.tipoAnimal === 'registrado' ? 'Registrado' : 'Cria/Recria'} - ${sexoTexto} - ${item.era || 'N/A'}`,
              observacoes: `Quantidade: ${quantidade} | Tipo: ${item.tipoAnimal === 'registrado' ? 'Registrado' : 'Cria/Recria'} | ${item.raca || 'Não informado'} | Valor unitário: R$ ${valorUnitario.toFixed(2)}`,
              localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
              dadosExtras: {
                numeroNF: numeroNF,
                numero_nf: numeroNF,
                fornecedor: nomeFornecedor,
                cnpjFornecedor: cnpjFornecedor,
                tipoProduto: 'bovino',
                modoCadastro: 'categoria',
                quantidade: quantidade,
                tipoAnimal: item.tipoAnimal,
                era: item.era,
                sexo: item.sexo,
                incricao: incricao || null
              }
            }
            
            console.log(`💾 Registrando movimentação com dados:`, {
              periodo: dadosMovimentacao.periodo,
              tipo: dadosMovimentacao.tipo,
              subtipo: dadosMovimentacao.subtipo,
              dataMovimento: dadosMovimentacao.dataMovimento,
              valor: dadosMovimentacao.valor,
              localidade: dadosMovimentacao.localidade
            })
            
            await databaseService.registrarMovimentacao(dadosMovimentacao)
            registradas++
            console.log(`✅ Movimentação registrada: ${quantidade} animais (${sexoTexto}) - R$ ${valorTotal.toFixed(2)}`)
          } else {
            const animalId = animaisIds[i] || null
            const valorUnitario = parseFloat(String(item.valorUnitario || item.valor_unitario || 0).replace(',', '.')) || 0
            
            const sexoRaw = String(item.sexo || '').trim().toLowerCase()
            const sexoTexto = sexoRaw === 'macho' || sexoRaw === 'm' || sexoRaw.startsWith('macho') ? 'Macho' : 'Fêmea'
            
            const dadosMovimentacao = {
              periodo: periodoAtual,
              tipo: 'entrada',
              subtipo: 'compra',
              dataMovimento: dataMovimento,
              animalId: animalId,
              valor: valorUnitario,
              descricao: `Compra de bovino via NF ${numeroNF}`,
              observacoes: `Animal: ${item.tatuagem || 'N/A'} - ${item.raca || 'Não informado'} - ${sexoTexto}`,
              localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
              dadosExtras: {
                numeroNF: numeroNF,
                numero_nf: numeroNF,
                fornecedor: nomeFornecedor,
                cnpjFornecedor: cnpjFornecedor,
                tipoProduto: 'bovino',
                era: item.era,
                peso: item.peso,
                incricao: incricao || null
              }
            }
            
            await databaseService.registrarMovimentacao(dadosMovimentacao)
            registradas++
            console.log(`✅ Movimentação registrada: Animal ${item.tatuagem || 'N/A'} - R$ ${valorUnitario.toFixed(2)}`)
          }
        } else if (nf.tipo === 'saida') {
          // Lógica para saída se necessário
          const animalId = animaisIds[i] || null
          const valorUnitario = parseFloat(String(item.valorUnitario || item.valor_unitario || 0).replace(',', '.')) || 0
          
          await databaseService.registrarMovimentacao({
            periodo: periodoAtual,
            tipo: 'saida',
            subtipo: 'venda',
            dataMovimento: dataMovimento,
            animalId: animalId,
            valor: valorUnitario,
            descricao: `Venda de bovino via NF ${numeroNF}`,
            observacoes: `Animal: ${item.tatuagem || 'N/A'} - ${item.raca || 'Não informado'}`,
            localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
            dadosExtras: {
              numeroNF: numeroNF,
              numero_nf: numeroNF,
              destino: nf.destino,
              tipoProduto: 'bovino',
              incricao: incricao || null
            }
          })
          registradas++
        }
      } catch (itemError) {
        console.error(`❌ Erro ao registrar movimentação para item ${i + 1} da NF ${numeroNF}:`, itemError)
        console.error(`   Item:`, JSON.stringify(item, null, 2))
        console.error(`   Stack:`, itemError.stack)
        erros.push(`Item ${i + 1}: ${itemError.message}`)
      }
    }
    
    if (erros.length > 0) {
      console.warn(`⚠️ ${erros.length} erro(s) ao processar itens da NF ${numeroNF}:`, erros)
      
      // Se todos os itens falharam, retornar erro
      if (registradas === 0) {
        return res.status(500).json({
          success: false,
          message: `Erro ao sincronizar NF ${numeroNF}: Nenhuma movimentação foi registrada`,
          erros: erros
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: `${registradas} movimentação(ões) registrada(s) no boletim contábil para NF ${numeroNF}`,
      registradas: registradas,
      totalItens: itens.length,
      incricao: incricao,
      localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA')
    })

  } catch (error) {
    console.error('❌ Erro ao sincronizar NF:', error)
    console.error('Stack trace:', error.stack)
    console.error('Request body:', req.body)
    
    // Retornar mensagem de erro mais detalhada
    const errorMessage = error.message || 'Erro desconhecido'
    const errorDetails = process.env.NODE_ENV === 'development' ? error.stack : undefined
    
    return res.status(500).json({
      success: false,
      message: `Erro ao sincronizar NF: ${errorMessage}`,
      error: errorMessage,
      details: errorDetails
    })
  }
}

