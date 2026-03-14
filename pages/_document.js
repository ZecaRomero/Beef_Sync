import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR" data-scroll-behavior="smooth">
      <Head>
        {/* Favicon padrão — substituído dinamicamente pelo DynamicFavicon.js */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%232563eb'/%3E%3Ctext x='16' y='13' font-family='Arial' font-size='9' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3EBS%3C/text%3E%3Ctext x='16' y='24' font-family='Arial' font-size='8' fill='rgba(255,255,255,0.85)' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%90%82%3C/text%3E%3C/svg%3E" />
        <link rel="shortcut icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%232563eb'/%3E%3Ctext x='16' y='21' font-family='Arial' font-size='14' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3EBS%3C/text%3E%3C/svg%3E" />
        
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