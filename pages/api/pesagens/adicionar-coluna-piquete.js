/**
 * API para adicionar coluna piquete na tabela pesagens
 */

import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Verificar se a coluna já existe
    const check = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pesagens' AND column_name = 'piquete'
    `)

    if (check.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Coluna piquete já existe na tabela pesagens'
      })
    }

    // Adicionar a coluna
    await query(`
      ALTER TABLE pesagens 
      ADD COLUMN IF NOT EXISTS piquete VARCHAR(100)
    `)

    // Criar índice para melhor performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_pesagens_piquete 
      ON pesagens(piquete)
    `)

    return res.status(200).json({
      success: true,
      message: 'Coluna piquete adicionada com sucesso à tabela pesagens'
    })

  } catch (error) {
    console.error('Erro ao adicionar coluna:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao adicionar coluna'
    })
  }
}
