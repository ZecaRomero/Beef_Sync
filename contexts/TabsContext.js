'use client'

import { useRouter } from 'next/router'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Mapeamento de rotas para labels das abas
const PATH_LABELS = {
  '/dashboard': 'Dashboard',
  '/animals': 'Animais',
  '/nascimentos': 'Nascimentos',
  '/gestacao': 'Gestação',
  '/ocorrencias': 'Ocorrências',
  '/movimentacoes/mortes': 'Mortes',
  '/limpar-animais': 'Limpar Animais',
  '/reproducao/controle': 'Controle Reprodutivo',
  '/reproducao/inseminacao': 'Inseminação',
  '/reproducao/transferencia-embrioes': 'Transferência de Embriões',
  '/reproducao/receptoras-dg': 'Receptoras DG',
  '/reproducao/nascimentos': 'Nascimentos',
  '/reproducao/coleta-fiv': 'Coleta FIV',
  '/reproducao/exames-andrologicos': 'Exames Andrológicos',
  '/reproducao/calendario': 'Calendário Reprodutivo',
  '/reproducao/genealogia': 'Genealogia',
  '/dna': 'DNA',
  '/dna/historico': 'Histórico DNA',
  '/sanidade/protocolos': 'Protocolos Sanitários',
  '/sanidade/vacinacao': 'Vacinação',
  '/sanidade/medicamentos': 'Medicamentos',
  '/sanidade/exames': 'Exames',
  '/sanidade/quarentena': 'Quarentena',
  '/sanidade/historico': 'Histórico Sanitário',
  '/movimentacao/localizacao': 'Localização',
  '/movimentacao/historico': 'Histórico Movimentação',
  '/movimentacao/piquetes': 'Piquetes',
  '/manejo/pesagem': 'Pesagem',
  '/manejo/lotes': 'Lotes',
  '/manejo/rastreabilidade': 'Rastreabilidade',
  '/manejo/resumo-pesagens': 'Resumo Pesagens',
  '/estoque-semen': 'Estoque Sêmen',
  '/nitrogenio': 'Nitrogênio',
  '/comercial': 'Comercial',
  '/comercial/analise-mercado': 'Análise Mercado',
  '/comercial/clientes': 'Clientes',
  '/comercial/fornecedores': 'Fornecedores',
  '/comercial/contratos': 'Contratos',
  '/monitoramento/alertas': 'Alertas',
  '/monitoramento/performance': 'Performance',
  '/monitoramento/tendencias': 'Tendências',
  '/monitoramento/dashboard-executivo': 'Dashboard Executivo',
  '/planejamento/agenda': 'Agenda',
  '/planejamento/metas': 'Metas',
  '/planejamento/orcamento': 'Orçamento',
  '/planejamento/projecoes': 'Projeções',
  '/notas-fiscais': 'Notas Fiscais',
  '/notas-fiscais/relatorio': 'Relatório Fiscal',
  '/notas-fiscais/vendas-genetica': 'Vendas Embriões/Sêmen',
  '/notas-fiscais/venda': 'Venda',
  '/contabilidade': 'Contabilidade',
  '/custos': 'Custos',
  '/protocol-editor': 'Protocolos',
  '/reports': 'Relatórios',
  '/reports-manager': 'Gerador Relatórios',
  '/relatorios-ocorrencias': 'Relatórios Ocorrências',
  '/relatorios-lotes': 'Histórico Lançamentos',
  '/relatorios-personalizados': 'Relatórios Personalizados',
  '/relatorios-envio': 'Envio Relatórios',
  '/settings': 'Configurações',
  '/backup': 'Backup',
  '/sistema/usuarios': 'Usuários',
  '/sistema/permissoes': 'Permissões',
  '/diagnostico-animais': 'Diagnóstico',
  '/profile': 'Perfil',
}

function getTabLabel(path) {
  // Rotas dinâmicas: /animals/123 -> "Animal"
  if (/^\/animals\/[^/]+$/.test(path)) {
    const id = path.split('/').pop()
    return id ? `Animal ${id}` : 'Animais'
  }
  // Match base path para rotas aninhadas
  for (const [key, label] of Object.entries(PATH_LABELS)) {
    if (path === key || path.startsWith(key + '/')) return label
  }
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1]?.replace(/-/g, ' ') || 'Página'
}

const TabsContext = createContext(null)

const STORAGE_KEY = 'beef-tabs-open'

function loadSavedTabs() {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (_) {}
  return []
}

function saveTabs(tabs) {
  try {
    // Salvar apenas path e label (sem id volátil)
    const toSave = tabs.map(t => ({ path: t.path, label: t.label }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (_) {}
}

export function TabsProvider({ children }) {
  const router = useRouter()
  const [tabs, setTabs] = useState([])
  const [hydrated, setHydrated] = useState(false)

  // Restaurar abas salvas ao montar (client-side)
  useEffect(() => {
    const saved = loadSavedTabs()
    if (saved.length > 0) {
      const restored = saved.map(t => ({ ...t, id: t.path + Date.now() + Math.random() }))
      setTabs(restored)
    }
    setHydrated(true)
  }, [])

  // Persistir abas no localStorage sempre que mudarem (após hydration)
  useEffect(() => {
    if (hydrated) saveTabs(tabs)
  }, [tabs, hydrated])

  const addTab = useCallback((path, label) => {
    const normalizedPath = path?.split('?')[0] || '/'
    if (!normalizedPath || normalizedPath === '/login' || normalizedPath === '/404' || normalizedPath === '/500') return

    setTabs(prev => {
      const exists = prev.some(t => t.path === normalizedPath)
      if (exists) return prev
      const newTab = { id: normalizedPath + Date.now(), path: normalizedPath, label }
      return [...prev, newTab]
    })
  }, [])

  const removeTab = useCallback((pathToRemove) => {
    const currentPath = router.asPath?.split('?')[0] || router.pathname
    setTabs(prev => {
      const filtered = prev.filter(t => t.path !== pathToRemove)
      if (filtered.length === 0) {
        router.push('/dashboard')
        return [] // Navegação adicionará a aba Dashboard
      }
      if (pathToRemove === currentPath) {
        const idx = prev.findIndex(t => t.path === pathToRemove)
        const nextTab = idx > 0 ? prev[idx - 1] : filtered[0]
        router.push(nextTab.path)
      }
      return filtered
    })
  }, [router])

  const navigateToTab = useCallback((path) => {
    router.push(path)
  }, [router])

  // Ao mudar a rota, adicionar aba (sem duplicar)
  useEffect(() => {
    const handleRouteChange = (url) => {
      const path = (url || router.asPath)?.split('?')[0] || '/'
      addTab(path, getTabLabel(path))
    }

    // Adicionar aba inicial
    const path = router.asPath?.split('?')[0] || router.pathname
    addTab(path, getTabLabel(path))

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router.pathname, router.asPath, addTab])

  return (
    <TabsContext.Provider value={{ tabs, addTab, removeTab, navigateToTab }}>
      {children}
    </TabsContext.Provider>
  )
}

export function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('useTabs must be used within TabsProvider')
  return ctx
}
