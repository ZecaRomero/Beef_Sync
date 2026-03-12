import Head from 'next/head'
import { useRouter } from 'next/router'

export default function VerificarBaixas() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Verificar baixas</title>
      </Head>

      <main style={{ padding: 24 }}>
        <h1>Verificar baixas</h1>
        <p>Esta página foi criada para evitar falha no build.</p>
        <button onClick={() => router.back()} style={{ marginTop: 12 }}>
          Voltar
        </button>
      </main>
    </>
  )
}
