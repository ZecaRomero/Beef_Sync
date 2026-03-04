#!/usr/bin/env node

// Testa a API /api/animals/batch com um animal de série BENT

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

async function run() {
  try {
    const url = 'http://localhost:3020/api/animals/batch'
    const payload = {
      animais: [
        {
          serie: 'BENT',
          rg: '6408',
          sexo: 'M',
          raca: 'Nelore',
          observacoes: 'Teste batch BENT'
        },
        {
          serie: 'BENT',
          rg: '6410',
          sexo: 'F',
          raca: 'Nelore',
          observacoes: 'Teste batch BENT 2'
        }
      ]
    }

    console.log('➡️ POST', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    console.log('📥 Status:', res.status)
    const data = await res.json()
    console.log('📊 Resposta:', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('❌ Erro no teste batch:', err)
    process.exitCode = 1
  }
}

if (require.main === module) {
  run()
}