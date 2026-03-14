/**
 * CONFIGURAÃâ€¡Ãâ€¢ES E DADOS ESTÃ�TICOS DO SISTEMA
 * 
 * âÅ¡ ï¸� ATENÃâ€¡ÃÆ’O: Este arquivo importa de utils/constants.js (fonte Ãºnica de verdade).
 * Adicione novas constantes lÃ¡, nÃ£o aqui.
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

/** @deprecated Array vazio ââ‚¬â€� dados vÃªm do PostgreSQL */
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
      { tipo: 'Medicamentos', subtipo: 'Brincos e IdentificaÃ§Ã£o', valor: 15, obrigatorio: true, descricao: 'IdentificaÃ§Ã£o do animal' },
      { tipo: 'DNA', subtipo: 'Paternidade', valor: 40, obrigatorio: false, descricao: 'ConfirmaÃ§Ã£o de paternidade (FIV)' },
      { tipo: 'Medicamentos', subtipo: 'Vitaminas e Minerais', valor: 25, obrigatorio: false, descricao: 'Aporte vitamÃ­nico inicial' }
    ],
    'ERA 4/8': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas ObrigatÃ³rias', valor: 36.90, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Medicamentos', subtipo: 'VermÃ­fugos', valor: 18, obrigatorio: true, descricao: 'Controle parasitÃ¡rio' }
    ],
    'ERA 9/12': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas ObrigatÃ³rias', valor: 36.90, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Manejo', subtipo: 'CastraÃ§Ã£o', valor: 45, obrigatorio: false, descricao: 'CastraÃ§Ã£o se necessÃ¡rio' }
    ],
    'ERA 10/24': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas ObrigatÃ³rias', valor: 89.10, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'VeterinÃ¡rios', subtipo: 'AndrolÃ³gico', valor: 120, obrigatorio: false, descricao: 'Exame reprodutivo' }
    ],
    'ERA 25/36': [
      { tipo: 'Manejo', subtipo: 'Casquear somente animais para venda', valor: null, obrigatorio: false, descricao: 'Casqueamento se for para venda' },
      { tipo: 'VeterinÃ¡rios', subtipo: 'AndrolÃ³gico', valor: 120, obrigatorio: false, descricao: 'Exame reprodutivo anual' }
    ],
    'ERA ACIMA 36': [
      { tipo: 'Manejo', subtipo: 'Casquear somente animais para venda', valor: null, obrigatorio: false, descricao: 'Casqueamento se for para venda' },
      { tipo: 'VeterinÃ¡rios', subtipo: 'AndrolÃ³gico', valor: 120, obrigatorio: false, descricao: 'Exame reprodutivo anual' }
    ]
  },
  femeas: {
    'ERA 0/3': [
      { tipo: 'Nascimento', subtipo: '', valor: 150, obrigatorio: true, descricao: 'Custo do parto e primeiros cuidados' },
      { tipo: 'Medicamentos', subtipo: 'Brincos e IdentificaÃ§Ã£o', valor: 15, obrigatorio: true, descricao: 'IdentificaÃ§Ã£o do animal' },
      { tipo: 'DNA', subtipo: 'Paternidade', valor: 40, obrigatorio: false, descricao: 'ConfirmaÃ§Ã£o de paternidade (FIV)' },
      { tipo: 'Medicamentos', subtipo: 'Vitaminas e Minerais', valor: 25, obrigatorio: false, descricao: 'Aporte vitamÃ­nico inicial' }
    ],
    'ERA 4/8': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas ObrigatÃ³rias', valor: 36.90, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Medicamentos', subtipo: 'VermÃ­fugos', valor: 18, obrigatorio: true, descricao: 'Controle parasitÃ¡rio' },
      { tipo: 'Medicamentos', subtipo: 'Vacinas Opcionais', valor: null, obrigatorio: false, descricao: 'Vacina B3 se necessÃ¡rio' }
    ],
    'ERA 9/12': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas ObrigatÃ³rias', valor: 36.90, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'Medicamentos', subtipo: 'VermÃ­fugos', valor: 18, obrigatorio: true, descricao: 'Controle parasitÃ¡rio' }
    ],
    'ERA 10/24': [
      { tipo: 'Medicamentos', subtipo: 'Vacinas ObrigatÃ³rias', valor: 89.10, obrigatorio: true, descricao: 'Controle ABCZ RGD' },
      { tipo: 'ReproduÃ§Ã£o', subtipo: 'InseminaÃ§Ã£o', valor: null, obrigatorio: false, descricao: 'InseminaÃ§Ã£o artificial' }
    ],
    'ERA 25/36': [
      { tipo: 'Manejo', subtipo: 'Casquear somente animais para venda', valor: null, obrigatorio: false, descricao: 'Casqueamento se for para venda' },
      { tipo: 'VeterinÃ¡rios', subtipo: 'DiagnÃ³stico de Prenhez', valor: 80, obrigatorio: false, descricao: 'DiagnÃ³stico de gestaÃ§Ã£o' }
    ],
    'ERA ACIMA 36': [
      { tipo: 'Manejo', subtipo: 'Casquear somente animais para venda', valor: null, obrigatorio: false, descricao: 'Casqueamento se for para venda' },
      { tipo: 'VeterinÃ¡rios', subtipo: 'DiagnÃ³stico de Prenhez', valor: 80, obrigatorio: false, descricao: 'DiagnÃ³stico de gestaÃ§Ã£o' }
    ]
  }
}

