/**
 * API para corrigir mapeamento de dados genÃ©ticos
 * Corrige animais onde os valores foram importados nas colunas erradas
 */
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'MÃ©todo nÃ£o permitido' })
  }

  try {
    console.log('ðÅ¸â€�§ Iniciando correÃ§Ã£o de dados genÃ©ticos...')
    
    // Buscar animais com situacao_abcz numÃ©rico (indica importaÃ§Ã£o errada)
    const result = await query(`
      SELECT id, serie, rg, nome, abczg, deca, iqg, pt_iqg, situacao_abcz, genetica_2, decile_2
      FROM animais 
      WHERE situacao_abcz ~ '^[0-9]+\\.?[0-9]*$'
      ORDER BY serie, rg
    `)
    
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum animal com dados incorretos encontrado!',
        corrigidos: 0,
        animais: []
      })
    }
    
    console.log(`ðÅ¸â€œâ€¹ Encontrados ${result.rows.length} animais com dados incorretos`)
    
    const animaisCorrigidos = []
    
    for (const animal of result.rows) {
      console.log(`\nðÅ¸â€�� Corrigindo: ${animal.serie} ${animal.rg}`)
      
      const antes = {
        abczg: animal.abczg,
        deca: animal.deca,
        iqg: animal.iqg,
        pt_iqg: animal.pt_iqg,
        situacao_abcz: animal.situacao_abcz
      }
      
      // Corrigir mapeamento:
      // situacao_abcz (que tem nÃºmero) -> iqg
      // iqg (que tem Pt IQG) -> pt_iqg
      // situacao_abcz -> NULL (limpar)
      
      const novoIqg = parseFloat(animal.situacao_abcz) || null
      const novoPtIqg = animal.iqg || null
      
      await query(`
        UPDATE animais 
        SET 
          iqg = $1,
          pt_iqg = $2,
          situacao_abcz = NULL,
          updated_at = NOW()
        WHERE id = $3
      `, [novoIqg, novoPtIqg, animal.id])
      
      const depois = {
        abczg: animal.abczg,
        deca: animal.deca,
        iqg: novoIqg,
        pt_iqg: novoPtIqg,
        situacao_abcz: null
      }
      
      animaisCorrigidos.push({
        id: animal.id,
        serie: animal.serie,
        rg: animal.rg,
        nome: animal.nome,
        antes,
        depois
      })
      
      console.log(`   âÅ“â€¦ Corrigido: IQG ${antes.iqg} ââ€ â€™ ${novoIqg}, Pt IQG ${antes.pt_iqg} ââ€ â€™ ${novoPtIqg}`)
    }
    
    console.log(`\nâÅ“â€¦ CorreÃ§Ã£o concluÃ­da! ${animaisCorrigidos.length} animais corrigidos.`)
    
    return res.status(200).json({
      success: true,
      message: `${animaisCorrigidos.length} animais corrigidos com sucesso!`,
      corrigidos: animaisCorrigidos.length,
      animais: animaisCorrigidos
    })
    
  } catch (error) {
    console.error('â�Å’ Erro ao corrigir dados genÃ©ticos:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao corrigir dados genÃ©ticos',
      error: error.message
    })
  }
}
