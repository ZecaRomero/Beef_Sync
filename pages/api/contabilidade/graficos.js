import { Chart, registerables } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import databaseService from '../../../services/databaseService'
import { RACAS_POR_SERIE as racasPorSerie } from '../../../utils/constants'

// Função para corrigir raça baseada na série
function corrigirRacaPorSerie(animal) {
  if (animal.serie && racasPorSerie[animal.serie]) {
    const racaCorreta = racasPorSerie[animal.serie]
    if (animal.raca !== racaCorreta) {
      return { ...animal, raca: racaCorreta }
    }
  }
  return animal
}

// Registrar todos os componentes do Chart.js
Chart.register(...registerables)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' })
  }

  try {
    const { period } = req.body

    // Buscar animais diretamente do banco ao invés de receber no body
    // Isso evita problemas com limite de tamanho do body (1MB)
    let animals = []
    
    try {
      console.log('🔄 Buscando animais diretamente do banco de dados para gráficos...')
      animals = await databaseService.buscarAnimais({})
      console.log(`✅ ${animals.length} animais encontrados no banco`)
      
      // Converter formato do banco para formato esperado pelo código e corrigir raça por série
      animals = animals.map(animal => {
        const animalFormatado = {
          ...animal,
          dataNascimento: animal.data_nascimento || animal.dataNascimento,
          data_nascimento: animal.data_nascimento || animal.dataNascimento,
          meses: animal.meses || (animal.data_nascimento ? 
            Math.floor((new Date() - new Date(animal.data_nascimento)) / (1000 * 60 * 60 * 24 * 30.44)) : 0),
          situacao: animal.situacao || 'Ativo'
        }
        // Corrigir raça baseada na série
        return corrigirRacaPorSerie(animalFormatado)
      })
    } catch (dbError) {
      console.error('❌ Erro ao buscar animais do banco:', dbError)
      return res.status(500).json({ 
        message: 'Erro ao buscar dados dos animais do banco de dados',
        error: dbError.message 
      })
    }
    
    if (animals.length === 0) {
      return res.status(400).json({ message: 'Nenhum animal encontrado no banco de dados' })
    }
    
    console.log(`📊 Processando ${animals.length} animais para os gráficos`)

    // Configurar Chart.js para Node.js
    const width = 800
    const height = 600
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height })

    // Preparar dados para os gráficos
    const dadosGraficos = prepararDadosGraficos(animals)

    // Gerar gráficos
    const graficos = await Promise.all([
      gerarGraficoRacas(dadosGraficos.porRaca, chartJSNodeCanvas),
      gerarGraficoIdades(dadosGraficos.porIdade, chartJSNodeCanvas),
      gerarGraficoSexo(dadosGraficos.porSexo, chartJSNodeCanvas),
      gerarGraficoSituacao(dadosGraficos.porSituacao, chartJSNodeCanvas),
      gerarGraficoEra(dadosGraficos.porEra, chartJSNodeCanvas),
      gerarGraficoPai(dadosGraficos.porPai, chartJSNodeCanvas),
      gerarGraficoMae(dadosGraficos.porMae, chartJSNodeCanvas)
    ])

    res.status(200).json({
      success: true,
      graficos: {
        porRaca: graficos[0],
        porIdade: graficos[1],
        porSexo: graficos[2],
        porSituacao: graficos[3],
        porEra: graficos[4],
        porPai: graficos[5],
        porMae: graficos[6]
      },
      resumo: dadosGraficos.resumo,
      periodo: period
    })

  } catch (error) {
    console.error('Erro ao gerar gráficos:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
}

function calcularEra(meses, sexo) {
  if (!meses || meses === 0) return 'Não informado'
  
  const isFemea = sexo && (sexo.toLowerCase().includes('fêmea') || sexo.toLowerCase().includes('femea') || sexo === 'F')
  const isMacho = sexo && (sexo.toLowerCase().includes('macho') || sexo === 'M')
  
  if (isFemea) {
    // FÊMEA: 0-7 / 7-12 / 12-18 / 18-24 / 24+
    if (meses <= 7) return '0/7'
    if (meses <= 12) return '7/12'
    if (meses <= 18) return '12/18'
    if (meses <= 24) return '18/24'
    return '24+'
  } else if (isMacho) {
    // MACHO: 0-7 / 7-15 / 15-18 / 18-22 / 22+
    if (meses <= 7) return '0/7'
    if (meses <= 15) return '7/15'
    if (meses <= 18) return '15/18'
    if (meses <= 22) return '18/22'
    return '22+'
  }
  
  // Se não tem sexo definido, usar padrão
  if (meses <= 7) return '0/7'
  if (meses <= 12) return '7/12'
  if (meses <= 18) return '12/18'
  if (meses <= 24) return '18/24'
  return '24+'
}

function prepararDadosGraficos(animals) {
  const porRaca = {}
  const porIdade = {}
  const porSexo = {}
  const porSituacao = {}
  const porEra = {}
  const porPai = {}
  const porMae = {}

  animals.forEach(animal => {
    // Por Raça
    const raca = animal.raca || 'Não informado'
    porRaca[raca] = (porRaca[raca] || 0) + 1

    // Por Sexo
    const sexo = animal.sexo || 'Não informado'
    porSexo[sexo] = (porSexo[sexo] || 0) + 1

    // Por Situação
    const situacao = animal.situacao || 'Ativo'
    porSituacao[situacao] = (porSituacao[situacao] || 0) + 1

    // Por Idade (em meses)
    let idadeMeses = 0
    const dataNascimento = animal.data_nascimento || animal.dataNascimento
    
    if (dataNascimento) {
      const nascimento = new Date(dataNascimento)
      const hoje = new Date()
      if (!isNaN(nascimento.getTime())) {
        idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44)) // Média de dias por mês
      }
    }
    
    // Se não tem data de nascimento válida, usar campo meses
    if (idadeMeses === 0 && animal.meses) {
      idadeMeses = parseInt(animal.meses) || 0
    }

    // Por ERA (faixa etária simplificada)
    const era = calcularEra(idadeMeses, animal.sexo)
    porEra[era] = (porEra[era] || 0) + 1

    // Categorizar por faixa etária conforme classificação bovina
    let faixaEtaria = 'Não informado'
    if (idadeMeses > 0) {
      if (animal.sexo === 'Fêmea') {
        if (idadeMeses <= 7) faixaEtaria = 'Bezerra (0-7 meses)'
        else if (idadeMeses <= 12) faixaEtaria = 'Bezerra/Novilha (8-12 meses)'
        else if (idadeMeses <= 18) faixaEtaria = 'Novilha (13-18 meses)'
        else if (idadeMeses <= 24) faixaEtaria = 'Novilha (19-24 meses)'
        else faixaEtaria = 'Vaca (+25 meses)'
      } else {
        if (idadeMeses <= 7) faixaEtaria = 'Bezerro (0-7 meses)'
        else if (idadeMeses <= 15) faixaEtaria = 'Bezerro/Garrote (8-15 meses)'
        else if (idadeMeses <= 24) faixaEtaria = 'Garrote (16-24 meses)'
        else if (idadeMeses <= 36) faixaEtaria = 'Garrote (25-36 meses)'
        else faixaEtaria = 'Touro (+36 meses)'
      }
    }

    porIdade[faixaEtaria] = (porIdade[faixaEtaria] || 0) + 1

    // Por Pai
    const pai = animal.pai || animal.nomePai || 'Não informado'
    porPai[pai] = (porPai[pai] || 0) + 1

    // Por Mãe
    const mae = animal.mae || animal.nomeMae || 'Não informado'
    porMae[mae] = (porMae[mae] || 0) + 1
  })

  return {
    porRaca,
    porIdade,
    porSexo,
    porSituacao,
    porEra,
    porPai,
    porMae,
    resumo: {
      total: animals.length,
      racas: Object.keys(porRaca).length,
      faixasEtarias: Object.keys(porIdade).length,
      eras: Object.keys(porEra).length,
      pais: Object.keys(porPai).length,
      maes: Object.keys(porMae).length
    }
  }
}

