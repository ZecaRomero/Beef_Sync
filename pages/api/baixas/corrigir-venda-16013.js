/**
 * API para corrigir venda registrada no animal errado
 * A venda (NF 4145, CLEBER, R$ 28.800) pertence à CJCJ 16013 (MANERA SANT ANNA),
 * mas foi importada incorretamente na CJCJ 17037 (JATAUBA SANT ANNA - filha).
 * 
 * Esta correção:
 * 1. Move a baixa de 17037 para 16013
 * 2. Corrige o valor (28,80 -> 28800)
 * 3. Atualiza situacao/valor_venda em animais
 */
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  try {
    // 1. Buscar a baixa com serie=CJCJ, rg=17037 que tem os dados da venda da 16013
    const baixaResult = await query(`
      SELECT id, animal_id, serie, rg, valor, comprador, numero_nf, data_baixa
      FROM baixas
      WHERE UPPER(TRIM(serie)) = 'CJCJ' 
        AND TRIM(rg::text) = '17037'
        AND tipo = 'VENDA'
        AND (comprador ILIKE '%CLEBER%' OR numero_nf = '4145')
      ORDER BY data_baixa DESC
      LIMIT 1
    `)

    const baixa = baixaResult.rows[0]
    if (!baixa) {
      return res.status(200).json({
        success: true,
        message: 'Nenhuma baixa encontrada para corrigir (CJCJ 17037 com NF 4145/CLEBER)',
        corrigido: false
      })
    }

    // 2. Buscar o animal CJCJ 16013
    const animal16013 = await query(`
      SELECT id FROM animais WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '16013' LIMIT 1
    `)
    const animalId16013 = animal16013.rows[0]?.id
    if (!animalId16013) {
      return res.status(400).json({
        success: false,
        message: 'Animal CJCJ 16013 não encontrado no cadastro'
      })
    }

    // 3. Corrigir valor se estiver errado (28.80 -> 28800)
    let valorCorrigido = parseFloat(baixa.valor)
    if (valorCorrigido > 0 && valorCorrigido < 100) {
      valorCorrigido = valorCorrigido * 1000
    }

    // 4. Atualizar a baixa: mover para 16013
    await query(`
      UPDATE baixas
      SET serie = 'CJCJ', rg = '16013', animal_id = $1, valor = $2
      WHERE id = $3
    `, [animalId16013, valorCorrigido, baixa.id])

    // 5. Remover Vendido da CJCJ 17037 (a venda não era dela)
    await query(`
      UPDATE animais
      SET situacao = CASE WHEN situacao = 'Vendido' THEN 'Ativo' ELSE situacao END,
          valor_venda = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '17037'
    `)

    // 6. Marcar CJCJ 16013 como Vendido
    await query(`
      UPDATE animais
      SET situacao = 'Vendido', valor_venda = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [valorCorrigido, animalId16013])

    return res.status(200).json({
      success: true,
      message: 'Venda corrigida: agora consta na CJCJ 16013 (MANERA SANT ANNA)',
      corrigido: true,
      detalhes: {
        baixaId: baixa.id,
        de: 'CJCJ 17037',
        para: 'CJCJ 16013',
        valorAnterior: baixa.valor,
        valorCorrigido,
        numeroNf: baixa.numero_nf,
        comprador: baixa.comprador
      }
    })
  } catch (error) {
    console.error('Erro ao corrigir venda:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao corrigir venda'
    })
  }
}
