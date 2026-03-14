/**
 * Constantes centralizadas do sistema Beef Sync
 * Fonte Ãºnica de verdade para opÃ§Ãµes de formulÃ¡rios e configuraÃ§Ãµes estÃ¡ticas.
 * 
 * Regra: qualquer lista que aparece em mais de um lugar deve estar aqui.
 */

// ---------------------------------------------------------------------------
// ANIMAIS
// ---------------------------------------------------------------------------

/**
 * SituaÃ§Ãµes possÃ­veis de um animal ââ‚¬â€� deve corresponder exatamente ao
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
  'Em ObservaÃ§Ã£o',
  'Doado',
]

/**
 * SituaÃ§Ãµes de uma gestaÃ§Ã£o ââ‚¬â€� corresponde ao CHECK constraint
 * `gestacoes_situacao_check` no PostgreSQL.
 */
export const SITUACOES_GESTACAO = ['Ativa', 'Gestante', 'Nasceu', 'Perdeu', 'Cancelada', 'Parida']

/** SÃ©ries de identificaÃ§Ã£o e suas raÃ§as correspondentes */
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

/** SÃ©ries disponÃ­veis para seleÃ§Ã£o em formulÃ¡rios */
export const SERIES_OPTIONS = Object.keys(RACAS_POR_SERIE)

/** Sexos disponÃ­veis */
export const SEXOS_ANIMAL = ['FÃªmea', 'Macho']

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
// REPRODUÃâ€¡ÃÆ’O
// ---------------------------------------------------------------------------

/** Resultados de diagnÃ³stico de gestaÃ§Ã£o (DG) */
export const RESULTADOS_DG = ['Prenha', 'Vazia', 'Pendente', 'Indefinido']

/** Tipos de protocolo reprodutivo */
export const TIPOS_PROTOCOLO = ['IATF', 'IA Convencional', 'Monta Natural', 'TE', 'FIV']

// ---------------------------------------------------------------------------
// CUSTOS
// ---------------------------------------------------------------------------

export const TIPOS_CUSTO = [
  'AquisiÃ§Ã£o',
  'Nascimento',
  'DNA',
  'Medicamentos',
  'VeterinÃ¡rio',
  'Manejo',
  'ReproduÃ§Ã£o',
  'Infraestrutura',
  'Transporte',
  'Outros',
]

export const SUBTIPOS_CUSTO = {
  DNA:            ['Teste de Paternidade', 'Perfil GenÃ©tico', 'Genealogia'],
  Medicamentos:   ['Vacina', 'AntiparasitÃ¡rio', 'AntibiÃ³tico', 'Vitamina', 'HormÃ´nio', 'Outros'],
  VeterinÃ¡rio:    ['Consulta', 'Cirurgia', 'Exame', 'Procedimento'],
  Manejo:         ['Pesagem', 'MarcaÃ§Ã£o', 'CastraÃ§Ã£o', 'Descorna', 'Casqueamento'],
  Infraestrutura: ['Cerca', 'InstalaÃ§Ãµes', 'Equipamentos', 'ManutenÃ§Ã£o'],
  ReproduÃ§Ã£o:     ['SÃªmen', 'Protocolo IA', 'EmbriÃ£o', 'FIV', 'DiagnÃ³stico'],
}

// ---------------------------------------------------------------------------
// SÃÅ MEN / ESTOQUE
// ---------------------------------------------------------------------------

export const RACAS_SEMEN = ['Nelore', 'Angus', 'Brahman', 'Simental', 'Gir', 'Girolando', 'HolandÃªs', 'Outros']

// ---------------------------------------------------------------------------
// NOTIFICAÃâ€¡Ãâ€¢ES
// ---------------------------------------------------------------------------

export const TIPOS_NOTIFICACAO = ['info', 'warning', 'error', 'success']