async function gerarGraficoRacas(dados, chartJSNodeCanvas) {
  const labels = Object.keys(dados)
  const values = Object.values(dados)
  
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ]

  const config = {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverBorderColor: '#333333'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribuição por Raça',
          font: { size: 18, weight: 'bold', color: '#333333' },
          padding: 20
        },
        legend: {
          position: 'bottom',
          labels: { 
            padding: 20,
            font: { size: 12, weight: 'bold' },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
      },
      elements: {
        arc: {
          borderWidth: 3,
          borderColor: '#ffffff'
        }
      },
      layout: {
        padding: 20
      }
    }
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config)
  return Buffer.from(imageBuffer).toString('base64')
}

async function gerarGraficoIdades(dados, chartJSNodeCanvas) {
  const labels = Object.keys(dados)
  const values = Object.values(dados)
  
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#FF6384'
  ]

  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Quantidade de Animais',
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: colors.slice(0, labels.length).map(color => color + 'CC'),
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribuição por Classificação Etária',
          font: { size: 18, weight: 'bold', color: '#333333' },
          padding: 20
        },
        legend: {
          display: false
        },
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11,
              weight: 'bold'
            },
            color: '#666666'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#E0E0E0',
            lineWidth: 1
          },
          ticks: {
            stepSize: 1,
            font: {
              size: 11,
              weight: 'bold'
            },
            color: '#666666'
          }
        }
      },
      layout: {
        padding: 20
      }
    }
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config)
  return Buffer.from(imageBuffer).toString('base64')
}

