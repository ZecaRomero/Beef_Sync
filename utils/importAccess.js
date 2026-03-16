function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function isZecaDeveloperRequest(req) {
  const roleHeader = normalizeText(req.headers?.['x-user-role'])
  const nameHeader = normalizeText(req.headers?.['x-user-name'])
  const emailHeader = normalizeText(req.headers?.['x-user-email'])
  const roleBody = normalizeText(req.body?.userRole)
  const nameBody = normalizeText(req.body?.userName)
  const emailBody = normalizeText(req.body?.userEmail)

  const role = roleHeader || roleBody
  const name = nameHeader || nameBody
  const email = emailHeader || emailBody
  const isDevRole = role === 'desenvolvedor' || role === 'developer'
  const isZeca = name.includes('zeca') || email.includes('zeca')
  if (isDevRole && isZeca) return true

  // Compatibilidade: quando front antigo não envia identidade, aceitar apenas localhost.
  const hasIdentity = Boolean(role || name || email)
  if (!hasIdentity) {
    const host = normalizeText(req.headers?.host)
    const origin = normalizeText(req.headers?.origin)
    const referer = normalizeText(req.headers?.referer)
    const isLocal =
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      referer.includes('localhost') ||
      referer.includes('127.0.0.1')
    return isLocal
  }

  return false
}

export function blockIfNotZecaDeveloper(req, res, customMessage) {
  if (isZecaDeveloperRequest(req)) return false

  return res.status(403).json({
    success: false,
    message:
      customMessage ||
      'Acesso negado. Esta importação é permitida somente para Zeca Desenvolvedor.',
    permissionRequired: true,
  })
}
