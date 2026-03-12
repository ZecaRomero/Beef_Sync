/**
 * Ficha do Animal - Modo Consulta (somente leitura)
 * Usado quando o usuário acessa via /a - sem edição, sem sidebar
 * Inclui: machos = exames andrológicos | fêmeas = FIV, inseminações, gestações
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

import EditGeneticaModal from '../../components/animals/EditGeneticaModal'
import ErrorBoundary from '../../components/ErrorBoundary'
import AnimalHeader from '../../components/animals/AnimalHeader'
import AnimalMetricsCards from '../../components/animals/AnimalMetricsCards'
import AnimalPlanningCards from '../../components/animals/AnimalPlanningCards'
import AnimalAndrologicalExams from '../../components/animals/AnimalAndrologicalExams'
import AnimalGestations from '../../components/animals/AnimalGestations'
import AnimalHealthProtocols from '../../components/animals/AnimalHealthProtocols'
import AnimalWeightHistory from '../../components/animals/AnimalWeightHistory'
import AnimalCosts from '../../components/animals/AnimalCosts'
import AnimalGenetics from '../../components/animals/AnimalGenetics'
import AnimalAdditionalInfo from '../../components/animals/AnimalAdditionalInfo'
import AnimalMainInfo from '../../components/animals/AnimalMainInfo'
import AnimalEmbryoTransfers from '../../components/animals/AnimalEmbryoTransfers'
import AnimalFixedActions from '../../components/animals/AnimalFixedActions'
import AnimalReproduction from '../../components/animals/AnimalReproduction'
import AnimalTimeline from '../../components/animals/AnimalTimeline'
import AnimalLocation from '../../components/animals/AnimalLocation'
import AnimalOffspring from '../../components/animals/AnimalOffspring'
import AnimalOccurrences from '../../components/animals/AnimalOccurrences'
import AnimalIVFCollections from '../../components/animals/AnimalIVFCollections'
import AnimalInseminations from '../../components/animals/AnimalInseminations'
import AnimalPhotos from '../../components/animals/AnimalPhotos'
import AnimalNotes from '../../components/animals/AnimalNotes'

import { localizacaoValidaParaExibir } from '../../utils/formatters'
import { useAnimalDetails } from '../../hooks/useAnimalDetails'
import { getSexTheme, getPageBgClasses } from '../../utils/animalSexTheme'

export default function ConsultaAnimalView({ darkMode = false, toggleDarkMode }) {
  const router = useRouter()
  const { id } = router.query

  // Log para debug
  useEffect(() => {
    console.log('ConsultaAnimalView montado', { id, pathname: router.pathname })
  }, [id, router.pathname])

  const {
    animal,
    setAnimal,
    loading,
    error,
    rankings,
    maeLink,
    maeColetas,
    baixasResumo,
    baixasMae,
    examesAndrologicos,
    ocorrencias,
    transferencias,
    inseminacoes,
    metrics
  } = useAnimalDetails(id)

  const filhosCombinados = useMemo(() => {
    try {
      const ativos = animal?.filhos || []
      const baixados = baixasResumo?.resumoMae?.proleDetalhes || []
    
    // Combinar e remover duplicatas por ID (se houver) ou RG/Série
    const map = new Map()
    
    ativos.forEach(f => {
      const key = f.id ? `id-${f.id}` : `${f.serie}-${f.rg}`
      map.set(key, { ...f, status: 'ATIVO' })
    })
    
    baixados.forEach((f, idx) => {
      const key = `${f.serie}-${f.rg}`
      const fComId = { ...f, id: f.id || `baixa-${f.serie}-${f.rg}-${idx}`, status: f.tipo }
      // Encontrar a chave do mapa onde esse filho já existe (evita duplicatas e chaves React duplicadas)
      let mapKeyToUpdate = null
      for (const [k, v] of map) {
        if (v.serie === f.serie && v.rg === f.rg) {
          mapKeyToUpdate = k
          break
        }
      }
      if (mapKeyToUpdate) {
        map.set(mapKeyToUpdate, { ...map.get(mapKeyToUpdate), ...fComId, status: f.tipo })
      } else {
        map.set(`baixa-${key}`, fComId)
      }
    })
    
    return Array.from(map.values()).sort((a, b) => {
      // Ordenar por nascimento (se tiver) ou data de baixa (se tiver) ou RG
      // Melhora: ordenar por data (nascimento ou baixa) decrescente
      const d1 = a.data_nascimento || a.data_baixa
      const d2 = b.data_nascimento || b.data_baixa
      if (d1 && d2) return new Date(d2) - new Date(d1)
      return 0
    })
    } catch (error) {
      console.error('Erro ao combinar filhos:', error)
      return []
    }
  }, [animal?.filhos, baixasResumo?.resumoMae?.proleDetalhes])

  const { posicaoIABCZ: rankingPosicao, posicaoIQG: rankingPosicaoGenetica2, filhoTopIABCZ: filhoTopRanking } = rankings

  const [, setShowIABCZInfo] = useState(false)
  const [isEditGeneticaModalOpen, setIsEditGeneticaModalOpen] = useState(false)
  const sectionRefs = useRef({ custos: null, genética: null, pai: null, filhos: null, peso: null, fiv: null, localizacao: null })

  const handleSaveGenetica = useCallback((updatedAnimal) => {
    setAnimal(prev => ({ ...prev, ...updatedAnimal }))
    setIsEditGeneticaModalOpen(false)
  }, [setAnimal])

  const refreshCustos = useCallback(async () => {
    if (!animal?.id) return
    try {
      const r = await fetch(`/api/animals/${animal.id}/custos`)
      const d = r.ok ? await r.json() : { data: [] }
      const custos = Array.isArray(d.data ?? d.custos ?? d) ? (d.data ?? d.custos ?? d) : []
      setAnimal(prev => prev ? { ...prev, custos } : prev)
    } catch {}
  }, [animal?.id, setAnimal])

  const [copiedIdent, setCopiedIdent] = useState(false)
  const handleCopyIdent = useCallback(() => {
    const t = `${animal?.serie || ''} ${animal?.rg || ''}`.trim()
    if (!t) return
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(t)
        .then(() => { setCopiedIdent(true); setTimeout(() => setCopiedIdent(false), 2000) })
        .catch(() => {})
    }
  }, [animal?.serie, animal?.rg])

  const handleWhatsAppShare = useCallback(() => {
    if (!animal) return
    const locAtiva = animal.localizacoes?.find(l => !l.data_saida)
    const locMaisRecente = animal.localizacoes?.[0]
    const locBruto = locAtiva?.piquete || locMaisRecente?.piquete || animal.piquete_atual || animal.piqueteAtual || animal.localizacao_atual
    const locFiltrada = localizacaoValidaParaExibir(locBruto) || (locBruto ? 'Não informado' : null)
    const texto = [
      `Animal: ${animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || '-'}`,
      `Identificação: ${animal.serie || '-'} ${animal.rg || '-'}`,
      animal.sexo ? `Sexo: ${animal.sexo}` : null,
      animal.raca ? `Raça: ${animal.raca}` : null,
      metrics.mesesIdade ? `Idade: ${metrics.mesesIdade} meses` : null,
      animal.peso ? `Peso: ${animal.peso} kg` : null,
      (animal.abczg || animal.abczg === 0) ? `iABCZ: ${animal.abczg}${filhoTopRanking ? ' • Mãe do 1º do ranking' : rankingPosicao ? ` • ${rankingPosicao}º no ranking` : ''}` : null,
      ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? `IQG: ${(animal.iqg ?? animal.genetica_2)}${rankingPosicaoGenetica2 ? ` • ${rankingPosicaoGenetica2}º no ranking` : ''}` : null,
      ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? `Pt IQG: ${(animal.pt_iqg ?? animal.decile_2)}` : null,
      locFiltrada ? `Localização: ${locFiltrada}` : null
    ].filter(Boolean).join('\n')
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }, [animal, metrics, rankingPosicao, rankingPosicaoGenetica2, filhoTopRanking])

  // Localização atual para exibição
  const locAtual = useMemo(() => {
    if (!animal) return null
    const locAtiva = animal.localizacoes?.find(l => !l.data_saida)
    const locMaisRecente = animal.localizacoes?.[0]
    const locBruto = locAtiva?.piquete
      || locMaisRecente?.piquete
      || animal.piquete_atual
      || animal.piqueteAtual
      || animal.pasto_atual
      || animal.pastoAtual
      || (typeof animal.localizacao_atual === 'object' ? animal.localizacao_atual?.piquete : null)
      || animal.localizacao_atual
    return localizacaoValidaParaExibir(locBruto) || (locBruto ? 'Não informado' : null)
  }, [animal])

  const resumoChips = useMemo(() => {
    try {
      if (!animal) return []
      return [
        animal.situacao,
        animal.sexo,
        animal.raca,
        animal.pelagem,
        animal.categoria,
        locAtual ? `📍 ${locAtual}` : null,
        animal.brinco ? `🏷️ ${animal.brinco}` : null
      ].filter(Boolean)
    } catch (error) {
      console.error('Erro ao gerar resumoChips:', error)
      return []
    }
  }, [animal, locAtual])

  const nome = animal ? (animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || '-') : '-'
  const sexTheme = getSexTheme(animal)

  const scrollToSection = useCallback((key) => {
    const el = sectionRefs.current[key]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (loading) {
    return (
      <>
        <Head>
          <title>Carregando... | Beef-Sync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-sky-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pb-24">
          {/* Skeleton header */}
          <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 backdrop-blur-md pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3 min-h-[52px]">
              <div className="skeleton h-6 w-24 rounded-lg" />
              <div className="skeleton h-10 w-10 rounded-xl" />
            </div>
          </header>
          <div className="max-w-lg mx-auto p-4 space-y-4">
            {/* Skeleton chips */}
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-7 w-20 rounded-full" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            {/* Skeleton metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-[72px] rounded-lg" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
            {/* Skeleton main card */}
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
              <div className="h-12 bg-gray-100 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="skeleton h-12 w-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-3/4 rounded" />
                    <div className="skeleton h-4 w-1/2 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-9 w-28 rounded-lg" />
                  <div className="skeleton h-9 w-24 rounded-lg" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-10 w-full rounded" style={{ animationDelay: `${i * 50}ms` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !animal) {
    return (
      <>
        <Head>
          <title>Erro | Beef-Sync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gray-50 dark:bg-gray-900">
          <p className="text-red-600 dark:text-red-400 text-center mb-2">{error || 'Animal não encontrado'}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6 max-w-sm">
            Se o animal existe no banco, tente por identificação: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/consulta-animal/SERIE-RG</code>
          </p>
          <Link
            href="/a?buscar=1"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Nova Consulta
          </Link>
        </div>
      </>
    )
  }

  return (
    <React.Fragment>
      <Head>
        <title>{nome} | Consulta Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
      </Head>
      <div className={`min-h-screen ${getPageBgClasses(sexTheme)} pb-[calc(6.5rem+env(safe-area-inset-bottom))] scroll-pt-4`}>
        <ErrorBoundary fallbackMessage="Erro ao carregar a ficha do animal. Tente recarregar a página.">
        <AnimalHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          animal={animal}
          resumoChips={resumoChips}
          setShowIABCZInfo={setShowIABCZInfo}
          rankings={rankings}
          sexTheme={sexTheme}
        />

        <div className="max-w-lg mx-auto p-3 sm:p-4 space-y-3">
          <div className="animate-fade-in-stagger-1">
            <AnimalMetricsCards animal={animal} metrics={metrics} rankings={rankings} onScrollTo={scrollToSection} sexTheme={sexTheme} />
          </div>

          <div className="animate-fade-in-stagger-2">
          <AnimalMainInfo
            animal={animal}
            sexTheme={sexTheme}
            rankings={rankings}
            metrics={{...metrics, locAtual, previsaoPartoExibir: metrics.previsaoParto}}
            examesAndrologicos={examesAndrologicos}
            ultimaIA={metrics.ultimaIA}
            totalOocitos={metrics.totalOocitos}
            onCopyIdent={handleCopyIdent}
            copiedIdent={copiedIdent}
            onWhatsAppShare={handleWhatsAppShare}
            onEditGenetica={() => setIsEditGeneticaModalOpen(true)}
            maeLink={maeLink}
            maeColetas={maeColetas}
            baixasResumo={baixasResumo}
            baixasMae={baixasMae}
            locAtual={locAtual}
            onScrollToLocation={() => scrollToSection('localizacao')}
          />

          <AnimalPlanningCards animal={animal} metrics={metrics} />

          <AnimalAndrologicalExams examesAndrologicos={examesAndrologicos} metrics={metrics} />
          </div>
          
          <div className="animate-fade-in-stagger-4">
          <AnimalGestations gestacoes={animal.gestacoes || []} />
          
          <AnimalInseminations inseminacoes={inseminacoes} dataNascimento={animal?.data_nascimento} />
          </div>

          <div className="animate-fade-in-stagger-5">
          <AnimalReproduction animal={animal} />
          
          <div ref={r => sectionRefs.current.fiv = r} className="scroll-mb-28"><AnimalIVFCollections fivs={animal.fivs || []} /></div>
          
          <AnimalEmbryoTransfers transferencias={transferencias} />

          <AnimalTimeline
            animal={animal}
            ocorrencias={ocorrencias}
            inseminacoes={inseminacoes}
            transferencias={transferencias}
          />

          <div ref={r => sectionRefs.current.localizacao = r} className="scroll-mb-28"><AnimalLocation animal={animal} locAtual={locAtual} diasNaFazenda={metrics.diasNaFazenda} /></div>

          <div ref={r => sectionRefs.current.filhos = r} className="scroll-mb-28"><AnimalOffspring animal={animal} filhos={filhosCombinados} /></div>

          <AnimalOccurrences animal={animal} ocorrencias={ocorrencias} />

          <AnimalHealthProtocols animal={animal} />

          <div ref={r => sectionRefs.current.peso = r} className="scroll-mb-28"><AnimalWeightHistory animal={animal} /></div>

          <div ref={r => sectionRefs.current.custos = r} className="scroll-mb-28"><AnimalCosts animal={animal} onCustosUpdated={refreshCustos} /></div>

          <div ref={r => sectionRefs.current.genética = r} className="scroll-mb-28"><AnimalGenetics animal={animal} /></div>

          <AnimalNotes animal={animal} />

          <AnimalPhotos animal={animal} />

          <AnimalAdditionalInfo animal={animal} />
          </div>
        </div>

        <AnimalFixedActions 
          onShare={handleWhatsAppShare}
          isSharing={false}
          animalId={animal?.id}
          sexTheme={sexTheme}
        />

        {isEditGeneticaModalOpen && (
          <EditGeneticaModal
            isOpen={isEditGeneticaModalOpen}
            onClose={() => setIsEditGeneticaModalOpen(false)}
            animal={animal}
            onSave={handleSaveGenetica}
          />
        )}
        </ErrorBoundary>
      </div>
    </React.Fragment>
  )
}
