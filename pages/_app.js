import React, { useEffect, useState } from 'react'

import "../styles/globals.css";
import { useRouter } from "next/router";
import ModernLayout from "../components/layout/ModernLayout";
import { ToastProvider } from "../contexts/ToastContext";
import { AppProvider } from "../contexts/AppContext";
import { AuthProvider } from "../contexts/AuthContext";
import AuthGuard from "../components/auth/AuthGuard";
import ErrorBoundary from "../components/ErrorBoundary";
import DynamicFavicon from "../components/ui/DynamicFavicon";
import MaintenanceOverlay from "../components/MaintenanceOverlay";
import DevLiveReload from "../components/DevLiveReload";
import logger from "../utils/logger";


export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // Indicador de navegação entre páginas
  useEffect(() => {
    const start = () => setRouteLoading(true)
    const end = () => setRouteLoading(false)
    router.events.on('routeChangeStart', start)
    router.events.on('routeChangeComplete', end)
    router.events.on('routeChangeError', end)
    return () => {
      router.events.off('routeChangeStart', start)
      router.events.off('routeChangeComplete', end)
      router.events.off('routeChangeError', end)
    }
  }, [router.events])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Limpeza preventiva de dados corrompidos
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value && (
              value.includes('total_tokens') ||
              value.includes('usage') ||
              value.includes('completion')
            )) {
              logger.warn('Removendo dados corrompidos do localStorage', { key });
              localStorage.removeItem(key);
            }
          } catch (e) {
            logger.error('Erro ao verificar localStorage', { key, error: e?.message });
            try {
              localStorage.removeItem(key);
            } catch (removeError) {
              logger.error('Erro ao remover item do localStorage', { key, error: removeError?.message });
            }
          }
        });
      } catch (error) {
        logger.error('Erro na limpeza preventiva do localStorage', { error: error?.message });
      }
      
      const isDark = localStorage.getItem("darkMode") === "true";
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
      
      // Log da inicialização da aplicação
      logger.info('Aplicação iniciada', {
        path: router.pathname,
        darkMode: isDark,
      });
    }
  }, [router.pathname]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem("darkMode", newDarkMode.toString());
      if (newDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      logger.debug('Dark mode toggled', { darkMode: newDarkMode });
    }
  };

  // Pages that don't need layout (login, 404, 500, consulta celular, ficha read-only, identificar)
  const noLayoutPages = ['/login', '/404', '/500', '/a', '/A', '/identificar', '/mobile-relatorios', '/boletim-defesa/mobile', '/adelso'];
  const isConsultaAnimal = router.pathname === '/consulta-animal/[id]';
  const useLayout = !noLayoutPages.includes(router.pathname) && !isConsultaAnimal;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <div className={darkMode ? "dark" : ""}>
            <DynamicFavicon />

            {routeLoading && (
              <>
                <div
                  style={{
                    position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, #2563eb, #60a5fa, #2563eb)',
                    backgroundSize: '200% 100%',
                    animation: 'bsProgress 1s linear infinite',
                    zIndex: 99999,
                  }}
                />
                <div
                  style={{
                    position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(15,23,42,0.92)', color: '#fff',
                    padding: '6px 18px', borderRadius: '999px',
                    fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                    zIndex: 99999, backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(96,165,250,0.3)',
                  }}
                >
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    border: '2px solid #60a5fa', borderTopColor: 'transparent',
                    animation: 'bsSpin 0.7s linear infinite', display: 'inline-block'
                  }} />
                  Atualizando App...
                </div>
                <style>{`
                  @keyframes bsProgress {
                    0% { background-position: 200% 0 }
                    100% { background-position: -200% 0 }
                  }
                  @keyframes bsSpin {
                    to { transform: rotate(360deg) }
                  }
                `}</style>
              </>
            )}
            <MaintenanceOverlay />
            <DevLiveReload />
            <ToastProvider>
              <AppProvider>
                {useLayout ? (
                  <ModernLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                    <Component
                      {...pageProps}
                      darkMode={darkMode}
                      toggleDarkMode={toggleDarkMode}
                    />
                  </ModernLayout>
                ) : (
                  <Component
                    {...pageProps}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                  />
                )}
              </AppProvider>
            </ToastProvider>
          </div>
        </AuthGuard>
      </AuthProvider>
    </ErrorBoundary>
  );
}