import { Pool } from 'pg'

require('dotenv').config()

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const client = await pool.connect()

  try {
    // Corrigir sequência de custos se estiver desatualizada (evita erro custos_pkey)
    try {
      await client.query(`
        SELECT setval(
          pg_get_serial_sequence('custos', 'id'),
          COALESCE((SELECT MAX(id) FROM custos), 1)
        )
      `)
    } catch (seqErr) {
      console.warn('Aviso ao corrigir sequência custos:', seqErr.message)
    }

    // Buscar protocolo "ANDROLOGICO+EXAMES"
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

    let valorProtocolo = 165.00
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

    // Buscar todos os exames andrológicos que não têm custo criado
    const examesResult = await client.query(`
      SELECT e.*
      FROM exames_andrologicos e
      WHERE e.status = 'Ativo'
        AND NOT EXISTS (
          SELECT 1
          FROM custos c
          WHERE c.animal_id IN (
            SELECT id FROM animais WHERE rg = e.rg
          )
          AND c.tipo = 'Exame'
          AND c.subtipo = 'Andrológico'
          AND c.data = e.data_exame
          AND c.observacoes LIKE '%Exame ID: ' || e.id || '%'
        )
      ORDER BY e.data_exame DESC
    `)

    console.log(`📊 Encontrados ${examesResult.rows.length} exames sem custo`)

    let custosCriados = 0
    let erros = 0
    const errosDetalhes = []

    for (const exame of examesResult.rows) {
      try {
        // Buscar animal pelo RG
        const rgNormalizadoBusca = String(exame.rg || '').trim()
        
        let animalResult = await client.query(`
          SELECT id, serie, rg
          FROM animais
          WHERE CAST(rg AS TEXT) = $1
             OR CAST(rg AS TEXT) = TRIM($1)
             OR CAST(rg AS TEXT) = LTRIM($1, '0')
          ORDER BY id DESC
          LIMIT 1
        `, [rgNormalizadoBusca])

        // Se não encontrou, tentar busca mais ampla
        if (animalResult.rows.length === 0) {
          const rgNormalizado = String(exame.rg).replace(/[^0-9]/g, '')
          if (rgNormalizado.length > 0) {
            animalResult = await client.query(`
              SELECT id, serie, rg
              FROM animais
              WHERE CAST(rg AS TEXT) = $1
                 OR CAST(rg AS TEXT) LIKE $2
                 OR REPLACE(REPLACE(CAST(rg AS TEXT), '-', ''), ' ', '') = $3
              ORDER BY id DESC
              LIMIT 1
            `, [rgNormalizado, `%${rgNormalizado}%`, rgNormalizado])
          }
        }

        if (animalResult.rows.length === 0) {
          erros++
          errosDetalhes.push(`RG ${exame.rg} não encontrado`)
          continue
        }

        const animal = animalResult.rows[0]

        // Verificar se já existe custo para este exame
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
          continue // Já existe custo
        }

        // Criar custo
        await client.query(`
          INSERT INTO custos (
            animal_id,
            tipo,
            subtipo,
            valor,
            data,
            observacoes,
            detalhes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          animal.id,
          'Exame',
          'Andrológico',
          valorProtocolo,
          exame.data_exame,
          `Exame Andrológico - ${exame.touro || `RG: ${exame.rg}`} | Resultado: ${exame.resultado || 'Pendente'} | Exame ID: ${exame.id}`,
          JSON.stringify({
            exame_id: exame.id,
            protocolo: nomeProtocolo,
            touro: exame.touro,
            rg: exame.rg,
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

        custosCriados++
        console.log(`✅ Custo criado para animal ${animal.serie}-${animal.rg} (exame ID: ${exame.id})`)

      } catch (error) {
        erros++
        errosDetalhes.push(`Erro ao processar exame ID ${exame.id}: ${error.message}`)
        console.error(`❌ Erro ao criar custo para exame ${exame.id}:`, error)
      }
    }

    client.release()

    res.status(200).json({
      success: true,
      message: `Processamento concluído`,
      custosCriados,
      erros,
      totalExames: examesResult.rows.length,
      errosDetalhes: errosDetalhes.slice(0, 10) // Limitar a 10 erros
    })

  } catch (error) {
    client.release()
    console.error('Erro ao reprocessar custos:', error)
    res.status(500).json({ 
      error: error.message,
      success: false
    })
  }
}

