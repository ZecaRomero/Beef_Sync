import { pool } from '../../../lib/database'
import { asyncHandler, sendSuccess, sendValidationError, sendError, HTTP_STATUS } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

/**
 * Endpoint para excluir TODOS os dados do banco de dados
 * 
 * ⚠️ ATENÇÃO: Esta é uma operação DESTRUTIVA e IRREVERSÍVEL!
 * 
 * Deleta dados de TODAS as tabelas:
 * - Animais e dados relacionados
 * - Notas fiscais e itens
 * - Boletim contábil e movimentações
 * - Inseminações
 * - Gestações e diagnósticos
 * - Nascimentos
 * - Sêmen
 * - Custos
 * - Mortes
 * - Localizações
 * - E todas as outras tabelas
 */
export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  const { confirmacao } = req.body

  // Validação de segurança - requer confirmação explícita
  if (!confirmacao || confirmacao !== 'LIMPAR TUDO DO ZERO') {
    return sendValidationError(res, 
      'Confirmação obrigatória. Envie { confirmacao: "LIMPAR TUDO DO ZERO" } no body da requisição.',
      { required: ['confirmacao'] }
    )
  }

  let client = null

  // Inicializar variáveis antes do try para garantir que existam
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
    logger.info('🚨 INICIANDO LIMPEZA COMPLETA DO BANCO DE DADOS...')
    
    // Lista de todas as tabelas para limpar (em ordem de dependência)
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

    // Contar registros antes da exclusão
    logger.info('📊 Contando registros antes da exclusão...')
    contagensAntes = {}
    
    for (const tabela of tabelas) {
      try {
        const result = await client.query(`SELECT COUNT(*) as total FROM ${tabela}`)
        contagensAntes[tabela] = parseInt(result.rows[0].total, 10)
        logger.info(`   ${tabela}: ${contagensAntes[tabela]} registros`)
      } catch (error) {
        // Tabela pode não existir, ignorar
        contagensAntes[tabela] = 0
        logger.info(`   ⏭️  Tabela ${tabela} não existe ou não acessível`)
      }
    }

    // Excluir dados de cada tabela
    logger.info('🗑️ Excluindo dados de todas as tabelas...')
    
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
            logger.info(`   ⏭️  Tabela ${tabela} não existe, pulando...`)
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
          
          logger.info(`   ✅ ${tabela}: ${excluidos} registros excluídos`)
        } catch (error) {
          logger.error(`   ❌ Erro ao excluir ${tabela}:`, error.message)
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

    // Resetar sequências
    logger.info('🔄 Resetando sequências...')
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
        // Sequência pode não existir, ignorar
        logger.debug(`Sequência ${seq} não existe ou não pode ser resetada`)
      }
    }

    // Verificar contagens finais
    logger.info('📊 Verificando contagens finais...')
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
      logger.warn(`⚠️ ATENÇÃO: Ainda restam ${totalRestante} registros no banco!`)
    } else {
      logger.info('✅ LIMPEZA COMPLETA CONCLUÍDA COM SUCESSO!')
      logger.info(`📊 Total excluído: ${totalExcluido} registros`)
    }

    return sendSuccess(res, resultado, 
      totalRestante === 0 
        ? `Limpeza completa realizada! ${totalExcluido} registros excluídos de ${tabelas.length} tabelas. O banco está limpo e pronto para começar do zero.`
        : `Limpeza parcial realizada. ${totalExcluido} registros excluídos, mas ainda restam ${totalRestante} registros.`,
      totalRestante === 0 ? HTTP_STATUS.OK : HTTP_STATUS.MULTI_STATUS
    )

  } catch (error) {
    logger.error('❌ Erro na limpeza completa:', error)
    logger.error('📋 Stack trace:', error.stack)
    
    // Retornar resposta de erro com dados parciais se disponíveis
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
      logger.info('🔌 Conexão liberada')
    }
  }
})
