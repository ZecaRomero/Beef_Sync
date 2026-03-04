/**
 * CONFIGURAÇÕES E DADOS ESTÁTICOS DO SISTEMA
 * 
 * ⚠️ ATENÇÃO: Este arquivo importa de utils/constants.js (fonte única de verdade).
 * Adicione novas constantes lá, não aqui.
 * Os re-exports abaixo existem apenas para retrocompatibilidade.
 */
import {
  RACAS_POR_SERIE,
  TIPOS_CUSTO,
  SUBTIPOS_CUSTO,
  SITUACOES_ANIMAL,
} from '../utils/constants'

// ============================================================================
// RE-EXPORTS DE COMPATIBILIDADE
// ============================================================================

/** @deprecated use RACAS_POR_SERIE de utils/constants.js */
export const racasPorSerie = RACAS_POR_SERIE

/** @deprecated Array vazio — dados vêm do PostgreSQL */
export const mockAnimals = []

/** @deprecated use TIPOS_CUSTO de utils/constants.js */
export const tiposCusto = TIPOS_CUSTO

/** @deprecated use SUBTIPOS_CUSTO de utils/constants.js */
export const subtiposCusto = SUBTIPOS_CUSTO

/** @deprecated use SITUACOES_ANIMAL de utils/constants.js */
export const situacoes = SITUACOES_ANIMAL

// Custos sugeridos por ERA (idade em meses)
export const custosPorERA = {
  machos: {
    'ERA 0/3': [
      { tipo: 'Nascimento', subtipo: '', valor: 150, obrigatorio: true, descricao: 'Custo do parto e primeiros cuidados' },
      { tipo: 'Medicamentos', subtipo: 'Brincos e Identificação', valor: 15, obrigatorio: true, descricao: 'Identificação do animal' },
      { tipo: 'DNA', subtipo: 'Paternidade', valor: 40, obrigatorio: false, descricao: 'Confirmação de paternidade (FIV)' },
      { tipo: 'Medicamentos', subtipo: 'Vitaminas e Minerais', valor: 25, obrigatorio: false, descricao: 'Suplementação inicial' }
    ],
    'ERA 4/8': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas Obrigatórias', valor: 36.90, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Alimentação', subtipo: 'Ração Creep Feeding', valor: 1.50, obrigatorio: false, descricao: 'Ração especial para bezerros (por dia)' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso (300g/dia)' },
      { tipo: 'Medicamentos', subtipo: 'Vermífugos', valor: 18, obrigatorio: true, descricao: 'Controle parasitário' }
    ],
    'ERA 9/12': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas Obrigatórias', valor: 36.90, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Alimentação', subtipo: 'Ração Creep Feeding', valor: 1.50, obrigatorio: false, descricao: 'Ração especial (por dia)' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Manejo', subtipo: 'Castração', valor: 45, obrigatorio: false, descricao: 'Castração se necessário' }
    ],
    'ERA 10/24': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas Obrigatórias', valor: 89.10, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Veterinários', subtipo: 'Andrológico', valor: 120, obrigatorio: false, descricao: 'Exame reprodutivo' }
    ],
    'ERA 25/36': [
      { tipo: 'Manejo', subtipo: 'Casquear somente animais para venda', valor: null, obrigatorio: false, descricao: 'Casqueamento se for para venda' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Veterinários', subtipo: 'Andrológico', valor: 120, obrigatorio: false, descricao: 'Exame reprodutivo anual' }
    ],
    'ERA ACIMA 36': [
      { tipo: 'Manejo', subtipo: 'Casquear somente animais para venda', valor: null, obrigatorio: false, descricao: 'Casqueamento se for para venda' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Veterinários', subtipo: 'Andrológico', valor: 120, obrigatorio: false, descricao: 'Exame reprodutivo anual' }
    ]
  },
  femeas: {
    'ERA 0/3': [
      { tipo: 'Nascimento', subtipo: '', valor: 150, obrigatorio: true, descricao: 'Custo do parto e primeiros cuidados' },
      { tipo: 'Medicamentos', subtipo: 'Brincos e Identificação', valor: 15, obrigatorio: true, descricao: 'Identificação do animal' },
      { tipo: 'DNA', subtipo: 'Paternidade', valor: 40, obrigatorio: false, descricao: 'Confirmação de paternidade (FIV)' },
      { tipo: 'Medicamentos', subtipo: 'Vitaminas e Minerais', valor: 25, obrigatorio: false, descricao: 'Suplementação inicial' }
    ],
    'ERA 4/8': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas Obrigatórias', valor: 36.90, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Alimentação', subtipo: 'Ração Creep Feeding', valor: 1.50, obrigatorio: false, descricao: 'Ração especial para bezerros (por dia)' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Medicamentos', subtipo: 'Vermífugos', valor: 18, obrigatorio: true, descricao: 'Controle parasitário' },
      { tipo: 'Medicamentos', subtipo: 'Vacinas Opcionais', valor: null, obrigatorio: false, descricao: 'Vacina B3 se necessário' }
    ],
    'ERA 9/12': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas Obrigatórias', valor: 36.90, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Medicamentos', subtipo: 'Vermífugos', valor: 18, obrigatorio: true, descricao: 'Controle parasitário' }
    ],
    'ERA 10/24': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas Obrigatórias', valor: 89.10, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Reprodução', subtipo: 'Inseminação', valor: null, obrigatorio: false, descricao: 'Inseminação artificial' }
    ],
    'ERA 25/36': [
      { tipo: 'Manejo', subtipo: 'Casquear somente animais para venda', valor: null, obrigatorio: false, descricao: 'Casqueamento se for para venda' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Veterinários', subtipo: 'Diagnóstico de Prenhez', valor: 80, obrigatorio: false, descricao: 'Diagnóstico de gestação' }
    ],
    'ERA ACIMA 36': [
      { tipo: 'Manejo', subtipo: 'Casquear somente animais para venda', valor: null, obrigatorio: false, descricao: 'Casqueamento se for para venda' },
      { tipo: 'Alimentação', subtipo: 'Ração Concentrada', valor: null, obrigatorio: false, descricao: 'Calcular por peso' },
      { tipo: 'Veterinários', subtipo: 'Diagnóstico de Prenhez', valor: 80, obrigatorio: false, descricao: 'Diagnóstico de gestação' }
    ]
  }
}

