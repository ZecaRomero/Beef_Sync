import { query } from '../../../lib/database'

export default async function handler(req, res) {
  try {
    const { id } = req.query
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID é obrigatório'
      })
    }
    
    if (req.method === 'GET') {
      const result = await query(`
        SELECT * FROM fornecedores_destinatarios
        WHERE id = $1 AND ativo = true
      `, [id])
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fornecedor/Destinatário não encontrado'
        })
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      })
    }
    
    if (req.method === 'PUT') {
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
      
      // Verificar se existe
      const existing = await query(`
        SELECT * FROM fornecedores_destinatarios
        WHERE id = $1
      `, [id])
      
      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fornecedor/Destinatário não encontrado'
        })
      }
      
      // Atualizar fornecedor/destinatário
      const result = await query(`
        UPDATE fornecedores_destinatarios SET
          nome = $1,
          tipo = $2,
          endereco = $3,
          municipio = $4,
          estado = $5,
          cnpj_cpf = $6,
          telefone = $7,
          email = $8,
          observacoes = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
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
        observacoes ? observacoes.trim() : null,
        id
      ])
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Fornecedor/Destinatário atualizado com sucesso'
      })
    }
    
    if (req.method === 'DELETE') {
      // Soft delete - marcar como inativo
      const result = await query(`
        UPDATE fornecedores_destinatarios SET
          ativo = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [id])
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fornecedor/Destinatário não encontrado'
        })
      }
      
      return res.status(200).json({
        success: true,
        message: 'Fornecedor/Destinatário removido com sucesso'
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

