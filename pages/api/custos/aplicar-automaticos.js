/**
 * API para aplicar custos automáticos aos animais conforme regras:
 * - Situação ABCZ POSSUI RGN → R$ 36,90
 * - Situação ABCZ POSSUI RGD → R$ 89,10
 * - Fêmeas 8+ meses → Vacina Brucelose R$ 2,76
 * - Receptoras → DNA VRGEN R$ 50,00
 * - Receptoras sem DNA Genômica → R$ 80,00
 * - Todos os animais → Brinco Amarelo R$ 2,70
 * - Todos os animais → Botton Eletrônico R$ 6,00
 * - Machos 15-32 meses → Exame Andrológico + Exames R$ 165,00
 */
const { query } = require('../../../lib/database')
const databaseService = require('../../../services/databaseService').default || require('../../../services/databaseService')

const CUSTOS = {
  RGN: { tipo: 'ABCZ', subtipo: 'RGN', valor: 36.90, desc: 'Situação ABCZ POSSUI RGN' },
  RGD: { tipo: 'ABCZ', subtipo: 'RGD', valor: 89.10, desc: 'Situação ABCZ POSSUI RGD' },
  BRUCELOSE: { tipo: 'Veterinário', subtipo: 'Vacina Brucelose', valor: 2.76, desc: 'Vacina Brucelose (fêmeas 8+ meses)' },
  DNA_VRGEN: { tipo: 'DNA', subtipo: 'DNA VRGEN', valor: 50.00, desc: 'DNA VRGEN (receptoras)' },
  DNA_GENOMICA_RECEPTORA: { tipo: 'DNA', subtipo: 'DNA Genômica Receptora', valor: 80.00, desc: 'DNA Genômica (receptoras sem genômica)' },
  BRINCO_AMARELO: { tipo: 'Manejo', subtipo: 'Brinco Amarelo', valor: 2.70, desc: 'Brinco amarelo de identificação' },
  BOTTON: { tipo: 'Manejo', subtipo: 'Botton Eletrônico', valor: 6.00, desc: 'Botton eletrônico' },
  ANDROLOGICO: { tipo: 'Exame', subtipo: 'Andrológico + Exames', valor: 165.00, desc: 'Exame andrológico e exames complementares (machos 15-32 meses)' }
}

function hoje() {
  return new Date().toISOString().split('T')[0]
}

async function animalJaTemCusto(animalId, tipo, subtipo) {
  const r = await query(
    `SELECT 1 FROM custos WHERE animal_id = $1 AND tipo = $2 AND subtipo = $3 LIMIT 1`,
    [animalId, tipo, subtipo]
  )
  return r.rows.length > 0
}

