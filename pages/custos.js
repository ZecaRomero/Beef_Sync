import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import CostManager from '../components/CostManager'
import QuickProtocolEditor from '../components/QuickProtocolEditor'

export default function CustosPage() {
  const router = useRouter()
  const { animalId } = router.query

  return (
    <>
      <Head>
        <title>Custos por Animal | Beef Sync</title>
        <meta name="description" content="Controle de custos por animal, ROI e custo na propriedade" />
      </Head>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <CostManager initialAnimalId={animalId} />
        <QuickProtocolEditor />
      </div>
    </>
  )
}