async function gerarGraficoSexo(dados, chartJSNodeCanvas) {
  const labels = Object.keys(dados)
  const values = Object.values(dados)
  
  const colors = ['#36A2EB', '#FF6384', '#FFCE56']

  const config = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverBorderColor: '#333333'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribuição por Sexo',
          font: { size: 18, weight: 'bold', color: '#333333' },
          padding: 20
        },
        legend: {
          position: 'bottom',
          labels: { 
            padding: 20,
            font: { size: 12, weight: 'bold' },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
      },
      elements: {
        arc: {
          borderWidth: 3,
          borderColor: '#ffffff'
        }
      },
      layout: {
        padding: 20
      }
    }
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config)
  return Buffer.from(imageBuffer).toString('base64')
}

async function gerarGraficoSituacao(dados, chartJSNodeCanvas) {
  const labels = Object.keys(dados)
  const values = Object.values(dados)
  
  const colors = ['#4BC0C0', '#FF6384', '#FFCE56']

  const config = {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverBorderColor: '#333333'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribuição por Situação',
          font: { size: 18, weight: 'bold', color: '#333333' },
          padding: 20
        },
        legend: {
          position: 'bottom',
          labels: { 
            padding: 20,
            font: { size: 12, weight: 'bold' },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
      },
      elements: {
        arc: {
          borderWidth: 3,
          borderColor: '#ffffff'
        }
      },
      layout: {
        padding: 20
      }
    }
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config)
  return Buffer.from(imageBuffer).toString('base64')
}

async function gerarGraficoEra(dados, chartJSNodeCanvas) {
  const labels = Object.keys(dados).sort((a, b) => {
    const ordem = ['0/7', '7/12', '12/18', '18/24', '24+', '7/15', '15/18', '18/22', '22+', 'Não informado']
    return ordem.indexOf(a) - ordem.indexOf(b)
  })
  const values = labels.map(label => dados[label])
  
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']

  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Quantidade de Animais',
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribuição por ERA (Faixa Etária)',
          font: { size: 18, weight: 'bold', color: '#333333' },
          padding: 20
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 12, weight: 'bold' },
            color: '#666666'
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#E0E0E0', lineWidth: 1 },
          ticks: {
            stepSize: 1,
            font: { size: 11, weight: 'bold' },
            color: '#666666'
          }
        }
      },
      layout: { padding: 20 }
    }
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config)
  return Buffer.from(imageBuffer).toString('base64')
}

async function gerarGraficoPai(dados, chartJSNodeCanvas) {
  // Ordenar por quantidade (mais descendentes primeiro) e pegar top 10
  const sorted = Object.entries(dados)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  const labels = sorted.map(([pai]) => pai || 'Não informado')
  const values = sorted.map(([, count]) => count)
  
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
    '#FF6384', '#36A2EB'
  ]

  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Descendentes',
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: 'Top 10 - Distribuição por Pai (Descendentes)',
          font: { size: 18, weight: 'bold', color: '#333333' },
          padding: 20
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#E0E0E0', lineWidth: 1 },
          ticks: {
            stepSize: 1,
            font: { size: 11, weight: 'bold' },
            color: '#666666'
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { size: 11, weight: 'bold' },
            color: '#666666'
          }
        }
      },
      layout: { padding: 20 }
    }
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config)
  return Buffer.from(imageBuffer).toString('base64')
}

async function gerarGraficoMae(dados, chartJSNodeCanvas) {
  // Ordenar por quantidade (mais descendentes primeiro) e pegar top 10
  const sorted = Object.entries(dados)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  const labels = sorted.map(([mae]) => mae || 'Não informado')
  const values = sorted.map(([, count]) => count)
  
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
    '#FF6384', '#36A2EB'
  ]

  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Descendentes',
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: 'Top 10 - Distribuição por Mãe (Descendentes)',
          font: { size: 18, weight: 'bold', color: '#333333' },
          padding: 20
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#E0E0E0', lineWidth: 1 },
          ticks: {
            stepSize: 1,
            font: { size: 11, weight: 'bold' },
            color: '#666666'
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { size: 11, weight: 'bold' },
            color: '#666666'
          }
        }
      },
      layout: { padding: 20 }
    }
  }

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config)
  return Buffer.from(imageBuffer).toString('base64')
}
