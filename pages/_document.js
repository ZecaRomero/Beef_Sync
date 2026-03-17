import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR" data-scroll-behavior="smooth">
      <Head>
        {/* Favicon e ícones PWA */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Viewport - crítico para layout mobile (deve estar no HTML inicial) */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        {/* Meta tags */}
        <meta name="description" content="Beef-Sync - Sistema de Gestão Pecuária" />
        <meta name="keywords" content="pecuária, gestão, bovinos, rebanho, beef sync" />
        <meta name="author" content="Beef-Sync" />
        
        {/* PWA Meta tags */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="application-name" content="Beef-Sync" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Beef-Sync" />
        
        {/* Preload de fontes importantes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}