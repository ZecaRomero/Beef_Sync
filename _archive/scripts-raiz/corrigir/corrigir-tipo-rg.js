/**
 * Script para diagnosticar e corrigir problema de tipo na coluna RG
 * Executa verificações e correções automáticas
 */

const { Pool } = require('pg')
require('dotenv').config()

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
  user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function diagnosticarECorrigir() {
  const client = await pool.connect()
  
  try {
    console.log('�Ÿ”� Iniciando diagnóstico e correção...\n')
    
    // 1. Verificar tipo da coluna RG
    console.log('1️�ƒ� Verificando tipo da coluna RG:')
    const tipoRG = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'animais' 
      AND column_name = 'rg'
    `)
    
    if (tipoRG.rows.length === 0) {
      console.log('   �Œ Coluna RG não encontrada!')
      return
    }
    
    const coluna = tipoRG.rows[0]
    console.log(`   Tipo: ${coluna.data_type}`)
    console.log(`   Tamanho máximo: ${coluna.character_maximum_length || 'N/A'}`)
    console.log(`   Permite NULL: ${coluna.is_nullable}`)
    
    // Verificar se o tipo está correto
    if (coluna.data_type !== 'character varying' && coluna.data_type !== 'varchar' && coluna.data_type !== 'text') {
      console.log(`\n   �š�️ PROBLEMA ENCONTRADO: Coluna RG tem tipo ${coluna.data_type} ao invés de VARCHAR!`)
      console.log('   �Ÿ”� Tentando corrigir...')
      
      try {
        await client.query('ALTER TABLE animais ALTER COLUMN rg TYPE VARCHAR(20)')
        console.log('   �œ… Tipo da coluna RG corrigido para VARCHAR(20)')
      } catch (error) {
        console.log('   �Œ Erro ao corrigir tipo:', error.message)
        console.log('   �Ÿ’� Você pode precisar fazer backup e recriar a tabela')
      }
    } else {
      console.log('   �œ… Tipo da coluna RG está correto (VARCHAR)')
    }
    
    // 2. Verificar RGs problemáticos
    console.log('\n2️�ƒ� Verificando RGs com caracteres especiais:')
    const rgsProblematicos = await client.query(`
      SELECT 
        id,
        serie,
        rg,
        CASE 
          WHEN rg ~ '[A-Za-z]' THEN 'Contém letras'
          WHEN rg ~ '\\s\\s+' THEN 'Contém espaços múltiplos'
          WHEN LENGTH(rg) > 20 THEN 'Muito longo'
          ELSE 'OK'
        END as problema
      FROM animais
      WHERE rg ~ '[A-Za-z]' OR rg ~ '\\s\\s+' OR LENGTH(rg) > 20
      ORDER BY id
      LIMIT 10
    `)
    
    if (rgsProblematicos.rows.length > 0) {
      console.log(`   �š�️ Encontrados ${rgsProblematicos.rows.length} RGs com problemas:`)
      rgsProblematicos.rows.forEach(row => {
        console.log(`   - ID ${row.id}: ${row.serie}-${row.rg} (${row.problema})`)
      })
      
      console.log('\n   �Ÿ’� Estes RGs são válidos, mas podem causar problemas em algumas queries')
      console.log('   �Ÿ’� Considere padronizar o formato no Excel antes de importar')
    } else {
      console.log('   �œ… Nenhum RG problemático encontrado')
    }
    
    // 3. Verificar índices
    console.log('\n3️�ƒ� Verificando índices na coluna RG:')
    const indices = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'animais'
      AND indexdef LIKE '%rg%'
      ORDER BY indexname
    `)
    
    if (indices.rows.length > 0) {
      console.log(`   Encontrados ${indices.rows.length} índices:`)
      indices.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`)
        
        // Verificar se há CAST problemático
        if (idx.indexdef.includes('CAST') && idx.indexdef.includes('integer')) {
          console.log(`     �š�️ PROBLEMA: Índice faz CAST para INTEGER!`)
          console.log(`     �Ÿ”� Recomendado remover e recriar: DROP INDEX ${idx.indexname};`)
        }
      })
    } else {
      console.log('   �„�️ Nenhum índice específico para RG encontrado')
    }
    
    // 4. Verificar triggers
    console.log('\n4️�ƒ� Verificando triggers:')
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
      console.log(`   Encontrados ${triggers.rows.length} triggers:`)
      triggers.rows.forEach(trg => {
        console.log(`   - ${trg.trigger_name} (${trg.event_manipulation})`)
      })
    } else {
      console.log('   �œ… Nenhum trigger encontrado')
    }
    
    // 5. Teste de inserção
    console.log('\n5️�ƒ� Testando inserção de RG com letras:')
    try {
      await client.query('BEGIN')
      
      const testResult = await client.query(`
        INSERT INTO animais (serie, rg, nome, sexo, raca, situacao)
        VALUES ('TEST', 'Lc CJCJ 17039', 'Animal Teste', 'Macho', 'Nelore', 'Ativo')
        RETURNING id, serie, rg
      `)
      
      console.log('   �œ… Inserção bem-sucedida!')
      console.log(`   ID: ${testResult.rows[0].id}, RG: ${testResult.rows[0].rg}`)
      
      await client.query('ROLLBACK')
      console.log('   �Ÿ�� Teste revertido (ROLLBACK)')
      
    } catch (error) {
      await client.query('ROLLBACK')
      console.log('   �Œ Erro ao inserir:')
      console.log(`   Código: ${error.code}`)
      console.log(`   Mensagem: ${error.message}`)
      
      if (error.message.includes('COMLSLSC') || error.message.includes('text') && error.message.includes('numeric')) {
        console.log('\n   �Ÿ”� CAUSA IDENTIFICADA: Há uma comparação ou conversão de tipo problemática')
        console.log('   �Ÿ’� Verifique se há constraints, triggers ou índices que fazem CAST para INTEGER')
      }
    }
    
    console.log('\n�œ… Diagnóstico concluído!')
    console.log('\n�Ÿ“‹ Resumo:')
    console.log('   - Tipo da coluna RG:', coluna.data_type)
    console.log('   - RGs problemáticos:', rgsProblematicos.rows.length)
    console.log('   - Índices encontrados:', indices.rows.length)
    console.log('   - Triggers encontrados:', triggers.rows.length)
    
  } catch (error) {
    console.error('�Œ Erro durante diagnóstico:', error)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar
diagnosticarECorrigir().catch(console.error)
