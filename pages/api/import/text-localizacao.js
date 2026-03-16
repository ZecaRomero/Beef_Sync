/**
 * API para importar localizações via texto colado
 * POST - Processa dados de localização colados do Excel
 */
import { query } from '../../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../../utils/apiResponse'
import { blockIfNotZecaDeveloper } from '../../../utils/importAccess'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  const blocked = blockIfNotZecaDeveloper(req, res)
  if (blocked) return blocked

  try {
    const { dados } = req.body

    if (!dados || !Array.isArray(dados) || dados.length === 0) {
      return sendError(res, 'Nenhum dado válido fornecido', 400)
    }

    console.log(`Iniciando importação de ${dados.length} linhas...`)

    const resultados = {
      animaisAtualizados: 0,
      localizacoesRegistradas: 0,
      totalLinhas: dados.length,
      naoEncontrados: [],
      erros: []
    }

    // Processar em lotes de 10 para melhor performance
    const BATCH_SIZE = 10
    for (let i = 0; i < dados.length; i += BATCH_SIZE) {
      const batch = dados.slice(i, i + BATCH_SIZE)
      
      await Promise.all(batch.map(async (linha, batchIndex) => {
        const numeroLinha = i + batchIndex + 1
        const { serie, rg, local, observacoes } = linha

        // Validar dados da linha
        if (!serie || !rg || !local) {
          const camposFaltando = []
          if (!serie) camposFaltando.push('SÉRIE')
          if (!rg) camposFaltando.push('RG')
          if (!local) camposFaltando.push('LOCAL')
          
          resultados.erros.push({
            linha: numeroLinha,
            serie: serie || '(vazio)',
            rg: rg || '(vazio)',
            local: local || '(vazio)',
            motivo: `Campos obrigatórios faltando: ${camposFaltando.join(', ')}`
          })
          return
        }

        try {
          // Buscar animal por série e RG (busca flexível: trim, case-insensitive, rg com/sem zeros à esquerda)
          const serieNorm = String(serie || '').trim()
          const rgNorm = String(rg || '').trim()

          const animalResult = await query(
            `SELECT id, serie, rg FROM animais 
             WHERE UPPER(TRIM(serie)) = UPPER($1) 
             AND (
               TRIM(rg::text) = $2 
               OR TRIM(LEADING '0' FROM rg::text) = TRIM(LEADING '0' FROM $2)
               OR rg::text = TRIM(LEADING '0' FROM $2)
             )
             LIMIT 1`,
            [serieNorm, rgNorm]
          )

          if (animalResult.rows.length === 0) {
            resultados.naoEncontrados.push({
              linha: numeroLinha,
              serie: serie,
              rg: rg,
              local: local,
              motivo: 'Animal não encontrado no banco de dados'
            })
            return
          }

          const animalId = animalResult.rows[0].id

          // Atualizar piquete_atual do animal
          await query(
            `UPDATE animais 
             SET piquete_atual = $1, 
                 data_entrada_piquete = CURRENT_DATE,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [local, animalId]
          )
          resultados.animaisAtualizados++

          // Registrar na tabela de localizações (UPSERT: tabela tem UNIQUE(animal_id))
          const observacoesVal = observacoes || `Importado em ${new Date().toLocaleString('pt-BR')}`
          const locExist = await query(
            'SELECT id FROM localizacoes_animais WHERE animal_id = $1',
            [animalId]
          )
          if (locExist.rows.length > 0) {
            await query(
              `UPDATE localizacoes_animais 
               SET piquete = $1, data_entrada = CURRENT_DATE, data_saida = NULL,
                   motivo_movimentacao = $2, observacoes = $3, usuario_responsavel = $4, updated_at = CURRENT_TIMESTAMP
               WHERE animal_id = $5`,
              [local, 'Importação via texto', observacoesVal, 'Sistema', animalId]
            )
          } else {
            await query(
              `INSERT INTO localizacoes_animais 
               (animal_id, piquete, data_entrada, motivo_movimentacao, observacoes, usuario_responsavel)
               VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)`,
              [animalId, local, 'Importação via texto', observacoesVal, 'Sistema']
            )
          }
          resultados.localizacoesRegistradas++

        } catch (error) {
          console.error(`Erro ao processar linha ${numeroLinha} (${serie} ${rg}):`, error)
          resultados.erros.push({
            linha: numeroLinha,
            serie: serie,
            rg: rg,
            local: local,
            motivo: `Erro no banco de dados: ${error.message}`
          })
        }
      }))
    }

    console.log(`Importação concluída: ${resultados.animaisAtualizados} atualizados, ${resultados.naoEncontrados.length} não encontrados, ${resultados.erros.length} erros`)

    return sendSuccess(res, {
      success: true,
      message: `Importação concluída! ${resultados.animaisAtualizados} animais atualizados.`,
      resultados
    })

  } catch (error) {
    console.error('Erro ao importar texto:', error)
    return sendError(res, error.message || 'Erro ao processar importação', 500)
  }
}
