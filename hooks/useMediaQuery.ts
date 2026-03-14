/**
 * Hook para detectar media queries de forma reativa
 * Útil para responsividade e adaptação de UI
 */
import { useEffect, useState } from 'react'

;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verificação SSR
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    
    // Definir estado inicial
    setMatches(media.matches);

    // Listener para mudanças
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Adicionar listener (compatível com browsers antigos)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback para browsers antigos
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hooks pré-configurados para breakpoints comuns
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

export function useIsDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

