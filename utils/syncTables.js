const SYNC_TABLES_WITH_LABELS = [
  // 1. Tabelas independentes ou primárias
  { key: 'animais', label: 'Animais' },
  { key: 'boletim_contabil', label: 'Boletim Contábil' },
  { key: 'notas_fiscais', label: 'Notas Fiscais' },
  { key: 'estoque_semen', label: 'Estoque Sêmen' },
  { key: 'abastecimento_nitrogenio', label: 'Abastecimento Nitrogênio' },

  // 2. Tabelas que dependem de 'animais' ou outras
  { key: 'custos', label: 'Custos' },
  { key: 'pesagens', label: 'Pesagens' },
  { key: 'inseminacoes', label: 'Inseminações' },
  { key: 'gestacoes', label: 'Gestações' },
  { key: 'nascimentos', label: 'Nascimentos' },
  { key: 'localizacoes_animais', label: 'Localizações' },
  { key: 'transferencias_embrioes', label: 'Transferências' },
  { key: 'coleta_fiv', label: 'Coletas FIV' },
  { key: 'baixas', label: 'Baixas' },
  { key: 'mortes', label: 'Mortes' },
  { key: 'notas_fiscais_itens', label: 'Itens de Notas Fiscais' },
  { key: 'movimentacoes_contabeis', label: 'Movimentações Contábeis' },
  { key: 'historia_ocorrencias', label: 'Ocorrências' },
]

const SYNC_TABLES = SYNC_TABLES_WITH_LABELS.map((t) => t.key)

module.exports = {
  SYNC_TABLES,
  SYNC_TABLES_WITH_LABELS,
}

