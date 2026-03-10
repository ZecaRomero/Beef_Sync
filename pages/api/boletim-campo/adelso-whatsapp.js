/**
 * API para cadastrar/obter WhatsApp do Adelso (uma única vez)
 */
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT whatsapp FROM boletim_campo_users WHERE LOWER(nome) = $1',
        ['adelso']
      )
      const whatsapp = result.rows[0]?.whatsapp || null
      return res.status(200).json({ success: true, whatsapp })
    } catch (error) {
      console.error('Erro ao buscar WhatsApp Adelso:', error)
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { whatsapp } = req.body
      const digits = (whatsapp || '').replace(/\D/g, '')
      if (digits.length < 10) {
        return res.status(400).json({ success: false, message: 'WhatsApp inválido. Informe DDD + número.' })
      }
      const numero = digits.startsWith('55') ? digits : `55${digits}`

      await query(
        'UPDATE boletim_campo_users SET whatsapp = $1, updated_at = NOW() WHERE LOWER(nome) = $2',
        [numero, 'adelso']
      )
      return res.status(200).json({ success: true, whatsapp: numero })
    } catch (error) {
      console.error('Erro ao salvar WhatsApp Adelso:', error)
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  return res.status(405).json({ message: 'Método não permitido' })
}
