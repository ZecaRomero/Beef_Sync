#!/usr/bin/env node

/**
 * Script para popular o banco de dados com dados de teste
 * Este script adiciona animais, nascimentos, mortes e vendas para demonstrar os relatórios
 */

require('dotenv').config()
const { query, testConnection, closePool } = require('../lib/database')

async function populateSampleData() {
  console.log('🌱 Populando banco de dados com dados de teste...')
  
  try {
    // Testar conexão
    await testConnection()
    
    // 1. Adicionar animais de teste
    console.log('🐄 Adicionando animais de teste...')
    
    const animais = [
      {
        serie: 'BF',
        rg: 'BF001',
        sexo: 'Fêmea',
        raca: 'Nelore',
        data_nascimento: '2020-03-15',
        peso: 450.5,
        situacao: 'Ativo',
        observacoes: 'Matriz reprodutora'
      },
      {
        serie: 'TC',
        rg: 'TC002',
        sexo: 'Macho',
        raca: 'Angus',
        data_nascimento: '2019-08-22',
        peso: 680.0,
        situacao: 'Ativo',
        observacoes: 'Reprodutor principal'
      },
      {
        serie: 'EC',
        rg: 'EC003',
        sexo: 'Fêmea',
        raca: 'Brahman',
        data_nascimento: '2021-01-10',
        peso: 380.2,
        situacao: 'Ativo',
        observacoes: 'Novilha para reprodução'
      },
      {
        serie: 'RP',
        rg: 'RP004',
        sexo: 'Macho',
        raca: 'Nelore',
        data_nascimento: '2020-11-05',
        peso: 520.8,
        situacao: 'Ativo',
        observacoes: 'Touro jovem'
      },
      {
        serie: 'PR',
        rg: 'PR005',
        sexo: 'Fêmea',
        raca: 'Gir',
        data_nascimento: '2022-06-18',
        peso: 280.5,
        situacao: 'Ativo',
        observacoes: 'Bezerro desmamado'
      }
    ]
    
    for (const animal of animais) {
      const result = await query(`
        INSERT INTO animais (serie, rg, sexo, raca, data_nascimento, peso, situacao, observacoes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (serie, rg) DO NOTHING
        RETURNING id
      `, [animal.serie, animal.rg, animal.sexo, animal.raca, animal.data_nascimento, animal.peso, animal.situacao, animal.observacoes])
      
      if (result.rows.length > 0) {
        console.log(`  ✅ Animal adicionado: ${animal.serie} ${animal.rg}`)
      } else {
        console.log(`  ⚠️  Animal já existe: ${animal.serie} ${animal.rg}`)
      }
    }
    
    // 2. Adicionar nascimentos de teste
    console.log('👶 Adicionando nascimentos de teste...')
    
    const nascimentos = [
      {
        serie: 'BZ',
        rg: 'BZ001',
        sexo: 'M',
        data_nascimento: '2025-09-15',
        peso: 35.5,
        cor: 'Branco',
        tipo_nascimento: 'Normal',
        dificuldade_parto: 'Fácil',
        custo_nascimento: 150.00,
        veterinario: 'Dr. Silva',
        observacoes: 'Nascimento sem complicações'
      },
      {
        serie: 'BZ',
        rg: 'BZ002',
        sexo: 'F',
        data_nascimento: '2025-10-01',
        peso: 32.0,
        cor: 'Marrom',
        tipo_nascimento: 'Normal',
        dificuldade_parto: 'Fácil',
        custo_nascimento: 120.00,
        veterinario: 'Dr. Silva',
        observacoes: 'Bezerro saudável'
      },
      {
        serie: 'BZ',
        rg: 'BZ003',
        sexo: 'M',
        data_nascimento: '2025-10-10',
        peso: 38.2,
        cor: 'Preto',
        tipo_nascimento: 'Cesariana',
        dificuldade_parto: 'Difícil',
        custo_nascimento: 350.00,
        veterinario: 'Dr. Santos',
        observacoes: 'Parto complicado, mas bezerro saudável'
      }
    ]
    
    for (const nascimento of nascimentos) {
      const result = await query(`
        INSERT INTO nascimentos (
          serie, rg, sexo, data_nascimento, peso, cor, tipo_nascimento, dificuldade_parto, custo_nascimento, veterinario, observacoes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        nascimento.serie, nascimento.rg, nascimento.sexo,
        nascimento.data_nascimento, nascimento.peso, nascimento.cor, nascimento.tipo_nascimento, nascimento.dificuldade_parto, nascimento.custo_nascimento, nascimento.veterinario, nascimento.observacoes
      ])
      
      if (result.rows.length > 0) {
        console.log(`  ✅ Nascimento adicionado: ${nascimento.serie} ${nascimento.rg}`)
      } else {
        console.log(`  ⚠️  Nascimento já existe: ${nascimento.serie} ${nascimento.rg}`)
      }
    }
    
    // 3. Adicionar algumas mortes de teste
    console.log('💀 Adicionando mortes de teste...')
    
    const mortes = [
      {
        animal_serie: 'MORT',
        animal_rg: 'MORT001',
        data_morte: '2025-09-30',
        causa_morte: 'Doença',
        valor_perda: 1500.00,
        observacoes: 'Morte por complicações respiratórias'
      }
    ]
    
    for (const morte of mortes) {
      // Primeiro criar o animal que morreu
      await query(`
        INSERT INTO animais (serie, rg, sexo, raca, data_nascimento, peso, situacao, observacoes, created_at, updated_at)
        VALUES ($1, $2, 'Macho', 'Nelore', '2020-01-01', 420.0, 'Morto', 'Animal de teste', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (serie, rg) DO NOTHING
      `, [morte.animal_serie, morte.animal_rg])
      
      // Buscar o ID do animal
      const animalResult = await query(`
        SELECT id FROM animais WHERE serie = $1 AND rg = $2
      `, [morte.animal_serie, morte.animal_rg])
      
      if (animalResult.rows.length > 0) {
        const animalId = animalResult.rows[0].id
        
        // Depois registrar a morte
        const result = await query(`
          INSERT INTO mortes (animal_id, data_morte, causa_morte, valor_perda, observacoes, created_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
          RETURNING id
        `, [animalId, morte.data_morte, morte.causa_morte, morte.valor_perda, morte.observacoes])
        
        if (result.rows.length > 0) {
          console.log(`  ✅ Morte adicionada: ${morte.animal_serie} ${morte.animal_rg}`)
        } else {
          console.log(`  ⚠️  Morte já existe: ${morte.animal_serie} ${morte.animal_rg}`)
        }
      }
    }
    
    // 4. Pular vendas por enquanto (não há tabela de vendas no schema atual)
    console.log('💰 Pulando vendas (tabela não encontrada no schema atual)...')
    
    // 5. Verificar dados inseridos
    console.log('\n📊 Verificando dados inseridos...')
    
    const animaisCount = await query('SELECT COUNT(*) as count FROM animais')
    console.log(`🐄 Total de animais: ${animaisCount.rows[0].count}`)
    
    const nascimentosCount = await query('SELECT COUNT(*) as count FROM nascimentos')
    console.log(`👶 Total de nascimentos: ${nascimentosCount.rows[0].count}`)
    
    const mortesCount = await query('SELECT COUNT(*) as count FROM mortes')
    console.log(`💀 Total de mortes: ${mortesCount.rows[0].count}`)
    
    console.log('\n✅ Dados de teste inseridos com sucesso!')
    console.log('🎯 Agora você pode testar a geração de relatórios com dados reais.')
    
  } catch (error) {
    console.error('❌ Erro ao popular dados de teste:', error.message)
    throw error
  } finally {
    await closePool()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateSampleData()
    .then(() => {
      console.log('🏁 Script concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { populateSampleData }