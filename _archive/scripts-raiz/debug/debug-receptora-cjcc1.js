#!/usr/bin/env node

/**
 * Script para debugar o campo receptora do animal CJCC 1
 */

const { query } = require('./lib/database')

async function debugReceptoraCJCC1() {
  console.log('�Ÿ”� Verificando campo receptora do animal CJCC 1...\n')

  try {
    // 1. Buscar animal CJCC 1 diretamente no banco
    console.log('1. Buscando animal CJCC 1 no banco de dados:')
    const result = await query(`
      SELECT id, serie, rg, nome, receptora, created_at, updated_at
      FROM animais 
      WHERE serie = 'CJCC' AND rg = '1'
      ORDER BY id DESC
      LIMIT 5
    `)
    
    if (result.rows.length > 0) {
      console.log(`   �œ… Encontrados ${result.rows.length} registros:`)
      result.rows.forEach((animal, index) => {
        console.log(`   ${index + 1}. ID: ${animal.id}`)
        console.log(`      Série: ${animal.serie}`)
        console.log(`      RG: ${animal.rg}`)
        console.log(`      Nome: ${animal.nome || 'Não informado'}`)
        console.log(`      Receptora: "${animal.receptora || 'NULL/VAZIO'}"`)
        console.log(`      Criado em: ${animal.created_at}`)
        console.log(`      Atualizado em: ${animal.updated_at}`)
        console.log('')
      })
    } else {
      console.log('   �Œ Nenhum animal CJCC 1 encontrado')
    }

    // 2. Verificar se há dados na planilha de importação
    console.log('2. Verificando dados de importação recentes:')
    const importRecent = await query(`
      SELECT * FROM animais 
      WHERE serie = 'CJCC' AND rg = '1'
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY created_at DESC
    `)
    
    if (importRecent.rows.length > 0) {
      console.log(`   �œ… Encontrados ${importRecent.rows.length} registros importados nos últimos 7 dias:`)
      importRecent.rows.forEach((animal, index) => {
        console.log(`   ${index + 1}. Receptora: "${animal.receptora || 'VAZIO'}"`)
        console.log(`      Criado: ${animal.created_at}`)
      })
    } else {
      console.log('   �Œ Nenhuma importação recente encontrada')
    }

    // 3. Verificar estrutura da tabela
    console.log('3. Verificando estrutura da coluna receptora:')
    const structure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'animais' AND column_name = 'receptora'
    `)
    
    if (structure.rows.length > 0) {
      const col = structure.rows[0]
      console.log(`   �œ… Coluna encontrada:`)
      console.log(`      Nome: ${col.column_name}`)
      console.log(`      Tipo: ${col.data_type}`)
      console.log(`      Permite NULL: ${col.is_nullable}`)
      console.log(`      Padrão: ${col.column_default || 'Nenhum'}`)
    } else {
      console.log('   �Œ Coluna receptora não encontrada na tabela animais')
    }

    // 4. Testar busca via API simulada
    console.log('4. Testando busca como a API faria:')
    const apiTest = await query(`
      SELECT 
        a.*,
        COALESCE(
          (SELECT SUM(valor) FROM custos WHERE animal_id = a.id),
          0
        ) as custo_total_calculado
      FROM animais a
      WHERE serie = 'CJCC' AND rg = '1'
      ORDER BY id DESC
      LIMIT 1
    `)
    
    if (apiTest.rows.length > 0) {
      const animal = apiTest.rows[0]
      console.log(`   �œ… Resultado da consulta API:`)
      console.log(`      ID: ${animal.id}`)
      console.log(`      Receptora: "${animal.receptora || 'VAZIO'}"`)
      console.log(`      Todos os campos receptora-relacionados:`)
      
      // Verificar todos os campos que podem conter "receptora"
      Object.keys(animal).forEach(key => {
        if (key.toLowerCase().includes('recept')) {
          console.log(`        ${key}: "${animal[key] || 'VAZIO'}"`)
        }
      })
    } else {
      console.log('   �Œ Nenhum resultado na consulta API')
    }

    // 5. Verificar se há dados na planilha original (RZE72304)
    console.log('5. Verificando se RZE72304 está no campo receptora:')
    const receptoraSearch = await query(`
      SELECT id, serie, rg, receptora, created_at
      FROM animais 
      WHERE receptora ILIKE '%RZE72304%' OR receptora ILIKE '%72304%'
      ORDER BY created_at DESC
    `)
    
    if (receptoraSearch.rows.length > 0) {
      console.log(`   �œ… Encontrados ${receptoraSearch.rows.length} animais com RZE72304:`)
      receptoraSearch.rows.forEach((animal, index) => {
        console.log(`   ${index + 1}. ${animal.serie} ${animal.rg} - Receptora: "${animal.receptora}"`)
      })
    } else {
      console.log('   �Œ RZE72304 não encontrado em nenhum campo receptora')
    }

    console.log('\n�œ… Verificação concluída!')

  } catch (error) {
    console.error('�Œ Erro durante verificação:', error)
  }
}

// Executar
debugReceptoraCJCC1()
  .then(() => {
    console.log('\n�ŸŽ� DIAGN�“STICO:')
    console.log('1. Verifique se o campo receptora está preenchido no banco')
    console.log('2. Se estiver vazio, o problema é na importação')
    console.log('3. Se estiver preenchido, o problema é na API ou frontend')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })