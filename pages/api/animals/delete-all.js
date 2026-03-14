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
 * âÅ¡ ï¸� ATENÃâ€¡ÃÆ’O: Esta Ã© uma operaÃ§Ã£o DESTRUTIVA e IRREVERSÃ�VEL!
 * 
 * Deleta:
 * - Todos os animais
 * - Todos os custos relacionados (CASCADE)
 * - Todas as localizaÃ§Ãµes relacionadas (CASCADE)
 * - Todas as mortes relacionadas (CASCADE)
 * - ReferÃªncias em outras tabelas serÃ£o setadas para NULL (SET NULL)
 */
export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  const { confirmacao, senha } = req.body

  // ValidaÃ§Ã£o de seguranÃ§a - requer confirmaÃ§Ã£o explÃ­cita
  if (!confirmacao || confirmacao !== 'EXCLUIR TODOS OS ANIMAIS') {
    return sendValidationError(res, 
      'ConfirmaÃ§Ã£o obrigatÃ³ria. Envie { confirmacao: "EXCLUIR TODOS OS ANIMAIS" } no body da requisiÃ§Ã£o.',
      { required: ['confirmacao'] }
    )
  }

  const client = await pool.connect()

  try {
    console.log('ðÅ¸Å¡¨ INICIANDO EXCLUSÃÆ’O DE TODOS OS ANIMAIS...')
    
    // 1. Contar animais antes da exclusÃ£o
    const countAntes = await client.query('SELECT COUNT(*) as total FROM animais')
    const totalAntes = parseInt(countAntes.rows[0].total, 10)
    console.log(`ðÅ¸â€œÅ  Total de animais ANTES da exclusÃ£o: ${totalAntes}`)

    if (totalAntes === 0) {
      return sendSuccess(res, {
        total_excluidos: 0,
        mensagem: 'NÃ£o hÃ¡ animais para excluir'
      }, 'Nenhum animal encontrado para excluir')
    }

    // 2. Contar registros relacionados que serÃ£o deletados (CASCADE)
    const custosCount = await client.query('SELECT COUNT(*) as total FROM custos')
    const localizacoesCount = await client.query('SELECT COUNT(*) as total FROM localizacoes_animais')
    
    // Verificar se tabela mortes existe
    let mortesCount = { rows: [{ total: 0 }] }
    try {
      mortesCount = await client.query('SELECT COUNT(*) as total FROM mortes')
    } catch (error) {
      console.log('ââ€ž¹ï¸� Tabela mortes nÃ£o existe ou nÃ£o acessÃ­vel')
    }
    
    console.log(`ðÅ¸â€œÅ  Registros relacionados que serÃ£o deletados:`)
    console.log(`   - Custos: ${custosCount.rows[0].total}`)
    console.log(`   - LocalizaÃ§Ãµes: ${localizacoesCount.rows[0].total}`)
    console.log(`   - Mortes: ${mortesCount.rows[0].total}`)

    // 3. Excluir todos os animais (CASCADE vai deletar registros relacionados automaticamente)
    console.log('ðÅ¸â€”â€˜ï¸� Excluindo todos os animais...')
    
    // Desabilitar temporariamente constraints para garantir exclusÃ£o completa
    await client.query('SET session_replication_role = replica')
    
    try {
      // Excluir em ordem para evitar problemas de foreign key
      // Primeiro deletar registros que referenciam animais mas nÃ£o tÃªm CASCADE
      await client.query('UPDATE servicos SET animal_id = NULL WHERE animal_id IS NOT NULL')
      await client.query('UPDATE movimentacoes_contabeis SET animal_id = NULL WHERE animal_id IS NOT NULL')
      await client.query('UPDATE notificacoes SET animal_id = NULL WHERE animal_id IS NOT NULL')
      
      // Agora deletar animais (CASCADE vai deletar custos, localizaÃ§Ãµes, mortes automaticamente)
      const deleteResult = await client.query('DELETE FROM animais RETURNING id, serie, rg')
      
      console.log(`âÅ“â€¦ ${deleteResult.rows.length} animais excluÃ­dos`)
    } finally {
      // Reabilitar constraints
      await client.query('SET session_replication_role = DEFAULT')
    }

    // 4. Verificar que realmente foram excluÃ­dos
    const countDepois = await client.query('SELECT COUNT(*) as total FROM animais')
    const totalDepois = parseInt(countDepois.rows[0].total, 10)
    
    if (totalDepois > 0) {
      console.error(`â�Å’ ERRO: Ainda restam ${totalDepois} animais no banco!`)
      throw new Error(`Falha na exclusÃ£o. Ainda restam ${totalDepois} animais no banco.`)
    }

    // 5. Verificar registros relacionados foram deletados
    const custosDepois = await client.query('SELECT COUNT(*) as total FROM custos')
    const localizacoesDepois = await client.query('SELECT COUNT(*) as total FROM localizacoes_animais')
    
    let mortesDepois = { rows: [{ total: 0 }] }
    try {
      mortesDepois = await client.query('SELECT COUNT(*) as total FROM mortes')
    } catch (error) {
      // Ignorar se tabela nÃ£o existe
    }

    console.log(`ðÅ¸â€œÅ  VerificaÃ§Ã£o pÃ³s-exclusÃ£o:`)
    console.log(`   - Animais restantes: ${totalDepois}`)
    console.log(`   - Custos restantes: ${custosDepois.rows[0].total}`)
    console.log(`   - LocalizaÃ§Ãµes restantes: ${localizacoesDepois.rows[0].total}`)
    console.log(`   - Mortes restantes: ${mortesDepois.rows[0].total}`)

    // 6. Resetar sequÃªncias para comeÃ§ar do 1 novamente
    console.log('ðÅ¸â€�â€ž Resetando sequÃªncias...')
    await client.query('ALTER SEQUENCE animais_id_seq RESTART WITH 1')
    console.log('âÅ“â€¦ SequÃªncias resetadas')

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

    console.log('âÅ“â€¦ EXCLUSÃÆ’O COMPLETA CONCLUÃ�DA COM SUCESSO!')
    console.log(`ðÅ¸â€œÅ  Resumo: ${totalAntes} animais excluÃ­dos`)

    return sendSuccess(res, resultado, 
      `Todos os ${totalAntes} animais foram excluÃ­dos com sucesso. O banco estÃ¡ limpo e pronto para nova importaÃ§Ã£o.`,
      HTTP_STATUS.OK
    )

  } catch (error) {
    console.error('â�Å’ Erro ao excluir animais:', error)
    console.error('ðÅ¸â€œâ€¹ Stack trace:', error.stack)
    
    // Tentar fazer rollback se houver transaÃ§Ã£o ativa
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      // Ignorar erro de rollback
    }
    
    throw error
  } finally {
    client.release()
    console.log('ðÅ¸â€�Å’ ConexÃ£o liberada')
  }
})
