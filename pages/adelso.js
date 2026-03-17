/**
 * Página de entrada do usuário Adelso.
 * Autentica via localStorage e redireciona direto para o Boletim Campo mobile.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AdelsoPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      localStorage.setItem('beef_adelso_auth', JSON.stringify({
        nome: 'Adelso',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }))
      localStorage.setItem('beef_usuario_identificado', JSON.stringify({ nome: 'Adelso' }))
      localStorage.setItem('mobile-auth', JSON.stringify({ nome: 'Adelso', telefone: '', registeredAt: new Date().toISOString() }))
    } catch (_) {}
    router.replace('/boletim-defesa/mobile')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" />
    </div>
  )
}
