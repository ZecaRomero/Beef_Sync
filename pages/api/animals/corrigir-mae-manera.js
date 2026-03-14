/**
 * API para corrigir os dados da mãe MANERA SANT ANNA
 * Atualiza serie_mae e rg_mae para CJCJ 16013
 */
import { query } from '../../../lib/database'
import { sendSuccess, sendError } from '../../../utils/apiResponse'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  try {
    console.log('🔧 Corrigindo dados da mãe MANERA SANT ANNA...')
    
    // Buscar todos os animais que têm MANERA SANT ANNA como mãe
    const animais = await query(
      `SELECT id, serie, rg, nome, mae, serie_mae, rg_mae
       FROM animais
       WHERE UPPER(mae) LIKE '%MANERA%SANT%ANNA%'
          OR UPPER(mae) LIKE '%MANERA%16013%'`
    )
    
    console.log(`📋 Encontrados ${animais.rows.length} animais com MANERA SANT ANNA como mãe`)
    
    if (animais.rows.length === 0) {
      return sendSuccess(res, { updated: 0 }, 'Nenhum animal encontrado')
    }
    
    // Atualizar cada animal
    const updated = []
    for (const animal of animais.rows) {
      console.log(`🔄 Atualizando ${animal.serie} ${animal.rg}...`)
      
      await query(
        `UPDATE animais 
         SET serie_mae = 'CJCJ', rg_mae = '16013'
         WHERE id = $1`,
        [animal.id]
      )
      
      updated.push({
        id: animal.id,
        serie: animal.serie,
        rg: animal.rg,
        nome: animal.nome,
        mae: animal.mae
      })
      
      console.log(`   ✅ Atualizado: serie_mae = 'CJCJ', rg_mae = '16013'`)
    }
    
    console.log('✅ Correção concluída!')
    
    return sendSuccess(res, {
      updated: updated.length,
      animais: updated
    }, `${updated.length} animal(is) atualizado(s) com sucesso`)
    
  } catch (error) {
    console.error('❌ Erro ao corrigir:', error)
    return sendError(res, 'Erro ao corrigir dados da mãe', 500, error.message)
  }
}
