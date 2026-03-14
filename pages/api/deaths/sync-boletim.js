import databaseService from '../../../services/databaseService'
import logger from '../../../utils/logger'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        status: 'error',
        message: `MÃ©todo ${req.method} nÃ£o permitido`
      })
    }

    logger.info('ðÅ¸â€�â€ž Iniciando sincronizaÃ§Ã£o de mortes com boletim contÃ¡bil...')

    // Buscar todas as mortes registradas
    const mortes = await databaseService.buscarMortes()
    
    if (mortes.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Nenhuma morte encontrada para sincronizar',
        sincronizadas: 0,
        timestamp: new Date().toISOString()
      })
    }

    let sincronizadas = 0
    let erros = 0
    const detalhes = []

    // Processar cada morte
    for (const morte of mortes) {
      try {
        // Verificar se jÃ¡ existe movimentaÃ§Ã£o para esta morte
        const movimentacaoExistente = await databaseService.query(`
          SELECT id FROM movimentacoes_contabeis 
          WHERE animal_id = $1 AND subtipo = 'morte' AND data_movimento = $2
        `, [morte.animal_id, morte.data_morte])

        if (movimentacaoExistente.rows.length > 0) {
          detalhes.push({
            animal: `${morte.serie} ${morte.rg}`,
            status: 'jÃ¡_sincronizada',
            message: 'MovimentaÃ§Ã£o jÃ¡ existe no boletim'
          })
          continue
        }

        // Registrar no boletim contÃ¡bil
        const periodo = new Date(morte.data_morte).toISOString().slice(0, 7) // YYYY-MM
        
        await databaseService.registrarMovimentacao({
          periodo: periodo,
          tipo: 'saida',
          subtipo: 'morte',
          dataMovimento: morte.data_morte,
          animalId: morte.animal_id,
          valor: parseFloat(morte.valor_perda) || 0,
          descricao: `Morte do animal ${morte.serie} ${morte.rg}`,
          observacoes: morte.observacoes || '',
          dadosExtras: {
            causa: morte.causa_morte,
            serie: morte.serie,
            rg: morte.rg,
            sexo: morte.sexo,
            raca: morte.raca,
            peso: morte.peso
          }
        })

        sincronizadas++
        detalhes.push({
          animal: `${morte.serie} ${morte.rg}`,
          status: 'sincronizada',
          message: 'Registrada no boletim contÃ¡bil',
          valor: morte.valor_perda
        })

        logger.info(`âÅ“â€¦ Morte sincronizada: ${morte.serie} ${morte.rg}`)

      } catch (error) {
        erros++
        detalhes.push({
          animal: `${morte.serie} ${morte.rg}`,
          status: 'erro',
          message: error.message
        })
        logger.error(`â�Å’ Erro ao sincronizar morte ${morte.serie} ${morte.rg}:`, error)
      }
    }

    logger.info(`ðÅ¸Å½â€° SincronizaÃ§Ã£o concluÃ­da: ${sincronizadas} mortes sincronizadas, ${erros} erros`)

    res.status(200).json({
      status: 'success',
      message: 'SincronizaÃ§Ã£o concluÃ­da',
      sincronizadas,
      erros,
      total: mortes.length,
      detalhes,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Erro na sincronizaÃ§Ã£o de mortes:', error)
    
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    })
  }
}
