#!/usr/bin/env node

/**
 * Script para vincular transferÃªncias de embriÃµes com nascimentos esperados
 * e gerar alertas para receptoras que nÃ£o pariram na data esperada
 */

const { query } = require('../lib/database')

async function vincularTENascimentos() {
  console.log('ðÅ¸â€�â€” Vinculando TransferÃªncias de EmbriÃµes com Nascimentos Esperados...\n')

  try {
    // 1. Buscar todas as transferÃªncias de embriÃµes com data_te = 01/10/2025
    console.log('1. Buscando transferÃªncias de embriÃµes de 01/10/2025:')
    const transferencias = await query(`
      SELECT id, numero_te, data_te, receptora_nome, doadora_nome, touro, status, sexo_prenhez
      FROM transferencias_embrioes 
      WHERE data_te = '2025-10-01'
      ORDER BY id
    `)
    
    console.log(`   âÅ“â€¦ Encontradas ${transferencias.rows.length} transferÃªncia(s)\n`)

    if (transferencias.rows.length === 0) {
      console.log('   âÅ¡ ï¸�  Nenhuma transferÃªncia encontrada para a data 01/10/2025')
      return
    }

    // 2. Para cada transferÃªncia, calcular data esperada de parto (9 meses = ~276 dias)
    const dataTE = new Date('2025-10-01')
    const dataEsperadaParto = new Date(dataTE)
    dataEsperadaParto.setDate(dataEsperadaParto.getDate() + 276) // 9 meses = ~276 dias
    
    console.log(`2. Data da TE: ${dataTE.toLocaleDateString('pt-BR')}`)
    console.log(`   Data esperada de parto: ${dataEsperadaParto.toLocaleDateString('pt-BR')}\n`)

    // 3. Verificar se jÃ¡ existem gestaÃ§Ãµes criadas para essas transferÃªncias
    let gestacoesCriadas = 0
    let gestacoesExistentes = 0
    let nascimentosEncontrados = 0
    let alertasGerados = 0

    for (const te of transferencias.rows) {
      console.log(`   Processando TE ${te.numero_te}:`)
      console.log(`      Receptora: ${te.receptora_nome}`)
      console.log(`      Doadora: ${te.doadora_nome}`)
      console.log(`      Touro: ${te.touro}`)

      // Extrair sÃ©rie e RG da receptora (formato "G 3028" ou "G-3028")
      const receptoraMatch = te.receptora_nome.match(/G\s*[-]?\s*(\d+)/i)
      const receptoraRG = receptoraMatch ? receptoraMatch[1] : null

      if (!receptoraRG) {
        console.log(`      âÅ¡ ï¸�  NÃ£o foi possÃ­vel extrair RG da receptora: ${te.receptora_nome}`)
        continue
      }

      // Buscar animal receptora no banco (opcional - pode ser receptora externa)
      const receptoraAnimal = await query(`
        SELECT id, serie, rg, nome, sexo
        FROM animais 
        WHERE serie = 'G' AND rg = $1
        ORDER BY id DESC
        LIMIT 1
      `, [receptoraRG])

      let receptora = null
      if (receptoraAnimal.rows.length > 0) {
        receptora = receptoraAnimal.rows[0]
        console.log(`      âÅ“â€¦ Receptora encontrada: ID ${receptora.id}, ${receptora.serie} ${receptora.rg}`)
      } else {
        console.log(`      ââ€ž¹ï¸�  Receptora G ${receptoraRG} nÃ£o cadastrada (receptora externa)`)
      }

      // Verificar se jÃ¡ existe gestaÃ§Ã£o para esta TE
      const gestacaoExistente = await query(`
        SELECT id, situacao, data_cobertura
        FROM gestacoes 
        WHERE receptora_nome = $1
          AND data_cobertura = $2
        ORDER BY id DESC
        LIMIT 1
      `, [te.receptora_nome, dataTE.toISOString().split('T')[0]])

      let gestacaoId = null
      let novaGestacao = null

      if (gestacaoExistente.rows.length > 0) {
        gestacaoId = gestacaoExistente.rows[0].id
        console.log(`      ââ€ž¹ï¸�  GestaÃ§Ã£o jÃ¡ existe (ID: ${gestacaoId})`)
        gestacoesExistentes++
      } else {
        // Criar gestaÃ§Ã£o
        // Extrair dados do touro (formato "M5369 DA XARAES (MAGNATA) (RG: XRGM 5369)")
        let touroSerie = 'NÃ£o Informado'
        let touroRG = 'NÃ£o Informado'
        if (te.touro) {
          const touroMatch = te.touro.match(/RG:\s*([A-Z]+)\s*(\d+)/i)
          if (touroMatch) {
            touroSerie = touroMatch[1]
            touroRG = touroMatch[2]
          } else {
            // Tentar extrair do nome do touro
            const nomeMatch = te.touro.match(/^([A-Z0-9]+)/)
            if (nomeMatch) {
              touroSerie = nomeMatch[1].substring(0, 10)
            }
          }
        }

        // Extrair dados da doadora (formato "CJCJ (RG: 16418)")
        let doadoraSerie = 'NÃ£o Informado'
        let doadoraRG = 'NÃ£o Informado'
        if (te.doadora_nome) {
          const doadoraMatch = te.doadora_nome.match(/([A-Z]+)\s*\(RG:\s*(\d+)\)/i)
          if (doadoraMatch) {
            doadoraSerie = doadoraMatch[1]
            doadoraRG = doadoraMatch[2]
          } else {
            // Tentar extrair sÃ©rie do nome
            const nomeMatch = te.doadora_nome.match(/^([A-Z]+)/)
            if (nomeMatch) {
              doadoraSerie = nomeMatch[1]
            }
          }
        }

        novaGestacao = await query(`
          INSERT INTO gestacoes (
            pai_serie, pai_rg,
            mae_serie, mae_rg,
            receptora_nome, receptora_serie, receptora_rg,
            data_cobertura,
            situacao,
            observacoes,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING id
        `, [
          touroSerie,
          touroRG,
          doadoraSerie,
          doadoraRG,
          te.receptora_nome,
          receptora?.serie || 'G',
          receptora?.rg || receptoraRG,
          dataTE.toISOString().split('T')[0],
          'Em GestaÃ§Ã£o',
          `TransferÃªncia de EmbriÃ£o - TE ${te.numero_te}`
        ])

        gestacaoId = novaGestacao.rows[0].id
        console.log(`      âÅ“â€¦ GestaÃ§Ã£o criada (ID: ${gestacaoId})`)
        gestacoesCriadas++
      }

      // Verificar se jÃ¡ existe nascimento registrado
      // Verificar na tabela nascimentos (estrutura antiga) e na tabela animais
      const nascimentoExistente = await query(`
        SELECT id, data as data_nascimento
        FROM nascimentos 
        WHERE receptora = $1
          AND data IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `, [te.receptora_nome])
      
      // TambÃ©m verificar se hÃ¡ animal nascido com esta receptora como mÃ£e
      const animalNascido = await query(`
        SELECT id, data_nascimento
        FROM animais 
        WHERE receptora = $1
          AND data_nascimento >= $2
          AND data_nascimento <= $3
        ORDER BY data_nascimento DESC
        LIMIT 1
      `, [
        te.receptora_nome,
        new Date(dataEsperadaParto.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias antes
        new Date(dataEsperadaParto.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]  // 30 dias depois
      ])

      const hoje = new Date()
      const diasAposDataEsperada = Math.floor((hoje - dataEsperadaParto) / (1000 * 60 * 60 * 24))

      const temNascimento = nascimentoExistente.rows.length > 0 || animalNascido.rows.length > 0
      
      if (temNascimento) {
        const dataNasc = nascimentoExistente.rows[0]?.data_nascimento || animalNascido.rows[0]?.data_nascimento
        console.log(`      âÅ“â€¦ Nascimento jÃ¡ registrado em ${dataNasc}`)
        nascimentosEncontrados++
      } else if (diasAposDataEsperada > 0) {
        // Gerar alerta - parto atrasado
        console.log(`      âÅ¡ ï¸�  ALERTA: Parto esperado hÃ¡ ${diasAposDataEsperada} dia(s) - Nenhum nascimento registrado!`)
        
        // Verificar se jÃ¡ existe notificaÃ§Ã£o para esta receptora
        const receptoraIdentificacao = receptora ? `${receptora.serie} ${receptora.rg}` : te.receptora_nome
        const notificacaoExistente = await query(`
          SELECT id FROM notificacoes 
          WHERE tipo = 'nascimento' 
            AND titulo ILIKE '%${receptoraIdentificacao}%'
            AND lida = false
          LIMIT 1
        `)

        if (notificacaoExistente.rows.length === 0) {
          await query(`
            INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras, animal_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [
            'nascimento',
            `Parto Atrasado - ${receptoraIdentificacao}`,
            `Receptora ${receptoraIdentificacao} deveria ter parido em ${dataEsperadaParto.toLocaleDateString('pt-BR')} (${diasAposDataEsperada} dia(s) atrÃ¡s). TE realizada em ${dataTE.toLocaleDateString('pt-BR')}.`,
            'high',
            JSON.stringify({
              receptora_id: receptora?.id || null,
              receptora_nome: te.receptora_nome,
              data_te: dataTE.toISOString(),
              data_esperada_parto: dataEsperadaParto.toISOString(),
              dias_atraso: diasAposDataEsperada,
              te_id: te.id,
              te_numero: te.numero_te,
              gestacao_id: gestacaoId
            }),
            receptora?.id || null
          ])
          alertasGerados++
          console.log(`      âÅ“â€¦ Alerta gerado`)
        } else {
          console.log(`      ââ€ž¹ï¸�  Alerta jÃ¡ existe`)
        }
      } else {
        const diasRestantes = Math.abs(diasAposDataEsperada)
        console.log(`      ââ€ž¹ï¸�  Parto esperado em ${diasRestantes} dia(s)`)
      }

      console.log('')
    }

    // 4. Resumo
    console.log('='.repeat(60))
    console.log('ðÅ¸â€œÅ  RESUMO:')
    console.log(`   TransferÃªncias processadas: ${transferencias.rows.length}`)
    console.log(`   GestaÃ§Ãµes criadas: ${gestacoesCriadas}`)
    console.log(`   GestaÃ§Ãµes jÃ¡ existentes: ${gestacoesExistentes}`)
    console.log(`   Nascimentos encontrados: ${nascimentosEncontrados}`)
    console.log(`   Alertas gerados: ${alertasGerados}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('â�Å’ Erro ao vincular TE com nascimentos:', error)
    throw error
  }
}

// Executar o script
if (require.main === module) {
  vincularTENascimentos()
    .then(() => {
      console.log('\nâÅ“â€¦ Script executado com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\nâ�Å’ Erro ao executar script:', error)
      process.exit(1)
    })
}

module.exports = { vincularTENascimentos }
