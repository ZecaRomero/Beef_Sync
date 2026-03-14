const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'consulta-animal', '[id].jsx');

const newContent = `/**
 * Ficha do Animal - Modo Consulta (somente leitura)
 * Usado quando o usuário acessa via /a - sem edição, sem sidebar
 * Inclui: machos = exames andrológicos | fêmeas = FIV, inseminações, gestações
 */
import React, { useState, useCallback, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

import EditGeneticaModal from '../../components/animals/EditGeneticaModal'
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

export default function ConsultaAnimalView({ darkMode = false, toggleDarkMode }) {
  const router = useRouter()
  const { id } = router.query

  const {
    animal,
    setAnimal,
    loading,
    error,
    rankings: {
      posicaoIABCZ: rankingPosicao,
      posicaoIQG: rankingPosicaoGenetica2,
      filhoTopIABCZ: filhoTopRanking,
      filhoTopIQG: filhoTopRankingIQG
    },
    maeLink,
    examesAndrologicos,
    setExamesAndrologicos,
    ocorrencias,
    transferencias,
    inseminacoes,
    metrics
  } = useAnimalDetails(id)

  const [showIABCZInfo, setShowIABCZInfo] = useState(false)
  const [isEditGeneticaModalOpen, setIsEditGeneticaModalOpen] = useState(false)

  const handleSaveGenetica = useCallback((updatedAnimal) => {
    setAnimal(prev => ({ ...prev, ...updatedAnimal }))
    setIsEditGeneticaModalOpen(false)
  }, [setAnimal])

  const handleCopyIdent = useCallback(() => {
    const t = \`\${animal?.serie || ''} \${animal?.rg || ''}\`.trim()
    if (!t) return
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(t).then(() => {
        alert('Identificação copiada')
      }).catch(() => {})
    }
  }, [animal?.serie, animal?.rg])

  const handleWhatsAppShare = useCallback(() => {
    if (!animal) return
    const locAtiva = animal.localizacoes?.find(l => !l.data_saida)
    const locMaisRecente = animal.localizacoes?.[0]
    const locBruto = locAtiva?.piquete || locMaisRecente?.piquete || animal.piquete_atual || animal.piqueteAtual || animal.localizacao_atual
    const locFiltrada = localizacaoValidaParaExibir(locBruto) || (locBruto ? 'Não informado' : null)
    const texto = [
      \`Animal: \${animal.nome || \`\${animal.serie || ''} \${animal.rg || ''}\`.trim() || '-'}\`,
      \`Identificação: \${animal.serie || '-'} \${animal.rg || '-'}\`,
      animal.sexo ? \`Sexo: \${animal.sexo}\` : null,
      animal.raca ? \`Raça: \${animal.raca}\` : null,
      metrics.mesesIdade ? \`Idade: \${metrics.mesesIdade} meses\` : null,
      animal.peso ? \`Peso: \${animal.peso} kg\` : null,
      (animal.abczg || animal.abczg === 0) ? \`iABCZ: \${animal.abczg}\${filhoTopRanking ? ' • Mãe do 1º do ranking' : rankingPosicao ? \` • \${rankingPosicao}º no ranking\` : ''}\` : null,
      ((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? \`IQG: \${(animal.iqg ?? animal.genetica_2)}\${rankingPosicaoGenetica2 ? \` • \${rankingPosicaoGenetica2}º no ranking\` : ''}\` : null,
      ((animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0) ? \`Pt IQG: \${(animal.pt_iqg ?? animal.decile_2)}\` : null,
      locFiltrada ? \`Localização: \${locFiltrada}\` : null
    ].filter(Boolean).join('\\n')
    const url = \`https://wa.me/?text=\${encodeURIComponent(texto)}\`
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
    if (!animal) return []
    return [
      animal.situacao,
      animal.sexo,
      animal.raca,
      animal.pelagem,
      animal.categoria,
      locAtual ? \`📍 \${locAtual}\` : null,
      animal.brinco ? \`🏷️ \${animal.brinco}\` : null
    ].filter(Boolean)
  }, [animal, locAtual])

  const nome = animal ? (animal.nome || \`\${animal.serie || ''} \${animal.rg || ''}\`.trim() || '-') : '-'

  if (loading) {
    return (
      <>
        <Head>
          <title>Carregando... | Beef-Sync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gray-50 dark:bg-gray-900">
          <span className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando...</p>
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
          <p className="text-red-600 dark:text-red-400 text-center mb-6">{error || 'Animal não encontrado'}</p>
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <AnimalHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          animal={animal}
          resumoChips={resumoChips}
          setShowIABCZInfo={setShowIABCZInfo}
          rankings={{
            posicaoIABCZ: rankingPosicao,
            posicaoIQG: rankingPosicaoGenetica2,
            filhoTopIABCZ: filhoTopRanking,
            filhoTopIQG: filhoTopRankingIQG
          }}
        />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          <AnimalMetricsCards animal={animal} metrics={metrics} rankings={{
            posicaoIABCZ: rankingPosicao,
            posicaoIQG: rankingPosicaoGenetica2,
            filhoTopIABCZ: filhoTopRanking,
            filhoTopIQG: filhoTopRankingIQG
          }} />

          <AnimalMainInfo
            animal={animal}
            rankings={{
              posicaoIABCZ: rankingPosicao,
              posicaoIQG: rankingPosicaoGenetica2,
              filhoTopIABCZ: filhoTopRanking,
              filhoTopIQG: filhoTopRankingIQG
            }}
            metrics={{...metrics, locAtual}}
            examesAndrologicos={examesAndrologicos}
            ultimaIA={metrics.ultimaIA}
            totalOocitos={metrics.totalOocitos}
            onCopyIdent={handleCopyIdent}
            onWhatsAppShare={handleWhatsAppShare}
            onEditGenetica={() => setIsEditGeneticaModalOpen(true)}
            maeLink={maeLink}
            locAtual={locAtual}
          />

          <AnimalPlanningCards animal={animal} metrics={metrics} />

          <AnimalAndrologicalExams examesAndrologicos={examesAndrologicos} />
          
          <AnimalGestations gestacoes={animal.gestacoes || []} />
          
          <AnimalInseminations inseminacoes={inseminacoes} />

          <AnimalReproduction animal={animal} />
          
          <AnimalIVFCollections animal={animal} totalOocitos={metrics.totalOocitos} mediaOocitos={metrics.mediaOocitos} />
          
          <AnimalEmbryoTransfers transferencias={transferencias} />

          <AnimalTimeline animal={animal} />

          <AnimalLocation animal={animal} locAtual={locAtual} diasNaFazenda={metrics.diasNaFazenda} />

          <AnimalOffspring animal={animal} />

          <AnimalOccurrences animal={animal} ocorrencias={ocorrencias} />

          <AnimalHealthProtocols animal={animal} />

          <AnimalWeightHistory animal={animal} />

          <AnimalCosts animal={animal} />

          <AnimalGenetics animal={animal} />

          <AnimalNotes animal={animal} />

          <AnimalPhotos animal={animal} />

          <AnimalAdditionalInfo animal={animal} />
        </div>

        <AnimalFixedActions 
          animal={animal} 
          onWhatsAppShare={handleWhatsAppShare}
          onCopyIdent={handleCopyIdent}
        />

        {isEditGeneticaModalOpen && (
          <EditGeneticaModal
            isOpen={isEditGeneticaModalOpen}
            onClose={() => setIsEditGeneticaModalOpen(false)}
            animal={animal}
            onSave={handleSaveGenetica}
          />
        )}
      </div>
    </React.Fragment>
  )
}
`;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('File rewritten successfully');