// PreÃ§os de referÃªncia para cÃ¡lculos automÃ¡ticos
export const precosReferencia = {
  pesoMedioMachosPorIdade: {
    3: 120, 6: 180, 9: 240, 12: 300, 18: 420, 24: 520, 36: 650
  },
  pesoMedioFemeasPorIdade: {
    3: 100, 6: 150, 9: 200, 12: 250, 18: 350, 24: 420, 36: 500
  }
}

// SugestÃµes de preÃ§os de mercado (valores podem ser atualizados)
export const sugestoesPrecosReferencia = {
  'Medicamentos': {
    'Vacinas ObrigatÃ³rias': { min: 30.00, max: 45.00, medio: 36.90, unidade: 'dose' },
    'Vacinas Opcionais': { min: 15.00, max: 30.00, medio: 22.50, unidade: 'dose' },
    'VermÃ­fugos': { min: 12.00, max: 25.00, medio: 18.00, unidade: 'dose' },
    'AntibiÃ³ticos': { min: 25.00, max: 80.00, medio: 50.00, unidade: 'tratamento' },
    'Vitaminas e Minerais': { min: 15.00, max: 35.00, medio: 25.00, unidade: 'dose' },
    'Carrapaticidas': { min: 20.00, max: 40.00, medio: 30.00, unidade: 'aplicaÃ§Ã£o' }
  },
  'VeterinÃ¡rios': {
    'Consulta VeterinÃ¡ria': { min: 80.00, max: 150.00, medio: 120.00, unidade: 'consulta' },
    'AndrolÃ³gico': { min: 100.00, max: 180.00, medio: 120.00, unidade: 'exame' },
    'DiagnÃ³stico de Prenhez': { min: 60.00, max: 100.00, medio: 80.00, unidade: 'exame' },
    'InseminaÃ§Ã£o Artificial': { min: 40.00, max: 80.00, medio: 60.00, unidade: 'procedimento' },
    'Ultrassonografia': { min: 80.00, max: 120.00, medio: 100.00, unidade: 'exame' }
  },
  'DNA': {
    'Paternidade': { min: 35.00, max: 50.00, medio: 40.00, unidade: 'teste' },
    'GenÃ´mica': { min: 70.00, max: 100.00, medio: 80.00, unidade: 'teste' },
    'AnÃ¡lise GenÃ©tica Completa': { min: 150.00, max: 250.00, medio: 200.00, unidade: 'teste' }
  },
  'Manejo': {
    'CastraÃ§Ã£o': { min: 35.00, max: 60.00, medio: 45.00, unidade: 'procedimento' },
    'Descorna': { min: 25.00, max: 40.00, medio: 30.00, unidade: 'procedimento' },
    'MarcaÃ§Ã£o/Tatuagem': { min: 15.00, max: 25.00, medio: 20.00, unidade: 'procedimento' },
    'Casquear somente animais para venda': { min: 30.00, max: 50.00, medio: 40.00, unidade: 'procedimento' }
  }
}

// Alertas e recomendaÃ§Ãµes inteligentes
export const alertasInteligentes = {
  'ERA 0/3': {
    obrigatorios: ['Nascimento', 'Brincos e IdentificaÃ§Ã£o'],
    recomendados: ['DNA - Paternidade', 'Vitaminas e Minerais'],
    alertas: [
      'Registrar nascimento nos primeiros 3 dias',
      'Identificar animal atÃ© 30 dias',
      'Considerar teste de paternidade para FIV'
    ]
  },
  'ERA 4/8': {
    obrigatorios: ['Vacinas ObrigatÃ³rias', 'VermÃ­fugos'],
    recomendados: ['Controle parasitÃ¡rio'],
    alertas: [
      'PerÃ­odo crÃ­tico para vacinaÃ§Ã£o',
      'Monitorar ganho de peso'
    ]
  },
  'ERA 9/12': {
    obrigatorios: ['Vacinas ObrigatÃ³rias'],
    recomendados: ['CastraÃ§Ã£o (se necessÃ¡rio)'],
    alertas: [
      'Avaliar necessidade de castraÃ§Ã£o',
      'Preparar para desmama'
    ]
  },
  'ERA 10/24': {
    obrigatorios: ['Vacinas ObrigatÃ³rias'],
    recomendados: ['Exame AndrolÃ³gico (machos)', 'InseminaÃ§Ã£o (fÃªmeas)'],
    alertas: [
      'PerÃ­odo reprodutivo - avaliar aptidÃ£o',
      'Machos: exame androlÃ³gico obrigatÃ³rio',
      'FÃªmeas: considerar primeira cobertura'
    ]
  },
  'ERA 25/36': {
    obrigatorios: [],
    recomendados: ['Casqueamento para venda', 'DiagnÃ³stico de prenhez'],
    alertas: [
      'Animal em idade produtiva',
      'Avaliar potencial de venda',
      'Manter controle reprodutivo'
    ]
  },
  'ERA ACIMA 36': {
    obrigatorios: [],
    recomendados: ['ManutenÃ§Ã£o reprodutiva', 'AvaliaÃ§Ã£o comercial'],
    alertas: [
      'Animal maduro - foco na produtividade',
      'Avaliar retorno do investimento',
      'Considerar renovaÃ§Ã£o do rebanho'
    ]
  }
}

// Calculadoras auxiliares
export const calculadoras = {
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

// Sistema integrado com PostgreSQL - dados vÃªm da API
export const usuarios = []