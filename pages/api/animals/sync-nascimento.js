/**
 * API para sincronizar data_nascimento de nascimentos para animais
 * Atualiza animais sem data de nascimento usando os dados da tabela nascimentos (serie+rg)
 */
import { query } from '../../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../../utils/apiResponse'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  try {
    // Atualizar animais que têm data_nascimento NULL usando nascimentos (match por serie+rg)
    const result = await query(`
      UPDATE animais a
      SET data_nascimento = n.data_nascimento,
          hora_nascimento = COALESCE(a.hora_nascimento, n.hora_nascimento),
          updated_at = NOW()
      FROM nascimentos n
      WHERE TRIM(COALESCE(a.serie, '')) = TRIM(COALESCE(n.serie, ''))
        AND TRIM(COALESCE(a.rg::text, '')) = TRIM(COALESCE(n.rg::text, ''))
        AND a.data_nascimento IS NULL
        AND n.data_nascimento IS NOT NULL
    `)

    const atualizados = result?.rowCount ?? 0

    return sendSuccess(res, {
      atualizados,
      mensagem: `${atualizados} animal(is) atualizado(s) com data de nascimento da tabela nascimentos`
    })
  } catch (error) {
    console.error('Erro ao sincronizar nascimentos:', error)
    return sendError(res, `Erro ao sincronizar: ${error.message}`, 500)
  }
}
