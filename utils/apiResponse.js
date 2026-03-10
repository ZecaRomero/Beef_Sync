/**
 * Utilitário para padronizar respostas de API
 * Garante consistência em todas as respostas da aplicação
 */

/**
 * Códigos de status HTTP mais comuns
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MULTI_STATUS: 207,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
}

/**
 * Tipos de resposta padronizados
 */
export const RESPONSE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

/**
 * Estrutura padrão de resposta da API
 */
class APIResponse {
  constructor(success = true, message = '', data = null, errors = null, meta = null) {
    this.success = success
    this.message = message
    this.timestamp = new Date().toISOString()
    
    if (data !== null) {
      this.data = data
    }
    
    if (errors !== null) {
      this.errors = errors
    }
    
    if (meta !== null) {
      this.meta = meta
    }
  }
}

/**
 * Cria uma resposta de sucesso padronizada
 * @param {Object} res - Objeto de resposta do Express
 * @param {*} data - Dados a serem retornados
 * @param {string} message - Mensagem de sucesso
 * @param {number} statusCode - Código de status HTTP
 * @param {Object} meta - Metadados adicionais (paginação, etc.)
 */
export const sendSuccess = (res, data = null, message = 'Operação realizada com sucesso', statusCode = HTTP_STATUS.OK, meta = null) => {
  const response = new APIResponse(true, message, data, null, meta)
  return res.status(statusCode).json(response)
}

/**
 * Cria uma resposta de erro padronizada
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de erro
 * @param {number} statusCode - Código de status HTTP
 * @param {Array|Object} errors - Detalhes dos erros
 * @param {*} data - Dados adicionais (opcional)
 */
export const sendError = (res, message = 'Erro interno do servidor', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null, data = null) => {
  const response = new APIResponse(false, message, data, errors)
  return res.status(statusCode).json(response)
}

/**
 * Cria uma resposta de validação com erros específicos
 * @param {Object} res - Objeto de resposta do Express
 * @param {Array|Object} validationErrors - Erros de validação
 * @param {string} message - Mensagem principal
 */
export const sendValidationError = (res, validationErrors, message = 'Dados inválidos fornecidos') => {
  return sendError(res, message, HTTP_STATUS.BAD_REQUEST, validationErrors)
}

/**
 * Cria uma resposta de recurso não encontrado
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} resource - Nome do recurso não encontrado
 */
export const sendNotFound = (res, resource = 'Recurso') => {
  return sendError(res, `${resource} não encontrado`, HTTP_STATUS.NOT_FOUND)
}

/**
 * Cria uma resposta de método não permitido
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} method - Método HTTP não permitido
 */
export const sendMethodNotAllowed = (res, method) => {
  return sendError(res, `Método ${method} não permitido`, HTTP_STATUS.METHOD_NOT_ALLOWED)
}

/**
 * Cria uma resposta de conflito (recurso já existe)
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} resource - Nome do recurso em conflito
 */
export const sendConflict = (res, resource = 'Recurso') => {
  return sendError(res, `${resource} já existe`, HTTP_STATUS.CONFLICT)
}

/**
 * Cria uma resposta de acesso negado (403 Forbidden)
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de acesso negado
 */
export const sendForbidden = (res, message = 'Acesso negado') => {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN)
}

/**
 * Cria uma resposta paginada padronizada
 * @param {Object} res - Objeto de resposta do Express
 * @param {Array} data - Dados paginados
 * @param {Object} pagination - Informações de paginação
 * @param {string} message - Mensagem de sucesso
 */
export const sendPaginatedResponse = (res, data, pagination, message = 'Dados recuperados com sucesso') => {
  const meta = {
    pagination: {
      currentPage: pagination.page || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || data.length,
      itemsPerPage: pagination.limit || data.length,
      hasNextPage: pagination.hasNextPage || false,
      hasPreviousPage: pagination.hasPreviousPage || false
    }
  }
  
  return sendSuccess(res, data, message, HTTP_STATUS.OK, meta)
}

/**
 * Wrapper para tratamento de erros assíncronos
 * @param {Function} fn - Função assíncrona a ser executada
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      try {
        const logger = require('./logger').default || require('./logger').logger
        logger?.error('Erro na API:', error)
      } catch (_) {
        console.error('Erro na API:', error)
      }
      
      // Se o erro já foi tratado (resposta já enviada), não fazer nada
      if (res.headersSent) {
        return
      }
      
      // Tratar diferentes tipos de erro
      if (error.name === 'ValidationError') {
        return sendValidationError(res, error.details || error.message)
      }
      
      if (error.name === 'CastError') {
        return sendError(res, 'ID inválido fornecido', HTTP_STATUS.BAD_REQUEST)
      }
      
      if (error.code === 11000) {
        return sendConflict(res, 'Recurso')
      }
      
      // Erro genérico
      return sendError(res, error.message || 'Erro interno do servidor', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  }
}

/**
 * Middleware para validar métodos HTTP permitidos
 * @param {Array} allowedMethods - Métodos HTTP permitidos
 */
export const validateMethods = (allowedMethods) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return sendMethodNotAllowed(res, req.method)
    }
    next()
  }
}

/**
 * Middleware para logging de requisições
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    try {
      const logger = require('./logger').default || require('./logger').logger
      logger?.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`)
    } catch (_) {
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`)
    }
  })
  
  next()
}

/**
 * Envia resposta de health check
 */
export const sendHealthCheck = (res, data, message = 'Sistema operacional') => {
  return res.status(HTTP_STATUS.OK).json({
    status: RESPONSE_TYPES.SUCCESS,
    message,
    data,
    timestamp: new Date().toISOString()
  })
}

/**
 * Envia resposta de não implementado (501)
 */
export const sendNotImplemented = (res, message = 'Funcionalidade não implementada', details = null) => {
  return res.status(HTTP_STATUS.NOT_IMPLEMENTED).json({
    status: RESPONSE_TYPES.ERROR,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  })
}

export default {
  HTTP_STATUS,
  RESPONSE_TYPES,
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendMethodNotAllowed,
  sendConflict,
  sendPaginatedResponse,
  sendHealthCheck,
  asyncHandler,
  validateMethods,
  requestLogger
}