/**
 * API de autenticaÃ§Ã£o do usuÃ¡rio Adelso para Boletim Campo.
 * Senha temporÃ¡ria: 123 (desenvolvedor pode resetar via banco)
 */
import { query } from '../../../lib/database'

const DEV_MASTER_PASSWORD = 'dev_master_123' // Desenvolvedor usa isso para resetar

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'MÃ©todo nÃ£o permitido' })
  }

  try {
    // (createTablesIfNotExist removido — tabelas criadas automaticamente no primeiro uso)
    const { nome, senha, novaSenha, acao } = req.body

    if (!nome || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Nome e senha sÃ£o obrigatÃ³rios'
      })
    }

    const nomeNorm = String(nome).trim()
    if (nomeNorm.toLowerCase() !== 'adelso') {
      return res.status(401).json({
        success: false,
        message: 'UsuÃ¡rio nÃ£o encontrado'
      })
    }

    const userResult = await query(
      'SELECT id, nome, senha_hash, senha_temporaria FROM boletim_campo_users WHERE LOWER(nome) = $1',
      [nomeNorm.toLowerCase()]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'UsuÃ¡rio nÃ£o encontrado'
      })
    }

    const user = userResult.rows[0]
    const senhaCorreta = senha === user.senha_hash || senha === '123'

    // Desenvolvedor pode acessar com senha master
    const isDeveloper = senha === DEV_MASTER_PASSWORD

    if (!senhaCorreta && !isDeveloper) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      })
    }

    // Trocar senha
    if (acao === 'trocar_senha' && novaSenha) {
      if (!senhaCorreta && !isDeveloper) {
        return res.status(401).json({ success: false, message: 'Senha atual incorreta' })
      }
      await query(
        'UPDATE boletim_campo_users SET senha_hash = $1, senha_temporaria = false, updated_at = NOW() WHERE id = $2',
        [novaSenha, user.id]
      )
      return res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso'
      })
    }

    return res.status(200).json({
      success: true,
      usuario: user.nome,
      senhaTemporaria: user.senha_temporaria
    })
  } catch (error) {
    console.error('Erro auth boletim-campo:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao autenticar',
      error: error.message
    })
  }
}

