#!/usr/bin/env node

/**
 * Script para vincular transferências de embriões com nascimentos esperados
 * e gerar alertas para receptoras que não pariram na data esperada
 */

const { query } = require('../lib/database')

async function vincularTENascimentos() {
  console.log('🔗 Vinculando Transferências de Embriões com Nascimentos Esperados...\n')

  try {
    // 1. Buscar todas as transferências de embriões com data_te = 01/10/2025
    console.log('1. Buscando transferências de embriões de 01/10/2025:')
    const transferencias = await query(`
      SELECT id, numero_te, data_te, receptora_nome, doadora_nome, touro, status, sexo_prenhez
      FROM transferencias_embrioes 
      WHERE data_te = '2025-10-01'
      ORDER BY id
    `)
    
    console.log(`   ✅ Encontradas ${transferencias.rows.length} transferência(s)\n`)

    if (transferencias.rows.length === 0) {
      console.log('   ⚠️  Nenhuma transferência encontrada para a data 01/10/2025')
      return
    }

    // 2. Para cada transferência, calcular data esperada de parto (9 meses = ~276 dias)
    const dataTE = new Date('2025-10-01')
    const dataEsperadaParto = new Date(dataTE)
    dataEsperadaParto.setDate(dataEsperadaParto.getDate() + 276) // 9 meses = ~276 dias
    
    console.log(`2. Data da TE: ${dataTE.toLocaleDateString('pt-BR')}`)
    console.log(`   Data esperada de parto: ${dataEsperadaParto.toLocaleDateString('pt-BR')}\n`)

    // 3. Verificar se já existem gestações criadas para essas transferências
    let gestacoesCriadas = 0
    let gestacoesExistentes = 0
    let nascimentosEncontrados = 0
    let alertasGerados = 0

    for (const te of transferencias.rows) {
      console.log(`   Processando TE ${te.numero_te}:`)
      console.log(`      Receptora: ${te.receptora_nome}`)
      console.log(`      Doadora: ${te.doadora_nome}`)
      console.log(`      Touro: ${te.touro}`)

      // Extrair série e RG da receptora (formato "G 3028" ou "G-3028")
      const receptoraMatch = te.receptora_nome.match(/G\s*[-]?\s*(\d+)/i)
      const receptoraRG = receptoraMatch ? receptoraMatch[1] : null

      if (!receptoraRG) {
        console.log(`      ⚠️  Não foi possível extrair RG da receptora: ${te.receptora_nome}`)
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
        console.log(`      ✅ Receptora encontrada: ID ${receptora.id}, ${receptora.serie} ${receptora.rg}`)
      } else {
        console.log(`      ℹ️  Receptora G ${receptoraRG} não cadastrada (receptora externa)`)
      }

      // Verificar se já existe gestação para esta TE
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
        console.log(`      ℹ️  Gestação já existe (ID: ${gestacaoId})`)
        gestacoesExistentes++
      } else {
        // Criar gestação
        // Extrair dados do touro (formato "M5369 DA XARAES (MAGNATA) (RG: XRGM 5369)")
        let touroSerie = 'Não Informado'
        let touroRG = 'Não Informado'
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
        let doadoraSerie = 'Não Informado'
        let doadoraRG = 'Não Informado'
        if (te.doadora_nome) {
          const doadoraMatch = te.doadora_nome.match(/([A-Z]+)\s*\(RG:\s*(\d+)\)/i)
          if (doadoraMatch) {
            doadoraSerie = doadoraMatch[1]
            doadoraRG = doadoraMatch[2]
          } else {
            // Tentar extrair série do nome
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
          'Em Gestação',
          `Transferência de Embrião - TE ${te.numero_te}`
        ])

        gestacaoId = novaGestacao.rows[0].id
        console.log(`      ✅ Gestação criada (ID: ${gestacaoId})`)
        gestacoesCriadas++
      }

      // Verificar se já existe nascimento registrado
      // Verificar na tabela nascimentos (estrutura antiga) e na tabela animais
      const nascimentoExistente = await query(`
        SELECT id, data as data_nascimento
        FROM nascimentos 
        WHERE receptora = $1
          AND data IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `, [te.receptora_nome])
      
      // Também verificar se há animal nascido com esta receptora como mãe
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
        console.log(`      ✅ Nascimento já registrado em ${dataNasc}`)
        nascimentosEncontrados++
      } else if (diasAposDataEsperada > 0) {
        // Gerar alerta - parto atrasado
        console.log(`      ⚠️  ALERTA: Parto esperado há ${diasAposDataEsperada} dia(s) - Nenhum nascimento registrado!`)
        
        // Verificar se já existe notificação para esta receptora
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
            `Receptora ${receptoraIdentificacao} deveria ter parido em ${dataEsperadaParto.toLocaleDateString('pt-BR')} (${diasAposDataEsperada} dia(s) atrás). TE realizada em ${dataTE.toLocaleDateString('pt-BR')}.`,
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
          console.log(`      ✅ Alerta gerado`)
        } else {
          console.log(`      ℹ️  Alerta já existe`)
        }
      } else {
        const diasRestantes = Math.abs(diasAposDataEsperada)
        console.log(`      ℹ️  Parto esperado em ${diasRestantes} dia(s)`)
      }

      console.log('')
    }

    // 4. Resumo
    console.log('='.repeat(60))
    console.log('📊 RESUMO:')
    console.log(`   Transferências processadas: ${transferencias.rows.length}`)
    console.log(`   Gestações criadas: ${gestacoesCriadas}`)
    console.log(`   Gestações já existentes: ${gestacoesExistentes}`)
    console.log(`   Nascimentos encontrados: ${nascimentosEncontrados}`)
    console.log(`   Alertas gerados: ${alertasGerados}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Erro ao vincular TE com nascimentos:', error)
    throw error
  }
}

// Executar o script
if (require.main === module) {
  vincularTENascimentos()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro ao executar script:', error)
      process.exit(1)
    })
}

module.exports = { vincularTENascimentos }
