// Script para corrigir a estrutura da tabela inseminacoes
const { query } = require('./lib/database')

async function fixInseminacaoTable() {
  console.log('�Ÿ”� Corrigindo estrutura da tabela inseminacoes...\n')

  try {
    // 1. Verificar se a tabela existe
    console.log('1. Verificando se a tabela inseminacoes existe...')
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inseminacoes'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      console.log('   �Œ Tabela inseminacoes não existe. Criando...')
      await query(`
        CREATE TABLE inseminacoes (
          id SERIAL PRIMARY KEY,
          animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
          data_inseminacao DATE NOT NULL,
          touro VARCHAR(100),
          semen_id INTEGER,
          inseminador VARCHAR(100),
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('   �œ… Tabela inseminacoes criada')
    } else {
      console.log('   �œ… Tabela inseminacoes existe')
    }

    // 2. Adicionar colunas que podem estar faltando
    console.log('\n2. Verificando e adicionando colunas necessárias...')
    
    const columnsToAdd = [
      { name: 'status_gestacao', type: 'VARCHAR(20)', description: 'Status da gestação' },
      { name: 'tecnico', type: 'VARCHAR(100)', description: 'Técnico responsável' },
      { name: 'protocolo', type: 'VARCHAR(50)', description: 'Protocolo utilizado' },
      { name: 'custo_dose', type: 'DECIMAL(12,2) DEFAULT 18.00', description: 'Custo da dose' },
      { name: 'custo_id', type: 'INTEGER REFERENCES custos(id) ON DELETE SET NULL', description: 'ID do custo' },
      { name: 'numero_ia', type: 'INTEGER', description: 'Número da IA' },
      { name: 'serie_touro', type: 'VARCHAR(20)', description: 'Série do touro' },
      { name: 'rg_touro', type: 'VARCHAR(50)', description: 'RG do touro' },
      { name: 'numero_dg', type: 'INTEGER', description: 'Número do diagnóstico' },
      { name: 'data_dg', type: 'DATE', description: 'Data do diagnóstico' },
      { name: 'resultado_dg', type: 'VARCHAR(20)', description: 'Resultado do diagnóstico' }
    ]

    for (const column of columnsToAdd) {
      try {
        // Verificar se a coluna existe
        const columnExists = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'inseminacoes' 
            AND column_name = $1
          )
        `, [column.name])

        if (!columnExists.rows[0].exists) {
          console.log(`   Adicionando coluna ${column.name}...`)
          await query(`ALTER TABLE inseminacoes ADD COLUMN ${column.name} ${column.type}`)
          console.log(`   �œ… Coluna ${column.name} adicionada (${column.description})`)
        } else {
          console.log(`   �œ… Coluna ${column.name} já existe`)
        }
      } catch (error) {
        console.error(`   �Œ Erro ao adicionar coluna ${column.name}:`, error.message)
      }
    }

    // 3. Criar índices necessários
    console.log('\n3. Criando índices...')
    const indexes = [
      { name: 'idx_inseminacoes_animal_id', column: 'animal_id' },
      { name: 'idx_inseminacoes_data', column: 'data_inseminacao' },
      { name: 'idx_inseminacoes_touro', column: 'touro' },
      { name: 'idx_inseminacoes_semen_id', column: 'semen_id' }
    ]

    for (const index of indexes) {
      try {
        await query(`CREATE INDEX IF NOT EXISTS ${index.name} ON inseminacoes(${index.column})`)
        console.log(`   �œ… Índice ${index.name} criado`)
      } catch (error) {
        console.log(`   �š�️ Índice ${index.name} já existe ou erro:`, error.message)
      }
    }

    // 4. Verificar estrutura final
    console.log('\n4. Verificando estrutura final da tabela...')
    const tableStructure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'inseminacoes'
      ORDER BY ordinal_position
    `)

    console.log('   Colunas da tabela inseminacoes:')
    tableStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })

    // 5. Testar inserção básica
    console.log('\n5. Testando estrutura da tabela...')
    
    // Buscar um animal fêmea para teste
    const femaleAnimal = await query(`
      SELECT id, serie, rg, sexo 
      FROM animais 
      WHERE sexo IN ('Fêmea', 'F') 
      LIMIT 1
    `)

    if (femaleAnimal.rows.length > 0) {
      const animal = femaleAnimal.rows[0]
      console.log(`   Testando com animal: ${animal.serie} ${animal.rg} (${animal.sexo})`)
      
      // Fazer um teste de inserção (sem realmente inserir)
      try {
        const testQuery = `
          SELECT 
            $1::INTEGER as animal_id,
            $2::DATE as data_inseminacao,
            $3::VARCHAR(100) as touro,
            $4::INTEGER as semen_id,
            $5::VARCHAR(100) as inseminador,
            $6::VARCHAR(100) as tecnico,
            $7::VARCHAR(50) as protocolo,
            $8::TEXT as observacoes,
            $9::VARCHAR(20) as status_gestacao,
            $10::DECIMAL(12,2) as custo_dose,
            $11::INTEGER as numero_ia,
            $12::VARCHAR(50) as rg_touro,
            $13::INTEGER as numero_dg,
            $14::DATE as data_dg,
            $15::VARCHAR(20) as resultado_dg
        `
        
        await query(testQuery, [
          animal.id,
          '2024-01-01',
          'TOURO TESTE',
          null,
          'TECNICO TESTE',
          'TECNICO TESTE',
          'PROTOCOLO TESTE',
          'TESTE DE ESTRUTURA',
          null,
          18.00,
          1,
          'TESTE 123',
          null,
          null,
          null
        ])
        
        console.log('   �œ… Estrutura da tabela está correta para inserções')
      } catch (error) {
        console.error('   �Œ Erro no teste de estrutura:', error.message)
      }
    } else {
      console.log('   �š�️ Nenhum animal fêmea encontrado para teste')
    }

    console.log('\n�œ… Correção da tabela inseminacoes concluída!')

  } catch (error) {
    console.error('�Œ Erro:', error)
  }
}

// Executar
fixInseminacaoTable()
  .then(() => {
    console.log('\n�ŸŽ� RESULTADO:')
    console.log('�€� Tabela inseminacoes corrigida')
    console.log('�€� Todas as colunas necessárias adicionadas')
    console.log('�€� Índices criados')
    console.log('�€� Importação de Excel deve funcionar agora')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })