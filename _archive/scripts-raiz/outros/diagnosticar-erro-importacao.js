/**
 * Script para diagnosticar erro de importa√ß√£o
 * Erro: "tipo no COMLSLSC text e numeric n√£o podem corresponder"
 * 
 * Este script verifica:
 * 1. Tipos de dados das colunas serie e rg
 * 2. Valores problem√°ticos que podem causar erro de tipo
 * 3. Constraints e triggers que podem estar causando o problema
 */

const { pool } = require('./lib/database')

async function diagnosticar() {
  const client = await pool.connect()
  
  try {
    console.log('≈∏‚Äùç Iniciando diagn√≥stico...\n')
    
    // 1. Verificar tipos de dados das colunas
    console.log('1Ô∏è‚∆í£ Verificando tipos de dados das colunas serie e rg:')
    const tiposResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'animais' 
      AND column_name IN ('serie', 'rg')
      ORDER BY column_name
    `)
    
    console.table(tiposResult.rows)
    
    // 2. Verificar se h√° valores com letras no RG
    console.log('\n2Ô∏è‚∆í£ Verificando RGs com letras (n√£o num√©ricos):')
    const rgsComLetras = await client.query(`
      SELECT serie, rg, COUNT(*) as quantidade
      FROM animais
      WHERE rg ~ '[A-Za-z]'
      GROUP BY serie, rg
      ORDER BY quantidade DESC
      LIMIT 10
    `)
    
    if (rgsComLetras.rows.length > 0) {
      console.log('   ‚≈°†Ô∏è Encontrados RGs com letras:')
      console.table(rgsComLetras.rows)
    } else {
      console.log('   ‚≈ì‚Ä¶ Nenhum RG com letras encontrado')
    }
    
    // 3. Verificar constraints
    console.log('\n3Ô∏è‚∆í£ Verificando constraints na tabela animais:')
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
      console.log('   ‚‚ÄûπÔ∏è Nenhuma constraint encontrada')
    }
    
    // 4. Verificar triggers
    console.log('\n4Ô∏è‚∆í£ Verificando triggers na tabela animais:')
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
      console.log('   ‚‚ÄûπÔ∏è Nenhum trigger encontrado')
    }
    
    // 5. Verificar √≠ndices
    console.log('\n5Ô∏è‚∆í£ Verificando √≠ndices na tabela animais:')
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
      console.log('   ‚‚ÄûπÔ∏è Nenhum √≠ndice encontrado')
    }
    
    // 6. Testar inser√ß√£o de um animal com RG contendo letras
    console.log('\n6Ô∏è‚∆í£ Testando inser√ß√£o de animal com RG contendo letras:')
    try {
      const testResult = await client.query(`
        INSERT INTO animais (serie, rg, nome, sexo, raca, situacao)
        VALUES ('TEST', 'Lc CJCJ 17039', 'Animal Teste', 'Macho', 'Nelore', 'Ativo')
        RETURNING id, serie, rg
      `)
      
      console.log('   ‚≈ì‚Ä¶ Inser√ß√£o bem-sucedida:')
      console.table(testResult.rows)
      
      // Limpar teste
      await client.query('DELETE FROM animais WHERE serie = $1 AND rg = $2', ['TEST', 'Lc CJCJ 17039'])
      console.log('   ≈∏ßπ Animal de teste removido')
      
    } catch (error) {
      console.log('   ‚ù≈í Erro ao inserir:')
      console.log('   C√≥digo:', error.code)
      console.log('   Mensagem:', error.message)
      console.log('   Detalhe:', error.detail)
    }
    
    console.log('\n‚≈ì‚Ä¶ Diagn√≥stico conclu√≠do!')
    
  } catch (error) {
    console.error('‚ù≈í Erro durante diagn√≥stico:', error)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

diagnosticar()
