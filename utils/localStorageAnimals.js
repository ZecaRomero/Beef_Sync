/**
 * localStorage costuma ter ~5MB; animais do Postgres trazem dezenas de colunas (ex.: GENEPLUS)
 * e JSON.stringify estoura a quota. Este módulo tenta gravar completo e, se necessário, versão enxuta.
 */

export const ANIMALS_STORAGE_KEY = 'animals'

/** Campos usados na maior parte das telas / cadastro (sem dezenas de métricas gp_/pmgz_/carc_/etc.) */
const SLIM_KEYS = new Set([
  'id', 'nome', 'serie', 'rg', 'tatuagem', 'sexo', 'raca', 'numero', 'brinco',
  'data_nascimento', 'dataNascimento', 'data_chegada', 'hora_nascimento',
  'peso', 'cor', 'tipo_nascimento', 'dificuldade_parto', 'meses', 'situacao',
  'pai', 'serie_pai', 'rg_pai', 'mae', 'serie_mae', 'rg_mae', 'avo_materno',
  'receptora', 'is_fiv', 'custo_total', 'valor_venda', 'valor_real',
  'veterinario', 'abczg', 'deca', 'iqg', 'pt_iqg', 'mgte', 'genetica_2', 'decile_2',
  'observacoes', 'boletim', 'local_nascimento', 'pasto_atual', 'piquete_atual',
  'data_entrada_piquete', 'situacao_abcz', 'situacaoAbcz', 'situacao_reprodutiva',
  'prev_parto', 'identificacao', 'precoVenda', 'status', 'data_dg', 'dataDG',
  'resultado_dg', 'resultadoDG', 'carimbo_leilao', 'top',
  'localNascimento', 'pastoAtual', 'piqueteAtual', 'valorCompra', 'valor_compra',
  'created_at', 'updated_at', 'ativo', 'vendido', 'baixado', 'nfEntrada', 'dataEntrada',
  'origem', 'fornecedor', 'nfSaida', 'comprador',
])

const OBS_MAX = 4000

export function slimAnimalForLocalCache(animal) {
  if (!animal || typeof animal !== 'object') return animal
  const o = {}
  for (const k of SLIM_KEYS) {
    if (Object.prototype.hasOwnProperty.call(animal, k) && animal[k] !== undefined) {
      o[k] = animal[k]
    }
  }
  if (typeof o.observacoes === 'string' && o.observacoes.length > OBS_MAX) {
    o.observacoes = `${o.observacoes.slice(0, OBS_MAX)}…`
  }
  return o
}

export function slimAnimalsForLocalCache(animals) {
  if (!Array.isArray(animals)) return []
  return animals.map(slimAnimalForLocalCache)
}

function isQuotaError(e) {
  if (!e) return false
  if (e.name === 'QuotaExceededError') return true
  if (e.code === 22) return true
  const m = String(e.message || '').toLowerCase()
  return m.includes('quota') || m.includes('exceeded')
}

/**
 * @returns {{ ok: true, slim: boolean, count: number } | { ok: false, message: string }}
 */
export function saveAnimalsToLocalStorage(animals) {
  const list = Array.isArray(animals) ? animals : []
  const write = (arr) => {
    localStorage.setItem(ANIMALS_STORAGE_KEY, JSON.stringify(arr))
  }
  try {
    write(list)
    return { ok: true, slim: false, count: list.length }
  } catch (e) {
    if (!isQuotaError(e)) {
      return { ok: false, message: e?.message || 'Erro ao gravar animais no navegador' }
    }
    const slim = slimAnimalsForLocalCache(list)
    try {
      write(slim)
      return { ok: true, slim: true, count: slim.length }
    } catch (e2) {
      return {
        ok: false,
        message:
          'Quota do navegador insuficiente (localStorage ~5MB). Limpe chaves antigas (ex.: beefsync_backup_*), ' +
          'use “Limpar localStorage” na página de limpeza, ou outro navegador. ' +
          'Os dados completos permanecem no PostgreSQL.',
      }
    }
  }
}
