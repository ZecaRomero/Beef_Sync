import databaseService from '../../../services/databaseService'
import logger from '../../../utils/logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    logger.info('Iniciando sincronização de animais com notas fiscais')

    // Buscar todos os animais
    const animais = await databaseService.buscarAnimais()
    logger.info(`Encontrados ${animais.length} animais para sincronizar`)

    let nfsCriadas = 0
    let erros = 0

    // Processar cada animal
    for (const animal of animais) {
      try {
        // IMPORTANTE: Pular animais de nascimento - eles NÃO devem ter NF de entrada
        // Animais de nascimento são identificados pelo campo tipo_nascimento preenchido
        // ou pela ausência de fornecedor/valor_compra
        if (animal.tipo_nascimento || (!animal.fornecedor && !animal.valor_compra)) {
          logger.info(`Animal ${animal.serie}${animal.rg} é de nascimento - pulando criação de NF`)
          continue
        }
        
        // Verificar se já existe NF para este animal
        const jaExisteNF = await verificarNFExistente(animal)
        if (jaExisteNF) {
          logger.info(`NF já existe para animal ${animal.serie}${animal.rg}`)
          continue
        }

        // DESABILITADO COMPLETAMENTE: Não criar notas fiscais automaticamente
        // As NFs devem ser criadas manualmente através do módulo de Notas Fiscais
        // Apenas animais comprados (com NF manual) devem ter notas fiscais
        // if (animal.situacao === 'Ativo') {
        //   await criarNotaFiscalEntradaAutomatica(animal)
        //   nfsCriadas++
        //   logger.info(`NF de entrada criada para: ${animal.serie}${animal.rg}`)
        // }
        
        // if (animal.situacao === 'Vendido' && animal.valor_venda) {
        //   await criarNotaFiscalSaidaAutomatica(animal)
        //   nfsCriadas++
        //   logger.info(`NF de saída criada para: ${animal.serie}${animal.rg}`)
        // }

      } catch (error) {
        erros++
        logger.error(`Erro ao sincronizar animal ${animal.serie}${animal.rg}:`, error)
      }
    }

    const resultado = {
      success: true,
      message: `Sincronização concluída: ${nfsCriadas} notas fiscais criadas, ${erros} erros. Nota: Criação automática de NFs foi desabilitada.`,
      detalhes: {
        totalAnimais: animais.length,
        nfsCriadas: 0, // Sempre 0 agora, pois está desabilitado
        erros
      }
    }

    logger.info('Sincronização de animais com NFs concluída', resultado)
    res.status(200).json(resultado)

  } catch (error) {
    logger.error('Erro na sincronização de animais com NFs:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
}

async function verificarNFExistente(animal) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'}/api/notas-fiscais`)
    if (response.ok) {
      const nfs = await response.json()
      const nfsArray = Array.isArray(nfs) ? nfs : (Array.isArray(nfs.data) ? nfs.data : [])
      
      return nfsArray.some(nf => 
        nf.numeroNF?.includes(`${animal.serie}${animal.rg}`) ||
        nf.itens?.some(item => 
          item.tatuagem === `${animal.serie}-${animal.rg}` ||
          item.tatuagem === animal.rg
        )
      )
    }
    return false
  } catch (error) {
    logger.error('Erro ao verificar NF existente:', error)
    return false
  }
}

async function criarNotaFiscalEntradaAutomatica(animal) {
  try {
    const nfData = {
      numeroNF: `AUTO-ENTRADA-${animal.serie}${animal.rg}-${Date.now()}`,
      data: animal.data_nascimento || new Date().toISOString().split('T')[0],
      fornecedor: animal.fornecedor || null,
      naturezaOperacao: 'Compra',
      observacoes: `NF gerada automaticamente para animal ${animal.serie} ${animal.rg}`,
      tipoProduto: 'bovino',
      tipo: 'entrada',
      itens: [{
        tatuagem: `${animal.serie}-${animal.rg}`,
        sexo: animal.sexo,
        era: calcularEra(animal.meses, animal.sexo),
        raca: animal.raca,
        peso: animal.peso || 0,
        valorUnitario: animal.valor_compra || 0,
        tipoProduto: 'bovino'
      }],
      valorTotal: animal.valor_compra || 0,
      dataCadastro: new Date().toISOString()
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'}/api/notas-fiscais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nfData)
    })

    if (!response.ok) {
      throw new Error(`Erro ao criar NF: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    logger.error('Erro ao criar NF de entrada automática:', error)
    throw error
  }
}

async function criarNotaFiscalSaidaAutomatica(animal) {
  try {
    const nfData = {
      numeroNF: `AUTO-SAIDA-${animal.serie}${animal.rg}-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      destino: animal.comprador || 'Venda Direta',
      naturezaOperacao: 'Venda',
      observacoes: `NF gerada automaticamente para venda do animal ${animal.serie} ${animal.rg}`,
      tipoProduto: 'bovino',
      tipo: 'saida',
      itens: [{
        tatuagem: `${animal.serie}-${animal.rg}`,
        sexo: animal.sexo,
        era: calcularEra(animal.meses, animal.sexo),
        raca: animal.raca,
        peso: animal.peso || 0,
        valorUnitario: animal.valor_venda || 0,
        tipoProduto: 'bovino'
      }],
      valorTotal: animal.valor_venda || 0,
      dataCadastro: new Date().toISOString()
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'}/api/notas-fiscais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nfData)
    })

    if (!response.ok) {
      throw new Error(`Erro ao criar NF: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    logger.error('Erro ao criar NF de saída automática:', error)
    throw error
  }
}

function calcularEra(meses, sexo) {
  if (!meses || meses <= 0) return 'Não informado'
  
  const isFemea = sexo && (sexo.toLowerCase().includes('fêmea') || sexo.toLowerCase().includes('femea') || sexo === 'F')
  const isMacho = sexo && (sexo.toLowerCase().includes('macho') || sexo === 'M')
  
  if (isFemea) {
    // FÊMEA: 0-7 / 7-12 / 12-18 / 18-24 / 24+
    if (meses <= 7) return '0/7'
    if (meses <= 12) return '7/12'
    if (meses <= 18) return '12/18'
    if (meses <= 24) return '18/24'
    return '24+'
  } else if (isMacho) {
    // MACHO: 0-7 / 7-15 / 15-18 / 18-22 / 22+
    if (meses <= 7) return '0/7'
    if (meses <= 15) return '7/15'
    if (meses <= 18) return '15/18'
    if (meses <= 22) return '18/22'
    return '22+'
  }
  
  // Se não tem sexo definido, usar padrão antigo para compatibilidade
  if (meses <= 7) return '0/7'
  if (meses <= 12) return '7/12'
  if (meses <= 18) return '12/18'
  if (meses <= 24) return '18/24'
  return '24+'
}
