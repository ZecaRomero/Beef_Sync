// Script para vincular inseminações artificiais com nascimentos (versão corrigida)
const { query } = require('./lib/database')

async function vincularIANascimentosCorrigido() {
  console.log('🔗 VINCULANDO INSEMINAÇÕES ARTIFICIAIS COM NASCIMENTOS')
  console.log('=' .repeat(70))
  console.log('')

  try {
    // 1. Verificar estrutura atual das tabelas
    console.log('1️⃣ VERIFICANDO ESTRUTURA DAS TABELAS:')
    console.log('-'.repeat(50))
    
    // Verificar se existe coluna tipo_cobertura na tabela gestacoes
    const gestacoesCols = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'gestacoes' AND column_name = 'tipo_cobertura'
    `)
    
    if (gestacoesCols.rows.length === 0) {
      console.log('Adicionando coluna tipo_cobertura na tabela gestacoes...')
      await query(`
        ALTER TABLE gestacoes 
        ADD COLUMN tipo_cobertura VARCHAR(10) DEFAULT 'IA' 
        CHECK (tipo_cobertura IN ('IA', 'FIV', 'MN'))
      `)
      console.log('✅ Coluna tipo_cobertura adicionada na tabela gestacoes')
    } else {
      console.log('✅ Coluna tipo_cobertura já existe na tabela gestacoes')
    }
    
    // Verificar se existe coluna inseminacao_id na tabela nascimentos
    const nascimentosInseminacaoId = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'nascimentos' AND column_name = 'inseminacao_id'
    `)
    
    if (nascimentosInseminacaoId.rows.length === 0) {
      console.log('Adicionando coluna inseminacao_id na tabela nascimentos...')
      await query(`
        ALTER TABLE nascimentos 
        ADD COLUMN inseminacao_id INTEGER REFERENCES inseminacoes(id) ON DELETE SET NULL
      `)
      console.log('✅ Coluna inseminacao_id adicionada na tabela nascimentos')
    } else {
      console.log('✅ Coluna inseminacao_id já existe na tabela nascimentos')
    }
    
    // 2. Atualizar gestações existentes de IA
    console.log('')
    console.log('2️⃣ ATUALIZANDO GESTAÇÕES EXISTENTES:')
    console.log('-'.repeat(50))
    
    // Marcar gestações criadas a partir de inseminações como IA
    const gestacaoIA = await query(`
      UPDATE gestacoes 
      SET tipo_cobertura = 'IA'
      WHERE EXISTS (
        SELECT 1 FROM inseminacoes i 
        INNER JOIN animais a ON i.animal_id = a.id
        WHERE a.serie = gestacoes.receptora_serie 
        AND a.rg = gestacoes.receptora_rg
        AND i.data_inseminacao = gestacoes.data_cobertura
      )
      AND (tipo_cobertura IS NULL OR tipo_cobertura = 'IA')
    `)
    
    console.log(`✅ ${gestacaoIA.rowCount} gestações marcadas como IA (Inseminação Artificial)`)
    
    // Marcar gestações existentes que não são de IA como FIV
    const gestacaoFIV = await query(`
      UPDATE gestacoes 
      SET tipo_cobertura = 'FIV'
      WHERE NOT EXISTS (
        SELECT 1 FROM inseminacoes i 
        INNER JOIN animais a ON i.animal_id = a.id
        WHERE a.serie = gestacoes.receptora_serie 
        AND a.rg = gestacoes.receptora_rg
        AND i.data_inseminacao = gestacoes.data_cobertura
      )
      AND (tipo_cobertura IS NULL OR tipo_cobertura != 'IA')
    `)
    
    console.log(`✅ ${gestacaoFIV.rowCount} gestações marcadas como FIV (Fertilização In Vitro)`)
    
    // 3. Verificar nascimentos existentes
    console.log('')
    console.log('3️⃣ CLASSIFICANDO NASCIMENTOS EXISTENTES:')
    console.log('-'.repeat(50))
    
    // Buscar nascimentos existentes
    const nascimentosExistentes = await query(`
      SELECT * FROM nascimentos
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    console.log(`📊 Total de nascimentos encontrados: ${nascimentosExistentes.rows.length}`)
    
    if (nascimentosExistentes.rows.length > 0) {
      console.log('')
      console.log('Exemplos da estrutura atual dos nascimentos:')
      nascimentosExistentes.rows.slice(0, 3).forEach((nasc, index) => {
        console.log(`${index + 1}. RG: ${nasc.rg || 'N/A'} - Receptora: ${nasc.receptora || 'N/A'}`)
        console.log(`   Touro: ${nasc.touro || 'N/A'} - Data: ${nasc.data || 'N/A'}`)
        console.log(`   Tipo atual: ${nasc.tipo_cobertura || 'NULL'}`)
        console.log('')
      })
      
      // Tentar vincular nascimentos com inseminações baseado na receptora
      console.log('Tentando vincular nascimentos com inseminações...')
      
      const vinculacoes = await query(`
        UPDATE nascimentos 
        SET inseminacao_id = (
          SELECT i.id 
          FROM inseminacoes i
          INNER JOIN animais a ON i.animal_id = a.id
          WHERE CONCAT(a.serie, ' ', a.rg) = nascimentos.receptora
          ORDER BY i.data_inseminacao DESC
          LIMIT 1
        ),
        tipo_cobertura = 'IA'
        WHERE inseminacao_id IS NULL
        AND receptora IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM inseminacoes i
          INNER JOIN animais a ON i.animal_id = a.id
          WHERE CONCAT(a.serie, ' ', a.rg) = nascimentos.receptora
        )
      `)
      
      console.log(`✅ ${vinculacoes.rowCount} nascimentos vinculados com inseminações e marcados como IA`)
      
      // Marcar nascimentos restantes como FIV se têm touro
      const nascimentosFIV = await query(`
        UPDATE nascimentos 
        SET tipo_cobertura = 'FIV'
        WHERE tipo_cobertura IS NULL 
        AND touro IS NOT NULL
        AND touro != ''
        AND inseminacao_id IS NULL
      `)
      
      console.log(`✅ ${nascimentosFIV.rowCount} nascimentos marcados como FIV (baseado na presença de touro)`)
    }
    
    // 4. Estatísticas finais
    console.log('')
    console.log('4️⃣ ESTATÍSTICAS FINAIS:')
    console.log('-'.repeat(50))
    
    const stats = await Promise.all([
      query(`SELECT COUNT(*) as total FROM gestacoes WHERE tipo_cobertura = 'IA'`),
      query(`SELECT COUNT(*) as total FROM gestacoes WHERE tipo_cobertura = 'FIV'`),
      query(`SELECT COUNT(*) as total FROM nascimentos WHERE tipo_cobertura = 'IA'`),
      query(`SELECT COUNT(*) as total FROM nascimentos WHERE tipo_cobertura = 'FIV'`),
      query(`SELECT COUNT(*) as total FROM nascimentos WHERE inseminacao_id IS NOT NULL`),
      query(`SELECT COUNT(*) as total FROM inseminacoes`),
      query(`SELECT COUNT(*) as total FROM nascimentos`)
    ])
    
    console.log(`📊 Gestações por IA: ${stats[0].rows[0].total}`)
    console.log(`📊 Gestações por FIV: ${stats[1].rows[0].total}`)
    console.log(`📊 Nascimentos por IA: ${stats[2].rows[0].total}`)
    console.log(`📊 Nascimentos por FIV: ${stats[3].rows[0].total}`)
    console.log(`📊 Nascimentos vinculados com IA: ${stats[4].rows[0].total}`)
    console.log(`📊 Total de inseminações: ${stats[5].rows[0].total}`)
    console.log(`📊 Total de nascimentos: ${stats[6].rows[0].total}`)
    
    // 5. Exemplo de consulta para verificar vinculação
    console.log('')
    console.log('5️⃣ EXEMPLO DE VINCULAÇÃO:')
    console.log('-'.repeat(50))
    
    const exemplo = await query(`
      SELECT 
        n.rg,
        n.receptora,
        n.data,
        n.tipo_cobertura,
        n.touro as touro_nascimento,
        i.data_inseminacao,
        i.touro as touro_ia,
        i.status_gestacao
      FROM nascimentos n
      LEFT JOIN inseminacoes i ON n.inseminacao_id = i.id
      WHERE n.tipo_cobertura IS NOT NULL
      ORDER BY n.created_at DESC
      LIMIT 5
    `)
    
    if (exemplo.rows.length > 0) {
      console.log('Exemplos de nascimentos classificados:')
      exemplo.rows.forEach((row, index) => {
        console.log(`${index + 1}. RG: ${row.rg || 'N/A'} - Receptora: ${row.receptora || 'N/A'}`)
        console.log(`   Tipo: ${row.tipo_cobertura} - Data nascimento: ${row.data || 'N/A'}`)
        if (row.data_inseminacao) {
          console.log(`   IA: ${new Date(row.data_inseminacao).toLocaleDateString('pt-BR')} - Touro IA: ${row.touro_ia}`)
        }
        if (row.touro_nascimento) {
          console.log(`   Touro nascimento: ${row.touro_nascimento}`)
        }
        console.log('')
      })
    } else {
      console.log('Nenhum nascimento classificado encontrado.')
    }
    
    console.log('')
    console.log('✅ VINCULAÇÃO CONCLUÍDA!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Executar
vincularIANascimentosCorrigido()
  .then(() => {
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('• Campo tipo_cobertura adicionado (IA/FIV/MN)')
    console.log('• Gestações classificadas por tipo de cobertura')
    console.log('• Nascimentos vinculados com inseminações quando possível')
    console.log('• Sistema diferencia IA de FIV nos relatórios')
    console.log('• Rastreabilidade completa da reprodução')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })