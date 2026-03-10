import { query } from '../../../lib/database'

export default async function transferirLocalizacaoHandler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { id, rack, botijao, caneca } = req.body
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' })
    }

    // Verificar se o registro existe
    const checkResult = await query(`SELECT * FROM estoque_semen WHERE id = $1`, [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro não encontrado' })
    }

    const registro = checkResult.rows[0]

    // Atualizar localização
    await query(
      `UPDATE estoque_semen 
       SET rack_touro = $1, botijao = $2, caneca = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [rack || registro.rack_touro, botijao || registro.botijao, caneca || registro.caneca, id]
    )

    // Buscar registro atualizado
    const result = await query(`SELECT * FROM estoque_semen WHERE id = $1`, [id])

    return res.status(200).json({ 
      success: true, 
      data: result.rows[0],
      message: 'Localização atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao transferir localização:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao transferir localização',
      error: error.message 
    })
  }
}
