import { query } from '../../../lib/database'

export default async function handler(req, res) {
  try {
    // Garantir que as tabelas existam
    // (createTablesIfNotExist removido — tabelas criadas automaticamente no primeiro uso)
    
    if (req.method === 'GET') {
      const { busca, tipo } = req.query
      
      let sqlQuery = `
        SELECT * FROM fornecedores_destinatarios
        WHERE ativo = true
      `
      const params = []
      let paramCount = 1
      
      if (tipo) {
        sqlQuery += ` AND tipo = $${paramCount}`
        params.push(tipo)
        paramCount++
      }
      
      if (busca) {
        // Normalizar busca removendo formatação para comparação de CNPJ
        const buscaLimpa = busca.replace(/[.\-\/\s]/g, '').trim()
        sqlQuery += ` AND (
          nome ILIKE $${paramCount} OR 
          cnpj_cpf ILIKE $${paramCount} OR
          REPLACE(REPLACE(REPLACE(REPLACE(cnpj_cpf, '.', ''), '-', ''), '/', ''), ' ', '') = $${paramCount + 1} OR
          municipio ILIKE $${paramCount}
        )`
        params.push(`%${busca}%`)
        params.push(buscaLimpa)
        paramCount += 2
      }
      
      sqlQuery += ` ORDER BY nome ASC LIMIT 50`
      
      const result = await query(sqlQuery, params)
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length
      })
    }
    
    if (req.method === 'POST') {
      const {
        nome,
        tipo,
        endereco,
        municipio,
        estado,
        cnpj_cpf,
        telefone,
        email,
        observacoes
      } = req.body
      
      if (!nome || !tipo) {
        return res.status(400).json({
          success: false,
          message: 'Nome e tipo são obrigatórios'
        })
      }
      
      // Verificar se já existe (verificar por nome+tipo ou por CNPJ se fornecido)
      let existing = null
      if (cnpj_cpf) {
        existing = await query(`
          SELECT * FROM fornecedores_destinatarios
          WHERE cnpj_cpf = $1 AND tipo = $2
        `, [cnpj_cpf, tipo])
      } else {
        existing = await query(`
          SELECT * FROM fornecedores_destinatarios
          WHERE nome = $1 AND tipo = $2 AND (cnpj_cpf IS NULL OR cnpj_cpf = '')
        `, [nome, tipo])
      }
      
      if (existing && existing.rows.length > 0) {
        return res.status(200).json({
          success: true,
          data: existing.rows[0],
          message: 'Fornecedor/Destinatário já existe'
        })
      }
      
      // Criar novo fornecedor/destinatário
      const result = await query(`
        INSERT INTO fornecedores_destinatarios (
          nome, tipo, endereco, municipio, estado, cnpj_cpf, telefone, email, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        nome.trim(),
        tipo,
        endereco ? endereco.trim() : null,
        municipio ? municipio.trim() : null,
        estado ? estado.trim().toUpperCase() : null,
        cnpj_cpf ? cnpj_cpf.trim() : null,
        telefone ? telefone.trim() : null,
        email ? email.trim() : null,
        observacoes ? observacoes.trim() : null
      ])
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Fornecedor/Destinatário criado com sucesso'
      })
    }
    
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    })
  } catch (error) {
    console.error('Erro na API de fornecedores:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
}


