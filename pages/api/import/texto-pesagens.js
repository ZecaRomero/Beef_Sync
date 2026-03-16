const databaseService = require('../../../services/databaseService').default || require('../../../services/databaseService')
const { pool, createTablesIfNotExist } = require('../../../lib/database')
const { blockIfNotZecaDeveloper } = require('../../../utils/importAccess')

export const config = { maxDuration: 300 }

const TAMANHO_LOTE = 80
const DEFAULTS_ANIMAL_IMPORT = {
  sexo: 'Macho',
  raca: 'NÃ£o informado',
  boletim: '1',
  pasto_atual: 'A definir',
  situacao: 'Ativo',
  observacoes: 'Animal criado via importaÃ§Ã£o de pesagens. Complete o cadastro (data de nascimento, sexo, raÃ§a, etc.) em Animais.'
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'MÃ©todo nÃ£o permitido' })
    }

    const blocked = blockIfNotZecaDeveloper(req, res)
    if (blocked) return blocked

    // (createTablesIfNotExist removido — tabelas criadas automaticamente no primeiro uso)

    const { pesagens = [], pendentes = [], criarAnimaisAusentes = false } = req.body || {}
    const todasPesagens = [...pesagens]

    let animaisCriados = 0
    let mapaAnimais = {}
    if (criarAnimaisAusentes && pendentes.length > 0) {
      const animaisExistentes = await databaseService.buscarAnimais({})
      for (const a of animaisExistentes || []) {
        const k = `${(a.serie || '').toString().trim().toLowerCase()}-${(a.rg || '').toString().trim().toLowerCase()}`
        if (k && k !== '-') mapaAnimais[k] = a
      }
      const animaisCache = { ...mapaAnimais }
      for (const p of pendentes) {
        const chave = `${(p.serie || '').toString().trim().toLowerCase()}-${(p.rg || '').toString().trim().toLowerCase()}`
        if (!chave || chave === '-') continue
        let animal = animaisCache[chave]
        if (!animal) {
          try {
            const sexoDoArquivo = (p.sexo === 'FÃªmea' || p.sexo === 'Macho') ? p.sexo : DEFAULTS_ANIMAL_IMPORT.sexo
            const novoAnimal = await databaseService.criarAnimal({
              nome: null,
              serie: (p.serie || '').toString().trim(),
              rg: (p.rg || '').toString().trim(),
              tatuagem: null,
              sexo: sexoDoArquivo,
              raca: DEFAULTS_ANIMAL_IMPORT.raca,
              data_nascimento: null,
              hora_nascimento: null,
              peso: null,
              cor: null,
              tipo_nascimento: null,
              dificuldade_parto: null,
              meses: null,
              situacao: DEFAULTS_ANIMAL_IMPORT.situacao,
              pai: null, mae: null, avo_materno: null, receptora: null,
              is_fiv: false, custo_total: 0, valor_venda: null, valor_real: null,
              veterinario: null, abczg: null, deca: null,
              observacoes: DEFAULTS_ANIMAL_IMPORT.observacoes,
              boletim: DEFAULTS_ANIMAL_IMPORT.boletim,
              local_nascimento: null,
              pasto_atual: DEFAULTS_ANIMAL_IMPORT.pasto_atual,
              serie_pai: null, rg_pai: null, serie_mae: null, rg_mae: null
            })
            if (novoAnimal._duplicateMessage) {
              animal = mapaAnimais[chave] || novoAnimal
            } else {
              animal = novoAnimal
              animaisCriados++
              mapaAnimais[chave] = novoAnimal
            }
          } catch (err) {
            if (err.code === '23505') {
              animal = mapaAnimais[chave]
              if (!animal) {
                const recheck = await databaseService.buscarAnimais({ serie: p.serie?.trim(), rg: p.rg?.toString().trim() })
                animal = recheck?.length > 0 ? recheck[0] : null
              }
            }
            if (!animal) {
              console.error('Erro ao criar animal:', err)
              continue
            }
          }
          animaisCache[chave] = animal
        }
        if (animal && animal.id) {
          todasPesagens.push({
            animal_id: animal.id,
            animal: `${animal.serie} - ${animal.rg}`,
            animal_sexo: animal.sexo,
            peso: parseFloat(p.peso) || 0,
            ce: p.ce ? parseFloat(p.ce) : null,
            data: p.data || new Date().toISOString().split('T')[0],
            observacoes: p.observacoes || null
          })
        }
      }
    }

    if (todasPesagens.length === 0) {
      return res.status(400).json({ error: 'Nenhuma pesagem para importar' })
    }

    let client
    try {
      client = await pool.connect()
    } catch (connErr) {
      console.error('Erro ao conectar no banco:', connErr)
      return res.status(500).json({ error: 'Erro de conexÃ£o com o banco de dados' })
    }

    try {
      await client.query('BEGIN')

      let importados = 0
      const erros = []
      for (let i = 0; i < todasPesagens.length; i += TAMANHO_LOTE) {
        const lote = todasPesagens.slice(i, i + TAMANHO_LOTE)
        const valores = []
        const params = []
        let idx = 1
        for (const pesagem of lote) {
          valores.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, NOW(), NOW())`)
          params.push(
            pesagem.animal_id,
            pesagem.peso ?? 0,
            pesagem.ce,
            pesagem.data || new Date().toISOString().split('T')[0],
            pesagem.observacoes || null
          )
          idx += 5
        }
        try {
          await client.query(
            `INSERT INTO pesagens (animal_id, peso, ce, data, observacoes, created_at, updated_at)
             VALUES ${valores.join(', ')}`,
            params
          )
          importados += lote.length
        } catch (error) {
          for (const pesagem of lote) {
            try {
              await client.query(
                `INSERT INTO pesagens (animal_id, peso, ce, data, observacoes, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                [pesagem.animal_id, pesagem.peso ?? 0, pesagem.ce, pesagem.data, pesagem.observacoes || null]
              )
              importados++
            } catch (e) {
              erros.push({ animal: pesagem.animal || pesagem.animal_id, erro: e.message })
            }
          }
        }
      }

      const porAnimal = {}
      todasPesagens.forEach(p => {
        const aid = p.animal_id
        const data = p.data || ''
        if (!porAnimal[aid] || (porAnimal[aid].data || '') < data) {
          porAnimal[aid] = p
        }
      })
      for (const [animalId, p] of Object.entries(porAnimal)) {
        try {
          await client.query(
            'UPDATE animais SET peso = $1, updated_at = NOW() WHERE id = $2',
            [p.peso ?? 0, animalId]
          )
        } catch (e) {
          console.warn('Erro ao atualizar peso do animal', animalId, e.message)
        }
      }

      await client.query('COMMIT')

      return res.status(200).json({
      success: true,
      importados,
      criados: animaisCriados,
      erros: erros.length,
      detalhesErros: erros,
      pesagens: todasPesagens.map((p, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        ...p,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    })

    } catch (error) {
      try { await client?.query('ROLLBACK') } catch (_) {}
      try { client?.release() } catch (_) {}
      console.error('Erro na importaÃ§Ã£o:', error)
      return res.status(500).json({ error: 'Erro ao importar pesagens: ' + (error.message || 'Erro interno') })
    } finally {
      try { client?.release() } catch (_) {}
    }
  } catch (outerError) {
    console.error('Erro fatal texto-pesagens:', outerError)
    return res.status(500).json({ error: 'Erro ao importar: ' + (outerError.message || 'Erro interno do servidor') })
  }
}

