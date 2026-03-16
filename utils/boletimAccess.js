function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function isAdelsoRequest(req) {
  const headerName = normalizeText(req.headers?.['x-user-name'])
  const bodyName = normalizeText(req.body?.userName || req.body?.nome || req.body?.usuario)
  const queryName = normalizeText(req.query?.userName || req.query?.nome || req.query?.usuario)
  const name = headerName || bodyName || queryName
  return name === 'adelso' || name.includes('adelso')
}

export function blockIfNotAdelso(req, res, customMessage) {
  if (isAdelsoRequest(req)) return false

  return res.status(403).json({
    success: false,
    message:
      customMessage ||
      'Acesso negado. Apenas Adelso pode registrar medicamentos ou alterar quantidades no Boletim Campo.',
    permissionRequired: true,
  })
}
