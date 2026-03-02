/**
 * Middleware do Next.js para prevenir loops de redirecionamento
 * Este arquivo é executado automaticamente antes de cada requisição
 */
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Deixar a requisição passar - retorno explícito evita comportamento inesperado
  return NextResponse.next()
}

// Configurar para rodar em todas as rotas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
