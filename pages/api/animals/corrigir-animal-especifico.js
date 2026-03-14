/**
 * API para corrigir dados genÃ©ticos de um animal especÃ­fico
 */
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'MÃ©todo nÃ£o permitido' })
  }

  const { serie, rg, iqg, pt_iqg } = req.body

  if (!serie || !rg) {
    return res.status(400).json({ success: false, message: 'SÃ©rie e RG sÃ£o obrigatÃ³rios' })
  }

  try {
    console.log(`ðÅ¸â€�§ Corrigindo animal: ${serie} ${rg}`)
    
    // Buscar animal atual
    const result = await query(
      `SELECT id, serie, rg, nome, abczg, deca, iqg, pt_iqg, situacao_abcz
       FROM animais 
       WHERE serie = $1 AND rg = $2`,
      [serie, rg]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Animal nÃ£o encontrado'
      })
    }
    
    const animal = result.rows[0]
    
    console.log('Dados ANTES:', {
      iqg: animal.iqg,
      pt_iqg: animal.pt_iqg,
      situacao_abcz: animal.situacao_abcz
    })
    
    // Atualizar com os valores corretos
    await query(
      `UPDATE animais 
       SET 
         iqg = $1,
         pt_iqg = $2,
         situacao_abcz = NULL,
         updated_at = NOW()
       WHERE id = $3`,
      [iqg, pt_iqg, animal.id]
    )
    
    console.log('Dados DEPOIS:', {
      iqg: iqg,
      pt_iqg: pt_iqg,
      situacao_abcz: null
    })
    
    return res.status(200).json({
      success: true,
      message: 'Animal corrigido com sucesso!',
      animal: {
        id: animal.id,
        serie: animal.serie,
        rg: animal.rg,
        nome: animal.nome,
        antes: {
          iqg: animal.iqg,
          pt_iqg: animal.pt_iqg,
          situacao_abcz: animal.situacao_abcz
        },
        depois: {
          iqg: iqg,
          pt_iqg: pt_iqg,
          situacao_abcz: null
        }
      }
    })
    
  } catch (error) {
    console.error('â�Å’ Erro ao corrigir animal:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao corrigir animal',
      error: error.message
    })
  }
}
