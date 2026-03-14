import { Pool } from 'pg'
import { 
  sendSuccess, 
  sendValidationError, 
  sendMethodNotAllowed, 
  asyncHandler, 
  HTTP_STATUS 
} from '../../../utils/apiResponse'
import { criarLoteManual } from '../../../utils/loteMiddleware'

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
})

export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  const { receptoras, usuario = 'sistema' } = req.body

  if (!receptoras || !Array.isArray(receptoras) || receptoras.length === 0) {
    return sendValidationError(res, 'Lista de receptoras é obrigatória e deve conter pelo menos uma receptora')
  }

  // Validar cada receptora
  for (let i = 0; i < receptoras.length; i++) {
    const receptora = receptoras[i]
    if (!receptora.brinco || !receptora.raca) {
      return sendValidationError(res, `Receptora ${i + 1}: Brinco e raça são obrigatórios`, {
        required: ['brinco', 'raca'],
        receptora_index: i + 1
      })
    }
  }

  let lote = null
  const resultados = {
    sucessos: [],
    erros: [],
    total_processados: 0,
    total_sucessos: 0,
    total_erros: 0
  }

  const client = await pool.connect()

  try {
    // Criar lote ANTES de processar as receptoras
    lote = await criarLoteManual({
      tipo_operacao: 'CADASTRO_RECEPTORAS',
      descricao: `Cadastro em lote de ${receptoras.length} receptoras`,
      detalhes: {
        quantidade_receptoras: receptoras.length,
        tipos_raca: [...new Set(receptoras.map(r => r.raca))],
        preview_brincos: receptoras.slice(0, 10).map(r => r.brinco),
        origem_dados: 'cadastro_lote_api'
      },
      usuario,
      quantidade_registros: receptoras.length,
      modulo: 'RECEPTORAS',
      req
    })

    console.log(`🚀 Iniciando processamento do lote ${lote.numero_lote} com ${receptoras.length} receptoras`)

    // Verificar se a tabela de receptoras existe, se não, criar
    await client.query(`
      CREATE TABLE IF NOT EXISTS receptoras (
        id SERIAL PRIMARY KEY,
        brinco VARCHAR(50) UNIQUE NOT NULL,
        raca VARCHAR(100) NOT NULL,
        idade INTEGER,
        peso DECIMAL(10,2),
        condicao_corporal INTEGER CHECK (condicao_corporal >= 1 AND condicao_corporal <= 5),
        status VARCHAR(20) DEFAULT 'Disponível',
        observacoes TEXT,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_ultima_utilizacao TIMESTAMP,
        numero_utilizacoes INTEGER DEFAULT 0,
        proprietario VARCHAR(100),
        localizacao VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Processar cada receptora
    for (let i = 0; i < receptoras.length; i++) {
      const receptoraData = receptoras[i]
      resultados.total_processados++

      try {
        const query = `
          INSERT INTO receptoras (
            brinco, raca, idade, peso, condicao_corporal, 
            status, observacoes, proprietario, localizacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `

        const values = [
          receptoraData.brinco,
          receptoraData.raca,
          receptoraData.idade || null,
          receptoraData.peso || null,
          receptoraData.condicao_corporal || null,
          receptoraData.status || 'Disponível',
          receptoraData.observacoes || `Cadastrada via lote ${lote.numero_lote}`,
          receptoraData.proprietario || null,
          receptoraData.localizacao || null
        ]

        const result = await client.query(query, values)
        const receptora = result.rows[0]
        
        resultados.sucessos.push({
          index: i + 1,
          receptora_id: receptora.id,
          brinco: receptora.brinco,
          receptora: receptora
        })
        resultados.total_sucessos++

        console.log(`✅ Receptora ${i + 1}/${receptoras.length} criada: ${receptora.brinco}`)

      } catch (error) {
        resultados.erros.push({
          index: i + 1,
          brinco: receptoraData.brinco,
          erro: error.message,
          codigo_erro: error.code || 'UNKNOWN'
        })
        resultados.total_erros++

        console.error(`❌ Erro na receptora ${i + 1}/${receptoras.length} (${receptoraData.brinco}): ${error.message}`)
      }
    }

    // Atualizar o lote com os resultados finais
    try {
      await atualizarLoteComResultados(lote.numero_lote, resultados, client)
    } catch (updateError) {
      console.error(`Erro ao atualizar lote: ${updateError.message}`)
    }

    const mensagem = `Processamento do lote ${lote.numero_lote} concluído: ${resultados.total_sucessos} sucessos, ${resultados.total_erros} erros`
    
    console.log(`🎉 ${mensagem}`)

    return sendSuccess(res, {
      lote: lote.numero_lote,
      resultados,
      resumo: {
        total_processados: resultados.total_processados,
        total_sucessos: resultados.total_sucessos,
        total_erros: resultados.total_erros,
        taxa_sucesso: ((resultados.total_sucessos / resultados.total_processados) * 100).toFixed(2) + '%'
      }
    }, mensagem, HTTP_STATUS.CREATED)

  } catch (error) {
    // Se houve erro geral, atualizar o lote como erro
    if (lote) {
      try {
        await atualizarLoteComErro(lote.numero_lote, error.message, client)
      } catch (updateError) {
        console.error(`Erro ao atualizar lote com erro: ${updateError.message}`)
      }
    }

    throw error
  } finally {
    client.release()
  }
})

// Função auxiliar para atualizar o lote com os resultados
async function atualizarLoteComResultados(numeroLote, resultados, client) {
  const status = resultados.total_erros > 0 ? 'parcial' : 'concluido'
  
  await client.query(`
    UPDATE lotes_operacoes 
    SET 
      detalhes = detalhes || $1,
      status = $2,
      quantidade_registros = $3
    WHERE numero_lote = $4
  `, [
    JSON.stringify({
      resultados_finais: {
        total_processados: resultados.total_processados,
        total_sucessos: resultados.total_sucessos,
        total_erros: resultados.total_erros,
        taxa_sucesso: ((resultados.total_sucessos / resultados.total_processados) * 100).toFixed(2) + '%',
        erros: resultados.erros.slice(0, 10) // Limitar erros salvos
      }
    }),
    status,
    resultados.total_sucessos,
    numeroLote
  ])
}

// Função auxiliar para marcar lote como erro
async function atualizarLoteComErro(numeroLote, mensagemErro, client) {
  await client.query(`
    UPDATE lotes_operacoes 
    SET 
      detalhes = detalhes || $1,
      status = 'erro'
    WHERE numero_lote = $2
  `, [
    JSON.stringify({
      erro_geral: {
        mensagem: mensagemErro,
        timestamp: new Date().toISOString()
      }
    }),
    numeroLote
  ])
}