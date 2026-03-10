import handler from '../animals/[id]'

export default async function proxyHandler(req, res) {
  const { id } = req.query
  console.log(`[PROXY] Redirecionando /api/animais/${id} para handler original em /api/animals/[id]`)
  return handler(req, res)
}
