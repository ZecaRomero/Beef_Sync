import { pool } from '../../../lib/database'
import { asyncHandler, sendSuccess, sendValidationError, sendError, HTTP_STATUS } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

/**
 * Endpoint para excluir TODOS os dados do banco de dados
 * 
 * âÅ¡ ï¸� ATENÃâ€¡ÃÆ’O: Esta Ã© uma operaÃ§Ã£o DESTRUTIVA e IRREVERSÃ�VEL!
 * 
 * Deleta dados de TODAS as tabelas:
 * - Animais e dados relacionados
 * - Notas fiscais e itens
 * - Boletim contÃ¡bil e movimentaÃ§Ãµes
 * - InseminaÃ§Ãµes
 * - GestaÃ§Ãµes e diagnÃ³sticos
 * - Nascimentos
 * - SÃªmen
 * - Custos
 * - Mortes
 * - LocalizaÃ§Ãµes
 * - E todas as outras tabelas
 */
export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'MÃ©todo nÃ£o permitido' })
  }

  const { confirmacao } = req.body

  // ValidaÃ§Ã£o de seguranÃ§a - requer confirmaÃ§Ã£o explÃ­cita
  if (!confirmacao || confirmacao !== 'LIMPAR TUDO DO ZERO') {
    return sendValidationError(res, 
      'ConfirmaÃ§Ã£o obrigatÃ³ria. Envie { confirmacao: "LIMPAR TUDO DO ZERO" } no body da requisiÃ§Ã£o.',
      { required: ['confirmacao'] }
    )
  }

  let client = null

  // Inicializar variÃ¡veis antes do try para garantir que existam
  let totalExcluido = 0
  let totalRestante = 0
  let resultados = {}
  let erros = []
  let contagensAntes = {}
  let contagensDepois = {}
  let sequenciasResetadas = []
  let tabelas = []

  try {
    client = await pool.connect()
    logger.info('ðÅ¸Å¡¨ INICIANDO LIMPEZA COMPLETA DO BANCO DE DADOS...')
    
    // Lista de todas as tabelas para limpar (em ordem de dependÃªncia)
    tabelas = [
      // Tabelas dependentes primeiro
      'notas_fiscais_itens',
      'notas_fiscais',
      'movimentacoes_contabeis',
      'boletim_contabil',
      'inseminacoes',
      'gestacoes',
      'nascimentos',
      'transferencias_embrioes',
      'custos',
      'localizacoes_animais',
      'mortes',
      'servicos',
      'protocolos_aplicados',
      'ciclos_reprodutivos',
      'notificacoes',
      'animais',
      'estoque_semen',
      'protocolos_reprodutivos',
      'relatorios_personalizados',
      'historia_ocorrencias',
      'lotes_operacoes',
      'nitrogenio',
      'ocorrencias',
      'contatos',
      'cache_contabilidade',
      'notas_fiscais_sincronizadas'
    ]

    resultados = {}
    erros = []

    // Contar registros antes da exclusÃ£o
    logger.info('ðÅ¸â€œÅ  Contando registros antes da exclusÃ£o...')
    contagensAntes = {}
    
    for (const tabela of tabelas) {
      try {
        const result = await client.query(`SELECT COUNT(*) as total FROM ${tabela}`)
        contagensAntes[tabela] = parseInt(result.rows[0].total, 10)
        logger.info(`   ${tabela}: ${contagensAntes[tabela]} registros`)
      } catch (error) {
        // Tabela pode nÃ£o existir, ignorar
        contagensAntes[tabela] = 0
        logger.info(`   â�­ï¸�  Tabela ${tabela} nÃ£o existe ou nÃ£o acessÃ­vel`)
      }
    }

    // Excluir dados de cada tabela
    logger.info('ðÅ¸â€”â€˜ï¸� Excluindo dados de todas as tabelas...')
    
    // Desabilitar temporariamente constraints
    await client.query('SET session_replication_role = replica')
    
    try {
      for (const tabela of tabelas) {
        try {
          // Verificar se tabela existe
          const tableExists = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )
          `, [tabela])
          
          if (!tableExists.rows[0].exists) {
            logger.info(`   â�­ï¸�  Tabela ${tabela} nÃ£o existe, pulando...`)
            resultados[tabela] = { excluidos: 0, antes: 0, status: 'tabela_nao_existe' }
            continue
          }

          // Excluir todos os registros
          const deleteResult = await client.query(`DELETE FROM ${tabela}`)
          const excluidos = deleteResult.rowCount || 0
          
          resultados[tabela] = {
            excluidos,
            antes: contagensAntes[tabela] || 0,
            status: 'sucesso'
          }
          
          logger.info(`   âÅ“â€¦ ${tabela}: ${excluidos} registros excluÃ­dos`)
        } catch (error) {
          logger.error(`   â�Å’ Erro ao excluir ${tabela}:`, error.message)
          erros.push({
            tabela,
            erro: error.message
          })
          resultados[tabela] = {
            excluidos: 0,
            antes: contagensAntes[tabela] || 0,
            status: 'erro',
            erro: error.message
          }
        }
      }
    } finally {
      // Reabilitar constraints
      try {
        await client.query('SET session_replication_role = DEFAULT')
      } catch (error) {
        logger.error('Erro ao reabilitar constraints:', error.message)
      }
    }

    // Resetar sequÃªncias
    logger.info('ðÅ¸â€�â€ž Resetando sequÃªncias...')
    const sequencias = [
      'animais_id_seq',
      'custos_id_seq',
      'gestacoes_id_seq',
      'nascimentos_id_seq',
      'inseminacoes_id_seq',
      'notas_fiscais_id_seq',
      'notas_fiscais_itens_id_seq',
      'boletim_contabil_id_seq',
      'movimentacoes_contabeis_id_seq',
      'estoque_semen_id_seq',
      'mortes_id_seq',
      'localizacoes_animais_id_seq',
      'servicos_id_seq',
      'protocolos_reprodutivos_id_seq',
      'protocolos_aplicados_id_seq',
      'ciclos_reprodutivos_id_seq',
      'notificacoes_id_seq',
      'relatorios_personalizados_id_seq',
      'transferencias_embrioes_id_seq',
      'historia_ocorrencias_id_seq',
      'lotes_operacoes_id_seq',
      'nitrogenio_id_seq',
      'ocorrencias_id_seq',
      'contatos_id_seq'
    ]

    sequenciasResetadas = []
    for (const seq of sequencias) {
      try {
        await client.query(`ALTER SEQUENCE IF EXISTS ${seq} RESTART WITH 1`)
        sequenciasResetadas.push(seq)
      } catch (error) {
        // SequÃªncia pode nÃ£o existir, ignorar
        logger.debug(`SequÃªncia ${seq} nÃ£o existe ou nÃ£o pode ser resetada`)
      }
    }

    // Verificar contagens finais
    logger.info('ðÅ¸â€œÅ  Verificando contagens finais...')
    contagensDepois = {}
    
    for (const tabela of tabelas) {
      try {
        const result = await client.query(`SELECT COUNT(*) as total FROM ${tabela}`)
        contagensDepois[tabela] = parseInt(result.rows[0].total, 10)
      } catch (error) {
        contagensDepois[tabela] = 0
      }
    }

    // Calcular total geral
    totalExcluido = Object.values(contagensAntes).reduce((sum, count) => sum + (count || 0), 0)
    totalRestante = Object.values(contagensDepois).reduce((sum, count) => sum + (count || 0), 0)

    const resultado = {
      total_excluido: totalExcluido,
      total_restante: totalRestante,
      tabelas_processadas: tabelas.length,
      tabelas_com_erro: erros.length,
      resultados_por_tabela: resultados,
      contagens_antes: contagensAntes,
      contagens_depois: contagensDepois,
      sequencias_resetadas: sequenciasResetadas.length,
      erros: erros.length > 0 ? erros : null
    }

    if (totalRestante > 0) {
      logger.warn(`âÅ¡ ï¸� ATENÃâ€¡ÃÆ’O: Ainda restam ${totalRestante} registros no banco!`)
    } else {
      logger.info('âÅ“â€¦ LIMPEZA COMPLETA CONCLUÃ�DA COM SUCESSO!')
      logger.info(`ðÅ¸â€œÅ  Total excluÃ­do: ${totalExcluido} registros`)
    }

    return sendSuccess(res, resultado, 
      totalRestante === 0 
        ? `Limpeza completa realizada! ${totalExcluido} registros excluÃ­dos de ${tabelas.length} tabelas. O banco estÃ¡ limpo e pronto para comeÃ§ar do zero.`
        : `Limpeza parcial realizada. ${totalExcluido} registros excluÃ­dos, mas ainda restam ${totalRestante} registros.`,
      totalRestante === 0 ? HTTP_STATUS.OK : HTTP_STATUS.MULTI_STATUS
    )

  } catch (error) {
    logger.error('â�Å’ Erro na limpeza completa:', error)
    logger.error('ðÅ¸â€œâ€¹ Stack trace:', error.stack)
    
    // Retornar resposta de erro com dados parciais se disponÃ­veis
    const erroResponse = {
      total_excluido: totalExcluido || 0,
      total_restante: totalRestante || 0,
      tabelas_processadas: tabelas ? tabelas.length : 0,
      tabelas_com_erro: erros ? erros.length : 0,
      resultados_por_tabela: resultados || {},
      contagens_antes: contagensAntes || {},
      contagens_depois: contagensDepois || {},
      sequencias_resetadas: sequenciasResetadas ? sequenciasResetadas.length : 0,
      erro: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
    
    return sendError(res, 
      `Erro ao realizar limpeza completa: ${error.message}`, 
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      null,
      erroResponse
    )
  } finally {
    if (client) {
      client.release()
      logger.info('ðÅ¸â€�Å’ ConexÃ£o liberada')
    }
  }
})
