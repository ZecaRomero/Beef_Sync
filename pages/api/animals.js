import databaseService from '../../services/databaseService'
import { logger } from '../../utils/logger'
import boletimContabilService from '../../services/boletimContabilService'
import { racasPorSerie } from '../../services/mockData'
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  sendConflict, 
  sendMethodNotAllowed, 
  asyncHandler, 
  HTTP_STATUS 
} from '../../utils/apiResponse'
import { 
  ValidationError, 
  NotFoundError, 
  DuplicateKeyError,
  throwIfNotFound 
} from '../../utils/apiErrorHandler'
import { withLoteTracking, LOTE_CONFIGS } from '../../utils/loteMiddleware'

// Função para corrigir a raça baseada na série
function corrigirRacaPorSerie(animal) {
  if (animal.serie && racasPorSerie[animal.serie]) {
    const racaCorreta = racasPorSerie[animal.serie]
    if (animal.raca !== racaCorreta) {
      logger.debug(`Corrigindo raça de ${animal.serie}-${animal.rg}: ${animal.raca} → ${racaCorreta}`)
      return { ...animal, raca: racaCorreta }
    }
  }
  return animal
}

// Função para criar nota fiscal de entrada automaticamente
async function criarNotaFiscalEntradaAutomatica(animal) {
  try {
    const nfData = {
      numeroNF: `AUTO-${animal.serie}${animal.rg}-${Date.now()}`,
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

    // Salvar NF no banco de dados
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
    logger.error('Erro ao criar NF automática:', error)
    throw error
  }
}

// Função para calcular era baseada na idade em meses e sexo
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

// Handler original para cadastro de animais
async function animaisHandler(req, res) {
  // Log da requisição
  console.log(`[API] ${req.method} /api/animals - Iniciando processamento`)
  
  if (req.method === 'GET') {
    const { situacao, raca, sexo, serie, rg, orderBy, limit } = req.query
    const filtros = {}
    
    if (situacao) filtros.situacao = situacao
    if (raca) filtros.raca = raca
    if (sexo) filtros.sexo = sexo
    if (serie) filtros.serie = serie
    if (rg) filtros.rg = rg
    if (orderBy) filtros.orderBy = orderBy
    if (limit) filtros.limit = limit
    
    const animais = await databaseService.buscarAnimais(filtros)
    
    // Adicionar campo identificacao para compatibilidade com componentes
    // e corrigir raça baseada na série
    const animaisComIdentificacao = animais.map(animal => {
      const animalCorrigido = corrigirRacaPorSerie(animal)
      return {
        ...animalCorrigido,
        identificacao: `${animalCorrigido.serie}-${animalCorrigido.rg}`,
        dataNascimento: animalCorrigido.data_nascimento,
        precoVenda: animalCorrigido.valor_venda,
        status: animalCorrigido.situacao,
        avoMaterno: animalCorrigido.avo_materno || animalCorrigido.avoMaterno,
        localNascimento: animalCorrigido.local_nascimento,
        pastoAtual: animalCorrigido.pasto_atual || animalCorrigido.piquete_atual,
        piqueteAtual: animalCorrigido.piquete_atual || animalCorrigido.pasto_atual,
        situacao_abcz: animalCorrigido.situacao_abcz || animalCorrigido.situacaoAbcz || null,
        situacaoAbcz: animalCorrigido.situacao_abcz || animalCorrigido.situacaoAbcz || null
      }
    })
    
    logger.debug(`[API] GET /api/animals - Enviando resposta com ${animaisComIdentificacao.length} animais`)
    console.log(`[API] GET /api/animals - Enviando resposta com ${animaisComIdentificacao.length} animais`)
    return sendSuccess(res, animaisComIdentificacao, 'Animais recuperados com sucesso')
    
  } else if (req.method === 'POST') {
    const { serie, rg, sexo, raca, boletim, pasto_atual, preRegistro } = req.body
    
    // Pré-cadastro: só Série e RG obrigatórios; demais campos opcionais
    const isPreRegistro = preRegistro === true || preRegistro === 'true'
    if (isPreRegistro) {
      if (!serie?.trim() || !rg?.trim()) {
        return sendValidationError(res, 'Pré-cadastro exige Série e RG', {
          required: ['serie', 'rg'],
          provided: { serie: !!serie?.trim(), rg: !!rg?.trim() }
        })
      }
    } else {
      // Cadastro completo: validação normal
      if (!serie || !rg || !sexo || !raca || !boletim || !pasto_atual) {
        return sendValidationError(res, 'Dados obrigatórios não fornecidos', {
          required: ['serie', 'rg', 'sexo', 'raca', 'boletim', 'pasto_atual'],
          provided: { serie: !!serie, rg: !!rg, sexo: !!sexo, raca: !!raca, boletim: !!boletim, pasto_atual: !!pasto_atual }
        })
      }
    }
    
    // Mapear dados do formulário para o formato do banco
    const defaults = isPreRegistro ? { sexo: 'Não informado', raca: 'Não informada', boletim: 'Pré-cadastro', pasto_atual: req.body.pasto_atual || req.body.piquete_atual || null } : {}
    const animalData = {
      nome: req.body.nome || null,
      serie: (req.body.serie || '').trim(),
      rg: (req.body.rg || '').trim(),
      tatuagem: req.body.tatuagem || null,
      sexo: req.body.sexo || defaults.sexo,
      raca: req.body.raca || defaults.raca,
      data_nascimento: req.body.dataNascimento || req.body.data_nascimento || null,
      data_chegada: req.body.dataChegada || req.body.data_chegada || null,
      hora_nascimento: req.body.horaNascimento || req.body.hora_nascimento || null,
      peso: req.body.peso || null,
      cor: req.body.cor || null,
      tipo_nascimento: req.body.tipoNascimento || req.body.tipo_nascimento || null,
      dificuldade_parto: req.body.dificuldadeParto || req.body.dificuldade_parto || null,
      meses: req.body.meses || null,
      situacao: req.body.situacao || 'Ativo',
      pai: req.body.pai || null,
      serie_pai: req.body.paiSerie || null,
      rg_pai: req.body.paiRg || null,
      mae: req.body.mae || null,
      serie_mae: req.body.maeSerie || null,
      rg_mae: req.body.maeRg || null,
      avo_materno: req.body.avoMaterno || req.body.avo_materno || null,
      receptora: req.body.receptora || null,
      is_fiv: req.body.isFiv || false,
      custo_total: req.body.custoTotal || req.body.custo_total || 0,
      valor_venda: req.body.valorVenda || req.body.valor_venda || null,
      valor_real: req.body.valorReal || req.body.valor_real || null,
      veterinario: req.body.veterinario || null,
      abczg: req.body.abczg || null,
      deca: req.body.deca || null,
      iqg: req.body.iqg || null,
      pt_iqg: req.body.pt_iqg || null,
      observacoes: req.body.observacoes || null,
      boletim: req.body.boletim || defaults.boletim || null,
      local_nascimento: req.body.local_nascimento || null,
      pasto_atual: req.body.pasto_atual || req.body.piquete_atual || defaults.pasto_atual || null
    }
    
    try {
      // Buscar informações do animal na internet antes de criar
      let dadosInternet = null
      try {
        const animalSearchService = (await import('../../services/animalSearchService')).default
        dadosInternet = await animalSearchService.searchAnimal(req.body.serie, req.body.rg)
        
        // Preencher campos vazios com dados encontrados na internet
        if (dadosInternet && dadosInternet.dados_encontrados) {
          if (!animalData.observacoes && dadosInternet.informacoes.observacoes) {
            animalData.observacoes = dadosInternet.informacoes.observacoes
          }
          // Adicionar informações encontradas nas observações
          if (dadosInternet.informacoes.origem_registro) {
            animalData.observacoes = (animalData.observacoes || '') + 
              `\n[Dados da Internet] Origem: ${dadosInternet.informacoes.origem_registro}`
          }
        }
      } catch (searchError) {
        logger.warn(`Erro ao buscar animal na internet (continuando cadastro): ${searchError.message}`)
        // Não falhar o cadastro se a busca falhar
      }
      
      const animal = await databaseService.criarAnimal(animalData)
      
      // Lote será criado automaticamente pelo middleware
      
      // DESABILITADO COMPLETAMENTE: Não criar nota fiscal de entrada automaticamente
      // Animais de nascimento (com tipo_nascimento) NÃO devem ter NF de entrada
      // Apenas animais comprados devem ter NF, e isso deve ser feito manualmente
      // através do módulo de Notas Fiscais
      // 
      // Verificação adicional: se o animal tem tipo_nascimento, é nascimento, não compra
      // if (!animalData.tipo_nascimento && animalData.fornecedor) {
      //   try {
      //     await criarNotaFiscalEntradaAutomatica(animal)
      //     logger.info(`NF de entrada criada automaticamente para: ${animal.serie}${animal.rg}`)
      //   } catch (nfError) {
      //     logger.error(`Erro ao criar NF automática: ${nfError.message}`)
      //   }
      // }
      
      // Registrar compra no Boletim Contábil automaticamente
      if (req.body.valorCompra && req.body.dataCompra) {
        try {
          await boletimContabilService.registrarCompra({
            dataCompra: req.body.dataCompra,
            serie: req.body.serie,
            rg: req.body.rg,
            sexo: req.body.sexo,
            raca: req.body.raca,
            pesoCompra: req.body.pesoCompra,
            valorCompra: parseFloat(req.body.valorCompra),
            fornecedor: req.body.fornecedor,
            notaFiscal: req.body.notaFiscal,
            observacoes: `Compra de animal - ${req.body.serie} ${req.body.rg}`
          })
          logger.info(`Compra registrada no Boletim Contábil: ${req.body.serie}${req.body.rg}`)
        } catch (boletimError) {
          logger.error(`Erro ao registrar compra no Boletim: ${boletimError.message}`)
          // Não falhar o cadastro por erro no boletim
        }
      }
      
      // Adicionar campo identificacao
      const animalComIdentificacao = {
        ...animal,
        identificacao: `${animal.serie}-${animal.rg}`,
        dataNascimento: animal.data_nascimento,
        precoVenda: animal.valor_venda,
        status: animal.situacao
      }
      
      logger.debug(`[API] POST /api/animals - Enviando resposta de sucesso para animal criado`)
      return sendSuccess(res, animalComIdentificacao, 'Animal criado com sucesso', HTTP_STATUS.CREATED)
      
    } catch (error) {
      // Tratar erros específicos do banco de dados
      if (error.code === '23505') { // Violação de constraint única
        return sendConflict(res, 'Animal com esta série/RG já existe', {
          serie: req.body.serie,
          rg: req.body.rg
        })
      } else if (error.code === '23502') { // Violação de NOT NULL
        return sendValidationError(res, 'Dados obrigatórios não fornecidos', {
          field: error.column,
          constraint: 'NOT NULL'
        })
      } else if (error.code === '23514') { // Violação de CHECK
        return sendValidationError(res, 'Valor inválido fornecido', {
          constraint: 'CHECK',
          detail: error.detail
        })
      }
      
      throw error // Re-throw para ser capturado pelo asyncHandler
    }
    
  } else {
    logger.debug(`[API] ${req.method} /api/animals - Método não permitido`)
    return sendMethodNotAllowed(res, ['GET', 'POST'])
  }
}

// Exportar handler com middleware de lotes aplicado apenas para POST
export default asyncHandler(withLoteTracking(animaisHandler, LOTE_CONFIGS.CADASTRO_ANIMAL))
