/**
 * Overlay de identificaÃ§Ã£o para TODO acesso mobile (nome + telefone).
 * Exibido antes de qualquer pÃ¡gina quando o usuÃ¡rio nÃ£o estÃ¡ identificado.
 * NÃ£o depende de modo manutenÃ§Ã£o.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

const STORAGE_KEY = 'beef_usuario_identificado'

function formatPhone(v) {
  const digits = String(v).replace(/\D/g, '')
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export default function MobileIdentificationOverlay() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(false)
  const [formData, setFormData] = useState({ nome: '', telefone: '', lembrar: true })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('maintenance_saved_data')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setFormData(prev => ({ ...prev, nome: data.nome || '', telefone: data.telefone || '', lembrar: true }))
      } catch (_) {}
    }
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') return

    const skipPaths = ['/login', '/identificar', '/monitoramento', '/adelso']
    if (skipPaths.includes(router.pathname)) return

    // Mostrar para mobile OU para usuÃ¡rios externos (ngrok, etc) em qualquer dispositivo
    const isExternal = !hostname.startsWith('192.168.') && !hostname.startsWith('10.') && !hostname.startsWith('172.')
    if (!isMobile() && !isExternal) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setShow(false)
        return
      }
    } catch (_) {}

    setShow(true)
  }, [mounted, router.pathname])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.nome.trim()) {
      setError('Nome Ã© obrigatÃ³rio')
      return
    }

    setSubmitting(true)
    try {
      if (formData.lembrar) {
        localStorage.setItem('maintenance_saved_data', JSON.stringify({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim()
        }))
      } else {
        localStorage.removeItem('maintenance_saved_data')
      }

      const telDigits = formData.telefone.replace(/\D/g, '')
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        nome: formData.nome.trim(),
        telefone: telDigits || null
      }))

      await fetch('/api/access-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: formData.nome.trim(),
          userType: 'Celular',
          ipAddress: 'N/A',
          hostname: window.location.hostname,
          userAgent: navigator.userAgent,
          telefone: telDigits || null,
          action: 'Acesso ao Sistema'
        })
      })

      sessionStorage.setItem('beef_access_logged', '1')
      window.location.reload()
    } catch (e) {
      setError('Erro ao salvar. Tente novamente.')
      setSubmitting(false)
    }
  }

  if (!mounted || !show) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-gray-900/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full mx-auto p-8 text-center bg-gray-800/50 rounded-2xl border border-gray-700">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <DevicePhoneMobileIcon className="h-12 w-12 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">IdentificaÃ§Ã£o</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Preencha seus dados para acessar o sistema
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(d => ({ ...d, nome: e.target.value }))}
              placeholder="Digite seu nome"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              disabled={submitting}
            />
          </div>
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Telefone <span className="text-gray-500">(opcional)</span>
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                setFormData(d => ({ ...d, telefone: formatPhone(digits) }))
              }}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              disabled={submitting}
              inputMode="numeric"
            />
          </div>
          <div className="flex items-center gap-2 text-left">
            <input
              type="checkbox"
              id="lembrar-mobile"
              checked={formData.lembrar}
              onChange={(e) => setFormData(d => ({ ...d, lembrar: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-600 focus:ring-2 focus:ring-amber-500"
              disabled={submitting}
            />
            <label htmlFor="lembrar-mobile" className="text-sm text-gray-300 cursor-pointer">
              Lembrar meus dados para prÃ³ximos acessos
            </label>
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-6">
          Beef-Sync ââ‚¬¢ {new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
