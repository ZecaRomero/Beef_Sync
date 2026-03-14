import { query } from '../../../lib/database'

// POST /api/contabilidade/sync-nf-movimentacoes
// Converte NFs de entrada do período em registros na tabela movimentacoes_contabeis
// para alimentar o boletim da "Agropecuária Pardinho" mesmo sem animal vinculado.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, nfNumber } = req.body || {}
    
    // Se não tem nfNumber nem período, retornar erro
    if (!nfNumber && (!period || !period.startDate || !period.endDate)) {
      return res.status(400).json({ message: 'Período é obrigatório (ou informe nfNumber)' })
    }

    const toPgDate = (value) => {
      if (!value) return null
      if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const [d, m, y] = value.split('/')
          return `${y}-${m}-${d}`
        }
      }
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
    }

    // Se tem nfNumber, não precisa de período
    let pgStart = null
    let pgEnd = null
    if (period && period.startDate && period.endDate) {
      pgStart = toPgDate(period.startDate)
      pgEnd = toPgDate(period.endDate)
      if (!pgStart || !pgEnd) {
        return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD ou dd/MM/yyyy.' })
      }
    }

    // Buscar NFs de entrada e saída no período com seus itens
    let nfs
    if (nfNumber) {
      // Buscar NF específica sem filtro de período
      nfs = await query(
        `
          SELECT 
            nf.id,
            nf.numero_nf,
            nf.data_compra,
            nf.data,
            nf.valor_total,
            COALESCE(nf.tipo, 'entrada') as tipo,
            COALESCE(nf.observacoes, '') as observacoes,
            nf.itens,
            nf.cnpj_origem_destino,
            nf.fornecedor
          FROM notas_fiscais nf
          WHERE nf.tipo IN ('entrada', 'saida')
            AND (nf.numero_nf = $1 OR CAST(nf.numero_nf AS TEXT) = $1)
          ORDER BY nf.id DESC
          LIMIT 1
        `,
        [String(nfNumber)]
      )
    } else {
      nfs = await query(
        `
          SELECT 
            nf.id,
            nf.numero_nf,
            nf.data_compra,
            nf.data,
            nf.valor_total,
            COALESCE(nf.tipo, 'entrada') as tipo,
            COALESCE(nf.observacoes, '') as observacoes,
            nf.itens,
            nf.cnpj_origem_destino,
            nf.fornecedor
          FROM notas_fiscais nf
          WHERE nf.tipo IN ('entrada', 'saida')
            AND (
              (nf.data_compra BETWEEN $1 AND $2)
              OR (nf.data BETWEEN $1 AND $2)
            )
          ORDER BY COALESCE(nf.data_compra, nf.data) DESC
        `,
        [pgStart, pgEnd]
      )
    }

    let inseridos = 0
    let atualizados = 0
    for (const nf of nfs.rows) {
      // Data da operação baseada no schema atual
      const dataOperacao = nf.data_compra || nf.data

      // Remover movimentações antigas desta NF antes de recriar
      // Isso garante que itens adicionados/removidos sejam refletidos corretamente
      try {
        await query(
          `DELETE FROM movimentacoes_contabeis 
           WHERE dados_extras::jsonb->>'numero_nf' = $1 
           AND tipo = $2`,
          [String(nf.numero_nf), String(nf.tipo)]
        )
        console.log(`🗑️ Movimentações antigas da NF ${nf.numero_nf} removidas`)
      } catch (e) {
        console.warn(`⚠️ Erro ao remover movimentações antigas da NF ${nf.numero_nf}:`, e.message)
      }

      // Itens podem estar como string JSON ou objeto/array
      let itens = []
      try {
        if (typeof nf.itens === 'string') {
          itens = JSON.parse(nf.itens)
        } else if (Array.isArray(nf.itens)) {
          itens = nf.itens
        } else if (nf.itens && typeof nf.itens === 'object') {
          // alguns casos podem salvar um objeto com a lista em uma chave
          itens = Array.isArray(nf.itens.itens) ? nf.itens.itens : []
        }
      } catch (e) {
        itens = []
      }

      // Se não encontrou itens no campo JSONB, buscar da tabela notas_fiscais_itens
      if ((!itens || itens.length === 0) && nf.id) {
        try {
          const itensTabela = await query(`
            SELECT dados_item FROM notas_fiscais_itens
            WHERE nota_fiscal_id = $1
            ORDER BY id
          `, [nf.id])
          
          if (itensTabela.rows?.length > 0) {
            itens = itensTabela.rows.map(row => {
              let dadosItem = row.dados_item
              if (typeof dadosItem === 'string') {
                try {
                  dadosItem = JSON.parse(dadosItem)
                } catch (e) {
                  dadosItem = {}
                }
              }
              return dadosItem
            })
          }
        } catch (e) {
          console.warn(`⚠️ Erro ao buscar itens da tabela para NF ${nf.numero_nf}:`, e.message)
        }
      }

      if (!Array.isArray(itens)) itens = []

      // Helper: extrair metadados de itens que venham como string descritiva
      const parseItemMeta = (raw) => {
        const meta = { sexo: null, era: null, raca: null, tatuagem: null, quantidade: 1, valor_unitario: null }
        if (raw == null) return meta
        if (typeof raw === 'string') {
          const s = raw.toLowerCase()
          // quantidade: primeiro número
          const qMatch = s.match(/(\d{1,3})\s*(?:cabecas|cabeças|animais|machos|fêmeas|femeas)?/)
          if (qMatch) {
            const q = parseInt(qMatch[1])
            if (!isNaN(q) && q > 0) meta.quantidade = q
          }
          // sexo
          if (s.includes('macho')) meta.sexo = 'macho'
          else if (s.includes('fêmea') || s.includes('femea')) meta.sexo = 'fêmea'
          // era
          const eraMatch = s.match(/(36\+|24\+|18-22|15-18|7-15|0-7|\d{1,2}\+?\s*meses?)/)
          if (eraMatch) meta.era = eraMatch[1]
          // raça
          if (s.includes('nelore')) meta.raca = 'Nelore'
          if (s.includes('angus')) meta.raca = 'Angus'
          return meta
        }
        if (typeof raw === 'object') {
          meta.sexo = raw.sexo || null
          meta.era = raw.era || raw.meses || null
          meta.raca = raw.raca || null
          meta.tatuagem = raw.tatuagem || raw.tat || null
          meta.valor_unitario = raw.valor_unitario || null
          if (Number.isInteger(raw.quantidade)) meta.quantidade = Math.max(1, raw.quantidade)
        }
        return meta
      }

      // Determinar propriedade
      let isPardinho = false
      let isSantAnna = false
      const cnpj = nf.cnpj_origem_destino
      const fornecedor = nf.fornecedor || ''
      const cnpjPardinho = '18978214000445'
      const cnpjFornecedorPardinho = '44017440001018'
      const cnpjSantAnna = '44017440001018'

      const normalizarCNPJ = (cnpj) => {
        if (!cnpj) return null
        return String(cnpj).replace(/[.\-\/]/g, '').trim()
      }

      const cnpjNormalizado = normalizarCNPJ(cnpj)
      const cnpjPardinhoNormalizado = normalizarCNPJ(cnpjPardinho)
      const cnpjFornecedorNormalizado = normalizarCNPJ(cnpjFornecedorPardinho)
      const cnpjSantAnnaNormalizado = normalizarCNPJ(cnpjSantAnna)

      if (cnpjNormalizado === cnpjPardinhoNormalizado || 
          cnpjNormalizado === cnpjFornecedorNormalizado || 
          fornecedor.toUpperCase().includes('PARDINHO')) {
        isPardinho = true
      }
      if (fornecedor.toUpperCase().includes('SANT ANNA') || cnpjNormalizado === cnpjSantAnnaNormalizado) {
        isSantAnna = true
      }

      const tipoMov = (nf.tipo || 'entrada')
      const subtipoMov = tipoMov === 'entrada' ? 'NF Entrada' : 'NF Saída'

      if (itens.length === 0) {
        // Inserir um movimento genérico quando a NF não tiver itens listados
        const dadosExtras = {
          nf_id: nf.id,
          numero_nf: nf.numero_nf,
          quantidade: 1,
          observacoes_nf: nf.observacoes || ''
        }
        if (isPardinho) {
          await query(
            `INSERT INTO movimentacoes_contabeis (
               tipo, subtipo, data_movimento, animal_id, valor, descricao, observacoes, localidade, dados_extras
             ) VALUES ($1, $2, $3, NULL, $4, $5, NULL, $6, $7)
             ON CONFLICT DO NOTHING`,
            [tipoMov, subtipoMov, dataOperacao, nf.valor_total || 0, `NF ${nf.numero_nf} (genérico)`, 'AGROPECUÁRIA PARDINHO LTDA', JSON.stringify(dadosExtras)]
          )
          inseridos++
        }
        if (isSantAnna) {
          await query(
            `INSERT INTO movimentacoes_contabeis (
               tipo, subtipo, data_movimento, animal_id, valor, descricao, observacoes, localidade, dados_extras
             ) VALUES ($1, $2, $3, NULL, $4, $5, NULL, $6, $7)
             ON CONFLICT DO NOTHING`,
            [tipoMov, subtipoMov, dataOperacao, nf.valor_total || 0, `NF ${nf.numero_nf} (genérico)`, 'FAZENDA SANT ANNA', JSON.stringify(dadosExtras)]
          )
          inseridos++
        }
        continue
      }

      // Inserir um movimento por item; se vier como string, extrair sexo/era/quantidade
      for (let idx = 0; idx < itens.length; idx++) {
        const itemRaw = itens[idx]
        const item = typeof itemRaw === 'string' ? {} : (itemRaw || {})
        const meta = parseItemMeta(itemRaw)
        const quantidadeItem = meta.quantidade

        const dadosExtras = {
          nf_id: nf.id,
          numero_nf: nf.numero_nf,
          nf_item_index: idx,
          sexo: meta.sexo || item.sexo || null,
          era: meta.era || item.era || item.meses || null,
          raca: meta.raca || item.raca || null,
          tatuagem: meta.tatuagem || item.tatuagem || item.tat || null,
          peso: item.peso || null,
          valor_unitario: meta.valor_unitario || item.valor_unitario || null,
          quantidade: itens.length === 1 ? quantidadeItem : 1
        }

        // Verificar se é NF da AGROPECUÁRIA PARDINHO
        // Usar dados já buscados da NF
        if (isPardinho) {
          await query(
            `INSERT INTO movimentacoes_contabeis (
               tipo, subtipo, data_movimento, animal_id, valor, descricao, observacoes, localidade, dados_extras
             ) VALUES ($1, $2, $3, NULL, $4, $5, NULL, $6, $7)`,
            [tipoMov, subtipoMov, dataOperacao, (meta.valor_unitario || item.valor_unitario || 0), `NF ${nf.numero_nf}`, 'AGROPECUÁRIA PARDINHO LTDA', JSON.stringify(dadosExtras)]
          )
          inseridos++
        }
        if (isSantAnna) {
          await query(
            `INSERT INTO movimentacoes_contabeis (
               tipo, subtipo, data_movimento, animal_id, valor, descricao, observacoes, localidade, dados_extras
             ) VALUES ($1, $2, $3, NULL, $4, $5, NULL, $6, $7)`,
            [tipoMov, subtipoMov, dataOperacao, (meta.valor_unitario || item.valor_unitario || 0), `NF ${nf.numero_nf}`, 'FAZENDA SANT ANNA', JSON.stringify(dadosExtras)]
          )
          inseridos++
        }
      }
    }

    return res.status(200).json({ 
      message: 'Sincronização concluída', 
      inseridos, 
      atualizados,
      filtro: nfNumber ? { nfNumber: String(nfNumber) } : { periodo: { start: pgStart, end: pgEnd } } 
    })
  } catch (error) {
    console.error('Erro ao sincronizar NFs para movimentações:', error)
    return res.status(500).json({ message: 'Erro ao sincronizar NFs', error: error.message })
  }
}