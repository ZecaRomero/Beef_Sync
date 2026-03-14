import { pool } from '../../../lib/database'
import { withLoteTracking, LOTE_CONFIGS } from '../../../utils/loteMiddleware'
import { asyncHandler, sendSuccess, sendError } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

// Função para calcular data de reagendamento (30 dias após o exame)
function calcularDataReagendamento(dataExame) {
  const data = new Date(dataExame)
  data.setDate(data.getDate() + 30)
  return data.toISOString().split('T')[0]
}

// Função auxiliar para buscar animal
async function findAnimal(client, rg, touro) {
    // Buscar animal pelo RG (tentando diferentes formatos)
    // Normalizar RG para busca (remover espaços e converter para string)
    const rgNormalizadoBusca = String(rg || '').trim()
    
    let animalResult = await client.query(`
      SELECT id, serie, rg
      FROM animais
      WHERE CAST(rg AS TEXT) = $1
         OR CAST(rg AS TEXT) = TRIM($1)
         OR CAST(rg AS TEXT) = LTRIM($1, '0')
      ORDER BY id DESC
      LIMIT 1
    `, [rgNormalizadoBusca])
    
    console.log(`🔍 Tentativa 1 - Busca exata: ${animalResult.rows.length} resultado(s)`)

    // Se não encontrou, tentar buscar pelo RG extraído do touro (formato SERIE-RG)
    if (animalResult.rows.length === 0 && touro) {
      // Tentar extrair RG do formato "SERIE-RG" ou "SERIERG"
      const rgExtraido = touro.split('-').pop() || touro.replace(/[^0-9]/g, '').slice(-5)
      
      if (rgExtraido && rgExtraido !== rg) {
        animalResult = await client.query(`
          SELECT id, serie, rg
          FROM animais
          WHERE rg = $1 OR rg = $2
          ORDER BY id DESC
          LIMIT 1
        `, [rg, rgExtraido])
      }
    }

    // Se ainda não encontrou, tentar buscar por parte do touro que contenha o RG
    if (animalResult.rows.length === 0 && touro) {
      // Tentar buscar animais onde o RG está contido no touro ou vice-versa
      animalResult = await client.query(`
        SELECT id, serie, rg
        FROM animais
        WHERE $1 LIKE '%' || CAST(rg AS TEXT) || '%'
           OR CAST(rg AS TEXT) LIKE '%' || $2 || '%'
        ORDER BY id DESC
        LIMIT 1
      `, [touro, rg])
    }

    // Última tentativa: buscar por qualquer correspondência parcial
    if (animalResult.rows.length === 0) {
      // Normalizar RG (remover caracteres não numéricos)
      const rgNormalizado = String(rg).replace(/[^0-9]/g, '')
      
      console.log(`🔍 Tentativa 4 - Busca parcial com RG normalizado: ${rgNormalizado}`)
      
      if (rgNormalizado.length > 0) {
        animalResult = await client.query(`
          SELECT id, serie, rg
          FROM animais
          WHERE CAST(rg AS TEXT) = $1
             OR CAST(rg AS TEXT) LIKE $2
             OR REPLACE(REPLACE(CAST(rg AS TEXT), '-', ''), ' ', '') = $3
             OR CAST(rg AS TEXT) LIKE $4
          ORDER BY id DESC
          LIMIT 1
        `, [rgNormalizado, `%${rgNormalizado}%`, rgNormalizado, `${rgNormalizado}%`])
        
        console.log(`🔍 Tentativa 4 - Resultado: ${animalResult.rows.length} animal(s) encontrado(s)`)
      }
    }

    // Última tentativa: buscar todos os animais e comparar manualmente
    if (animalResult.rows.length === 0) {
      console.log(`🔍 Tentativa 5 - Busca ampla em todos os animais`)
      const todosAnimais = await client.query(`
        SELECT id, serie, rg
        FROM animais
        ORDER BY id DESC
        LIMIT 100
      `)
      
      // Comparar manualmente
      const rgBusca = String(rg).trim().replace(/[^0-9]/g, '')
      const animalEncontrado = todosAnimais.rows.find(animal => {
        const rgAnimal = String(animal.rg || '').trim().replace(/[^0-9]/g, '')
        return rgAnimal === rgBusca || rgAnimal.endsWith(rgBusca) || rgBusca.endsWith(rgAnimal)
      })
      
      if (animalEncontrado) {
        animalResult = { rows: [animalEncontrado] }
        console.log(`✅ Animal encontrado na busca ampla: ${animalEncontrado.serie}-${animalEncontrado.rg}`)
      }
    }

    if (animalResult.rows.length === 0) {
      console.warn(`⚠️ Animal não encontrado para RG: ${rg}, Touro: ${touro || 'N/A'}`)
      return null
    }

    const animal = animalResult.rows[0]
    console.log(`✅ Animal encontrado: ${animal.serie}-${animal.rg} (ID: ${animal.id})`)
    return animal
}

