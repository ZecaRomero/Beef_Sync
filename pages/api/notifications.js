import { query } from '../../lib/database'

export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  } catch (error) {
    console.error('Erro na API de notificaÃ§Ãµes:', error)
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message })
  }
}

async function handleGet(req, res) {
  try {
    const { limit = 50, unread_only = false } = req.query
    
    let sql = `
      SELECT 
        n.*,
        CASE 
          WHEN n.tipo = 'nascimento' THEN 'ðÅ¸�â€ž'
          WHEN n.tipo = 'estoque' THEN 'ðÅ¸â€œ¦'
          WHEN n.tipo = 'gestacao' THEN 'ðÅ¸�â€ž'
          WHEN n.tipo = 'saude' THEN 'ðÅ¸�¥'
          WHEN n.tipo = 'financeiro' THEN 'ðÅ¸â€™°'
          WHEN n.tipo = 'sistema' THEN 'âÅ¡â„¢ï¸�'
          WHEN n.tipo = 'nitrogenio' THEN 'â�â€žï¸�'
          WHEN n.tipo = 'andrologico' THEN 'ðÅ¸â€�¬'
          WHEN n.tipo = 'reproducao' THEN 'ðÅ¸â€�¬'
          ELSE 'ðÅ¸â€œ¢'
        END as icon,
        CASE 
          WHEN n.prioridade = 'high' THEN 'bg-red-500'
          WHEN n.prioridade = 'medium' THEN 'bg-yellow-500'
          WHEN n.prioridade = 'low' THEN 'bg-blue-500'
          ELSE 'bg-gray-500'
        END as color_class
      FROM notificacoes n
    `
    
    const params = []
    let paramCount = 0
    
    if (unread_only === 'true') {
      sql += ` WHERE n.lida = false`
    }
    
    sql += ` ORDER BY n.prioridade DESC, n.created_at DESC`
    
    if (limit) {
      sql += ` LIMIT $${++paramCount}`
      params.push(parseInt(limit))
    }
    
    const result = await query(sql, params)
    
    // Buscar feedbacks pendentes
    let feedbacks = []
    try {
      const feedbacksResult = await query(`
        SELECT id, nome, sugestao, audio_path, created_at
        FROM feedbacks
        WHERE status = 'pendente'
        ORDER BY created_at DESC
        LIMIT 10
      `)
      
      feedbacks = feedbacksResult.rows.map(f => ({
        id: `feedback_${f.id}`,
        tipo: 'feedback',
        titulo: `ðÅ¸â€™¬ Novo feedback de ${f.nome}`,
        mensagem: f.sugestao ? f.sugestao.substring(0, 100) + (f.sugestao.length > 100 ? '...' : '') : 'Feedback com Ã¡udio',
        prioridade: 'high',
        lida: false,
        created_at: f.created_at,
        dados_extras: { feedback_id: f.id, tem_audio: !!f.audio_path },
        icon: 'ðÅ¸â€™¬',
        color_class: 'bg-blue-500'
      }))
    } catch (e) {
      // Tabela feedbacks nÃ£o existe ainda
    }
    
    // Combinar notificaÃ§Ãµes normais com feedbacks
    const allNotifications = [...feedbacks, ...result.rows]
    
    // Ordenar por prioridade e data
    allNotifications.sort((a, b) => {
      const prioridadeOrder = { high: 3, medium: 2, low: 1 }
      const prioA = prioridadeOrder[a.prioridade] || 0
      const prioB = prioridadeOrder[b.prioridade] || 0
      
      if (prioA !== prioB) return prioB - prioA
      return new Date(b.created_at) - new Date(a.created_at)
    })
    
    // Limitar total
    const limitedNotifications = allNotifications.slice(0, parseInt(limit))
    
    // Formatar timestamps para exibiÃ§Ã£o
    const notifications = limitedNotifications.map(notif => ({
      ...notif,
      tempo_relativo: getRelativeTime(notif.created_at),
      timestamp: new Date(notif.created_at).toLocaleString('pt-BR')
    }))
    
    res.status(200).json(notifications)
  } catch (error) {
    console.error('Erro ao buscar notificaÃ§Ãµes:', error)
    res.status(500).json({ message: 'Erro ao buscar notificaÃ§Ãµes', error: error.message })
  }
}