// Preços de referência para cálculos automáticos
export const precosReferencia = {
  racaoKg: 1.20,
  salMineralKg: 3.50,
  salProteinadoKg: 4.20,
  consumoDiarioRacao: 0.025, // 2.5% do peso corporal
  consumoDiarioSalMineral: 0.08, // 80g por dia
  pesoMedioMachosPorIdade: {
    3: 120, 6: 180, 9: 240, 12: 300, 18: 420, 24: 520, 36: 650
  },
  pesoMedioFemeasPorIdade: {
    3: 100, 6: 150, 9: 200, 12: 250, 18: 350, 24: 420, 36: 500
  }
}

// Sugestões de preços de mercado (valores podem ser atualizados)
export const sugestoesPrecosReferencia = {
  'Alimentação': {
    'Ração Concentrada': { min: 1.00, max: 1.50, medio: 1.20, unidade: 'kg' },
    'Ração Creep Feeding': { min: 1.80, max: 2.20, medio: 2.00, unidade: 'kg' },
    'Sal Mineral': { min: 3.00, max: 4.00, medio: 3.50, unidade: 'kg' },
    'Sal Proteinado': { min: 3.80, max: 4.60, medio: 4.20, unidade: 'kg' },
    'Silagem': { min: 0.15, max: 0.25, medio: 0.20, unidade: 'kg' },
    'Feno': { min: 0.40, max: 0.60, medio: 0.50, unidade: 'kg' }
  },
  'Medicamentos': {
    'Vacinas Obrigatórias': { min: 30.00, max: 45.00, medio: 36.90, unidade: 'dose' },
    'Vacinas Opcionais': { min: 15.00, max: 30.00, medio: 22.50, unidade: 'dose' },
    'Vermífugos': { min: 12.00, max: 25.00, medio: 18.00, unidade: 'dose' },
    'Antibióticos': { min: 25.00, max: 80.00, medio: 50.00, unidade: 'tratamento' },
    'Vitaminas e Minerais': { min: 15.00, max: 35.00, medio: 25.00, unidade: 'dose' },
    'Carrapaticidas': { min: 20.00, max: 40.00, medio: 30.00, unidade: 'aplicação' }
  },
  'Veterinários': {
    'Consulta Veterinária': { min: 80.00, max: 150.00, medio: 120.00, unidade: 'consulta' },
    'Andrológico': { min: 100.00, max: 180.00, medio: 120.00, unidade: 'exame' },
    'Diagnóstico de Prenhez': { min: 60.00, max: 100.00, medio: 80.00, unidade: 'exame' },
    'Inseminação Artificial': { min: 40.00, max: 80.00, medio: 60.00, unidade: 'procedimento' },
    'Ultrassonografia': { min: 80.00, max: 120.00, medio: 100.00, unidade: 'exame' }
  },
  'DNA': {
    'Paternidade': { min: 35.00, max: 50.00, medio: 40.00, unidade: 'teste' },
    'Genômica': { min: 70.00, max: 100.00, medio: 80.00, unidade: 'teste' },
    'Análise Genética Completa': { min: 150.00, max: 250.00, medio: 200.00, unidade: 'teste' }
  },
  'Manejo': {
    'Castração': { min: 35.00, max: 60.00, medio: 45.00, unidade: 'procedimento' },
    'Descorna': { min: 25.00, max: 40.00, medio: 30.00, unidade: 'procedimento' },
    'Marcação/Tatuagem': { min: 15.00, max: 25.00, medio: 20.00, unidade: 'procedimento' },
    'Casquear somente animais para venda': { min: 30.00, max: 50.00, medio: 40.00, unidade: 'procedimento' }
  }
}

