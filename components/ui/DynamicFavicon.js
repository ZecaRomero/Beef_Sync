import { useEffect } from 'react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

// Gera um favicon SVG como data URL ââ‚¬â€� sem precisar de arquivos em /public
function gerarFaviconSVG(isLocal) {
  const bg = isLocal ? '#2563eb' : '#16a34a'
  const label = isLocal ? 'L' : 'R'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="7" fill="${bg}"/>
    <text x="16" y="13" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">BS</text>
    <text x="16" y="24" font-family="Arial,sans-serif" font-size="8" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function atualizarFavicon(href) {
  if (typeof document === 'undefined') return
  ;['icon', 'shortcut icon', 'apple-touch-icon'].forEach(rel => {
    let el = document.querySelector(`link[rel="${rel}"]`)
    if (!el) {
      el = document.createElement('link')
      el.rel = rel
      document.head.appendChild(el)
    }
    el.href = href
  })
}

export default function DynamicFavicon() {
  const { isLocal } = useNetworkStatus()

  useEffect(() => {
    const href = gerarFaviconSVG(isLocal)
    atualizarFavicon(href)

    const originalTitle = document.title
      .replace(/\s*\[Local\]|\s*\[Rede\]/g, '')
      .replace(/\s*\| Beef-Sync$/, '')
    const statusTag = isLocal ? ' [Local]' : ' [Rede]'
    document.title = (originalTitle || 'Beef-Sync') + statusTag
  }, [isLocal])

  return null
}
