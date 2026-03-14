// Script para verificar se as gestações foram corretamente marcadas como IA
const { query } = require('./lib/database')

async function verificarGestacoesIA() {
  console.log('�Ÿ”� VERIFICANDO GESTA�‡�•ES DE INSEMINA�‡�ƒO ARTIFICIAL')
  console.log('=' .repeat(70))
  console.log('')

  try {
    // 1. Verificar gestações existentes
    console.log('1️�ƒ� GESTA�‡�•ES EXISTENTES:')
    console.log('-'.repeat(50))
    
    const gestacoes = await query(`
      SELECT 
        g.*,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM inseminacoes i 
            INNER JOIN animais a ON i.animal_id = a.id
            WHERE a.serie = g.receptora_serie 
            AND a.rg = g.receptora_rg
            AND i.data_inseminacao = g.data_cobertura
          ) THEN 'IA_MATCH'
          ELSE 'NO_MATCH'
        END as tem_ia_correspondente
      FROM gestacoes g
      ORDER BY g.created_at DESC
      LIMIT 10
    `)
    
    console.log(`�Ÿ“Š Total de gestações: ${gestacoes.rows.length}`)
    
    if (gestacoes.rows.length > 0) {
      console.log('')
      console.log('Detalhes das gestações:')
      gestacoes.rows.forEach((gest, index) => {
        console.log(`${index + 1}. Receptora: ${gest.receptora_serie} ${gest.receptora_rg}`)
        console.log(`   Data cobertura: ${gest.data_cobertura ? new Date(gest.data_cobertura).toLocaleDateString('pt-BR') : 'N/A'}`)
        console.log(`   Tipo: ${gest.tipo_cobertura || 'NULL'}`)
        console.log(`   Situação: ${gest.situacao}`)
        console.log(`   Tem IA correspondente: ${gest.tem_ia_correspondente}`)
        console.log('')
      })
    }
    
    // 2. Forçar atualização das gestações que têm IA correspondente
    console.log('2️�ƒ� FOR�‡ANDO ATUALIZA�‡�ƒO DAS GESTA�‡�•ES:')
    console.log('-'.repeat(50))
    
    const atualizacao = await query(`
      UPDATE gestacoes 
      SET tipo_cobertura = 'IA'
      WHERE EXISTS (
        SELECT 1 FROM inseminacoes i 
        INNER JOIN animais a ON i.animal_id = a.id
        WHERE a.serie = gestacoes.receptora_serie 
        AND a.rg = gestacoes.receptora_rg
        AND i.data_inseminacao = gestacoes.data_cobertura
      )
    `)
    
    console.log(`�œ… ${atualizacao.rowCount} gestações atualizadas para IA`)
    
    // 3. Verificar inseminações e suas gestações correspondentes
    console.log('')
    console.log('3️�ƒ� INSEMINA�‡�•ES E SUAS GESTA�‡�•ES:')
    console.log('-'.repeat(50))
    
    const iaComGestacao = await query(`
      SELECT 
        i.id as ia_id,
        i.data_inseminacao,
        i.touro,
        i.status_gestacao,
        a.serie,
        a.rg,
        g.id as gestacao_id,
        g.tipo_cobertura,
        g.situacao as situacao_gestacao
      FROM inseminacoes i
      INNER JOIN animais a ON i.animal_id = a.id
      LEFT JOIN gestacoes g ON (
        a.serie = g.receptora_serie 
        AND a.rg = g.receptora_rg
        AND i.data_inseminacao = g.data_cobertura
      )
      ORDER BY i.data_inseminacao DESC
      LIMIT 10
    `)
    
    console.log(`�Ÿ“Š Inseminações verificadas: ${iaComGestacao.rows.length}`)
    
    if (iaComGestacao.rows.length > 0) {
      console.log('')
      console.log('Detalhes das inseminações:')
      iaComGestacao.rows.forEach((ia, index) => {
        console.log(`${index + 1}. IA ID: ${ia.ia_id} - Animal: ${ia.serie} ${ia.rg}`)
        console.log(`   Data IA: ${new Date(ia.data_inseminacao).toLocaleDateString('pt-BR')}`)
        console.log(`   Touro: ${ia.touro}`)
        console.log(`   Status IA: ${ia.status_gestacao}`)
        if (ia.gestacao_id) {
          console.log(`   �œ… Gestação ID: ${ia.gestacao_id} - Tipo: ${ia.tipo_cobertura} - Situação: ${ia.situacao_gestacao}`)
        } else {
          console.log(`   �Œ Sem gestação correspondente`)
        }
        console.log('')
      })
    }
    
    // 4. Estatísticas finais
    console.log('4️�ƒ� ESTATÍSTICAS FINAIS:')
    console.log('-'.repeat(50))
    
    const stats = await Promise.all([
      query(`SELECT COUNT(*) as total FROM gestacoes WHERE tipo_cobertura = 'IA'`),
      query(`SELECT COUNT(*) as total FROM gestacoes WHERE tipo_cobertura = 'FIV'`),
      query(`SELECT COUNT(*) as total FROM gestacoes WHERE tipo_cobertura IS NULL`),
      query(`SELECT COUNT(*) as total FROM inseminacoes WHERE status_gestacao = 'Prenha'`),
      query(`
        SELECT COUNT(*) as total 
        FROM inseminacoes i
        INNER JOIN animais a ON i.animal_id = a.id
        WHERE EXISTS (
          SELECT 1 FROM gestacoes g 
          WHERE a.serie = g.receptora_serie 
          AND a.rg = g.receptora_rg
          AND i.data_inseminacao = g.data_cobertura
        )
      `)
    ])
    
    console.log(`�Ÿ“Š Gestações IA: ${stats[0].rows[0].total}`)
    console.log(`�Ÿ“Š Gestações FIV: ${stats[1].rows[0].total}`)
    console.log(`�Ÿ“Š Gestações sem tipo: ${stats[2].rows[0].total}`)
    console.log(`�Ÿ“Š IAs com prenhez: ${stats[3].rows[0].total}`)
    console.log(`�Ÿ“Š IAs com gestação correspondente: ${stats[4].rows[0].total}`)
    
    // 5. Criar gestações para IAs que não têm
    console.log('')
    console.log('5️�ƒ� CRIANDO GESTA�‡�•ES FALTANTES:')
    console.log('-'.repeat(50))
    
    const iasSemGestacao = await query(`
      SELECT 
        i.id,
        i.data_inseminacao,
        i.touro,
        i.status_gestacao,
        a.serie,
        a.rg,
        a.nome
      FROM inseminacoes i
      INNER JOIN animais a ON i.animal_id = a.id
      WHERE i.status_gestacao = 'Prenha'
      AND NOT EXISTS (
        SELECT 1 FROM gestacoes g 
        WHERE a.serie = g.receptora_serie 
        AND a.rg = g.receptora_rg
        AND i.data_inseminacao = g.data_cobertura
      )
    `)
    
    console.log(`�Ÿ“Š IAs prenhas sem gestação: ${iasSemGestacao.rows.length}`)
    
    if (iasSemGestacao.rows.length > 0) {
      console.log('Criando gestações faltantes...')
      
      for (const ia of iasSemGestacao.rows) {
        try {
          await query(`
            INSERT INTO gestacoes (
              pai_serie,
              pai_rg,
              mae_serie,
              mae_rg,
              receptora_nome,
              receptora_serie,
              receptora_rg,
              data_cobertura,
              situacao,
              tipo_cobertura,
              observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            'IA', // pai_serie para IAs
            ia.touro || 'N/A', // pai_rg
            ia.serie, // mae_serie
            ia.rg, // mae_rg
            ia.nome || `${ia.serie} ${ia.rg}`,
            ia.serie,
            ia.rg,
            ia.data_inseminacao,
            'Em Gestação',
            'IA',
            `Gestação criada automaticamente para IA ID ${ia.id}`
          ])
          
          console.log(`�œ… Gestação criada para ${ia.serie} ${ia.rg}`)
        } catch (error) {
          console.log(`�Œ Erro ao criar gestação para ${ia.serie} ${ia.rg}: ${error.message}`)
        }
      }
    }
    
    console.log('')
    console.log('�œ… VERIFICA�‡�ƒO CONCLUÍDA!')
    
  } catch (error) {
    console.error('�Œ Erro:', error)
  }
}

// Executar
verificarGestacoesIA()
  .then(() => {
    console.log('')
    console.log('�ŸŽ� RESULTADO:')
    console.log('�€� Gestações verificadas e atualizadas')
    console.log('�€� Tipo de cobertura IA aplicado corretamente')
    console.log('�€� Gestações faltantes criadas')
    console.log('�€� Sistema pronto para vincular nascimentos')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })