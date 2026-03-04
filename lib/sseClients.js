/**
 * Gerenciador de clientes SSE (Server-Sent Events)
 * Mantém a lista de conexões abertas e faz broadcast de eventos
 * Usa global para sobreviver hot-reloads em dev
 */

if (!global.__sseClients) {
  global.__sseClients = new Set()
}

/**
 * Registra um cliente SSE (response object do Node.js)
 * @param {import('http').ServerResponse} res
 */
export function addSseClient(res) {
  global.__sseClients.add(res)
}

/**
 * Remove um cliente SSE da lista
 * @param {import('http').ServerResponse} res
 */
export function removeSseClient(res) {
  global.__sseClients.delete(res)
}

/**
 * Envia um evento SSE para todos os clientes conectados
 * @param {string} type - tipo do evento (ex: 'animal.updated', 'animal.created')
 * @param {object} payload - dados do evento
 */
export function broadcast(type, payload = {}) {
  if (!global.__sseClients || global.__sseClients.size === 0) return

  const message = `event: change\ndata: ${JSON.stringify({ type, ...payload })}\n\n`
  const dead = []

  global.__sseClients.forEach(res => {
    try {
      res.write(message)
    } catch {
      dead.push(res)
    }
  })

  // Limpar conexões mortas
  dead.forEach(r => global.__sseClients.delete(r))
}

/**
 * Retorna quantos clientes estão conectados
 */
export function clientCount() {
  return global.__sseClients?.size ?? 0
}
