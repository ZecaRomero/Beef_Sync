/**
 * Constantes centralizadas do sistema Beef Sync
 * Fonte única de verdade para opções de formulários e configurações estáticas.
 * 
 * Regra: qualquer lista que aparece em mais de um lugar deve estar aqui.
 */

// ---------------------------------------------------------------------------
// ANIMAIS
// ---------------------------------------------------------------------------

/**
 * Situações possíveis de um animal — deve corresponder exatamente ao
 * CHECK constraint `animais_situacao_check` no PostgreSQL.
 */
export const SITUACOES_ANIMAL = [
  'Ativo',
  'Vendido',
  'Morto',
  'Transferido',
  'Inativo',
  'Gestante',
  'Lactante',
  'Desmamado',
  'Em Observação',
  'Doado',
]

/**
 * Situações de uma gestação — corresponde ao CHECK constraint
 * `gestacoes_situacao_check` no PostgreSQL.
 */
export const SITUACOES_GESTACAO = ['Ativa', 'Gestante', 'Nasceu', 'Perdeu', 'Cancelada', 'Parida']

/** Séries de identificação e suas raças correspondentes */
export const RACAS_POR_SERIE = {
  RPT:  'Receptora',
  BENT: 'Brahman',
  JDHF: 'Brahman',
  CJCJ: 'Nelore',
  CJCG: 'Gir',
  PDJG: 'Gir',
  FELG: 'Gir',
  FFAL: 'Gir',
  CJCS: 'Nelore',
  PA:   'Nelore PA',
}

/** Séries disponíveis para seleção em formulários */
export const SERIES_OPTIONS = Object.keys(RACAS_POR_SERIE)

/** Sexos disponíveis */
export const SEXOS_ANIMAL = ['Fêmea', 'Macho']

/** Categorias de animal */
export const CATEGORIAS_ANIMAL = [
  'Bezerro(a)',
  'Garrote',
  'Novilho(a)',
  'Vaca',
  'Touro',
  'Receptora',
  'Doadora',
]

// ---------------------------------------------------------------------------
// REPRODUÇÃO
// ---------------------------------------------------------------------------

/** Resultados de diagnóstico de gestação (DG) */
export const RESULTADOS_DG = ['Prenha', 'Vazia', 'Pendente', 'Indefinido']

/** Tipos de protocolo reprodutivo */
export const TIPOS_PROTOCOLO = ['IATF', 'IA Convencional', 'Monta Natural', 'TE', 'FIV']

// ---------------------------------------------------------------------------
// CUSTOS
// ---------------------------------------------------------------------------

export const TIPOS_CUSTO = [
  'Aquisição',
  'Nascimento',
  'Alimentação',
  'DNA',
  'Medicamentos',
  'Veterinário',
  'Manejo',
  'Reprodução',
  'Infraestrutura',
  'Transporte',
  'Outros',
]

export const SUBTIPOS_CUSTO = {
  Alimentação:    ['Ração', 'Sal Mineral', 'Silagem', 'Feno', 'Suplemento', 'Pasto'],
  DNA:            ['Teste de Paternidade', 'Perfil Genético', 'Genealogia'],
  Medicamentos:   ['Vacina', 'Antiparasitário', 'Antibiótico', 'Vitamina', 'Hormônio', 'Outros'],
  Veterinário:    ['Consulta', 'Cirurgia', 'Exame', 'Procedimento'],
  Manejo:         ['Pesagem', 'Marcação', 'Castração', 'Descorna', 'Casqueamento'],
  Infraestrutura: ['Cerca', 'Instalações', 'Equipamentos', 'Manutenção'],
  Reprodução:     ['Sêmen', 'Protocolo IA', 'Embrião', 'FIV', 'Diagnóstico'],
}

// ---------------------------------------------------------------------------
// SÊMEN / ESTOQUE
// ---------------------------------------------------------------------------

export const RACAS_SEMEN = ['Nelore', 'Angus', 'Brahman', 'Simental', 'Gir', 'Girolando', 'Holandês', 'Outros']

// ---------------------------------------------------------------------------
// NOTIFICAÇÕES
// ---------------------------------------------------------------------------

export const TIPOS_NOTIFICACAO = ['info', 'warning', 'error', 'success']
