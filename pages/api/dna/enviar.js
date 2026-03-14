import { pool, query } from '../../../lib/database'
import logger from '../../../utils/logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { animais_ids, laboratorio, data_envio, custo_por_animal, custo_total, observacoes, tipo_exame } = req.body

    console.log('ðÅ¸â€œâ€¹ Dados recebidos:', { 
      animais_ids, 
      laboratorio, 
      data_envio, 
      custo_por_animal, 
      custo_total,
      tipo_exame,
      tipo_animais_ids: Array.isArray(animais_ids) ? animais_ids.map(id => typeof id) : 'nÃ£o Ã© array'
    })

    if (!animais_ids || !Array.isArray(animais_ids) || animais_ids.length === 0) {
      return res.status(400).json({ message: 'Lista de animais Ã© obrigatÃ³ria' })
    }

    if (!laboratorio || !['VRGEN', 'NEOGEN'].includes(laboratorio)) {
      return res.status(400).json({ message: 'LaboratÃ³rio deve ser VRGEN ou NEOGEN' })
    }

    if (!data_envio) {
      return res.status(400).json({ message: 'Data de envio Ã© obrigatÃ³ria' })
    }

    // Garantir que os IDs sejam nÃºmeros
    const animaisIdsNumericos = animais_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
    
    if (animaisIdsNumericos.length === 0) {
      return res.status(400).json({ message: 'Nenhum ID de animal vÃ¡lido encontrado' })
    }

    // Verificar se as tabelas existem, se nÃ£o, criar (antes de iniciar transaÃ§Ã£o)
    try {
      await query('SELECT 1 FROM dna_envios LIMIT 1')
    } catch (error) {
      // Tabelas nÃ£o existem, criar
      const { createDNATables } = require('../../../scripts/create-dna-tables')
      await createDNATables()
    }

    const client = await pool.connect()
    
    try {
      // PRIMEIRO: Verificar quais animais existem ANTES de iniciar a transaÃ§Ã£o
      const animaisExistentes = []
      const animaisNaoEncontrados = []
      const animaisInfo = []
      
      console.log(`ðÅ¸â€�� Verificando existÃªncia de ${animaisIdsNumericos.length} animais antes de processar...`)
      
      for (const animalId of animaisIdsNumericos) {
        const animalCheck = await client.query(
          'SELECT id, serie, rg, nome, situacao FROM animais WHERE id = $1', 
          [animalId]
        )
        
        if (animalCheck.rows.length === 0) {
          console.warn(`â�Å’ Animal ${animalId} nÃ£o encontrado no banco de dados`)
          animaisNaoEncontrados.push(animalId)
          
          // Tentar buscar por sÃ©rie/RG caso o ID nÃ£o seja encontrado
          const buscaAlternativa = await client.query(
            `SELECT id, serie, rg, nome FROM animais 
             WHERE CAST(id AS TEXT) LIKE $1 
             OR serie LIKE $2 
             OR rg LIKE $2
             LIMIT 5`,
            [`%${animalId}%`, `%${animalId}%`]
          )
          
          if (buscaAlternativa.rows.length > 0) {
            console.log(`ðÅ¸â€™¡ SugestÃµes para ID ${animalId}:`, buscaAlternativa.rows.map(a => `${a.id} (${a.serie}-${a.rg})`))
          }
        } else {
          const animal = animalCheck.rows[0]
          animaisExistentes.push(animalId)
          animaisInfo.push({
            id: animal.id,
            serie: animal.serie,
            rg: animal.rg,
            nome: animal.nome,
            situacao: animal.situacao
          })
          console.log(`âÅ“â€¦ Animal ${animalId} encontrado: ${animal.serie}-${animal.rg} (${animal.nome || 'sem nome'})`)
        }
      }
      
      // Se nenhum animal foi encontrado, retornar erro antes de iniciar transaÃ§Ã£o
      if (animaisExistentes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum dos animais selecionados foi encontrado no banco de dados',
          animais_nao_encontrados: animaisNaoEncontrados,
          total_selecionados: animaisIdsNumericos.length
        })
      }
      
      // Se alguns animais nÃ£o foram encontrados, avisar mas continuar com os que existem
      if (animaisNaoEncontrados.length > 0) {
        console.warn(`âÅ¡ ï¸� ${animaisNaoEncontrados.length} animal(is) nÃ£o encontrado(s): ${animaisNaoEncontrados.join(', ')}`)
        console.log(`âÅ“â€¦ Processando ${animaisExistentes.length} animal(is) vÃ¡lido(s)`)
      }

      await client.query('BEGIN')

      // Criar registro de envio apenas com animais que existem
      const envioResult = await client.query(
        `INSERT INTO dna_envios 
         (laboratorio, data_envio, custo_por_animal, custo_total, observacoes, quantidade_animais, tipo_exame, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          laboratorio, 
          data_envio, 
          custo_por_animal, 
          animaisExistentes.length * custo_por_animal, // Custo total apenas dos animais existentes
          observacoes || null, 
          animaisExistentes.length,
          tipo_exame || null
        ]
      )

      const envioId = envioResult.rows[0].id

      // Atualizar cada animal com informaÃ§Ãµes de DNA (apenas os que existem)
      const animaisAtualizados = []
      
      for (const animalId of animaisExistentes) {
        const animal = animaisInfo.find(a => a.id === animalId)
        logger.info(`Processando animal ${animalId}: ${animal?.serie}-${animal?.rg} (${animal?.nome || 'sem nome'})`)

        // Buscar custo atual de DNA do animal
        const custoAtualResult = await client.query(
          'SELECT custo_dna FROM animais WHERE id = $1',
          [animalId]
        )
        const custoAtual = parseFloat(custoAtualResult.rows[0]?.custo_dna || 0)
        const novoCusto = custoAtual + custo_por_animal

        // Buscar laboratÃ³rios jÃ¡ registrados
        const labAtualResult = await client.query(
          'SELECT laboratorio_dna FROM animais WHERE id = $1',
          [animalId]
        )
        const labAtual = labAtualResult.rows[0]?.laboratorio_dna
        const novosLabs = labAtual && labAtual !== laboratorio 
          ? `${labAtual}, ${laboratorio}` 
          : laboratorio

        // Atualizar animal com informaÃ§Ãµes de DNA (acumulando custos e laboratÃ³rios)
        await client.query(
          `UPDATE animais 
           SET laboratorio_dna = $1, 
               data_envio_dna = $2,
               custo_dna = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [novosLabs, data_envio, novoCusto, animalId]
        )

        // Criar registro na tabela de relacionamento
        await client.query(
          `INSERT INTO dna_animais 
           (envio_id, animal_id, created_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)`,
          [envioId, animalId]
        )

        animaisAtualizados.push(animalId)
      }

      // Criar custo para cada animal
      for (const animalId of animaisAtualizados) {
        await client.query(
          `INSERT INTO custos 
           (animal_id, tipo, subtipo, valor, data, observacoes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            animalId,
            'DNA',
            'AnÃ¡lise GenÃ©tica',
            custo_por_animal,
            data_envio,
            `AnÃ¡lise de DNA - ${laboratorio}`
          ]
        )
      }

      await client.query('COMMIT')

      logger.info(`Envio de DNA criado: ${animaisAtualizados.length} animais para ${laboratorio}`)
      
      if (animaisNaoEncontrados.length > 0) {
        logger.warn(`${animaisNaoEncontrados.length} animal(is) nÃ£o encontrado(s): ${animaisNaoEncontrados.join(', ')}`)
      }

      const responseMessage = animaisNaoEncontrados.length > 0
        ? `${animaisAtualizados.length} animal(is) enviado(s) para ${laboratorio}. ${animaisNaoEncontrados.length} animal(is) nÃ£o encontrado(s) e foram ignorados: ${animaisNaoEncontrados.join(', ')}`
        : `${animaisAtualizados.length} animal(is) enviado(s) para ${laboratorio}`

      res.status(200).json({
        success: true,
        message: responseMessage,
        data: {
          envio_id: envioId,
          animais_atualizados: animaisAtualizados.length,
          animais_processados: animaisInfo.map(a => ({ id: a.id, serie: a.serie, rg: a.rg, nome: a.nome })),
          animais_nao_encontrados: animaisNaoEncontrados.length,
          animais_nao_encontrados_ids: animaisNaoEncontrados,
          custo_total: animaisAtualizados.length * custo_por_animal,
          custo_por_animal
        }
      })
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError)
      }
      throw error
    } finally {
      if (client) {
        client.release()
      }
    }
  } catch (error) {
    console.error('Erro ao enviar para laboratÃ³rio:', error)
    logger.error('Erro ao enviar DNA para laboratÃ³rio', error)
    res.status(500).json({ 
      message: 'Erro ao enviar para laboratÃ³rio', 
      error: error.message 
    })
  }
}