async function animalTemCustoDNA(animalId, subtipoContem) {
  const r = await query(
    `SELECT 1 FROM custos WHERE animal_id = $1 AND tipo = 'DNA' AND (subtipo ILIKE $2 OR observacoes ILIKE $2) LIMIT 1`,
    [animalId, `%${subtipoContem}%`]
  )
  return r.rows.length > 0
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const dryRun = req.body?.dryRun === true

  try {
    const resultados = {
      rgn: { aplicados: 0, pulados: 0 },
      rgd: { aplicados: 0, pulados: 0 },
      brucelose: { aplicados: 0, pulados: 0 },
      dnaVrgen: { aplicados: 0, pulados: 0 },
      dnaGenomicaReceptora: { aplicados: 0, pulados: 0 },
      brincoAmarelo: { aplicados: 0, pulados: 0 },
      botton: { aplicados: 0, pulados: 0 },
      andrologico: { aplicados: 0, pulados: 0 },
      erros: []
    }

    // 1. Animais com Situação ABCZ POSSUI RGN
    const rgnAnimais = await query(`
      SELECT id, serie, rg, situacao_abcz FROM animais
      WHERE situacao_abcz IS NOT NULL AND TRIM(situacao_abcz) != ''
        AND (UPPER(situacao_abcz) LIKE '%POSSUI RGN%' OR UPPER(situacao_abcz) LIKE '%POSSUEM RGN%')
        AND situacao = 'Ativo'
    `)

    for (const a of rgnAnimais.rows) {
      const jaTem = await animalJaTemCusto(a.id, CUSTOS.RGN.tipo, CUSTOS.RGN.subtipo)
      if (jaTem) {
        resultados.rgn.pulados++
        continue
      }
      if (!dryRun) {
        await databaseService.adicionarCusto(a.id, {
          tipo: CUSTOS.RGN.tipo,
          subtipo: CUSTOS.RGN.subtipo,
          valor: CUSTOS.RGN.valor,
          data: hoje(),
          observacoes: CUSTOS.RGN.desc
        })
      }
      resultados.rgn.aplicados++
    }

    // 2. Animais com Situação ABCZ POSSUI RGD
    const rgdAnimais = await query(`
      SELECT id, serie, rg, situacao_abcz FROM animais
      WHERE situacao_abcz IS NOT NULL AND TRIM(situacao_abcz) != ''
        AND (UPPER(situacao_abcz) LIKE '%POSSUI RGD%' OR UPPER(situacao_abcz) LIKE '%POSSUEM RGD%')
        AND situacao = 'Ativo'
    `)

    for (const a of rgdAnimais.rows) {
      const jaTem = await animalJaTemCusto(a.id, CUSTOS.RGD.tipo, CUSTOS.RGD.subtipo)
      if (jaTem) {
        resultados.rgd.pulados++
        continue
      }
      if (!dryRun) {
        await databaseService.adicionarCusto(a.id, {
          tipo: CUSTOS.RGD.tipo,
          subtipo: CUSTOS.RGD.subtipo,
          valor: CUSTOS.RGD.valor,
          data: hoje(),
          observacoes: CUSTOS.RGD.desc
        })
      }
      resultados.rgd.aplicados++
    }

    // 3. Fêmeas 8+ meses → Vacina Brucelose
    const femeas8m = await query(`
      SELECT id, serie, rg, sexo, data_nascimento, meses
      FROM animais
      WHERE situacao = 'Ativo'
        AND (UPPER(sexo) LIKE '%FÊMEA%' OR UPPER(sexo) LIKE '%FEMEA%' OR sexo = 'F')
        AND (
          (meses IS NOT NULL AND meses >= 8)
          OR (data_nascimento IS NOT NULL AND AGE(CURRENT_DATE, data_nascimento) >= INTERVAL '8 months')
        )
    `)

    for (const a of femeas8m.rows) {
      const jaTem = await animalJaTemCusto(a.id, CUSTOS.BRUCELOSE.tipo, CUSTOS.BRUCELOSE.subtipo)
      if (jaTem) {
        resultados.brucelose.pulados++
        continue
      }
      if (!dryRun) {
        await databaseService.adicionarCusto(a.id, {
          tipo: CUSTOS.BRUCELOSE.tipo,
          subtipo: CUSTOS.BRUCELOSE.subtipo,
          valor: CUSTOS.BRUCELOSE.valor,
          data: hoje(),
          observacoes: CUSTOS.BRUCELOSE.desc
        })
      }
      resultados.brucelose.aplicados++
    }

    // 4. Receptoras → DNA VRGEN R$ 50
    const receptoras = await query(`
      SELECT id, serie, rg, raca, receptora, laboratorio_dna
      FROM animais
      WHERE situacao = 'Ativo'
        AND (UPPER(COALESCE(raca, '')) LIKE '%RECEPTORA%'
             OR UPPER(COALESCE(receptora, '')) != ''
             OR UPPER(COALESCE(nome, '')) LIKE '%RECEPTORA%')
    `)

    for (const a of receptoras.rows) {
      const jaTemVrgen = await animalTemCustoDNA(a.id, 'VRGEN')
      const jaTemVirgem = await animalTemCustoDNA(a.id, 'Virgem')
      if (jaTemVrgen || jaTemVirgem) {
        resultados.dnaVrgen.pulados++
        continue
      }
      const jaTem = await animalJaTemCusto(a.id, CUSTOS.DNA_VRGEN.tipo, CUSTOS.DNA_VRGEN.subtipo)
      if (jaTem) {
        resultados.dnaVrgen.pulados++
        continue
      }
      if (!dryRun) {
        await databaseService.adicionarCusto(a.id, {
          tipo: CUSTOS.DNA_VRGEN.tipo,
          subtipo: CUSTOS.DNA_VRGEN.subtipo,
          valor: CUSTOS.DNA_VRGEN.valor,
          data: hoje(),
          observacoes: CUSTOS.DNA_VRGEN.desc
        })
      }
      resultados.dnaVrgen.aplicados++
    }

    // 5. Receptoras sem DNA Genômica → R$ 80
    for (const a of receptoras.rows) {
      const jaTemGenomica = await animalTemCustoDNA(a.id, 'Genômica')
      if (jaTemGenomica) {
        resultados.dnaGenomicaReceptora.pulados++
        continue
      }
      const jaTem = await animalJaTemCusto(a.id, CUSTOS.DNA_GENOMICA_RECEPTORA.tipo, CUSTOS.DNA_GENOMICA_RECEPTORA.subtipo)
      if (jaTem) {
        resultados.dnaGenomicaReceptora.pulados++
        continue
      }
      if (!dryRun) {
        await databaseService.adicionarCusto(a.id, {
          tipo: CUSTOS.DNA_GENOMICA_RECEPTORA.tipo,
          subtipo: CUSTOS.DNA_GENOMICA_RECEPTORA.subtipo,
          valor: CUSTOS.DNA_GENOMICA_RECEPTORA.valor,
          data: hoje(),
          observacoes: CUSTOS.DNA_GENOMICA_RECEPTORA.desc
        })
      }
      resultados.dnaGenomicaReceptora.aplicados++
    }

    // 6. Todos os animais → Brinco Amarelo R$ 2,70
    const todosAnimais = await query(`SELECT id FROM animais WHERE situacao = 'Ativo'`)
    for (const a of todosAnimais.rows) {
      const jaTem = await animalJaTemCusto(a.id, CUSTOS.BRINCO_AMARELO.tipo, CUSTOS.BRINCO_AMARELO.subtipo)
      if (jaTem) {
        resultados.brincoAmarelo.pulados++
        continue
      }
      if (!dryRun) {
        await databaseService.adicionarCusto(a.id, {
          tipo: CUSTOS.BRINCO_AMARELO.tipo,
          subtipo: CUSTOS.BRINCO_AMARELO.subtipo,
          valor: CUSTOS.BRINCO_AMARELO.valor,
          data: hoje(),
          observacoes: CUSTOS.BRINCO_AMARELO.desc
        })
      }
      resultados.brincoAmarelo.aplicados++
    }

    // 7. Todos os animais → Botton Eletrônico R$ 6,00
    for (const a of todosAnimais.rows) {
      const jaTem = await animalJaTemCusto(a.id, CUSTOS.BOTTON.tipo, CUSTOS.BOTTON.subtipo)
      if (jaTem) {
        resultados.botton.pulados++
        continue
      }
      if (!dryRun) {
        await databaseService.adicionarCusto(a.id, {
          tipo: CUSTOS.BOTTON.tipo,
          subtipo: CUSTOS.BOTTON.subtipo,
          valor: CUSTOS.BOTTON.valor,
          data: hoje(),
          observacoes: CUSTOS.BOTTON.desc
        })
      }
      resultados.botton.aplicados++
    }

    // 9. Machos 15-32 meses → Exame Andrológico + Exames R$ 165,00
    const machos1532 = await query(`
      SELECT id, serie, rg, sexo, meses, data_nascimento
      FROM animais
      WHERE situacao = 'Ativo'
        AND (UPPER(sexo) LIKE '%MACHO%' OR sexo = 'M')
        AND (
          (meses IS NOT NULL AND meses >= 15 AND meses <= 32)
          OR (data_nascimento IS NOT NULL AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, data_nascimento)) >= 15
              AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, data_nascimento)) <= 32)
        )
    `)

    for (const a of machos1532.rows) {
      const jaTem = await animalJaTemCusto(a.id, CUSTOS.ANDROLOGICO.tipo, CUSTOS.ANDROLOGICO.subtipo)
      if (jaTem) {
        resultados.andrologico.pulados++
        continue
      }
      if (!dryRun) {
        await databaseService.adicionarCusto(a.id, {
          tipo: CUSTOS.ANDROLOGICO.tipo,
          subtipo: CUSTOS.ANDROLOGICO.subtipo,
          valor: CUSTOS.ANDROLOGICO.valor,
          data: hoje(),
          observacoes: CUSTOS.ANDROLOGICO.desc
        })
      }
      resultados.andrologico.aplicados++
    }

    const totalAplicados =
      resultados.rgn.aplicados + resultados.rgd.aplicados +
      resultados.brucelose.aplicados + resultados.dnaVrgen.aplicados +
      resultados.dnaGenomicaReceptora.aplicados +
      resultados.brincoAmarelo.aplicados + resultados.botton.aplicados +
      resultados.andrologico.aplicados

    return res.status(200).json({
      success: true,
      dryRun,
      message: dryRun
        ? `Pré-visualização: ${totalAplicados} custos seriam aplicados`
        : `${totalAplicados} custos aplicados com sucesso`,
      resultados
    })
  } catch (error) {
    console.error('Erro ao aplicar custos automáticos:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
