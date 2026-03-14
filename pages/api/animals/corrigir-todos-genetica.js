/**
 * API para corrigir dados genÃ©ticos de TODOS os animais
 * Identifica animais onde:
 * - situacao_abcz contÃ©m um nÃºmero (deveria ser IQG)
 * - iqg contÃ©m um nÃºmero pequeno (deveria ser Pt IQG)
 */
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'MÃ©todo nÃ£o permitido' })
  }

  try {
    console.log('ðÅ¸â€�§ Iniciando correÃ§Ã£o em massa de dados genÃ©ticos...')
    
    // Buscar TODOS os animais com situacao_abcz numÃ©rico
    // Isso indica que os dados foram importados nas colunas erradas
    // TambÃ©m buscar animais onde IQG Ã© muito pequeno (< 10) e situacao_abcz tem valor
    const result = await query(`
      SELECT 
        id, serie, rg, nome, 
        abczg, deca, iqg, pt_iqg, 
        situacao_abcz, genetica_2, decile_2
      FROM animais 
      WHERE (
        -- Caso 1: situacao_abcz Ã© numÃ©rico
        (situacao_abcz IS NOT NULL AND situacao_abcz ~ '^[0-9]+\\.?[0-9]*$')
        OR
        -- Caso 2: IQG muito pequeno (< 10) E situacao_abcz tem valor numÃ©rico
        (iqg IS NOT NULL AND iqg < 10 AND situacao_abcz IS NOT NULL AND situacao_abcz ~ '^[0-9]+\\.?[0-9]*$')
      )
      ORDER BY serie, rg
    `)
    
    console.log(`ðÅ¸â€œâ€¹ Encontrados ${result.rows.length} animais com dados incorretos`)
    
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum animal com dados incorretos encontrado!',
        corrigidos: 0,
        animais: []
      })
    }
    
    const animaisCorrigidos = []
    let erros = []
    
    for (const animal of result.rows) {
      try {
        console.log(`\nðÅ¸â€�� Corrigindo: ${animal.serie} ${animal.rg} (${animal.nome || 'Sem nome'})`)
        
        const antes = {
          abczg: animal.abczg,
          deca: animal.deca,
          iqg: animal.iqg,
          pt_iqg: animal.pt_iqg,
          situacao_abcz: animal.situacao_abcz
        }
        
        // LÃ³gica de correÃ§Ã£o:
        // situacao_abcz (nÃºmero) ââ€ â€™ iqg
        // iqg (valor atual) ââ€ â€™ pt_iqg
        // situacao_abcz ââ€ â€™ NULL
        
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
        
      } catch (error) {
        console.error(`   â�Å’ Erro ao corrigir ${animal.serie} ${animal.rg}:`, error.message)
        erros.push({
          serie: animal.serie,
          rg: animal.rg,
          erro: error.message
        })
      }
    }
    
    console.log(`\nâÅ“â€¦ CorreÃ§Ã£o concluÃ­da! ${animaisCorrigidos.length} animais corrigidos.`)
    if (erros.length > 0) {
      console.log(`âÅ¡ ï¸�  ${erros.length} erros encontrados.`)
    }
    
    return res.status(200).json({
      success: true,
      message: `${animaisCorrigidos.length} animais corrigidos com sucesso!`,
      corrigidos: animaisCorrigidos.length,
      erros: erros.length,
      animais: animaisCorrigidos,
      errosDetalhes: erros
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
