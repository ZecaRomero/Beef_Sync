import { pool } from '../../../lib/database'
import { 
  sendSuccess, 
  sendValidationError, 
  sendMethodNotAllowed, 
  asyncHandler, 
  HTTP_STATUS 
} from '../../../utils/apiResponse'

/**
 * Endpoint para excluir TODOS os animais do banco de dados
 * 
 * ⚠️ ATENÇÃO: Esta é uma operação DESTRUTIVA e IRREVERSÍVEL!
 * 
 * Deleta:
 * - Todos os animais
 * - Todos os custos relacionados (CASCADE)
 * - Todas as localizações relacionadas (CASCADE)
 * - Todas as mortes relacionadas (CASCADE)
 * - Referências em outras tabelas serão setadas para NULL (SET NULL)
 */
export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  const { confirmacao, senha } = req.body

  // Validação de segurança - requer confirmação explícita
  if (!confirmacao || confirmacao !== 'EXCLUIR TODOS OS ANIMAIS') {
    return sendValidationError(res, 
      'Confirmação obrigatória. Envie { confirmacao: "EXCLUIR TODOS OS ANIMAIS" } no body da requisição.',
      { required: ['confirmacao'] }
    )
  }

  const client = await pool.connect()

  try {
    console.log('🚨 INICIANDO EXCLUSÃO DE TODOS OS ANIMAIS...')
    
    // 1. Contar animais antes da exclusão
    const countAntes = await client.query('SELECT COUNT(*) as total FROM animais')
    const totalAntes = parseInt(countAntes.rows[0].total, 10)
    console.log(`📊 Total de animais ANTES da exclusão: ${totalAntes}`)

    if (totalAntes === 0) {
      return sendSuccess(res, {
        total_excluidos: 0,
        mensagem: 'Não há animais para excluir'
      }, 'Nenhum animal encontrado para excluir')
    }

    // 2. Contar registros relacionados que serão deletados (CASCADE)
    const custosCount = await client.query('SELECT COUNT(*) as total FROM custos')
    const localizacoesCount = await client.query('SELECT COUNT(*) as total FROM localizacoes_animais')
    
    // Verificar se tabela mortes existe
    let mortesCount = { rows: [{ total: 0 }] }
    try {
      mortesCount = await client.query('SELECT COUNT(*) as total FROM mortes')
    } catch (error) {
      console.log('ℹ️ Tabela mortes não existe ou não acessível')
    }
    
    console.log(`📊 Registros relacionados que serão deletados:`)
    console.log(`   - Custos: ${custosCount.rows[0].total}`)
    console.log(`   - Localizações: ${localizacoesCount.rows[0].total}`)
    console.log(`   - Mortes: ${mortesCount.rows[0].total}`)

    // 3. Excluir todos os animais (CASCADE vai deletar registros relacionados automaticamente)
    console.log('🗑️ Excluindo todos os animais...')
    
    // Desabilitar temporariamente constraints para garantir exclusão completa
    await client.query('SET session_replication_role = replica')
    
    try {
      // Excluir em ordem para evitar problemas de foreign key
      // Primeiro deletar registros que referenciam animais mas não têm CASCADE
      await client.query('UPDATE servicos SET animal_id = NULL WHERE animal_id IS NOT NULL')
      await client.query('UPDATE movimentacoes_contabeis SET animal_id = NULL WHERE animal_id IS NOT NULL')
      await client.query('UPDATE notificacoes SET animal_id = NULL WHERE animal_id IS NOT NULL')
      
      // Agora deletar animais (CASCADE vai deletar custos, localizações, mortes automaticamente)
      const deleteResult = await client.query('DELETE FROM animais RETURNING id, serie, rg')
      
      console.log(`✅ ${deleteResult.rows.length} animais excluídos`)
    } finally {
      // Reabilitar constraints
      await client.query('SET session_replication_role = DEFAULT')
    }

    // 4. Verificar que realmente foram excluídos
    const countDepois = await client.query('SELECT COUNT(*) as total FROM animais')
    const totalDepois = parseInt(countDepois.rows[0].total, 10)
    
    if (totalDepois > 0) {
      console.error(`❌ ERRO: Ainda restam ${totalDepois} animais no banco!`)
      throw new Error(`Falha na exclusão. Ainda restam ${totalDepois} animais no banco.`)
    }

    // 5. Verificar registros relacionados foram deletados
    const custosDepois = await client.query('SELECT COUNT(*) as total FROM custos')
    const localizacoesDepois = await client.query('SELECT COUNT(*) as total FROM localizacoes_animais')
    
    let mortesDepois = { rows: [{ total: 0 }] }
    try {
      mortesDepois = await client.query('SELECT COUNT(*) as total FROM mortes')
    } catch (error) {
      // Ignorar se tabela não existe
    }

    console.log(`📊 Verificação pós-exclusão:`)
    console.log(`   - Animais restantes: ${totalDepois}`)
    console.log(`   - Custos restantes: ${custosDepois.rows[0].total}`)
    console.log(`   - Localizações restantes: ${localizacoesDepois.rows[0].total}`)
    console.log(`   - Mortes restantes: ${mortesDepois.rows[0].total}`)

    // 6. Resetar sequências para começar do 1 novamente
    console.log('🔄 Resetando sequências...')
    await client.query('ALTER SEQUENCE animais_id_seq RESTART WITH 1')
    console.log('✅ Sequências resetadas')

    const resultado = {
      total_excluidos: totalAntes,
      registros_relacionados_excluidos: {
        custos: parseInt(custosCount.rows[0].total, 10),
        localizacoes: parseInt(localizacoesCount.rows[0].total, 10),
        mortes: parseInt(mortesCount.rows[0].total, 10)
      },
      verificacao: {
        animais_restantes: totalDepois,
        custos_restantes: parseInt(custosDepois.rows[0].total, 10),
        localizacoes_restantes: parseInt(localizacoesDepois.rows[0].total, 10),
        mortes_restantes: parseInt(mortesDepois.rows[0].total, 10)
      },
      sequencias_resetadas: true
    }

    console.log('✅ EXCLUSÃO COMPLETA CONCLUÍDA COM SUCESSO!')
    console.log(`📊 Resumo: ${totalAntes} animais excluídos`)

    return sendSuccess(res, resultado, 
      `Todos os ${totalAntes} animais foram excluídos com sucesso. O banco está limpo e pronto para nova importação.`,
      HTTP_STATUS.OK
    )

  } catch (error) {
    console.error('❌ Erro ao excluir animais:', error)
    console.error('📋 Stack trace:', error.stack)
    
    // Tentar fazer rollback se houver transação ativa
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      // Ignorar erro de rollback
    }
    
    throw error
  } finally {
    client.release()
    console.log('🔌 Conexão liberada')
  }
})
