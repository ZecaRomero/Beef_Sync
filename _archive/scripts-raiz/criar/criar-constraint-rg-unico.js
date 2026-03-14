const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function criarConstraint() {
  try {
    console.log('�Ÿ”� Criando constraint para evitar RGs duplicados...\n')

    // 1. Primeiro, verificar se já existem duplicatas
    console.log('�Ÿ“Š Verificando duplicatas existentes...')
    const duplicatas = await pool.query(`
      SELECT rg, serie, COUNT(*) as total
      FROM animais
      WHERE rg IS NOT NULL AND rg != ''
      GROUP BY rg, serie
      HAVING COUNT(*) > 1
      ORDER BY total DESC, rg
    `)

    if (duplicatas.rows.length > 0) {
      console.log(`\n�š�️ Encontradas ${duplicatas.rows.length} combinações duplicadas:`)
      duplicatas.rows.forEach(d => {
        console.log(`   - Série "${d.serie || '(vazio)'}", RG "${d.rg}": ${d.total} animais`)
      })
      console.log('\n�Œ ERRO: Não posso criar a constraint com duplicatas existentes!')
      console.log('Execute primeiro um script para limpar as duplicatas.\n')
      return
    }

    console.log('�œ… Nenhuma duplicata encontrada!\n')

    // 2. Verificar se a constraint já existe
    const constraintExiste = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'animais' 
      AND constraint_name = 'animais_serie_rg_unique'
    `)

    if (constraintExiste.rows.length > 0) {
      console.log('�š�️ Constraint já existe! Removendo para recriar...')
      await pool.query(`
        ALTER TABLE animais 
        DROP CONSTRAINT IF EXISTS animais_serie_rg_unique
      `)
      console.log('�œ… Constraint antiga removida.\n')
    }

    // 3. Criar a constraint UNIQUE para S�‰RIE + RG
    console.log('�Ÿ“� Criando constraint UNIQUE para (S�‰RIE, RG)...')
    await pool.query(`
      ALTER TABLE animais 
      ADD CONSTRAINT animais_serie_rg_unique 
      UNIQUE (serie, rg)
    `)

    console.log('�œ… Constraint criada com sucesso!\n')

    // 4. Testar a constraint
    console.log('�Ÿ�� Testando a constraint...')
    try {
      await pool.query(`
        INSERT INTO animais (nome, serie, rg, sexo, raca, situacao)
        VALUES ('TESTE DUPLICATA', 'M', '8251', 'Fêmea', 'Receptora', 'Ativo')
      `)
      console.log('�Œ ERRO: Constraint não está funcionando! Consegui inserir duplicata.')
    } catch (error) {
      if (error.message.includes('animais_serie_rg_unique')) {
        console.log('�œ… Constraint funcionando! Tentativa de inserir duplicata foi bloqueada.')
        console.log(`   Erro: ${error.message.split('\n')[0]}\n`)
      } else {
        console.log('�š�️ Erro inesperado:', error.message)
      }
    }

    // 5. Informações finais
    console.log('�Ÿ“‹ Informações da Constraint:')
    console.log('   Nome: animais_serie_rg_unique')
    console.log('   Tipo: UNIQUE')
    console.log('   Colunas: (serie, rg)')
    console.log('   Efeito: Impede que dois animais tenham a mesma combinação de S�‰RIE + RG')
    console.log('\n�œ… Agora o banco de dados vai bloquear automaticamente duplicatas!')
    console.log('   Quando tentar criar um animal com S�‰RIE + RG já existente,')
    console.log('   o banco vai retornar um erro e não vai permitir a inserção.\n')

  } catch (error) {
    console.error('�Œ Erro:', error.message)
    console.error(error.stack)
  } finally {
    await pool.end()
  }
}

criarConstraint()