// Função para criar ocorrência no histórico
async function criarOcorrenciaAndrologica(client, exame, rg, touro) {
  try {
    const animal = await findAnimal(client, rg, touro)
    if (!animal) return null

    // Verificar se já existe ocorrência
    const checkQuery = `
      SELECT id FROM historia_ocorrencias 
      WHERE animal_id = $1 AND tipo = 'Exame' AND data = $2 
      AND observacoes LIKE $3
    `
    const checkResult = await client.query(checkQuery, [
      animal.id, 
      exame.data_exame, 
      `%Exame ID: ${exame.id}%`
    ])

    if (checkResult.rows.length > 0) {
      console.log(`ℹ️ Ocorrência já existe para este exame (ID: ${exame.id})`)
      return checkResult.rows[0]
    }

    // Inserir ocorrência
    const insertQuery = `
      INSERT INTO historia_ocorrencias (
        animal_id, tipo, data, descricao, observacoes, veterinario, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `
    const observacoes = `Exame Andrológico - Touro: ${touro}. Resultado: ${exame.resultado}. CE: ${exame.ce || 'N/A'}. Defeitos: ${exame.defeitos || 'Nenhum'}. Obs: ${exame.observacoes || ''}. (Exame ID: ${exame.id})`
    
    const result = await client.query(insertQuery, [
      animal.id,
      'Exame',
      exame.data_exame,
      'Exame Andrológico',
      observacoes,
      'Sistema'
    ])

    console.log(`✅ Ocorrência criada para animal ${animal.serie}-${animal.rg}`)
    return result.rows[0]
  } catch (error) {
    console.error('Erro ao criar ocorrência:', error)
    // Não lançar erro para não bloquear o fluxo principal
    return null
  }
}

