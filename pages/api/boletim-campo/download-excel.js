import { query } from '../../../lib/database'
import { generateBoletimCampoWorkbook } from '../../../utils/boletimCampoExcel'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    const dadosResult = await query(`
      SELECT id, local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao
      FROM boletim_campo
      ORDER BY local, local_1, sub_local_2
    `)
    const dados = dadosResult.rows || []

    const historicoResult = await query(`
      SELECT m.id, m.tipo, m.destino_local, m.destino_sub_local, m.motivo, m.quantidade,
             m.sexo, m.era, m.raca, m.categoria, m.observacao, m.usuario, m.created_at,
             b.local, b.local_1, b.sub_local_2
      FROM boletim_campo_movimentacoes m
      LEFT JOIN boletim_campo b ON b.id = m.boletim_campo_id
      ORDER BY m.created_at DESC
      LIMIT 500
    `)
    const historico = historicoResult.rows || []

    const workbook = await generateBoletimCampoWorkbook(dados, historico)
    const buffer = await workbook.xlsx.writeBuffer()
    const now = new Date()
    const dataStr = now.toISOString().split('T')[0]
    const horaStr = now.toTimeString().slice(0, 5).replace(':', 'h')
    const filename = `Boletim_Campo_${dataStr}_${horaStr}.xlsx`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(Buffer.from(buffer))
  } catch (error) {
    console.error('Erro download Excel:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
