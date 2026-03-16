const SYNC_TABLES_WITH_LABELS = [
  { key: 'animais', label: 'Animais' },
  { key: 'custos', label: 'Custos' },
  { key: 'pesagens', label: 'Pesagens' },
  { key: 'inseminacoes', label: 'Inseminações' },
  { key: 'gestacoes', label: 'Gestações' },
  { key: 'nascimentos', label: 'Nascimentos' },
  { key: 'localizacoes_animais', label: 'Localizações' },
  { key: 'estoque_semen', label: 'Estoque Sêmen' },
  { key: 'transferencias_embrioes', label: 'Transferências' },
  { key: 'coleta_fiv', label: 'Coletas FIV' },
  { key: 'baixas', label: 'Baixas' },
  { key: 'mortes', label: 'Mortes' },
  { key: 'notas_fiscais', label: 'Notas Fiscais' },
  { key: 'notas_fiscais_itens', label: 'Itens de Notas Fiscais' },
  { key: 'boletim_contabil', label: 'Boletim Contábil' },
  { key: 'movimentacoes_contabeis', label: 'Movimentações Contábeis' },
  { key: 'historia_ocorrencias', label: 'Ocorrências' },
  { key: 'abastecimento_nitrogenio', label: 'Abastecimento Nitrogênio' },
]

const SYNC_TABLES = SYNC_TABLES_WITH_LABELS.map((t) => t.key)

module.exports = {
  SYNC_TABLES,
  SYNC_TABLES_WITH_LABELS,
}

