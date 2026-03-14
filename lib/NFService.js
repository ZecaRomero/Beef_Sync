/**
 * Re-exporta NFService de services/NFService
 * Usa conexão centralizada (lib/database) em vez de pool próprio
 * @deprecated Use import NFService from '@/services/NFService'
 */
module.exports = require('../services/NFService')
