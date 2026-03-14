import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id, serie, rg } = req.query

  // Log para debug
  console.log('🔍 Verificar animal:', { id, serie, rg })

  try {
    let result

    if (id) {
      const animalId = parseInt(id, 10)
      if (isNaN(animalId)) {
        // Se não é número, pode ser RG
        result = await query(
          `SELECT id, serie, rg, nome, data_nascimento, situacao 
           FROM animais 
           WHERE rg = $1`,
          [id]
        )
      } else {
        result = await query(
          `SELECT id, serie, rg, nome, data_nascimento, situacao 
           FROM animais 
           WHERE id = $1`,
          [animalId]
        )
      }
    } else if (rg) {
      // Buscar apenas por RG
      result = await query(
        `SELECT id, serie, rg, nome, data_nascimento, situacao 
         FROM animais 
         WHERE rg = $1`,
        [rg]
      )
    } else if (serie && rg) {
      // Busca flexível: série case-insensitive, rg aceita texto ou número
      result = await query(
        `SELECT id, serie, rg, nome, data_nascimento, situacao 
         FROM animais 
         WHERE UPPER(TRIM(COALESCE(serie,''))) = UPPER(TRIM($1)) 
         AND (rg::text = $2 OR TRIM(rg::text) = TRIM($2))`,
        [String(serie).trim(), String(rg).trim()]
      )
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Forneça id, rg ou serie+rg' 
      })
    }

    if (result.rows.length === 0) {
      // Verificar se existe algum animal com ID próximo ou similar
      let sugestoes = []
      
      if (id) {
        const animalId = parseInt(id, 10)
        const buscaProximos = await query(
          `SELECT id, serie, rg, nome 
           FROM animais 
           WHERE id BETWEEN $1 AND $2 
           ORDER BY ABS(id - $3)
           LIMIT 5`,
          [animalId - 10, animalId + 10, animalId]
        )
        sugestoes = buscaProximos.rows
      }

      return res.status(404).json({
        success: false,
        message: 'Animal não encontrado',
        busca: id ? { id } : { serie, rg },
        sugestoes: sugestoes.length > 0 ? sugestoes : null,
        total_animais: (await query('SELECT COUNT(*) as total FROM animais')).rows[0].total
      })
    }

    const animal = result.rows[0]
    let custosInfo = { quantidade: 0, total: 0 }
    let dnaInfo = null

    try {
      const custos = await query(
        'SELECT COUNT(*) as total, SUM(valor) as total_valor FROM custos WHERE animal_id = $1',
        [animal.id]
      )
      custosInfo = {
        quantidade: parseInt(custos.rows[0]?.total || 0),
        total: parseFloat(custos.rows[0]?.total_valor || 0)
      }
    } catch (_) { /* tabela custos pode não existir */ }

    try {
      const dna = await query(
        'SELECT laboratorio_dna, data_envio_dna, custo_dna FROM animais WHERE id = $1',
        [animal.id]
      )
      if (dna.rows[0]?.laboratorio_dna) {
        dnaInfo = {
          laboratorio: dna.rows[0].laboratorio_dna,
          data_envio: dna.rows[0].data_envio_dna,
          custo: parseFloat(dna.rows[0].custo_dna || 0)
        }
      }
    } catch (_) { /* colunas dna podem não existir */ }

    res.status(200).json({
      success: true,
      message: 'Animal encontrado',
      data: {
        ...animal,
        custos: custosInfo,
        dna: dnaInfo
      }
    })
  } catch (error) {
    console.error('Erro ao verificar animal:', error)
    const msg = error.message || ''
    const isConnRefused = msg.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED'
    const isNoDatabase = msg.includes('DATABASE_URL') || msg.includes('127.0.0.1')
    const isTableMissing = msg.includes('relation') && msg.includes('does not exist')
    let hint = 'Erro ao verificar animal'
    if (isConnRefused || isNoDatabase) {
      hint = 'Configure DATABASE_URL no Vercel (Settings → Environment Variables) e faça Redeploy'
    } else if (isTableMissing) {
      hint = 'Execute o script scripts/neon-migracao-minima.sql no Neon Console'
    }
    res.status(500).json({
      success: false,
      message: hint,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
