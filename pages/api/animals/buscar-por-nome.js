import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { nome } = req.query

    if (!nome) {
      return res.status(400).json({ message: 'Nome Ã© obrigatÃ³rio' })
    }

    const nomeTrim = nome.trim()
    
    if (nomeTrim.length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Digite pelo menos 2 caracteres' 
      })
    }

    const termo = nomeTrim.replace(/%/g, '') // evitar injection
    const padraoContem = `%${termo}%`
    const termoUpper = termo.toUpperCase()

    // Buscar por: nome, identificaÃ§Ã£o (serie + rg). Priorizar: exato > palavra > contÃ©m
    const result = await query(
      `SELECT id, serie, rg, nome, sexo, raca, situacao_reprodutiva, carimbo_leilao, prev_parto,
         CASE 
           WHEN UPPER(TRIM(COALESCE(nome,''))) = $1 THEN 0
           WHEN UPPER(TRIM(COALESCE(nome,''))) LIKE $1 || ',%' OR UPPER(TRIM(COALESCE(nome,''))) LIKE $1 || ' %' THEN 1
           WHEN UPPER(TRIM(COALESCE(nome,''))) LIKE '% ' || $1 || ' %' OR UPPER(TRIM(COALESCE(nome,''))) LIKE '% ' || $1 OR UPPER(TRIM(COALESCE(nome,''))) LIKE $1 || ' %' THEN 2
           WHEN UPPER(TRIM(COALESCE(nome,''))) LIKE $2 THEN 3
           WHEN UPPER(TRIM(COALESCE(serie,'') || ' ' || COALESCE(rg::text,''))) LIKE $2 THEN 4
           ELSE 5
         END AS prioridade
       FROM animais 
       WHERE UPPER(TRIM(COALESCE(nome,''))) LIKE $2
          OR UPPER(TRIM(COALESCE(serie,'') || ' ' || COALESCE(rg::text,''))) LIKE $2
          OR UPPER(TRIM(COALESCE(serie,''))) LIKE $2
       ORDER BY prioridade, nome
       LIMIT 15`,
      [termoUpper, padraoContem]
    )

    // Fallback: buscar em coleta_fiv (doadora_nome) - ex: "Mosca" como doadora (CJCJ 15959)
    try {
      const cfResult = await query(
        `SELECT a.id, a.serie, a.rg, a.nome, a.sexo, a.raca, a.situacao_reprodutiva, a.carimbo_leilao, a.prev_parto
         FROM coleta_fiv cf
         JOIN animais a ON a.id = cf.doadora_id
         WHERE UPPER(TRIM(COALESCE(cf.doadora_nome,''))) LIKE UPPER($1)
            OR UPPER(TRIM(COALESCE(a.nome,''))) LIKE UPPER($1)
         ORDER BY cf.data_fiv DESC
         LIMIT 10`,
        [padraoContem]
      )
      if (cfResult.rows.length > 0) {
        const seen = new Set(result.rows.map(r => `${r.serie}-${r.rg}`))
        for (const r of cfResult.rows) {
          const key = `${r.serie}-${r.rg}`
          if (!seen.has(key)) {
            seen.add(key)
            result.rows.push(r)
          }
        }
      }
    } catch (e) {
      console.warn('Fallback coleta_fiv:', e?.message)
    }

    // Mapa de nomes alternativos (doadora/receptora) para exibir quando cadastro estÃ¡ errado
    const nomeAlternativo = new Map()
    try {
      const cfNomes = await query(
        `SELECT cf.doadora_id, MAX(cf.doadora_nome) as doadora_nome
         FROM coleta_fiv cf
         WHERE cf.doadora_id IS NOT NULL AND UPPER(TRIM(COALESCE(cf.doadora_nome,''))) LIKE UPPER($1)
         GROUP BY cf.doadora_id`,
        [padraoContem]
      )
      for (const row of cfNomes.rows || []) {
        if (row.doadora_nome) nomeAlternativo.set(row.doadora_id, row.doadora_nome)
      }
    } catch (_) {}

    // Fallback: buscar em gestacoes (receptora_nome) - ex: JALOUSIER, JATAUBA quando nome no cadastro estÃ¡ errado
    // EstratÃ©gia em 2 passos: 1) achar gestacoes com receptora_nome; 2) buscar animais por serie+rg (evita JOIN complexo)
    try {
      const gestNomes = await query(
        `SELECT receptora_serie, receptora_rg, receptora_nome
         FROM gestacoes
         WHERE UPPER(TRIM(COALESCE(receptora_nome,''))) LIKE UPPER($1)
           AND receptora_nome IS NOT NULL AND TRIM(receptora_nome) != ''
           AND receptora_serie IS NOT NULL AND receptora_rg IS NOT NULL
         ORDER BY id DESC
         LIMIT 20`,
        [padraoContem]
      )
      if (gestNomes.rows.length > 0) {
        const seen = new Set(result.rows.map(r => `${r.serie}-${r.rg}`))
        for (const g of gestNomes.rows) {
          const serieG = String(g.receptora_serie || '').trim()
          const rgG = String(g.receptora_rg ?? '').trim().replace(/^0+/, '') || '0'
          const key = `${serieG}-${rgG}`
          if (seen.has(key)) continue
          const aResult = await query(
            `SELECT id, serie, rg, nome, sexo, raca, situacao_reprodutiva, carimbo_leilao, prev_parto
             FROM animais
             WHERE UPPER(TRIM(COALESCE(serie,''))) = UPPER(TRIM($1))
               AND (TRIM(REGEXP_REPLACE(COALESCE(rg::text,''), '^0+', '')) = $2 OR TRIM(rg::text) = $3)
             LIMIT 1`,
            [serieG, rgG, String(g.receptora_rg ?? '').trim()]
          )
          if (aResult.rows.length > 0) {
            const animal = aResult.rows[0]
            seen.add(key)
            result.rows.push(animal)
            if (g.receptora_nome) nomeAlternativo.set(animal.id, g.receptora_nome)
          }
        }
      }
    } catch (e) {
      console.warn('Fallback gestacoes receptora_nome:', e?.message)
    }

    // Fallback: buscar em transferencias_embrioes (receptora_nome) - quando nome no cadastro estÃ¡ errado
    try {
      const teCols = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'transferencias_embrioes' AND column_name = 'receptora_nome'`)
      if (teCols.rows.length > 0) {
        const teResult = await query(
          `SELECT a.id, a.serie, a.rg, a.nome, a.sexo, a.raca, a.situacao_reprodutiva, a.carimbo_leilao, a.prev_parto,
                  te.receptora_nome
           FROM transferencias_embrioes te
           JOIN animais a ON a.id = te.receptora_id
           WHERE UPPER(TRIM(COALESCE(te.receptora_nome,''))) LIKE UPPER($1)
             AND te.receptora_nome IS NOT NULL AND TRIM(te.receptora_nome) != ''
           ORDER BY te.data_te DESC
           LIMIT 10`,
          [padraoContem]
        )
        if (teResult.rows.length > 0) {
          const seen = new Set(result.rows.map(r => `${r.serie}-${r.rg}`))
          for (const r of teResult.rows) {
            const key = `${r.serie}-${r.rg}`
            if (!seen.has(key)) {
              seen.add(key)
              const { receptora_nome, ...animal } = r
              result.rows.push(animal)
              if (receptora_nome) nomeAlternativo.set(animal.id, receptora_nome)
            }
          }
        }
      }
    } catch (e) {
      console.warn('Fallback transferencias_embrioes receptora_nome:', e?.message)
    }

    // OrdenaÃ§Ã£o final: termo como palavra primeiro (ex: JALOUSIER antes de JALOM quando busca "JALO")
    const nomeParaSort = (r) => (r.id ? nomeAlternativo.get(r.id) : null) || r.nome || ''
    const prioridade = (r) => {
      const n = nomeParaSort(r).toUpperCase()
      if (n === termoUpper) return 0
      if (n.startsWith(termoUpper + ' ') || n.startsWith(termoUpper + ',')) return 1
      if (n.includes(' ' + termoUpper + ' ') || n.endsWith(' ' + termoUpper)) return 2
      if (n.includes(termoUpper)) return 3
      return 4
    }
    result.rows.sort((a, b) => {
      const pa = prioridade(a)
      const pb = prioridade(b)
      if (pa !== pb) return pa - pb
      return nomeParaSort(a).localeCompare(nomeParaSort(b))
    })

    // ÃÅ¡ltimo recurso: busca simples por ILIKE (case-insensitive, pode pegar variaÃ§Ãµes)
    if (result.rows.length === 0) {
      try {
        const ilikeResult = await query(
          `SELECT id, serie, rg, nome, sexo, raca, situacao_reprodutiva, carimbo_leilao, prev_parto
           FROM animais
           WHERE nome IS NOT NULL AND nome ILIKE $1
           LIMIT 15`,
          [padraoContem]
        )
        if (ilikeResult.rows.length > 0) {
          result.rows.push(...ilikeResult.rows)
        }
      } catch (e) {
        console.warn('Fallback ILIKE:', e?.message)
      }
    }

    if (result.rows.length === 0) {
      console.log(`â�Å’ Nenhum animal encontrado com: "${nomeTrim}"`)
      return res.status(200).json({ 
        success: true,
        data: [],
        message: 'Nenhum animal encontrado'
      })
    }

    console.log(`âÅ“â€¦ ${result.rows.length} animal(is) encontrado(s) com: "${nomeTrim}"`)
    
    res.status(200).json({
      success: true,
      data: result.rows.map(animal => {
        const nomeAlt = animal.id ? nomeAlternativo.get(animal.id) : null
        const nomeExibir = nomeAlt && (nomeAlt || '').toUpperCase().trim().includes(termoUpper)
          ? nomeAlt
          : animal.nome
        return {
          id: animal.id,
          serie: animal.serie,
          rg: animal.rg,
          nome: nomeExibir || animal.nome,
          sexo: animal.sexo,
          raca: animal.raca,
          situacao_reprodutiva: animal.situacao_reprodutiva,
          carimbo_leilao: animal.carimbo_leilao,
          prev_parto: animal.prev_parto
        }
      })
    })
  } catch (error) {
    console.error('Erro ao buscar animal por nome:', error)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar animal', 
      error: error.message 
    })
  }
}