// Alertas e recomendações inteligentes
export const alertasInteligentes = {
  'ERA 0/3': {
    obrigatorios: ['Nascimento', 'Brincos e Identificação'],
    recomendados: ['DNA - Paternidade', 'Vitaminas e Minerais'],
    alertas: [
      'Registrar nascimento nos primeiros 3 dias',
      'Identificar animal até 30 dias',
      'Considerar teste de paternidade para FIV'
    ]
  },
  'ERA 4/8': {
    obrigatorios: ['Vacinas Obrigatórias', 'Vermífugos'],
    recomendados: ['Ração Creep Feeding', 'Controle parasitário'],
    alertas: [
      'Período crítico para vacinação',
      'Iniciar suplementação alimentar',
      'Monitorar ganho de peso'
    ]
  },
  'ERA 9/12': {
    obrigatorios: ['Vacinas Obrigatórias'],
    recomendados: ['Ração Concentrada', 'Castração (se necessário)'],
    alertas: [
      'Avaliar necessidade de castração',
      'Intensificar alimentação',
      'Preparar para desmama'
    ]
  },
  'ERA 10/24': {
    obrigatorios: ['Vacinas Obrigatórias'],
    recomendados: ['Exame Andrológico (machos)', 'Inseminação (fêmeas)'],
    alertas: [
      'Período reprodutivo - avaliar aptidão',
      'Machos: exame andrológico obrigatório',
      'Fêmeas: considerar primeira cobertura'
    ]
  },
  'ERA 25/36': {
    obrigatorios: [],
    recomendados: ['Casqueamento para venda', 'Diagnóstico de prenhez'],
    alertas: [
      'Animal em idade produtiva',
      'Avaliar potencial de venda',
      'Manter controle reprodutivo'
    ]
  },
  'ERA ACIMA 36': {
    obrigatorios: [],
    recomendados: ['Manutenção reprodutiva', 'Avaliação comercial'],
    alertas: [
      'Animal maduro - foco na produtividade',
      'Avaliar retorno do investimento',
      'Considerar renovação do rebanho'
    ]
  }
}

// Calculadoras auxiliares
export const calculadoras = {
  // Calcular consumo de ração baseado no peso
  consumoRacao: (peso, percentual = 2.5) => {
    return (peso * percentual / 100).toFixed(2)
  },
  
  // Calcular custo mensal de alimentação
  custoMensalAlimentacao: (peso, precoKg = 1.20, percentual = 2.5) => {
    const consumoDiario = peso * percentual / 100
    return (consumoDiario * precoKg * 30).toFixed(2)
  },
  
  // Calcular ROI (Retorno sobre Investimento)
  calcularROI: (valorVenda, custoTotal) => {
    if (!valorVenda || custoTotal === 0) return 0
    return (((valorVenda - custoTotal) / custoTotal) * 100).toFixed(2)
  },
  
  // Calcular custo por kg de peso vivo
  custoPorKg: (custoTotal, pesoAtual) => {
    if (pesoAtual === 0) return 0
    return (custoTotal / pesoAtual).toFixed(2)
  }
}

// Sistema integrado com PostgreSQL - dados vêm da API
export const usuarios = []