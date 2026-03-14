import { query } from '../../../lib/database'

/**
 * POST: Lançamento em lote de DG.
 * Aceita receptoras com ou sem animalId.
 * Se não tiver animalId, busca ou cria o animal por serie+rg e depois atualiza o DG.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { dataDG, veterinario, receptoras } = req.body
    
    // LOG: Dados recebidos
    console.log('📥 Dados recebidos na API lancar-dg-batch:');
    console.log('Data DG:', dataDG);
    console.log('Veterinário:', veterinario);
    console.log('Receptoras:', JSON.stringify(receptoras, null, 2));

    if (!dataDG || !veterinario) {
      return res.status(400).json({
        success: false,
        error: 'Data do DG e veterinário são obrigatórios',
        required: ['dataDG', 'veterinario']
      })
    }

    if (!receptoras || !Array.isArray(receptoras) || receptoras.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de receptoras é obrigatória'
      })
    }

    const resultados = { sucessos: 0, erros: 0, detalhes: [] }

    for (const r of receptoras) {
        const letra = (r.letra || '').trim().toUpperCase()
        const numero = String(r.numero || '').trim()
        const animalId = r.animalId
        const numeroNF = r.numeroNF || null
        const resultadoDG = r.resultadoDG || 'Prenha'
        const observacoes = r.observacoes || ''
      const identificador = `${letra}${numero}`

      try {
        let idParaUpdate = animalId
        
        console.log(`\n🔄 Processando receptora ${identificador}:`);
        console.log(`  - animalId: ${animalId}`);
        console.log(`  - letra: ${letra}`);
        console.log(`  - numero: ${numero}`);
        console.log(`  - resultado: ${resultadoDG}`);

        if (!idParaUpdate && letra && numero) {
          const animalExistente = await query(`
            SELECT id FROM animais
            WHERE (TRIM(COALESCE(serie, '')) = $1 AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = TRIM(LTRIM($2, '0'))))
               OR ($1 = '' AND (TRIM(rg::text) = $2 OR TRIM(LTRIM(rg::text, '0')) = TRIM(LTRIM($2, '0'))))
            LIMIT 1
          `, [letra, numero])

          if (animalExistente.rows.length > 0) {
            idParaUpdate = animalExistente.rows[0].id
          } else {
            await query(`
              ALTER TABLE animais 
              ADD COLUMN IF NOT EXISTS data_chegada DATE,
              ADD COLUMN IF NOT EXISTS data_dg_prevista DATE
            `).catch(() => {})

            const novoAnimal = await query(`
              INSERT INTO animais (serie, rg, nome, sexo, raca, situacao)
              VALUES ($1, $2, $3, 'Fêmea', 'Receptora', 'Ativo')
              RETURNING id
            `, [letra, numero, `${letra} ${numero}`.trim()])

            idParaUpdate = novoAnimal.rows[0].id
          }
        }

        if (!idParaUpdate) {
          resultados.erros++
          resultados.detalhes.push({ identificador, erro: 'Não foi possível identificar o animal' })
          continue
        }

        await query(`
          UPDATE animais 
          SET data_dg = $1, veterinario_dg = $2, resultado_dg = $3, observacoes_dg = $4, updated_at = NOW()
          WHERE id = $5
        `, [dataDG, veterinario, resultadoDG, observacoes, idParaUpdate])
        
        console.log(`  ✅ DG atualizado com sucesso para animal ID ${idParaUpdate}!`);

        // Se DG positivo, registrar gestante no menu de Nascimentos com parto previsto 9 meses após a TE
        const ehPrenha = (resultadoDG || '').toString().toLowerCase().includes('pren')
        if (ehPrenha && letra && numero) {
          try {
            // Buscar data da TE: 1) pela NF específica (numero_nf), 2) por receptora_letra/numero, 3) por transferencias_embrioes
            let dataTE = null
            let touro = ''
            let doadora = ''

            // 1. Se temos numeroNF, buscar data_te dessa NF diretamente (mais confiável)
            if (numeroNF) {
              const nfByNumero = await query(`
                SELECT data_te, fornecedor, numero_nf
                FROM notas_fiscais
                WHERE eh_receptoras = true AND numero_nf::text = $1
                LIMIT 1
              `, [String(numeroNF).trim()])
              if (nfByNumero.rows.length > 0 && nfByNumero.rows[0].data_te) {
                dataTE = nfByNumero.rows[0].data_te
              }
            }
            // 2. Buscar por receptora_letra/numero na NF
            if (!dataTE) {
              const nf = await query(`
                SELECT data_te, fornecedor, numero_nf
                FROM notas_fiscais
                WHERE eh_receptoras = true
                  AND TRIM(COALESCE(receptora_letra, '')) = $1
                  AND (TRIM(receptora_numero::text) = $2 OR TRIM(LTRIM(COALESCE(receptora_numero::text, ''), '0')) = TRIM(LTRIM($2, '0')))
                ORDER BY COALESCE(data_te, data_compra) DESC
                LIMIT 1
              `, [letra, numero])
              if (nf.rows.length > 0 && nf.rows[0].data_te) {
                dataTE = nf.rows[0].data_te
              }
            }
            // 3. Fallback: transferências de embriões
            if (!dataTE) {
              const nomeReceptora = `${letra} ${numero}`
              const te = await query(`
                SELECT data_te, touro, doadora_nome
                FROM transferencias_embrioes
                WHERE REPLACE(LOWER(COALESCE(receptora_nome, '')), ' ', '') = REPLACE(LOWER($1), ' ', '')
                ORDER BY data_te DESC
                LIMIT 1
              `, [nomeReceptora])
              if (te.rows.length > 0) {
                dataTE = te.rows[0].data_te
                touro = te.rows[0].touro || ''
                doadora = te.rows[0].doadora_nome || ''
              }
            }
            // 4. Último fallback: data_chegada da NF (aprox. TE)
            if (!dataTE && numeroNF) {
              const nfChegada = await query(`
                SELECT data_chegada_animais, data_compra
                FROM notas_fiscais
                WHERE eh_receptoras = true AND numero_nf::text = $1
                LIMIT 1
              `, [String(numeroNF).trim()])
              if (nfChegada.rows.length > 0) {
                dataTE = nfChegada.rows[0].data_chegada_animais || nfChegada.rows[0].data_compra
              }
            }

            if (dataTE) {
              // Calcular data prevista de parto: TE + 9 meses
              const teDate = new Date(dataTE)
              const partoPrevisto = new Date(teDate)
              partoPrevisto.setMonth(partoPrevisto.getMonth() + 9)

              const formatBR = (d) => {
                const dd = String(d.getDate()).padStart(2, '0')
                const mm = String(d.getMonth() + 1).padStart(2, '0')
                const yyyy = d.getFullYear()
                return `${dd}/${mm}/${yyyy}`
              }

              const prevPartoStr = formatBR(partoPrevisto)
              const nascimentoStr = prevPartoStr
              const rgCompleto = `${letra} ${numero}`

              // Evitar duplicidade: checar se já existe registro para esta receptora
              const existe = await query(`
                SELECT id FROM nascimentos
                WHERE serie = $1 AND rg = $2
                LIMIT 1
              `, [letra, numero])

              if (existe.rows.length === 0) {
                // Usar o schema correto da tabela nascimentos
                await query(`
                  INSERT INTO nascimentos (
                    serie, rg, sexo, data_nascimento, observacoes
                  ) VALUES (
                    $1, $2, $3, $4, $5
                  )
                `, [
                  letra, // serie
                  numero, // rg
                  'Fêmea', // sexo (receptoras são sempre fêmeas)
                  partoPrevisto.toISOString().split('T')[0], // data_nascimento (data prevista do parto)
                  `DG positivo em ${formatBR(new Date(dataDG))}. Parto previsto 9 meses após a TE. Touro: ${touro || 'N/A'}. Doadora: ${doadora || 'N/A'}.` // observacoes
                ])
              }
            }
          } catch (e) {
            // Não bloquear o fluxo se falhar inserir no menu de nascimentos
            resultados.detalhes.push({ identificador, aviso: `Falha ao inserir em nascimentos: ${e.message}` })
          }
        }

        resultados.sucessos++
        resultados.detalhes.push({ identificador, sucesso: true })
      } catch (err) {
        resultados.erros++
        resultados.detalhes.push({ identificador, erro: err.message })
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processadas: ${resultados.sucessos} sucesso(s), ${resultados.erros} erro(s)`,
      sucessos: resultados.sucessos,
      erros: resultados.erros,
      detalhes: resultados.detalhes
    })
  } catch (error) {
    console.error('Erro ao lançar DG em lote:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar lote',
      message: error.message
    })
  }
}
