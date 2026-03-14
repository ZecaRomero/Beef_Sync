/**
 * Watcher para Live Reload no desenvolvimento mobile
 * Detecta mudanças em arquivos e atualiza timestamp para o cliente recarregar
 * Rode junto com: npm run dev
 */
const fs = require('fs')
const path = require('path')

const RELOAD_FILE = path.join(__dirname, '..', '.next', 'dev-reload-timestamp.json')
const WATCH_DIRS = ['pages', 'components', 'styles', 'lib', 'contexts', 'hooks', 'utils', 'services', 'public']
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.json']

function ensureNextDir() {
  const nextDir = path.dirname(RELOAD_FILE)
  if (!fs.existsSync(nextDir)) {
    fs.mkdirSync(nextDir, { recursive: true })
  }
}

function writeTimestamp() {
  ensureNextDir()
  const data = { timestamp: Date.now(), updated: new Date().toISOString() }
  fs.writeFileSync(RELOAD_FILE, JSON.stringify(data))
  console.log('[dev-live-reload] 📱 Mudança detectada - mobile será notificado para recarregar')
}

function shouldWatch(filePath) {
  const ext = path.extname(filePath)
  return EXTENSIONS.includes(ext)
}

function watchDir(dir) {
  const fullPath = path.join(__dirname, '..', dir)
  if (!fs.existsSync(fullPath)) return

  fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
    if (!filename) return
    if (shouldWatch(filename)) {
      // Pequeno delay para dar tempo do Next.js recompilar antes do reload
      setTimeout(writeTimestamp, 1500)
    }
  })
}

// Inicial
writeTimestamp()
console.log('[dev-live-reload] 👀 Observando mudanças para live reload no mobile...')

WATCH_DIRS.forEach(watchDir)
