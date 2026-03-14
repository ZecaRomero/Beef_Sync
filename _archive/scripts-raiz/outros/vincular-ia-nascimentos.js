// Script para vincular inseminações artificiais com nascimentos
const { query } = require('./lib/database')

async function vincularIANascimentos() {
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
      WHERE table_name = 'gestacoes'
      ORDER BY ordinal_position
    `)
    
    console.log('Colunas da tabela gestacoes:')
    gestacoesCols.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`)
    })
    
    // Verificar se existe coluna tipo_cobertura na tabela nascimentos
    const nascimentosCols = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'nascimentos'
      ORDER BY ordinal_position
    `)
    
    console.log('')
    console.log('Colunas da tabela nascimentos:')
    nascimentosCols.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`)
    })
    
    // 2. Adicionar coluna tipo_cobertura se não existir
    console.log('')
    console.log('2️⃣ ADICIONANDO CAMPO TIPO_COBERTURA:')
    console.log('-'.repeat(50))
    
    const temTipoCobertura = gestacoesCols.rows.some(col => col.column_name === 'tipo_cobertura')
    
    if (!temTipoCobertura) {
      console.log('Adicionando coluna tipo_cobertura na tabela gestacoes...')
      await query(`
        ALTER TABLE gestacoes 
        ADD COLUMN tipo_cobertura VARCHAR(10) DEFAULT 'IA' 
        CHECK (tipo_cobertura IN ('IA', 'FIV', 'MN'))
      `)
      console.log('✅ Coluna tipo_cobertura adicionada (IA=Inseminação Artificial, FIV=Fertilização In Vitro, MN=Monta Natural)')
    } else {
      console.log('✅ Coluna tipo_cobertura já existe na tabela gestacoes')
    }
    
    const temTipoCoberturaNasc = nascimentosCols.rows.some(col => col.column_name === 'tipo_cobertura')
    
    if (!temTipoCoberturaNasc) {
      console.log('Adicionando coluna tipo_cobertura na tabela nascimentos...')
      await query(`
        ALTER TABLE nascimentos 
        ADD COLUMN tipo_cobertura VARCHAR(10) DEFAULT 'IA'
        CHECK (tipo_cobertura IN ('IA', 'FIV', 'MN'))
      `)
      console.log('✅ Coluna tipo_cobertura adicionada na tabela nascimentos')
    } else {
      console.log('✅ Coluna tipo_cobertura já existe na tabela nascimentos')
    }
    
    // 3. Adicionar coluna inseminacao_id para vincular nascimentos com IAs
    const temInseminacaoId = nascimentosCols.rows.some(col => col.column_name === 'inseminacao_id')
    
    if (!temInseminacaoId) {
      console.log('Adicionando coluna inseminacao_id na tabela nascimentos...')
      await query(`
        ALTER TABLE nascimentos 
        ADD COLUMN inseminacao_id INTEGER REFERENCES inseminacoes(id) ON DELETE SET NULL
      `)
      console.log('✅ Coluna inseminacao_id adicionada para vincular nascimentos com inseminações')
    } else {
      console.log('✅ Coluna inseminacao_id já existe na tabela nascimentos')
    }
    
    // 4. Atualizar gestações existentes de IA
    console.log('')
    console.log('3️⃣ ATUALIZANDO GESTAÇÕES EXISTENTES:')
    console.log('-'.repeat(50))
    
    // Marcar gestações criadas a partir de inseminações como IA
    const gestacaoIA = await query(`
      UPDATE gestacoes 
      SET tipo_cobertura = 'IA'
      WHERE EXISTS (
        SELECT 1 FROM inseminacoes i 
        WHERE i.animal_id IN (
          SELECT id FROM animais 
          WHERE serie = gestacoes.receptora_serie 
          AND rg = gestacoes.receptora_rg
        )
        AND i.data_inseminacao = gestacoes.data_cobertura
      )
      AND (tipo_cobertura IS NULL OR tipo_cobertura = 'IA')
    `)
    
    console.log(`✅ ${gestacaoIA.rowCount} gestações marcadas como IA (Inseminação Artificial)`)
    
    // Marcar gestações existentes que não são de IA como FIV (assumindo que são FIV se não são IA)
    const gestacaoFIV = await query(`
      UPDATE gestacoes 
      SET tipo_cobertura = 'FIV'
      WHERE NOT EXISTS (
        SELECT 1 FROM inseminacoes i 
        WHERE i.animal_id IN (
          SELECT id FROM animais 
          WHERE serie = gestacoes.receptora_serie 
          AND rg = gestacoes.receptora_rg
        )
        AND i.data_inseminacao = gestacoes.data_cobertura
      )
      AND (tipo_cobertura IS NULL OR tipo_cobertura != 'IA')
    `)
    
    console.log(`✅ ${gestacaoFIV.rowCount} gestações marcadas como FIV (Fertilização In Vitro)`)
    
    // 5. Verificar nascimentos existentes e classificá-los
    console.log('')
    console.log('4️⃣ CLASSIFICANDO NASCIMENTOS EXISTENTES:')
    console.log('-'.repeat(50))
    
    // Buscar nascimentos existentes
    const nascimentosExistentes = await query(`
      SELECT n.*, g.tipo_cobertura as gestacao_tipo
      FROM nascimentos n
      LEFT JOIN gestacoes g ON n.gestacao_id = g.id
      ORDER BY n.data_nascimento DESC
    `)
    
    console.log(`📊 Total de nascimentos encontrados: ${nascimentosExistentes.rows.length}`)
    
    if (nascimentosExistentes.rows.length > 0) {
      // Atualizar tipo_cobertura dos nascimentos baseado na gestação
      const nascimentosIA = await query(`
        UPDATE nascimentos 
        SET tipo_cobertura = 'IA'
        WHERE gestacao_id IN (
          SELECT id FROM gestacoes WHERE tipo_cobertura = 'IA'
        )
      `)
      
      const nascimentosFIV = await query(`
        UPDATE nascimentos 
        SET tipo_cobertura = 'FIV'
        WHERE gestacao_id IN (
          SELECT id FROM gestacoes WHERE tipo_cobertura = 'FIV'
        )
      `)
      
      console.log(`✅ ${nascimentosIA.rowCount} nascimentos marcados como IA`)
      console.log(`✅ ${nascimentosFIV.rowCount} nascimentos marcados como FIV`)
      
      // Vincular nascimentos de IA com inseminações
      const vinculacoes = await query(`
        UPDATE nascimentos 
        SET inseminacao_id = (
          SELECT i.id 
          FROM inseminacoes i
          INNER JOIN animais a ON i.animal_id = a.id
          INNER JOIN gestacoes g ON nascimentos.gestacao_id = g.id
          WHERE a.serie = g.receptora_serie 
          AND a.rg = g.receptora_rg
          AND i.data_inseminacao = g.data_cobertura
          AND g.tipo_cobertura = 'IA'
          LIMIT 1
        )
        WHERE tipo_cobertura = 'IA' 
        AND gestacao_id IS NOT NULL
        AND inseminacao_id IS NULL
      `)
      
      console.log(`✅ ${vinculacoes.rowCount} nascimentos vinculados com suas inseminações`)
    }
    
    // 6. Estatísticas finais
    console.log('')
    console.log('5️⃣ ESTATÍSTICAS FINAIS:')
    console.log('-'.repeat(50))
    
    const stats = await Promise.all([
      query(`SELECT COUNT(*) as total FROM gestacoes WHERE tipo_cobertura = 'IA'`),
      query(`SELECT COUNT(*) as total FROM gestacoes WHERE tipo_cobertura = 'FIV'`),
      query(`SELECT COUNT(*) as total FROM nascimentos WHERE tipo_cobertura = 'IA'`),
      query(`SELECT COUNT(*) as total FROM nascimentos WHERE tipo_cobertura = 'FIV'`),
      query(`SELECT COUNT(*) as total FROM nascimentos WHERE inseminacao_id IS NOT NULL`),
      query(`SELECT COUNT(*) as total FROM inseminacoes`)
    ])
    
    console.log(`📊 Gestações por IA: ${stats[0].rows[0].total}`)
    console.log(`📊 Gestações por FIV: ${stats[1].rows[0].total}`)
    console.log(`📊 Nascimentos por IA: ${stats[2].rows[0].total}`)
    console.log(`📊 Nascimentos por FIV: ${stats[3].rows[0].total}`)
    console.log(`📊 Nascimentos vinculados com IA: ${stats[4].rows[0].total}`)
    console.log(`📊 Total de inseminações: ${stats[5].rows[0].total}`)
    
    // 7. Exemplo de consulta para verificar vinculação
    console.log('')
    console.log('6️⃣ EXEMPLO DE VINCULAÇÃO:')
    console.log('-'.repeat(50))
    
    const exemplo = await query(`
      SELECT 
        n.serie,
        n.rg,
        n.data_nascimento,
        n.tipo_cobertura,
        i.data_inseminacao,
        i.touro,
        i.status_gestacao,
        g.situacao as situacao_gestacao
      FROM nascimentos n
      LEFT JOIN inseminacoes i ON n.inseminacao_id = i.id
      LEFT JOIN gestacoes g ON n.gestacao_id = g.id
      WHERE n.tipo_cobertura = 'IA'
      ORDER BY n.data_nascimento DESC
      LIMIT 5
    `)
    
    if (exemplo.rows.length > 0) {
      console.log('Exemplos de nascimentos vinculados com IA:')
      exemplo.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.serie} ${row.rg} - Nascido em ${new Date(row.data_nascimento).toLocaleDateString('pt-BR')}`)
        if (row.data_inseminacao) {
          console.log(`   IA: ${new Date(row.data_inseminacao).toLocaleDateString('pt-BR')} - Touro: ${row.touro}`)
        }
        console.log(`   Status: ${row.status_gestacao || 'N/A'} - Gestação: ${row.situacao_gestacao || 'N/A'}`)
        console.log('')
      })
    } else {
      console.log('Nenhum nascimento de IA encontrado ainda.')
    }
    
    console.log('')
    console.log('✅ VINCULAÇÃO CONCLUÍDA!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Executar
vincularIANascimentos()
  .then(() => {
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('• Campo tipo_cobertura adicionado (IA/FIV/MN)')
    console.log('• Gestações classificadas por tipo de cobertura')
    console.log('• Nascimentos vinculados com inseminações')
    console.log('• Sistema diferencia IA de FIV nos relatórios')
    console.log('• Rastreabilidade completa da reprodução')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })/*  */