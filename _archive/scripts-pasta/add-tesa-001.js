const { Pool } = require('pg')

// Configuração do banco de dados
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function adicionarTESA001() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('🐄 Adicionando fêmea TESA 001...')
    
    // 1. Inserir o animal TESA 001
    const animalResult = await client.query(`
      INSERT INTO animais (
        serie, 
        rg, 
        sexo, 
        raca, 
        data_nascimento, 
        peso, 
        situacao,
        created_at
      ) VALUES (
        'TESA', 
        '001', 
        'Fêmea', 
        'Nelore', 
        '2022-03-15', 
        450.5, 
        'Ativo',
        NOW()
      ) 
      RETURNING id
    `)
    
    const animalId = animalResult.rows[0].id
    console.log(`✅ Animal TESA 001 criado com ID: ${animalId}`)
    
    // 2. Adicionar histórico de movimentação
    console.log('📍 Adicionando histórico de movimentação...')
    
    // Primeira localização: Piquete 01 (01/10/2025 - IA)
    await client.query(`
      INSERT INTO localizacoes_animais (
        animal_id,
        piquete,
        data_entrada,
        data_saida,
        motivo_movimentacao,
        observacoes,
        usuario_responsavel,
        created_at,
        updated_at
      ) VALUES (
        $1,
        'Piquete 01',
        '2025-10-01',
        '2025-10-10',
        'Inseminação Artificial',
        'Animal movido para piquete de IA. Procedimento realizado no mesmo dia.',
        'Sistema',
        NOW(),
        NOW()
      )
    `, [animalId])
    
    console.log('✅ Localização 1: Piquete 01 (01/10/2025 - 10/10/2025)')
    
    // Segunda localização: Piquete 02 (10/10/2025 - atual)
    await client.query(`
      INSERT INTO localizacoes_animais (
        animal_id,
        piquete,
        data_entrada,
        data_saida,
        motivo_movimentacao,
        observacoes,
        usuario_responsavel,
        created_at,
        updated_at
      ) VALUES (
        $1,
        'Piquete 02',
        '2025-10-10',
        NULL,
        'Pós-IA',
        'Animal transferido para piquete de acompanhamento pós-inseminação.',
        'Sistema',
        NOW(),
        NOW()
      )
    `, [animalId])
    
    console.log('✅ Localização 2: Piquete 02 (10/10/2025 - atual)')
    
    await client.query('COMMIT')
    
    console.log('\n🎉 TESA 001 adicionada com sucesso!')
    console.log('📋 Resumo:')
    console.log(`   • Animal: TESA 001 (ID: ${animalId})`)
    console.log('   • Raça: Nelore')
    console.log('   • Sexo: Fêmea')
    console.log('   • Situação: Ativo')
    console.log('   • Localização atual: Piquete 02')
    console.log('   • Histórico: 2 movimentações registradas')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao adicionar TESA 001:', error)
    throw error
  } finally {
    client.release()
  }
}

async function verificarTESA001() {
  const client = await pool.connect()
  
  try {
    console.log('\n🔍 Verificando dados da TESA 001...')
    
    // Buscar animal
    const animalResult = await client.query(`
      SELECT * FROM animais 
      WHERE serie = 'TESA' AND rg = '001'
    `)
    
    if (animalResult.rows.length === 0) {
      console.log('❌ Animal TESA 001 não encontrado')
      return
    }
    
    const animal = animalResult.rows[0]
    console.log('✅ Animal encontrado:', {
      id: animal.id,
      serie: animal.serie,
      rg: animal.rg,
      sexo: animal.sexo,
      raca: animal.raca,
      situacao: animal.situacao
    })
    
    // Buscar localizações
    const localizacoesResult = await client.query(`
      SELECT 
        l.*,
        a.serie,
        a.rg
      FROM localizacoes_animais l
      JOIN animais a ON l.animal_id = a.id
      WHERE a.serie = 'TESA' AND a.rg = '001'
      ORDER BY l.data_entrada
    `)
    
    console.log(`✅ Localizações encontradas: ${localizacoesResult.rows.length}`)
    localizacoesResult.rows.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.piquete} (${loc.data_entrada} - ${loc.data_saida || 'atual'})`)
      console.log(`      Motivo: ${loc.motivo_movimentacao}`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar TESA 001:', error)
  } finally {
    client.release()
  }
}

async function main() {
  try {
    // Verificar se já existe
    const client = await pool.connect()
    const existeResult = await client.query(`
      SELECT id FROM animais 
      WHERE serie = 'TESA' AND rg = '001'
    `)
    client.release()
    
    if (existeResult.rows.length > 0) {
      console.log('⚠️  TESA 001 já existe no banco de dados')
      await verificarTESA001()
    } else {
      await adicionarTESA001()
      await verificarTESA001()
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  } finally {
    await pool.end()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = { adicionarTESA001, verificarTESA001 }