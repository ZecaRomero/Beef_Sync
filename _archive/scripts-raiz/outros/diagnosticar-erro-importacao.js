/**
 * Script para diagnosticar erro de importação
 * Erro: "tipo no COMLSLSC text e numeric não podem corresponder"
 * 
 * Este script verifica:
 * 1. Tipos de dados das colunas serie e rg
 * 2. Valores problemáticos que podem causar erro de tipo
 * 3. Constraints e triggers que podem estar causando o problema
 */

const { pool } = require('./lib/database')

async function diagnosticar() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Iniciando diagnóstico...\n')
    
    // 1. Verificar tipos de dados das colunas
    console.log('1️⃣ Verificando tipos de dados das colunas serie e rg:')
    const tiposResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'animais' 
      AND column_name IN ('serie', 'rg')
      ORDER BY column_name
    `)
    
    console.table(tiposResult.rows)
    
    // 2. Verificar se há valores com letras no RG
    console.log('\n2️⃣ Verificando RGs com letras (não numéricos):')
    const rgsComLetras = await client.query(`
      SELECT serie, rg, COUNT(*) as quantidade
      FROM animais
      WHERE rg ~ '[A-Za-z]'
      GROUP BY serie, rg
      ORDER BY quantidade DESC
      LIMIT 10
    `)
    
    if (rgsComLetras.rows.length > 0) {
      console.log('   ⚠️ Encontrados RGs com letras:')
      console.table(rgsComLetras.rows)
    } else {
      console.log('   ✅ Nenhum RG com letras encontrado')
    }
    
    // 3. Verificar constraints
    console.log('\n3️⃣ Verificando constraints na tabela animais:')
    const constraints = await client.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'animais'::regclass
      ORDER BY conname
    `)
    
    if (constraints.rows.length > 0) {
      console.table(constraints.rows)
    } else {
      console.log('   ℹ️ Nenhuma constraint encontrada')
    }
    
    // 4. Verificar triggers
    console.log('\n4️⃣ Verificando triggers na tabela animais:')
    const triggers = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'animais'
      ORDER BY trigger_name
    `)
    
    if (triggers.rows.length > 0) {
      console.table(triggers.rows)
    } else {
      console.log('   ℹ️ Nenhum trigger encontrado')
    }
    
    // 5. Verificar índices
    console.log('\n5️⃣ Verificando índices na tabela animais:')
    const indices = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'animais'
      ORDER BY indexname
    `)
    
    if (indices.rows.length > 0) {
      console.table(indices.rows)
    } else {
      console.log('   ℹ️ Nenhum índice encontrado')
    }
    
    // 6. Testar inserção de um animal com RG contendo letras
    console.log('\n6️⃣ Testando inserção de animal com RG contendo letras:')
    try {
      const testResult = await client.query(`
        INSERT INTO animais (serie, rg, nome, sexo, raca, situacao)
        VALUES ('TEST', 'Lc CJCJ 17039', 'Animal Teste', 'Macho', 'Nelore', 'Ativo')
        RETURNING id, serie, rg
      `)
      
      console.log('   ✅ Inserção bem-sucedida:')
      console.table(testResult.rows)
      
      // Limpar teste
      await client.query('DELETE FROM animais WHERE serie = $1 AND rg = $2', ['TEST', 'Lc CJCJ 17039'])
      console.log('   🧹 Animal de teste removido')
      
    } catch (error) {
      console.log('   ❌ Erro ao inserir:')
      console.log('   Código:', error.code)
      console.log('   Mensagem:', error.message)
      console.log('   Detalhe:', error.detail)
    }
    
    console.log('\n✅ Diagnóstico concluído!')
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

diagnosticar()
