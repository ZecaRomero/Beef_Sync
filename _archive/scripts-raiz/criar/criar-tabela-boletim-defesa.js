/**
 * Script para criar tabela do Boletim Defesa
 */

const { Client } = require('pg')

async function criarTabelaBoletimDefesa() {
  const client = new Client({
    connectionString: 'postgres://postgres:jcromero85@localhost:5432/beef_sync'
  })

  try {
    await client.connect()
    console.log('✅ Conectado ao banco de dados\n')

    console.log('📋 Criando tabela boletim_defesa_fazendas...\n')

    await client.query(`
      CREATE TABLE IF NOT EXISTS boletim_defesa_fazendas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(50) NOT NULL UNIQUE,
        quantidades JSONB DEFAULT '{
          "0a3": {"M": 0, "F": 0},
          "3a8": {"M": 0, "F": 0},
          "8a12": {"M": 0, "F": 0},
          "12a24": {"M": 0, "F": 0},
          "25a36": {"M": 0, "F": 0},
          "acima36": {"M": 0, "F": 0}
        }'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    console.log('✅ Tabela boletim_defesa_fazendas criada com sucesso!\n')

    // Criar índices
    console.log('📋 Criando índices...\n')

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_boletim_defesa_cnpj 
      ON boletim_defesa_fazendas(cnpj)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_boletim_defesa_nome 
      ON boletim_defesa_fazendas(nome)
    `)

    console.log('✅ Índices criados com sucesso!\n')

    // Inserir dados de exemplo (baseado na imagem)
    console.log('📋 Inserindo dados de exemplo...\n')

    await client.query(`
      INSERT INTO boletim_defesa_fazendas (nome, cnpj, quantidades)
      VALUES 
        (
          'FAZENDA SANT ANNA - RANCHARIA',
          'CNPJ 44.017.440/0010-18',
          '{
            "0a3": {"M": 158, "F": 142},
            "3a8": {"M": 180, "F": 117},
            "8a12": {"M": 34, "F": 145},
            "12a24": {"M": 94, "F": 27},
            "25a36": {"M": 23, "F": 357},
            "acima36": {"M": 1, "F": 17}
          }'::jsonb
        ),
        (
          'AGROPECUÁRIA PARDINHO LTDA',
          'CNPJ 18.978.214/0004-45',
          '{
            "0a3": {"M": 0, "F": 0},
            "3a8": {"M": 218, "F": 105},
            "8a12": {"M": 0, "F": 163},
            "12a24": {"M": 25, "F": 442},
            "25a36": {"M": 1, "F": 339},
            "acima36": {"M": 0, "F": 110}
          }'::jsonb
        )
      ON CONFLICT (cnpj) DO NOTHING
    `)

    console.log('✅ Dados de exemplo inseridos com sucesso!\n')

    console.log('=' .repeat(60))
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('=' .repeat(60))
    console.log('\n📊 Estrutura criada:')
    console.log('   - Tabela: boletim_defesa_fazendas')
    console.log('   - Índices: cnpj, nome')
    console.log('   - Dados de exemplo: 2 fazendas\n')

  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Executar
criarTabelaBoletimDefesa()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })
