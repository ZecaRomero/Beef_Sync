import { query } from '../../../lib/database'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { animal_id, data_inicio, data_fim } = req.query
      
      let sqlQuery = `
        SELECT 
          i.*,
          a.serie as animal_serie,
          a.rg as animal_rg,
          a.nome as animal_nome,
          a.tatuagem as animal_tatuagem,
          es.nome_touro as semen_nome_touro
        FROM inseminacoes i
        LEFT JOIN animais a ON i.animal_id = a.id
        LEFT JOIN estoque_semen es ON i.semen_id = es.id
        WHERE 1=1
      `
      const params = []
      let paramCount = 1

      if (animal_id) {
        sqlQuery += ` AND i.animal_id = $${paramCount}`
        params.push(animal_id)
        paramCount++
      }

      if (data_inicio) {
        sqlQuery += ` AND i.data_ia >= $${paramCount}`
        params.push(data_inicio)
        paramCount++
      }

      if (data_fim) {
        sqlQuery += ` AND i.data_ia <= $${paramCount}`
        params.push(data_fim)
        paramCount++
      }

      sqlQuery += ` ORDER BY i.data_ia DESC, i.created_at DESC`

      let result
      try {
        result = await query(sqlQuery, params)
      } catch (error) {
        // Se a tabela estoque_semen não existir (erro 42P01), tentar query simplificada
        if (error.code === '42P01') {
          console.warn('Tabela estoque_semen não encontrada, usando query simplificada')
          
          let simpleQuery = `
            SELECT 
              i.*,
              a.serie as animal_serie,
              a.rg as animal_rg,
              a.nome as animal_nome,
              a.tatuagem as animal_tatuagem
            FROM inseminacoes i
            LEFT JOIN animais a ON i.animal_id = a.id
            WHERE 1=1
          `
          // Recriar params para a nova query (embora sejam os mesmos, o paramCount precisa bater)
          // Na verdade, podemos reusar os params pois a ordem é a mesma
          
          if (animal_id) simpleQuery += ` AND i.animal_id = $1` // Assumindo ordem fixa se reusar params? Não, melhor reconstruir
          
          // Reconstruir a query simplificada com a mesma lógica de filtros
          simpleQuery = `
            SELECT 
              i.*,
              a.serie as animal_serie,
              a.rg as animal_rg,
              a.nome as animal_nome,
              a.tatuagem as animal_tatuagem
            FROM inseminacoes i
            LEFT JOIN animais a ON i.animal_id = a.id
            WHERE 1=1
          `
          // Reusar params e lógica de construção
          paramCount = 1
          const simpleParams = []
          
          if (animal_id) {
            simpleQuery += ` AND i.animal_id = $${paramCount}`
            simpleParams.push(animal_id)
            paramCount++
          }

          if (data_inicio) {
            simpleQuery += ` AND i.data_ia >= $${paramCount}`
            simpleParams.push(data_inicio)
            paramCount++
          }

          if (data_fim) {
            simpleQuery += ` AND i.data_ia <= $${paramCount}`
            simpleParams.push(data_fim)
            paramCount++
          }
          
          simpleQuery += ` ORDER BY i.data_ia DESC, i.created_at DESC`
          
          result = await query(simpleQuery, simpleParams)
        } else {
          throw error
        }
      }

      // Corrigir nomes de touro quando touro_nome/touro contém "PIQUETE" (local em vez de touro)
      const isPiquete = (v) => {
        if (!v || typeof v !== 'string') return false
        return /^PIQUETE\s*\d*$/i.test(v.trim()) || /^PIQ\s*\d*$/i.test(v.trim())
      }
      const rows = result.rows.map(row => {
        const touroAtual = row.touro_nome || row.touro || ''
        const semenNome = row.semen_nome_touro
        let touroExibir = touroAtual
        if (isPiquete(touroAtual) && semenNome) {
          touroExibir = semenNome
        } else if (!touroAtual && semenNome) {
          touroExibir = semenNome
        }
        const { semen_nome_touro, ...rest } = row
        return {
          ...rest,
          data_inseminacao: rest.data_ia || rest.data_inseminacao,
          touro_nome: touroExibir || touroAtual || null
        }
      })

      return res.status(200).json({
        success: true,
        data: rows
      })
    }

    if (req.method === 'POST') {
      const {
        animal_id,
        data_inseminacao,
        touro,
        semen_id,
        inseminador,
        tecnico,
        protocolo,
        observacoes,
        status_gestacao,
        custo_dose,
        numero_ia,
        rg_touro,
        numero_dg,
        data_dg,
        resultado_dg
      } = req.body

      if (!animal_id || !data_inseminacao) {
        return res.status(400).json({
          success: false,
          error: 'animal_id e data_inseminacao são obrigatórios'
        })
      }

      // Verificar se o animal existe e é fêmea
      const animalCheck = await query('SELECT id, sexo FROM animais WHERE id = $1', [animal_id])
      if (animalCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Animal não encontrado'
        })
      }

      if (animalCheck.rows[0].sexo !== 'Fêmea' && animalCheck.rows[0].sexo !== 'F') {
        return res.status(400).json({
          success: false,
          error: 'Apenas fêmeas podem ser inseminadas'
        })
      }

      // Valor padrão do custo por dose (R$ 18,00)
      const custoPorDose = parseFloat(custo_dose) || 18.00

      // Calcular numero_ia automaticamente se não fornecido
      let numeroIA = numero_ia ? parseInt(numero_ia) : null
      if (!numeroIA) {
        try {
          const countResult = await query(
            'SELECT COUNT(*) as total FROM inseminacoes WHERE animal_id = $1',
            [parseInt(animal_id)]
          )
          numeroIA = parseInt(countResult.rows[0].total) + 1
        } catch (countError) {
          console.error('Erro ao contar inseminações:', countError)
          numeroIA = 1 // Valor padrão
        }
      }

      // Validar data_inseminacao
      if (!data_inseminacao || data_inseminacao.toString().trim() === '' || data_inseminacao === 'null' || data_inseminacao === 'undefined') {
        return res.status(400).json({
          success: false,
          error: 'data_inseminacao é obrigatória e não pode estar vazia'
        })
      }

      // Validar formato da data
      const dataTest = new Date(data_inseminacao)
      if (isNaN(dataTest.getTime()) || data_inseminacao === 'Invalid Date') {
        return res.status(400).json({
          success: false,
          error: `data_inseminacao inválida: ${data_inseminacao}`
        })
      }
      
      // Validar se a data está em formato ISO válido (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data_inseminacao)) {
        return res.status(400).json({
          success: false,
          error: `data_inseminacao deve estar no formato YYYY-MM-DD: ${data_inseminacao}`
        })
      }

      // Garantir coluna valida e invalidar IAs anteriores da mesma fêmea
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS valida BOOLEAN DEFAULT true').catch(() => {})
      await query(`
        UPDATE inseminacoes 
        SET valida = false, status_gestacao = 'Vazia', 
            resultado_dg = COALESCE(NULLIF(TRIM(resultado_dg), ''), 'Vazia'),
            updated_at = CURRENT_TIMESTAMP
        WHERE animal_id = $1
      `, [parseInt(animal_id)])

      // Inserir inseminação
      let result
      try {
        result = await query(`
          INSERT INTO inseminacoes (
            animal_id,
            data_ia,
            touro_nome,
            tecnico,
            protocolo,
            observacoes,
            status_gestacao,
            custo_dose,
            numero_ia,
            touro_rg,
            data_dg,
            valida
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
          RETURNING *
        `, [
          parseInt(animal_id),
          data_inseminacao, // Já validado acima
          touro && touro.trim() ? touro.trim() : null,
          (tecnico && tecnico.trim()) || (inseminador && inseminador.trim()) || null,
          protocolo && protocolo.trim() ? protocolo.trim() : null,
          observacoes && observacoes.trim() ? observacoes.trim() : null,
          status_gestacao || resultado_dg || null,
          custoPorDose,
          numeroIA || null,
          rg_touro && rg_touro.trim() ? rg_touro.trim() : null,
          (data_dg && data_dg.trim() && data_dg !== 'null' && data_dg !== 'undefined' && data_dg !== 'Invalid Date') ? data_dg.trim() : null
        ])
      } catch (dbError) {
        console.error('Erro ao inserir inseminação no banco:', dbError)
        return res.status(500).json({
          success: false,
          error: 'Erro ao salvar inseminação no banco de dados',
          details: dbError.message
        })
      }

      const inseminacao = result.rows[0]

      // Criar custo automaticamente para a inseminação
      try {
        const custoResult = await query(`
          INSERT INTO custos (
            animal_id,
            tipo,
            subtipo,
            valor,
            data,
            observacoes,
            detalhes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          animal_id,
          'Reprodução',
          'Inseminação Artificial',
          custoPorDose,
          data_inseminacao,
          `IA - ${touro || 'Touro não informado'} - ${tecnico || inseminador || 'Técnico não informado'}`,
          JSON.stringify({
            inseminacao_id: inseminacao.id,
            touro: touro || null,
            protocolo: protocolo || null,
            tecnico: tecnico || inseminador || null
          })
        ])

        // Atualizar inseminação com o ID do custo
        await query(`
          UPDATE inseminacoes 
          SET custo_id = $1 
          WHERE id = $2
        `, [custoResult.rows[0].id, inseminacao.id])

        // Atualizar custo total do animal
        await query(`
          UPDATE animais 
          SET custo_total = (
            SELECT COALESCE(SUM(valor), 0) FROM custos WHERE animal_id = $1
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [animal_id])

        console.log('✅ Custo de R$', custoPorDose, 'registrado para a inseminação')
      } catch (custoError) {
        console.error('⚠️ Erro ao criar custo (inseminação registrada, mas custo não):', custoError)
        // Não falhar a inseminação se o custo falhar
      }

      // Se status_gestacao ou resultado_dg for 'prenha'/'positivo', criar gestação
      const resultadoPrenha = (
        (status_gestacao && (status_gestacao.toLowerCase() === 'prenha' || status_gestacao.toLowerCase() === 'prenhez')) ||
        (resultado_dg && (
          resultado_dg.toString().toUpperCase().includes('P') || 
          resultado_dg.toString().toUpperCase().includes('POSITIVO') ||
          resultado_dg.toString().toUpperCase().includes('PRENHA')
        ))
      )

      if (resultadoPrenha) {
        // Buscar dados do animal
        const animal = await query('SELECT serie, rg, nome FROM animais WHERE id = $1', [animal_id])
        if (animal.rows.length === 0) {
          console.warn('Animal não encontrado para criar gestação')
        } else {
          const animalData = animal.rows[0]

          // Buscar dados do touro se houver touro informado
          let pai_serie = 'N/A'
          let pai_rg = 'N/A'
          
          if (touro) {
            // Tentar buscar touro na tabela de animais
            const touroParts = touro.split(' ')
            if (touroParts.length >= 2) {
              pai_serie = touroParts[0]
              pai_rg = touroParts.slice(1).join(' ')
            }
          }

          // Verificar se já existe gestação para este animal nesta data
          const gestacaoExistente = await query(`
            SELECT id FROM gestacoes 
            WHERE receptora_serie = $1 
              AND receptora_rg = $2 
              AND data_cobertura = $3
            LIMIT 1
          `, [animalData.serie, animalData.rg, data_inseminacao])

          if (gestacaoExistente.rows.length === 0) {
            // Criar gestação
            await query(`
              INSERT INTO gestacoes (
                receptora_nome,
                receptora_serie,
                receptora_rg,
                pai_serie,
                pai_rg,
                data_cobertura,
                situacao,
                observacoes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              animalData.nome || `${animalData.serie} ${animalData.rg}`,
              animalData.serie,
              animalData.rg,
              pai_serie,
              pai_rg,
              data_inseminacao,
              'Em Gestação',
              `Gestação confirmada via IA - ${touro || 'Touro não informado'}`
            ])
            console.log('✅ Gestação criada automaticamente para animal', animalData.serie, animalData.rg)
          } else {
            console.log('Gestação já existe para este animal nesta data')
          }
        }
      }

      return res.status(201).json({
        success: true,
        data: inseminacao,
        message: 'Inseminação registrada com sucesso'
      })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (error) {
    console.error('Erro na API de inseminações:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar requisição',
      details: error.message
    })
  }
}