async function handlePost(req, res) {
  try {
    const {
      tipo,
      titulo,
      mensagem,
      prioridade = 'medium',
      dados_extras = null,
      animal_id = null
    } = req.body

    // ValidaÃ§Ãµes
    if (!tipo || !titulo || !mensagem) {
      return res.status(400).json({ 
        message: 'Tipo, tÃ­tulo e mensagem sÃ£o obrigatÃ³rios',
        campos: { tipo, titulo, mensagem }
      })
    }

    // Validar tipo de notificaÃ§Ã£o
    const tiposValidos = ['nascimento', 'estoque', 'gestacao', 'saude', 'financeiro', 'sistema', 'andrologico', 'reproducao']
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        message: `Tipo de notificaÃ§Ã£o invÃ¡lido. Valores aceitos: ${tiposValidos.join(', ')}` 
      })
    }

    // Validar prioridade
    const prioridadesValidas = ['low', 'medium', 'high']
    if (!prioridadesValidas.includes(prioridade)) {
      return res.status(400).json({ 
        message: `Prioridade invÃ¡lida. Valores aceitos: ${prioridadesValidas.join(', ')}` 
      })
    }

    const result = await query(
      `INSERT INTO notificacoes 
       (tipo, titulo, mensagem, prioridade, dados_extras, animal_id, lida)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [
        tipo,
        titulo,
        mensagem,
        prioridade,
        dados_extras ? JSON.stringify(dados_extras) : null,
        animal_id,
      ]
    )

    const notification = result.rows[0]
    
    // Adicionar campos calculados
    const notificationWithExtras = {
      ...notification,
      icon: getIconForType(tipo),
      color_class: getColorForPriority(prioridade),
      tempo_relativo: getRelativeTime(notification.created_at),
      timestamp: new Date(notification.created_at).toLocaleString('pt-BR')
    }

    res.status(201).json(notificationWithExtras)
  } catch (error) {
    console.error('Erro ao criar notificaÃ§Ã£o:', error)
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message })
  }
}

async function handlePut(req, res) {
  try {
    const { id } = req.query
    const { lida, dados_extras } = req.body

    if (!id) {
      return res.status(400).json({ message: 'ID da notificaÃ§Ã£o Ã© obrigatÃ³rio' })
    }

    // NotificaÃ§Ãµes de feedback sÃ£o virtuais (nÃ£o estÃ£o na tabela notificacoes)
    // Retornar sucesso sem atualizar para evitar erro 500
    if (String(id).startsWith('feedback_')) {
      return res.status(200).json({ id, lida: true, message: 'Feedback marcado como visualizado' })
    }

    let sql = 'UPDATE notificacoes SET updated_at = CURRENT_TIMESTAMP'
    const params = []
    let paramCount = 0

    if (lida !== undefined) {
      sql += `, lida = $${++paramCount}`
      params.push(lida)
    }

    if (dados_extras !== undefined) {
      sql += `, dados_extras = $${++paramCount}`
      params.push(dados_extras ? JSON.stringify(dados_extras) : null)
    }

    sql += ` WHERE id = $${++paramCount} RETURNING *`
    params.push(id)

    const result = await query(sql, params)

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'NotificaÃ§Ã£o nÃ£o encontrada' })
    }

    const notification = result.rows[0]
    
    // Adicionar campos calculados
    const notificationWithExtras = {
      ...notification,
      icon: getIconForType(notification.tipo),
      color_class: getColorForPriority(notification.prioridade),
      tempo_relativo: getRelativeTime(notification.created_at),
      timestamp: new Date(notification.created_at).toLocaleString('pt-BR')
    }

    res.status(200).json(notificationWithExtras)
  } catch (error) {
    console.error('Erro ao atualizar notificaÃ§Ã£o:', error)
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message })
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ message: 'ID da notificaÃ§Ã£o Ã© obrigatÃ³rio' })
    }

    // NotificaÃ§Ãµes de feedback: atualizar status para nÃ£o aparecer mais na lista
    if (String(id).startsWith('feedback_')) {
      const feedbackId = id.replace('feedback_', '')
      try {
        await query(
          `UPDATE feedbacks SET status = 'em_analise' WHERE id = $1`,
          [feedbackId]
        )
      } catch (e) {
        // Tabela pode nÃ£o existir
      }
      return res.status(200).json({ message: 'NotificaÃ§Ã£o removida com sucesso' })
    }

    const result = await query(
      'DELETE FROM notificacoes WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'NotificaÃ§Ã£o nÃ£o encontrada' })
    }

    res.status(200).json({ message: 'NotificaÃ§Ã£o excluÃ­da com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir notificaÃ§Ã£o:', error)
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message })
  }
}

// FunÃ§Ãµes auxiliares
function getIconForType(tipo) {
  const icons = {
    'nascimento': 'ðÅ¸�â€ž',
    'estoque': 'ðÅ¸â€œ¦',
    'gestacao': 'ðÅ¸�â€ž',
    'saude': 'ðÅ¸�¥',
    'financeiro': 'ðÅ¸â€™°',
    'sistema': 'âÅ¡â„¢ï¸�',
    'nitrogenio': 'â�â€žï¸�',
    'andrologico': 'ðÅ¸â€�¬',
    'reproducao': 'ðÅ¸â€�¬'
  }
  return icons[tipo] || 'ðÅ¸â€œ¢'
}

function getColorForPriority(prioridade) {
  const colors = {
    'high': 'bg-red-500',
    'medium': 'bg-yellow-500',
    'low': 'bg-blue-500'
  }
  return colors[prioridade] || 'bg-gray-500'
}

function getRelativeTime(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Agora mesmo'
  if (diffMinutes < 60) return `HÃ¡ ${diffMinutes} min`
  if (diffHours < 24) return `HÃ¡ ${diffHours}h`
  if (diffDays < 7) return `HÃ¡ ${diffDays} dia${diffDays > 1 ? 's' : ''}`
  return date.toLocaleDateString('pt-BR')
}