// Função auxiliar para criar custo do exame andrológico
async function criarCustoAndrologico(client, exame, rg, touro) {
  try {
    console.log(`🔍 Buscando animal para criar custo - RG: ${rg}, Touro: ${touro || 'N/A'}`)
    
    // Buscar protocolo "ANDROLOGICO+EXAMES" na tabela de medicamentos
    // Tentar buscar com diferentes estruturas de colunas
    let protocoloResult
    try {
      protocoloResult = await client.query(`
        SELECT id, nome, preco, unidade, por_animal
        FROM medicamentos
        WHERE UPPER(nome) LIKE '%ANDROLOGICO%EXAMES%' 
           OR UPPER(nome) = 'ANDROLOGICO+EXAMES'
           OR UPPER(nome) = 'ANDROLOGICO + EXAMES'
        ORDER BY id DESC
        LIMIT 1
      `)
    } catch (error) {
      // Se a coluna por_animal não existir, tentar sem ela
      try {
        protocoloResult = await client.query(`
          SELECT id, nome, preco, unidade
          FROM medicamentos
          WHERE UPPER(nome) LIKE '%ANDROLOGICO%EXAMES%' 
             OR UPPER(nome) = 'ANDROLOGICO+EXAMES'
             OR UPPER(nome) = 'ANDROLOGICO + EXAMES'
          ORDER BY id DESC
          LIMIT 1
        `)
      } catch (error2) {
        console.warn('Erro ao buscar protocolo:', error2.message)
        protocoloResult = { rows: [] }
      }
    }

    let valorProtocolo = 165.00 // Valor padrão se não encontrar o protocolo
    let nomeProtocolo = 'ANDROLOGICO+EXAMES'
    
    if (protocoloResult.rows.length > 0) {
      const protocolo = protocoloResult.rows[0]
      // Tentar diferentes campos para o valor
      valorProtocolo = parseFloat(
        protocolo.por_animal || 
        protocolo.preco || 
        protocolo.valor ||
        165.00
      )
      nomeProtocolo = protocolo.nome || 'ANDROLOGICO+EXAMES'
      console.log(`✅ Protocolo encontrado: ${nomeProtocolo} - Valor: R$ ${valorProtocolo.toFixed(2)}`)
    } else {
      console.log(`ℹ️ Protocolo não encontrado, usando valor padrão: R$ ${valorProtocolo.toFixed(2)}`)
    }

    const animal = await findAnimal(client, rg, touro)
    if (!animal) {
        console.warn(`⚠️ Animal não encontrado para RG: ${rg}, Touro: ${touro || 'N/A'}`)
        return null
    }

    // Verificar se já existe um custo para este exame (evitar duplicatas)
    const custoExistente = await client.query(`
      SELECT id
      FROM custos
      WHERE animal_id = $1
        AND tipo = 'Exame'
        AND subtipo = 'Andrológico'
        AND data = $2
        AND observacoes LIKE $3
      LIMIT 1
    `, [
      animal.id,
      exame.data_exame,
      `%Exame ID: ${exame.id}%`
    ])

    if (custoExistente.rows.length > 0) {
      console.log(`ℹ️ Custo já existe para este exame (ID: ${exame.id})`)
      return custoExistente.rows[0]
    }

    // Criar custo vinculado ao protocolo
    const custoResult = await client.query(`
      INSERT INTO custos (
        animal_id,
        tipo,
        subtipo,
        valor,
        data,
        observacoes,
        detalhes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      animal.id,
      'Exame',
      'Andrológico',
      valorProtocolo,
      exame.data_exame,
      `Exame Andrológico - ${touro || `RG: ${rg}`} | Resultado: ${exame.resultado || 'Pendente'} | Exame ID: ${exame.id}`,
      JSON.stringify({
        exame_id: exame.id,
        protocolo: nomeProtocolo,
        touro: touro,
        rg: rg,
        resultado: exame.resultado,
        ce: exame.ce,
        defeitos: exame.defeitos
      })
    ])

    // Atualizar custo total do animal (exclui custos com data futura)
    await client.query(`
      UPDATE animais
      SET custo_total = (
        SELECT COALESCE(SUM(valor), 0)
        FROM custos
        WHERE animal_id = $1
          AND (data IS NULL OR data <= CURRENT_DATE)
      )
      WHERE id = $1
    `, [animal.id])

    console.log(`✅ Custo criado automaticamente: R$ ${valorProtocolo.toFixed(2)} para animal ${animal.serie}-${animal.rg}`)
    return custoResult.rows[0]
  } catch (error) {
    console.error('❌ Erro ao criar custo do exame andrológico:', error)
    throw error
  }
}

// Função para criar exame reagendado automaticamente
async function criarExameReagendado(client, exameOriginal) {
  const dataReagendamento = calcularDataReagendamento(exameOriginal.data_exame)
  
  const defeitosInfo = exameOriginal.defeitos ? ` | Defeitos: ${exameOriginal.defeitos}` : '';
  // Evitar duplicar Obs se já estiver incluída
  const obsInfo = (exameOriginal.observacoes && !exameOriginal.observacoes.includes('Reagendamento')) ? ` | Obs: ${exameOriginal.observacoes}` : '';
  
  const novaObs = `Reagendamento automático.${defeitosInfo}${obsInfo} (Exame anterior: ${new Date(exameOriginal.data_exame).toLocaleDateString('pt-BR')})`;

  const result = await client.query(`
    INSERT INTO exames_andrologicos (
      touro, rg, data_exame, resultado, observacoes, 
      reagendado, exame_origem_id, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    exameOriginal.touro,
    exameOriginal.rg,
    dataReagendamento,
    'Pendente',
    novaObs,
    true,
    exameOriginal.id,
    'Ativo'
  ])

  return result.rows[0]
}

// Função para determinar a configuração de lote baseado no método HTTP
function getExameAndrologicoLoteConfig(req) {
  if (req.method === 'POST') {
    return LOTE_CONFIGS.CADASTRO_EXAME_ANDROLOGICO
  } else if (req.method === 'PUT') {
    return LOTE_CONFIGS.ATUALIZACAO_EXAME_ANDROLOGICO
  } else if (req.method === 'DELETE') {
    return LOTE_CONFIGS.EXCLUSAO_EXAME_ANDROLOGICO
  }
  return null // GET não precisa de lote
}

async function examesAndrologicosHandler(req, res) {
  if (req.method === 'GET') {
    const client = await pool.connect()
    try {
      // Verificar se a tabela existe, se não criar
      await client.query(`
        CREATE TABLE IF NOT EXISTS exames_andrologicos (
          id SERIAL PRIMARY KEY,
          touro VARCHAR(100) NOT NULL,
          rg VARCHAR(20) NOT NULL,
          data_exame DATE NOT NULL,
          resultado VARCHAR(30) NOT NULL CHECK (resultado IN ('Apto', 'Inapto', 'Pendente')),
          ce DECIMAL(5,2),
          defeitos TEXT,
          observacoes TEXT,
          data_reagendamento DATE,
          reagendado BOOLEAN DEFAULT FALSE,
          exame_origem_id INTEGER REFERENCES exames_andrologicos(id),
          status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Reagendado', 'Finalizado')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

        // Adicionar colunas se não existirem (para tabelas já criadas)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS ce DECIMAL(5,2);
        `)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS defeitos TEXT;
        `)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Ativo';
        `)
        // Adicionar coluna exame_origem_id sem constraint primeiro (para evitar erros)
        try {
          await client.query(`
            ALTER TABLE exames_andrologicos 
            ADD COLUMN IF NOT EXISTS exame_origem_id INTEGER;
          `)
          // Tentar adicionar constraint depois (pode falhar se já existir ou houver dados inválidos)
          try {
            await client.query(`
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_constraint 
                  WHERE conname = 'exames_andrologicos_exame_origem_id_fkey'
                ) THEN
                  ALTER TABLE exames_andrologicos 
                  ADD CONSTRAINT exames_andrologicos_exame_origem_id_fkey 
                  FOREIGN KEY (exame_origem_id) REFERENCES exames_andrologicos(id);
                END IF;
              END $$;
            `)
          } catch (constraintError) {
            console.warn('Não foi possível adicionar constraint de foreign key:', constraintError.message)
          }
        } catch (columnError) {
          console.warn('Erro ao adicionar coluna exame_origem_id:', columnError.message)
        }
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS reagendado BOOLEAN DEFAULT FALSE;
        `)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS data_reagendamento DATE;
        `)

        // Criar índices para busca rápida
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_exames_andrologicos_rg ON exames_andrologicos(rg);
          CREATE INDEX IF NOT EXISTS idx_exames_andrologicos_status ON exames_andrologicos(status);
          CREATE INDEX IF NOT EXISTS idx_exames_andrologicos_data ON exames_andrologicos(data_exame);
        `)

        // Verificar se há filtro por RG
        const { rg } = req.query
        // Normalizar RG para busca (remover espaços e hífens extras)
        const rgNormalizado = rg ? String(rg).trim().replace(/\s+/g, '') : null
        
        let result
        try {
          // Tentar fazer query com JOIN (para exames reagendados)
          if (rgNormalizado) {
            const queryParams = [
              rgNormalizado, 
              String(rgNormalizado).replace(/-/g, ''), 
              String(rgNormalizado).replace(/[^0-9]/g, '') // Apenas números
            ]
            result = await client.query(`
              SELECT 
                e.*,
                eo.data_exame as data_exame_original,
                eo.resultado as resultado_original,
                eo.defeitos as defeitos_originais
              FROM exames_andrologicos e
              LEFT JOIN exames_andrologicos eo ON e.exame_origem_id = eo.id
              WHERE (e.rg = $1 OR e.rg = $2 OR e.rg = $3)
              ORDER BY e.data_exame DESC, e.created_at DESC
            `, queryParams)
          } else {
            result = await client.query(`
              SELECT 
                e.*,
                eo.data_exame as data_exame_original,
                eo.resultado as resultado_original,
                eo.defeitos as defeitos_originais
              FROM exames_andrologicos e
              LEFT JOIN exames_andrologicos eo ON e.exame_origem_id = eo.id
              ORDER BY e.data_exame DESC, e.created_at DESC
            `)
          }
        } catch (joinError) {
          // Se o JOIN falhar (coluna não existe), fazer query simples
          logger.warn('Erro no JOIN, usando query simples:', joinError.message)
          if (rgNormalizado) {
            const queryParams = [
              rgNormalizado, 
              String(rgNormalizado).replace(/-/g, ''), 
              String(rgNormalizado).replace(/[^0-9]/g, '')
            ]
            result = await client.query(`
              SELECT *
              FROM exames_andrologicos
              WHERE (rg = $1 OR rg = $2 OR rg = $3)
              ORDER BY data_exame DESC, created_at DESC
            `, queryParams)
          } else {
            result = await client.query(`
              SELECT *
              FROM exames_andrologicos
              ORDER BY data_exame DESC, created_at DESC
            `)
          }
        }

      return sendSuccess(res, result.rows, 'Exames andrológicos recuperados com sucesso')
    } catch (error) {
      logger.error('Erro ao buscar exames:', error)
      return sendError(res, `Erro ao buscar exames: ${error.message}`, 500)
    } finally {
      if (client) {
        client.release()
      }
    }
  } else if (req.method === 'POST') {
    try {
      // Verificar se é uma ação de registro de notificação
      if (req.body.action === 'registrar_notificacao') {
        const { exame_ids } = req.body;
        if (!exame_ids || !Array.isArray(exame_ids) || exame_ids.length === 0) {
          return res.status(400).json({ error: 'Lista de IDs de exames inválida' });
        }

        const client = await pool.connect();
        try {
          await client.query(`
            UPDATE exames_andrologicos
            SET whatsapp_notificacoes = COALESCE(whatsapp_notificacoes, 0) + 1,
                ultima_notificacao_whatsapp = CURRENT_TIMESTAMP
            WHERE id = ANY($1::int[])
          `, [exame_ids]);

          return res.status(200).json({ message: 'Notificações registradas com sucesso' });
        } finally {
          client.release();
        }
      }

      const { touro, rg, data_exame, resultado, ce, defeitos, observacoes } = req.body

      if (!touro || !rg || !data_exame) {
        return res.status(400).json({ error: 'Campos obrigatórios: touro, rg, data_exame' })
      }

      // Validar e normalizar resultado - deve ser um dos valores permitidos
      // Se não fornecido, usar 'Apto' como padrão
      let resultadoValido = 'Apto' // Valor padrão
      
      console.log('=== API RECEBENDO DADOS ===')
      console.log('Resultado recebido:', resultado)
      console.log('Tipo:', typeof resultado)
      console.log('Valor como string:', String(resultado))
      console.log('Valor trimado:', String(resultado || '').trim())
      
      if (resultado !== null && resultado !== undefined && resultado !== '') {
        resultadoValido = String(resultado).trim()
        const resultadosValidos = ['Apto', 'Inapto', 'Pendente']
        
        console.log('Resultado após normalização:', resultadoValido)
        console.log('É válido?', resultadosValidos.includes(resultadoValido))
        
        if (!resultadosValidos.includes(resultadoValido)) {
          console.error('❌ Resultado inválido recebido:', {
            valor: resultadoValido,
            tipo: typeof resultado,
            original: resultado,
            charCodes: resultadoValido.split('').map(c => c.charCodeAt(0))
          })
          return res.status(400).json({ 
            error: `Resultado inválido: "${resultadoValido}". Valores permitidos: ${resultadosValidos.join(', ')}` 
          })
        }
      } else {
        console.warn('⚠️ Resultado não fornecido, usando padrão: Apto')
      }
      
      console.log('✅ Resultado final que será salvo:', resultadoValido)
      console.log('===============================')

      const client = await pool.connect()

      try {
        // Verificar se a tabela existe, se não criar
        await client.query(`
          CREATE TABLE IF NOT EXISTS exames_andrologicos (
            id SERIAL PRIMARY KEY,
            touro VARCHAR(100) NOT NULL,
            rg VARCHAR(20) NOT NULL,
            data_exame DATE NOT NULL,
            resultado VARCHAR(30) NOT NULL CHECK (resultado IN ('Apto', 'Inapto', 'Pendente')),
            ce DECIMAL(5,2),
            defeitos TEXT,
            observacoes TEXT,
            data_reagendamento DATE,
            reagendado BOOLEAN DEFAULT FALSE,
            exame_origem_id INTEGER REFERENCES exames_andrologicos(id),
            status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Reagendado', 'Finalizado')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)

        // Adicionar colunas se não existirem (para tabelas já criadas)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS ce DECIMAL(5,2);
        `)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS defeitos TEXT;
        `)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Ativo';
        `)

        // Criar índices para busca rápida
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_exames_andrologicos_rg ON exames_andrologicos(rg);
          CREATE INDEX IF NOT EXISTS idx_exames_andrologicos_status ON exames_andrologicos(status);
          CREATE INDEX IF NOT EXISTS idx_exames_andrologicos_data ON exames_andrologicos(data_exame);
        `)

        // Log antes de inserir no banco
        console.log('📝 Inserindo no banco:', {
          touro,
          rg,
          data_exame,
          resultado: resultadoValido,
          resultadoTipo: typeof resultadoValido,
          resultadoLength: resultadoValido.length,
          resultadoCharCodes: resultadoValido.split('').map(c => c.charCodeAt(0))
        })

        const result = await client.query(`
          INSERT INTO exames_andrologicos (touro, rg, data_exame, resultado, ce, defeitos, observacoes, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          touro, 
          rg, 
          data_exame, 
          resultadoValido, // Usar o valor validado
          ce ? parseFloat(ce) : null, 
          defeitos || null, 
          observacoes || null, 
          'Ativo'
        ])
        
        console.log('✅ Exame inserido com sucesso:', result.rows[0])

        const novoExame = result.rows[0]

        // Criar custo automaticamente vinculado ao protocolo "ANDROLOGICO+EXAMES"
        let custoCriado = null
        try {
          custoCriado = await criarCustoAndrologico(client, novoExame, rg, touro)
          if (custoCriado) {
            // Custo criado com sucesso - será atualizado na ficha automaticamente
            console.log('✅ Custo criado automaticamente para o exame:', custoCriado.id)
          }
        } catch (custoError) {
          console.error('⚠️ Erro ao criar custo do exame andrológico:', custoError)
          // Não falhar o processo se o custo não for criado
        }

        // Se o resultado for "Inapto", criar automaticamente um reagendamento
        if (resultadoValido === 'Inapto') {
          const exameReagendado = await criarExameReagendado(client, novoExame)
          
          // Atualizar o exame original para indicar que foi reagendado
          await client.query(`
            UPDATE exames_andrologicos 
            SET status = 'Reagendado', data_reagendamento = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [exameReagendado.data_exame, novoExame.id])

          // Gerar notificação sobre o reagendamento
          try {
            await client.query(`
              INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
              VALUES ($1, $2, $3, $4, $5)
            `, [
              'andrologico',
              '🔬 Novo Exame Andrológico Reagendado',
              `Touro ${novoExame.touro} (RG: ${novoExame.rg}) teve exame marcado como "Inapto". Novo exame agendado para ${new Date(exameReagendado.data_exame).toLocaleDateString('pt-BR')} (30 dias).`,
              'medium',
              JSON.stringify({
                exame_id: novoExame.id,
                exame_reagendado_id: exameReagendado.id,
                touro: novoExame.touro,
                rg: novoExame.rg,
                data_reagendamento: exameReagendado.data_exame
              })
            ])
          } catch (notifError) {
            console.error('Erro ao criar notificação:', notifError)
            // Não falhar o processo se a notificação não for criada
          }

          client.release()
          res.status(201).json({
            exame: novoExame,
            reagendamento: exameReagendado,
            message: `Exame registrado. Como o resultado foi "Inapto", um novo exame foi automaticamente agendado para ${new Date(exameReagendado.data_exame).toLocaleDateString('pt-BR')}.`
          })
        } else {
          client.release()
          res.status(201).json({ exame: novoExame })
        }
      } catch (error) {
        client.release()
        throw error
      }
    } catch (error) {
      console.error('Erro ao salvar exame:', error)
      res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query
      const { touro, rg, data_exame, resultado, ce, defeitos, observacoes } = req.body

      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório' })
      }

      // Validar resultado - deve ser um dos valores permitidos
      if (resultado) {
        const resultadosValidos = ['Apto', 'Inapto', 'Pendente']
        if (!resultadosValidos.includes(resultado)) {
          return res.status(400).json({ 
            error: `Resultado inválido. Valores permitidos: ${resultadosValidos.join(', ')}` 
          })
        }
      }

      // Converter ID para inteiro (caso venha como string do localStorage)
      const exameId = parseInt(id)
      if (isNaN(exameId) || exameId <= 0) {
        return res.status(400).json({ error: 'ID inválido' })
      }

      const client = await pool.connect()

      try {
        // Adicionar colunas se não existirem (para tabelas já criadas)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS ce DECIMAL(5,2);
        `)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS defeitos TEXT;
        `)
        await client.query(`
          ALTER TABLE exames_andrologicos 
          ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Ativo';
        `)

        // Buscar o exame atual
        const exameAtual = await client.query(`
          SELECT * FROM exames_andrologicos WHERE id = $1
        `, [exameId])

        if (exameAtual.rows.length === 0) {
          client.release()
          return res.status(404).json({ error: 'Exame não encontrado' })
        }

        const exame = exameAtual.rows[0]
        const resultadoAnterior = exame.resultado

        // Validar resultado se fornecido
        let resultadoValidoUpdate = resultado
        if (resultado) {
          resultadoValidoUpdate = String(resultado).trim()
          const resultadosValidos = ['Apto', 'Inapto', 'Pendente']
          if (!resultadosValidos.includes(resultadoValidoUpdate)) {
            client.release()
            return res.status(400).json({ 
              error: `Resultado inválido: "${resultadoValidoUpdate}". Valores permitidos: ${resultadosValidos.join(', ')}` 
            })
          }
        }

        // Atualizar o exame
        const result = await client.query(`
          UPDATE exames_andrologicos 
          SET touro = $1, rg = $2, data_exame = $3, resultado = $4, ce = $5, defeitos = $6, observacoes = $7, updated_at = CURRENT_TIMESTAMP
          WHERE id = $8
          RETURNING *
        `, [
          touro, 
          rg, 
          data_exame, 
          resultadoValidoUpdate, // Usar o valor validado
          ce ? parseFloat(ce) : null, 
          defeitos || null, 
          observacoes || null, 
          exameId
        ])

        const exameAtualizado = result.rows[0]

        // Atualizar/Criar ocorrência no histórico geral
        try {
          await criarOcorrenciaAndrologica(client, exameAtualizado, rg, touro)
        } catch (occError) {
          console.error('⚠️ Erro ao criar ocorrência na atualização:', occError)
        }

        // Se o resultado mudou de "Pendente" ou "Apto" para "Inapto", criar reagendamento
        if (resultadoAnterior !== 'Inapto' && resultadoValidoUpdate === 'Inapto') {
          const exameReagendado = await criarExameReagendado(client, exameAtualizado)
          
          await client.query(`
            UPDATE exames_andrologicos 
            SET status = 'Reagendado', data_reagendamento = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [exameReagendado.data_exame, exameId])

          client.release()
          res.status(200).json({
            exame: exameAtualizado,
            reagendamento: exameReagendado,
            message: `Exame atualizado. Como o resultado foi alterado para "Inapto", um novo exame foi automaticamente agendado para ${new Date(exameReagendado.data_exame).toLocaleDateString('pt-BR')}.`
          })
        } 
        // Se o resultado já era Inapto e continuou Inapto, mas houve alteração em defeitos ou observações,
        // atualizar o reagendamento existente para refletir as novas informações
        else if (resultadoValidoUpdate === 'Inapto' && (defeitos || observacoes)) {
          // Buscar reagendamento existente
          const reagendamentoExistente = await client.query(`
            SELECT * FROM exames_andrologicos 
            WHERE exame_origem_id = $1
          `, [exameId])

          if (reagendamentoExistente.rows.length > 0) {
            const reagendado = reagendamentoExistente.rows[0];
            const defeitosInfo = defeitos ? ` | Defeitos: ${defeitos}` : '';
            const obsInfo = (observacoes && !observacoes.includes('Reagendamento')) ? ` | Obs: ${observacoes}` : '';
            const novaObs = `Reagendamento automático.${defeitosInfo}${obsInfo} (Exame anterior: ${new Date(exameAtualizado.data_exame).toLocaleDateString('pt-BR')})`;
            
            await client.query(`
              UPDATE exames_andrologicos 
              SET observacoes = $1
              WHERE id = $2
            `, [novaObs, reagendado.id]);
          } else {
             // Caso não exista reagendamento (por algum erro anterior), criar agora
             const exameReagendado = await criarExameReagendado(client, exameAtualizado)
             await client.query(`
               UPDATE exames_andrologicos 
               SET status = 'Reagendado', data_reagendamento = $1, updated_at = CURRENT_TIMESTAMP
               WHERE id = $2
             `, [exameReagendado.data_exame, exameId])
          }

          client.release()
          res.status(200).json({ exame: exameAtualizado })
        } else {
          client.release()
          res.status(200).json({ exame: exameAtualizado })
        }
      } catch (error) {
        client.release()
        throw error
      }
    } catch (error) {
      console.error('Erro ao atualizar exame:', error)
      res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório' })
      }

      const client = await pool.connect()

      try {
        // Verificar se existem exames reagendados vinculados
        const reagendados = await client.query(`
          SELECT id FROM exames_andrologicos WHERE exame_origem_id = $1
        `, [id])

        // Deletar exames reagendados primeiro
        if (reagendados.rows.length > 0) {
          await client.query(`
            DELETE FROM exames_andrologicos WHERE exame_origem_id = $1
          `, [id])
        }

        // Deletar o exame principal
        const result = await client.query(`
          DELETE FROM exames_andrologicos WHERE id = $1 RETURNING *
        `, [id])

        client.release()
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Exame não encontrado' })
        }

        res.status(200).json({ 
          message: 'Exame deletado com sucesso',
          reagendamentosRemovidos: reagendados.rows.length
        })
      } catch (error) {
        client.release()
        throw error
      }
    } catch (error) {
      console.error('Erro ao deletar exame:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    res.status(405).json({ error: `Método ${req.method} não permitido` })
  }
}

// Exportar handler com middleware de lotes aplicado
export const config = { api: { externalResolver: true } }
export default asyncHandler((req, res) => {
  // GET não precisa de tracking de lotes
  if (req.method === 'GET') {
    return examesAndrologicosHandler(req, res)
  }
  
  // Para outros métodos, aplicar tracking de lotes
  return withLoteTracking(examesAndrologicosHandler, getExameAndrologicoLoteConfig)(req, res)
})