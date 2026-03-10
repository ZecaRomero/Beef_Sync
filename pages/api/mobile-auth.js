/**
 * API para registrar acesso de dispositivos móveis
 */
import { query } from '../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../utils/apiResponse'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  try {
    const { nome, telefone, userAgent, timestamp } = req.body

    if (!nome || !nome.trim()) {
      return sendError(res, 'Nome é obrigatório', 400)
    }

    const telefoneLimpo = (telefone || '').replace(/\D/g, '')
    const telefoneFinal = telefoneLimpo.length >= 10 ? telefoneLimpo : `nome_${nome.trim().toLowerCase().replace(/\s+/g, '_')}`

    // Obter IP do cliente
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'

    // Verificar se a tabela existe, se não, criar
    await query(`
      CREATE TABLE IF NOT EXISTS mobile_access_logs (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        first_access TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_access TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 1,
        ativo BOOLEAN DEFAULT true,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar índices se não existirem
    await query(`
      CREATE INDEX IF NOT EXISTS idx_mobile_access_telefone ON mobile_access_logs(telefone)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_mobile_access_ativo ON mobile_access_logs(ativo)
    `)

    // Verificar se já existe registro
    const existing = await query(
      'SELECT * FROM mobile_access_logs WHERE telefone = $1',
      [telefoneFinal]
    )

    let result

    if (existing.rows.length > 0) {
      // Atualizar registro existente
      result = await query(`
        UPDATE mobile_access_logs 
        SET 
          nome = $1,
          last_access = CURRENT_TIMESTAMP,
          access_count = access_count + 1,
          ip_address = $2,
          user_agent = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE telefone = $4
        RETURNING *
      `, [nome, ip, userAgent, telefoneFinal])
    } else {
      // Criar novo registro
      result = await query(`
        INSERT INTO mobile_access_logs (
          nome, telefone, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [nome, telefoneFinal, ip, userAgent])
    }

    // Registrar no log de acesso geral (se a tabela existir)
    try {
      await query(`
        INSERT INTO access_logs (
          user_name, user_type, ip_address, hostname, user_agent, telefone, action
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        nome,
        'mobile',
        ip,
        req.headers.host || 'unknown',
        userAgent || 'unknown',
        telefoneFinal,
        'mobile_auth'
      ])
    } catch (e) {
      // Ignorar se a tabela access_logs não existir
      console.log('Tabela access_logs não encontrada ou erro ao inserir:', e.message)
    }

    return sendSuccess(res, {
      message: 'Acesso registrado com sucesso',
      user: {
        nome: result.rows[0].nome,
        telefone: result.rows[0].telefone,
        isNew: existing.rows.length === 0
      }
    })

  } catch (error) {
    console.error('Erro ao registrar acesso mobile:', error)
    return sendError(res, error.message || 'Erro ao registrar acesso', 500)
  }
}
