/**
 * Utilitário para combinar classes CSS (clsx + tailwind-merge)
 * Fonte única - use este ou lib/utils
 */
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes CSS de forma condicional com merge do Tailwind
 * @param {...(string|object|array)} inputs - Classes ou objetos condicionais
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(...inputs))
}

export default cn
