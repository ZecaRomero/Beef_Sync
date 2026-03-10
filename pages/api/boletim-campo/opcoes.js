/**
 * API para retornar opções de Era, Raça e Categoria usadas no Boletim Campo
 */
import { query } from '../../../lib/database'

const OPCOES_PADRAO = {
  raca: ['BRAHMAN', 'CRUZA', 'GIR', 'NELORE', 'NELORE PA', 'RECEPTORA'],
  categoria: ['BEZERRO(AS)', 'DESMAMA', 'GARROTE', 'NOVILHA', 'NOVILHAS', 'TOURO', 'VACA'],
  era: ['+23', '+25', '0/7', '12/23', '08/12']
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    const [racaRes, categoriaRes, eraRes] = await Promise.all([
      query('SELECT DISTINCT raca FROM boletim_campo WHERE raca IS NOT NULL AND TRIM(raca) != \'\' ORDER BY raca'),
      query('SELECT DISTINCT categoria FROM boletim_campo WHERE categoria IS NOT NULL AND TRIM(categoria) != \'\' ORDER BY categoria'),
      query('SELECT DISTINCT era FROM boletim_campo WHERE era IS NOT NULL AND TRIM(era) != \'\' ORDER BY era')
    ])

    const racas = [...new Set([...OPCOES_PADRAO.raca, ...(racaRes.rows || []).map(r => r.raca).filter(Boolean)])]
    const categorias = [...new Set([...OPCOES_PADRAO.categoria, ...(categoriaRes.rows || []).map(r => r.categoria).filter(Boolean)])]
    const eras = [...new Set([...OPCOES_PADRAO.era, ...(eraRes.rows || []).map(r => r.era).filter(Boolean)])]

    return res.status(200).json({
      success: true,
      raca: racas,
      categoria: categorias,
      era: eras
    })
  } catch (error) {
    console.error('Erro ao buscar opções:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar opções',
      raca: OPCOES_PADRAO.raca,
      categoria: OPCOES_PADRAO.categoria,
      era: OPCOES_PADRAO.era
    })
  }
}
