/**
 * Script para criar ou atualizar NF de Saída 18 com 4 itens e data de saída amanhã
 * Execute: node scripts/criar-nf-saida-18.js
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'

// Amanhã
const amanha = new Date()
amanha.setDate(amanha.getDate() + 1)
const dataSaida = amanha.toISOString().split('T')[0] // YYYY-MM-DD
const dataFormatada = dataSaida.split('-').reverse().join('/') // DD/MM/YYYY

const itens = [
  { tatuagem: 'NF18-1', sexo: 'femea', era: '24+ meses', raca: 'Nelore', peso: 0, valorUnitario: 0, tipoProduto: 'bovino' },
  { tatuagem: 'NF18-2', sexo: 'femea', era: '24+ meses', raca: 'Nelore', peso: 0, valorUnitario: 0, tipoProduto: 'bovino' },
  { tatuagem: 'NF18-3', sexo: 'femea', era: '24+ meses', raca: 'Nelore', peso: 0, valorUnitario: 0, tipoProduto: 'bovino' },
  { tatuagem: 'NF18-4', sexo: 'femea', era: '24+ meses', raca: 'Nelore', peso: 0, valorUnitario: 0, tipoProduto: 'bovino' }
]

async function executar() {
  console.log('📤 NF de Saída 18 - 4 itens - Data de saída:', dataFormatada)
  console.log('   Incrição: PARDINHO (Boletim de Pardinho)')
  console.log('')

  try {
    // Buscar NF 18
    const listRes = await fetch(`${API_URL}/api/notas-fiscais`)
    const listData = await listRes.json()
    const nf18 = (listData.data || []).find(nf => String(nf.numero_nf) === '18')

    if (nf18) {
      // Atualizar NF existente
      const updateData = {
        id: nf18.id,
        numeroNF: '18',
        data: dataFormatada,
        dataSaida: dataFormatada,
        tipo: 'saida',
        tipoProduto: 'bovino',
        naturezaOperacao: 'Venda',
        destino: nf18.destino || 'A definir',
        incricao: 'PARDINHO',
        valorTotal: 0,
        itens
      }

      const res = await fetch(`${API_URL}/api/notas-fiscais`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`)
      }

      console.log('✅ NF de Saída 18 atualizada com sucesso!')
      console.log('   ID:', nf18.id)
      console.log('   Data saída:', dataFormatada)
      console.log('   Itens:', itens.length)
    } else {
      // Criar nova NF
      const nfData = {
        numeroNF: '18',
        data: dataFormatada,
        dataSaida: dataFormatada,
        tipo: 'saida',
        tipoProduto: 'bovino',
        naturezaOperacao: 'Venda',
        destino: 'A definir',
        incricao: 'PARDINHO',
        valorTotal: 0,
        itens
      }

      const res = await fetch(`${API_URL}/api/notas-fiscais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nfData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`)
      }

      console.log('✅ NF de Saída 18 criada com sucesso!')
      console.log('   ID:', data.data?.id)
      console.log('   Data saída:', dataFormatada)
      console.log('   Itens:', itens.length)
    }

    console.log('')
    console.log('⚠️ Edite a NF no sistema para preencher tatuagens reais, valores e destino.')
  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
}

executar()
