import { syncToSupabase } from '../../scripts/sync-to-supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Streaming de progresso via SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    send({ type: 'start', message: 'Iniciando sincronização...' })

    const result = await syncToSupabase((msg) => {
      send({ type: 'progress', message: msg })
    })

    send({ type: 'done', success: result.success, results: result.results, error: result.error })
  } catch (err) {
    send({ type: 'done', success: false, error: err.message })
  } finally {
    res.end()
  }
}

export const config = { api: { externalResolver: true } }
