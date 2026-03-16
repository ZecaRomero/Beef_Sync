export function isLocalOrPrivateHost(hostname) {
  const host = String(hostname || '').toLowerCase()
  if (!host) return false

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
  if (host.startsWith('192.168.')) return true
  if (host.startsWith('10.')) return true

  const m172 = host.match(/^172\.(\d{1,3})\./)
  if (!m172) return false

  const secondOctet = Number(m172[1])
  return secondOctet >= 16 && secondOctet <= 31
}

export function isLocalOrPrivateBrowserEnv() {
  if (typeof window === 'undefined') return false
  return isLocalOrPrivateHost(window.location.hostname)
}

