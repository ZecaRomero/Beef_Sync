import { query } from '../../../lib/database'

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método não permitido' })
    }

    // Primeiro, verificar quantas NFs de receptoras existem
    const nfsReceptoras = await query(`
      SELECT id, numero_nf, receptora_letra, receptora_numero, data_compra, data_chegada_animais, data_te
      FROM notas_fiscais
      WHERE eh_receptoras = true AND tipo = 'entrada'
    `)
    
    console.log(`📋 NFs de Receptoras encontradas: ${nfsReceptoras.rows.length}`)
    
    // Buscar receptoras que precisam de DG
    // Buscar cada item da NF como uma receptora separada
    let result
    try {
      const receptorasQuery = `
        SELECT 
          nf.id as nf_id,
          nf.numero_nf,
          nf.data_compra,
          nf.data_chegada_animais,
          nf.receptora_letra,
          nf.receptora_numero,
          nf.data_te,
          nf.fornecedor,
          CASE 
            WHEN COALESCE(nf.data_chegada_animais, nf.data_compra) IS NOT NULL THEN (COALESCE(nf.data_chegada_animais, nf.data_compra) + INTERVAL '15 days')::date
            ELSE NULL
          END as data_prevista_dg,
          CASE 
            WHEN item.dados_item IS NOT NULL THEN item.dados_item->>'tatuagem'
            ELSE NULL
          END as tatuagem_item,
          CASE 
            WHEN item.dados_item IS NOT NULL THEN item.dados_item->>'sexo'
            ELSE NULL
          END as sexo_item,
          item.dados_item as dados_item_completo,
          item.id as item_id
        FROM notas_fiscais nf
        INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
        WHERE nf.eh_receptoras = true
          AND nf.tipo = 'entrada'
          AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
        ORDER BY nf.numero_nf, item.id
      `
      result = await query(receptorasQuery)
    } catch (queryError) {
      console.error('Erro na query principal:', queryError)
      // Tentar query mais simples
      result = { rows: [] }
    }
    console.log(`📋 Itens de receptoras encontrados: ${result.rows.length}`)
    
    if (result.rows.length > 0) {
      console.log('📋 Primeiro item exemplo:', JSON.stringify(result.rows[0], null, 2))
    }
    
    // Processar resultados
    const receptorasProcessadas = []
    
    result.rows.forEach((row, index) => {
      try {
        // Parse do dados_item se for string
        let dadosItem = null
        if (row.dados_item_completo) {
          if (typeof row.dados_item_completo === 'string') {
            try {
              dadosItem = JSON.parse(row.dados_item_completo)
            } catch (e) {
              console.log(`Erro ao parsear dados_item do item ${index + 1}:`, e.message)
            }
          } else {
            dadosItem = row.dados_item_completo
          }
        }
        
        const tatuagem = row.tatuagem_item || (dadosItem?.tatuagem) || ''
        let letra = row.receptora_letra || ''
        let numero = row.receptora_numero || ''
        
        // Se tem tatuagem, tentar extrair letra e número
        if (tatuagem) {
          // Formato pode ser: M0898, M 0898, M0898, 0898, etc
          const matchLetra = tatuagem.match(/^([A-Za-z]+)/)
          const matchNumero = tatuagem.match(/(\d+)/)
          
          if (matchLetra) letra = matchLetra[1].toUpperCase()
          if (matchNumero) numero = matchNumero[1]
        }
        
        // Se ainda não tem número, usar da NF
        if (!numero && row.receptora_numero) {
          numero = row.receptora_numero
        }
        if (!letra && row.receptora_letra) {
          letra = row.receptora_letra.toUpperCase()
        }
        
        // Se ainda não tem, tentar extrair da tatuagem completa
        if (!numero && tatuagem) {
          const matchNumeroFinal = tatuagem.match(/(\d+)/)
          if (matchNumeroFinal) numero = matchNumeroFinal[1]
        }
        
        if (numero) {
          receptorasProcessadas.push({
            letra: letra,
            numero: numero,
            numeroOrdenado: parseInt(numero) || 0,
            dataPrevistaDG: row.data_prevista_dg,
            dataChegadaAnimais: row.data_chegada_animais,
            dataTE: row.data_te,
            numeroNF: row.numero_nf,
            fornecedor: row.fornecedor,
            tatuagemCompleta: tatuagem || `${letra}${numero}`,
            animalId: null,
            serie: letra,
            rg: numero,
            animalNome: null,
            dataDG: null,
            resultadoDG: null,
            veterinario: null,
            observacoes: ''
          })
        } else {
          console.log(`⚠️ Item ${index + 1} sem número:`, { tatuagem, receptora_letra: row.receptora_letra, receptora_numero: row.receptora_numero })
        }
      } catch (error) {
        console.error(`Erro ao processar item ${index + 1}:`, error)
      }
    })
    
    console.log(`✅ Receptoras processadas após extração: ${receptorasProcessadas.length}`)
    
    // Se não encontrou nada na query principal, tentar buscar de forma mais simples
    if (receptorasProcessadas.length === 0 && nfsReceptoras.rows.length > 0) {
      console.log('⚠️ Nenhum item encontrado, tentando busca alternativa...')
      // Buscar apenas pelas NFs e usar dados da NF diretamente
      const nfsComItens = await Promise.all(nfsReceptoras.rows.map(async (nf) => {
        const itensResult = await query(`
          SELECT dados_item FROM notas_fiscais_itens
          WHERE nota_fiscal_id = $1 AND (tipo_produto = 'bovino' OR tipo_produto IS NULL)
        `, [nf.id])
        
        return {
          nf: nf,
          itens: itensResult.rows.map(row => {
            try {
              return typeof row.dados_item === 'string' 
                ? JSON.parse(row.dados_item) 
                : row.dados_item
            } catch {
              return null
            }
          }).filter(Boolean)
        }
      }))
      
      // Processar manualmente e adicionar ao array existente
      nfsComItens.forEach(({ nf, itens }) => {
        itens.forEach((item, index) => {
          const tatuagem = item.tatuagem || ''
          // Extrair letra e número da tatuagem ou usar da NF
          let letra = nf.receptora_letra || ''
          let numero = nf.receptora_numero || ''
          
          if (tatuagem) {
            // Tentar extrair letra e número da tatuagem (ex: M0898, M 0898, 0898)
            const matchLetra = tatuagem.match(/^([A-Za-z]+)/)
            const matchNumero = tatuagem.match(/(\d+)/)
            
            if (matchLetra) letra = matchLetra[1].toUpperCase()
            if (matchNumero) numero = matchNumero[1]
          }
          
          // Se ainda não tem, usar da NF
          if (!numero && nf.receptora_numero) {
            numero = nf.receptora_numero
          }
          if (!letra && nf.receptora_letra) {
            letra = nf.receptora_letra.toUpperCase()
          }
          
          if (numero) {
            const dataRef = nf.data_chegada_animais || nf.data_compra
            receptorasProcessadas.push({
              letra: letra,
              numero: numero,
              numeroOrdenado: parseInt(numero) || 0,
              dataPrevistaDG: dataRef 
                ? new Date(new Date(dataRef).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : null,
              dataChegadaAnimais: nf.data_chegada_animais,
              dataTE: nf.data_te,
              numeroNF: nf.numero_nf,
              fornecedor: null,
              tatuagemCompleta: tatuagem || `${letra}${numero}`,
              animalId: null,
              serie: letra,
              rg: numero,
              animalNome: null,
              dataDG: null,
              resultadoDG: null,
              veterinario: null,
              observacoes: ''
            })
          }
        })
      })
      
      console.log(`✅ Receptoras após busca alternativa: ${receptorasProcessadas.length}`)
    }
    
    // Se ainda não tem receptoras, retornar vazio
    if (receptorasProcessadas.length === 0) {
      console.log('⚠️ Nenhuma receptora encontrada após processamento')
      return res.status(200).json({
        success: true,
        data: [],
        total: 0
      })
    }
    
    // Normalizar número (remover zeros à esquerda para matching consistente)
    const normNum = (n) => String(n || '').replace(/^0+/, '') || '0'

    // Buscar dados de animais e inseminações para as receptoras processadas
    const receptorasCompletas = await Promise.all(receptorasProcessadas.map(async (receptora) => {
      try {
        // Buscar animal correspondente
        let animalId = null
        let serie = receptora.letra
        let rg = receptora.numero
        let animalNome = null
        let dataDG = null
        let resultadoDG = null
        let veterinario = null
        let observacoes = ''
        
        // Tentar encontrar animal por múltiplos critérios (match flexível: serie/rg, tatuagem, zeros à esquerda)
        try {
          const letraNorm = String(receptora.letra || '').trim().toUpperCase()
          const numeroNorm = String(receptora.numero || '').trim()
          const numeroNormSemZero = normNum(receptora.numero)
          const tatuagemBusca = receptora.tatuagemCompleta || `${letraNorm}${numeroNorm}`
          const tatuagemSemEspacos = (receptora.tatuagemCompleta || `${letraNorm}${numeroNorm}`).replace(/\s/g, '')
          
          let animalResult = await query(`
            SELECT id, serie, rg, nome, data_dg, veterinario_dg, resultado_dg, observacoes_dg
            FROM animais
            WHERE (
              (TRIM(COALESCE(serie, '')) = $1 AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3))
              OR ($1 = '' AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3))
              OR REPLACE(LOWER(COALESCE(serie, '')), ' ', '') = REPLACE(LOWER($1 || $2), ' ', '')
              OR TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3
              OR tatuagem = $4
              OR REPLACE(COALESCE(tatuagem, ''), ' ', '') = $5
              OR (tatuagem IS NOT NULL AND REPLACE(LOWER(tatuagem), ' ', '') = $6)
            )
            ORDER BY data_dg DESC NULLS LAST, id DESC
            LIMIT 1
          `, [letraNorm, numeroNorm, numeroNormSemZero, tatuagemBusca, tatuagemSemEspacos, tatuagemSemEspacos.toLowerCase()])
          
          // Fallback: buscar apenas por rg/numero (serie pode estar vazia ou diferente)
          if (animalResult.rows.length === 0 && numeroNorm) {
            animalResult = await query(`
              SELECT id, serie, rg, nome, data_dg, veterinario_dg, resultado_dg, observacoes_dg
              FROM animais
              WHERE TRIM(rg::text) = $1 OR TRIM(LTRIM(rg::text, '0')) = $2
              ORDER BY data_dg DESC NULLS LAST
              LIMIT 1
            `, [numeroNorm, numeroNormSemZero])
          }

          // Fallback extra: série pode ter sido gravada junto com o número (ex: "M8251")
          if (animalResult.rows.length === 0 && letraNorm && numeroNorm) {
            const serieNumeroJuntos = `${letraNorm}${numeroNorm}`
            const serieNumeroJuntosSemEspaco = serieNumeroJuntos.replace(/\s/g, '').toLowerCase()
            animalResult = await query(`
              SELECT id, serie, rg, nome, data_dg, veterinario_dg, resultado_dg, observacoes_dg
              FROM animais
              WHERE REPLACE(LOWER(COALESCE(serie, '') || TRIM(COALESCE(rg::text, ''))), ' ', '') = $1
                 OR LOWER(REPLACE(COALESCE(nome, ''), ' ', '')) LIKE $2
              ORDER BY id DESC
              LIMIT 1
            `, [serieNumeroJuntosSemEspaco, `${serieNumeroJuntosSemEspaco}%`])
          }
          
          // Fallback: verificar nascimentos (prenhas já foram para lista de partos)
          if (animalResult.rows.length === 0 && numeroNorm) {
            const nascResult = await query(`
              SELECT serie, rg FROM nascimentos
              WHERE (($1 != '' AND TRIM(COALESCE(serie, '')) = $1) OR ($1 = '' AND (serie IS NULL OR TRIM(COALESCE(serie, '')) = '')))
                AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3)
              LIMIT 1
            `, [letraNorm, numeroNorm, numeroNormSemZero])
            if (nascResult.rows.length > 0) {
              dataDG = '1900-01-01'
              resultadoDG = 'Prenha'
            }
          }
          else if (!animalId && numeroNorm) {
            try {
              const onlyRg = await query(`
                SELECT id, serie, rg, nome, data_dg, veterinario_dg, resultado_dg, observacoes_dg
                FROM animais
                WHERE TRIM(rg::text) = $1 OR TRIM(LTRIM(rg::text, '0')) = TRIM(LTRIM($1, '0'))
                ORDER BY id DESC
                LIMIT 1
              `, [numeroNorm])
              if (onlyRg.rows.length > 0) {
                const animal = onlyRg.rows[0]
                animalId = animal.id
                serie = animal.serie || serie
                rg = animal.rg || rg
                animalNome = animal.nome
                dataDG = animal.data_dg
                veterinario = animal.veterinario_dg
                resultadoDG = animal.resultado_dg
                observacoes = animal.observacoes_dg || ''
              }
            } catch (err) {
              console.error('Erro no fallback por RG:', err.message)
            }
          }
          
          if (animalResult.rows.length > 0) {
            const animal = animalResult.rows[0]
            animalId = animal.id
            serie = animal.serie || serie
            rg = animal.rg || rg
            animalNome = animal.nome
            dataDG = animal.data_dg
            veterinario = animal.veterinario_dg
            resultadoDG = animal.resultado_dg
            observacoes = animal.observacoes_dg || ''
            
            // Se não tem dados do DG na tabela animais, buscar de inseminação
            if (!dataDG) {
              try {
                const inseminacaoResult = await query(`
                  SELECT data_dg, resultado_dg, observacoes, tecnico
                  FROM inseminacoes
                  WHERE animal_id = $1 AND data_dg IS NOT NULL
                  ORDER BY data_dg DESC
                  LIMIT 1
                `, [animalId])
                
                if (inseminacaoResult.rows.length > 0) {
                  const inseminacao = inseminacaoResult.rows[0]
                  dataDG = inseminacao.data_dg
                  resultadoDG = inseminacao.resultado_dg
                  veterinario = inseminacao.tecnico
                  observacoes = inseminacao.observacoes || ''
                }
              } catch (err) {
                console.error('Erro ao buscar inseminação:', err.message)
              }
            }
            // Se ainda não tem DG, buscar em historia_ocorrencias (DG lançado via ocorrência rápida)
            if (!dataDG && animalId) {
              try {
                const histResult = await query(`
                  SELECT data, observacoes, descricao FROM historia_ocorrencias
                  WHERE animal_id = $1 AND tipo = 'DG' AND data IS NOT NULL
                  ORDER BY data DESC LIMIT 1
                `, [animalId])
                if (histResult.rows.length > 0) {
                  const row = histResult.rows[0]
                  dataDG = row.data
                  const texto = (row.observacoes || row.descricao || '').toLowerCase()
                  if (texto.includes('prenha') || texto.includes('positivo')) resultadoDG = 'Prenha'
                  else if (texto.includes('negativo') || texto.includes('vazia')) resultadoDG = 'Vazia'
                  else {
                    const match = (row.observacoes || row.descricao || '').match(/Diagnóstico de Gestação:\s*(\w+)/i)
                    resultadoDG = match ? match[1].trim() : 'Vazia'
                  }
                }
              } catch (err) {
                console.error('Erro ao buscar DG em historia_ocorrencias:', err.message)
              }
            }
          }
        } catch (err) {
          console.error('Erro ao buscar animal:', err.message)
        }
        
        return {
          ...receptora,
          animalId,
          serie,
          rg,
          animalNome,
          dataDG,
          resultadoDG,
          veterinario,
          observacoes,
          dataChegada: receptora.dataChegadaAnimais || receptora.dataTE || null,
          dataTE: receptora.dataTE || null,
          origem: receptora.numeroNF || receptora.fornecedor || null,
          nf_numero: receptora.numeroNF,
          fornecedor: receptora.fornecedor || null
        }
      } catch (error) {
        console.error('Erro ao processar receptora:', error)
        return receptora // Retornar dados básicos se houver erro
      }
    }))
    
    // Consolidação: garantir dataDG/resultadoDG consultando diretamente a tabela animais para qualquer receptora sem DG
    for (let i = 0; i < receptorasCompletas.length; i++) {
      const r = receptorasCompletas[i]
      if (!r.dataDG) {
        try {
          const letraNorm = String(r.letra || '').trim().toUpperCase()
          const numeroNorm = String(r.numero || '').trim()
          const numeroNormSemZero = String(r.numero || '').replace(/^0+/, '')
          const tatuagemBusca = r.tatuagemCompleta || `${letraNorm}${numeroNorm}`
          const tatuagemSemEspacos = (r.tatuagemCompleta || `${letraNorm}${numeroNorm}`).replace(/\s/g, '')
          const fix = await query(`
            SELECT id, serie, rg, nome, data_dg, veterinario_dg, resultado_dg, observacoes_dg
            FROM animais
            WHERE (
              (TRIM(COALESCE(serie, '')) = $1 AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3))
              OR ($1 = '' AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3))
              OR REPLACE(LOWER(COALESCE(serie, '')), ' ', '') = REPLACE(LOWER($1 || $2), ' ', '')
              OR TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = $3
              OR tatuagem = $4
              OR REPLACE(COALESCE(tatuagem, ''), ' ', '') = $5
              OR (tatuagem IS NOT NULL AND REPLACE(LOWER(tatuagem), ' ', '') = $6)
            )
            ORDER BY data_dg DESC NULLS LAST, id DESC
            LIMIT 1
          `, [letraNorm, numeroNorm, numeroNormSemZero, tatuagemBusca, tatuagemSemEspacos, tatuagemSemEspacos.toLowerCase()])
          if (fix.rows.length > 0) {
            const a = fix.rows[0]
            receptorasCompletas[i] = {
              ...r,
              animalId: a.id || r.animalId,
              serie: a.serie || r.serie,
              rg: a.rg || r.rg,
              animalNome: a.nome || r.animalNome,
              dataDG: a.data_dg || r.dataDG,
              veterinario: a.veterinario_dg || r.veterinario,
              resultadoDG: a.resultado_dg || r.resultadoDG,
              observacoes: a.observacoes_dg || r.observacoes
            }
          }
        } catch (e) {
          // ignora
        }
      }
    }
    
    // Agrupar por letra+número+fornecedor para evitar duplicatas
    // IMPORTANTE: a mesma receptora (ex: 8251) pode estar em NFs de fornecedores diferentes.
    // Se usarmos só letra_numero, perderíamos a associação com MINEREMBRYO ao deduplicar.
    const receptorasMap = new Map()
    receptorasCompletas.forEach(receptora => {
      const fornecedor = receptora.fornecedor || 'Sem Fornecedor'
      const chave = `${receptora.letra}_${receptora.numero}|${fornecedor}`
      if (!receptorasMap.has(chave)) {
        receptorasMap.set(chave, receptora)
      } else {
        // Se já existe (mesmo fornecedor), manter a que tem mais dados (DG realizado)
        const existente = receptorasMap.get(chave)
        if (receptora.dataDG && !existente.dataDG) {
          receptorasMap.set(chave, receptora)
        }
      }
    })

    // Converter para array e ordenar por número
    let receptoras = Array.from(receptorasMap.values())
      .sort((a, b) => {
        // Ordenar primeiro por letra, depois por número
        if (a.letra !== b.letra) {
          return (a.letra || '').localeCompare(b.letra || '')
        }
        return a.numeroOrdenado - b.numeroOrdenado
      })

    // Excluir receptoras que já têm DG (e foram para Nascimentos se prenhas)
    // Somente receptoras novas/pendentes de DG devem aparecer nesta tela
    const { incluirComDG } = req.query
    if (incluirComDG !== 'true') {
      const antes = receptoras.length
      receptoras = receptoras.filter(r => !r.dataDG)
      console.log(`📤 Excluídas ${antes - receptoras.length} receptoras que já têm DG. Restam ${receptoras.length} pendentes.`)
    }

    console.log(`✅ Receptoras processadas: ${receptoras.length}`)

    return res.status(200).json({
      success: true,
      data: receptoras,
      total: receptoras.length
    })
  } catch (error) {
    console.error('Erro ao buscar receptoras para DG:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar receptoras',
      message: error.message
    })
  }
}
