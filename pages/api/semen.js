import databaseService from '../../services/databaseService'
import semenService from '../../services/semenService'
import { sendSuccess, sendError, sendMethodNotAllowed, asyncHandler, HTTP_STATUS } from '../../utils/apiResponse'
import { withLoteTracking, LOTE_CONFIGS } from '../../utils/loteMiddleware'

const semenHandler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const semenStock = await databaseService.buscarEstoqueSemen(req.query)
      return sendSuccess(res, semenStock, 'Estoque de sêmen obtido com sucesso')
    } catch (error) {
      console.error('Erro ao buscar estoque de sêmen:', error)
      return sendError(res, 'Erro ao buscar estoque de sêmen', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    }
  } else if (req.method === 'POST') {
    try {
      const { tipoOperacao } = req.body;
      
      let result;
      if (tipoOperacao === 'saida') {
        // Suporte a saída em lote: se vier um array em req.body.saidas, processar múltiplas
        if (Array.isArray(req.body.saidas)) {
          result = await semenService.registrarSaidaLote(req.body.saidas)
        } else {
          result = await semenService.registrarSaida(req.body);
        }
      } else {
        result = await semenService.adicionarEntrada(req.body);
      }
      
      if (result.success) {
        const responseData = Array.isArray(result.data) 
          ? { resultados: result.data, count: result.count, errors: result.errors }
          : result.data || { count: result.count };
        return sendSuccess(res, responseData, result.message, HTTP_STATUS.CREATED)
      } else {
        // Falha parcial em lote: retornar 200 com dados para o cliente exibir detalhes
        if (Array.isArray(req.body?.saidas) && result.count > 0) {
          const data = { count: result.count, errors: result.errors, resultados: result.data }
          return sendSuccess(res, data, result.message, HTTP_STATUS.OK)
        }
        return sendError(res, result.message, HTTP_STATUS.BAD_REQUEST, result.error || result.errors)
      }
    } catch (error) {
      console.error('Erro ao processar sêmen:', error)
      return sendError(res, 'Erro ao processar operação de sêmen', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    }
  } else {
    return sendMethodNotAllowed(res, req.method)
  }
}

// Determinar configuração de lote baseado no método e tipo de operação
function getSemenLoteConfig(req) {
  if (req.method === 'POST') {
    const { tipoOperacao } = req.body || {};
    
    // Log para depuração de template
    console.log('🔍 [API Semen] Processando lote:', {
      tipoOperacao,
      body: req.body,
      templateEntrada: LOTE_CONFIGS.ENTRADA_SEMEN.descricao_template
    });

    if (tipoOperacao === 'saida') {
      // Se for lote, usar configuração específica com contagem
      if (Array.isArray(req.body.saidas)) {
        return LOTE_CONFIGS.SAIDA_SEMEN_LOTE
      }
      return LOTE_CONFIGS.SAIDA_SEMEN;
    } else {
      return LOTE_CONFIGS.ENTRADA_SEMEN;
    }
  }
  return null;
}

export const config = { api: { externalResolver: true } }
export default asyncHandler(withLoteTracking(semenHandler, getSemenLoteConfig))
