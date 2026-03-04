/**
 * Endpoint SSE (Server-Sent Events)
 * Clientes se conectam aqui e recebem eventos em tempo real
 * quando dados são modificados no servidor
 */
import { addSseClient, removeSseClient } from '../../lib/sseClients'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Configura cabeçalhos SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Desabilita buffer do nginx/proxy
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // Evento inicial de conexão
  res.write('event: connected\ndata: {"status":"ok"}\n\n')

  // Registra este cliente
  addSseClient(res)

  // Heartbeat a cada 25s para manter a conexão viva (proxies fecham conexões inativas)
  const heartbeat = setInterval(() => {
    try {
      res.write('event: heartbeat\ndata: {}\n\n')
    } catch {
      clearInterval(heartbeat)
    }
  }, 25000)

  // Cleanup quando o cliente desconecta
  req.on('close', () => {
    clearInterval(heartbeat)
    removeSseClient(res)
  })

  req.on('error', () => {
    clearInterval(heartbeat)
    removeSseClient(res)
  })
}

export const config = {
  api: {
    bodyParser: false,
    // Timeout longo para SSE (0 = sem timeout)
    externalResolver: true,
  },
}
