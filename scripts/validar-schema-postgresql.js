#!/usr/bin/env node

/**
 * Script de ValidaÃ§Ã£o do Schema PostgreSQL
 * 
 * Este script verifica se todas as tabelas necessÃ¡rias existem e
 * se possuem as colunas corretas com os tipos adequados.
 */

const { pool, testConnection } = require('../lib/database')
const { logger } = require('../utils/logger')

// Schema esperado do banco de dados
const SCHEMA_ESPERADO = {
  animais: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'serie', tipo: 'character varying', nullable: false },
      { nome: 'rg', tipo: 'character varying', nullable: false },
      { nome: 'tatuagem', tipo: 'character varying', nullable: true },
      { nome: 'sexo', tipo: 'character varying', nullable: false },
      { nome: 'raca', tipo: 'character varying', nullable: false },
      { nome: 'data_nascimento', tipo: 'date', nullable: true },
      { nome: 'hora_nascimento', tipo: 'time without time zone', nullable: true },
      { nome: 'peso', tipo: 'numeric', nullable: true },
      { nome: 'cor', tipo: 'character varying', nullable: true },
      { nome: 'tipo_nascimento', tipo: 'character varying', nullable: true },
      { nome: 'dificuldade_parto', tipo: 'character varying', nullable: true },
      { nome: 'meses', tipo: 'integer', nullable: true },
      { nome: 'situacao', tipo: 'character varying', nullable: true },
      { nome: 'pai', tipo: 'character varying', nullable: true },
      { nome: 'mae', tipo: 'character varying', nullable: true },
      { nome: 'receptora', tipo: 'character varying', nullable: true },
      { nome: 'is_fiv', tipo: 'boolean', nullable: true },
      { nome: 'custo_total', tipo: 'numeric', nullable: true },
      { nome: 'valor_venda', tipo: 'numeric', nullable: true },
      { nome: 'valor_real', tipo: 'numeric', nullable: true },
      { nome: 'veterinario', tipo: 'character varying', nullable: true },
      { nome: 'observacoes', tipo: 'text', nullable: true },
      { nome: 'created_at', tipo: 'timestamp without time zone', nullable: true },
      { nome: 'updated_at', tipo: 'timestamp without time zone', nullable: true }
    ],
    indices: ['idx_animais_serie_rg', 'idx_animais_situacao', 'idx_animais_raca']
  },
  
  custos: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'animal_id', tipo: 'integer', nullable: false },
      { nome: 'tipo', tipo: 'character varying', nullable: false },
      { nome: 'subtipo', tipo: 'character varying', nullable: true },
      { nome: 'valor', tipo: 'numeric', nullable: false },
      { nome: 'data', tipo: 'date', nullable: false },
      { nome: 'observacoes', tipo: 'text', nullable: true },
      { nome: 'detalhes', tipo: 'jsonb', nullable: true },
      { nome: 'data_registro', tipo: 'timestamp without time zone', nullable: true }
    ],
    indices: ['idx_custos_animal_id']
  },
  
  localizacoes_animais: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'animal_id', tipo: 'integer', nullable: false },
      { nome: 'piquete', tipo: 'character varying', nullable: false },
      { nome: 'data_entrada', tipo: 'date', nullable: false },
      { nome: 'data_saida', tipo: 'date', nullable: true },
      { nome: 'motivo_movimentacao', tipo: 'character varying', nullable: true },
      { nome: 'observacoes', tipo: 'text', nullable: true },
      { nome: 'usuario_responsavel', tipo: 'character varying', nullable: true },
      { nome: 'created_at', tipo: 'timestamp without time zone', nullable: true },
      { nome: 'updated_at', tipo: 'timestamp without time zone', nullable: true }
    ],
    indices: ['idx_localizacoes_animal_id', 'idx_localizacoes_piquete', 'idx_localizacoes_data_entrada']
  },
  
  gestacoes: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'pai_serie', tipo: 'character varying', nullable: true },
      { nome: 'pai_rg', tipo: 'character varying', nullable: true },
      { nome: 'mae_serie', tipo: 'character varying', nullable: true },
      { nome: 'mae_rg', tipo: 'character varying', nullable: true },
      { nome: 'receptora_nome', tipo: 'character varying', nullable: true },
      { nome: 'receptora_serie', tipo: 'character varying', nullable: true },
      { nome: 'receptora_rg', tipo: 'character varying', nullable: true },
      { nome: 'data_cobertura', tipo: 'date', nullable: false },
      { nome: 'custo_acumulado', tipo: 'numeric', nullable: true },
      { nome: 'situacao', tipo: 'character varying', nullable: true },
      { nome: 'observacoes', tipo: 'text', nullable: true },
      { nome: 'created_at', tipo: 'timestamp without time zone', nullable: true },
      { nome: 'updated_at', tipo: 'timestamp without time zone', nullable: true }
    ],
    indices: ['idx_gestacoes_situacao']
  },
  
  estoque_semen: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'nome_touro', tipo: 'character varying', nullable: false },
      { nome: 'rg_touro', tipo: 'character varying', nullable: true },
      { nome: 'raca', tipo: 'character varying', nullable: true },
      { nome: 'localizacao', tipo: 'character varying', nullable: true },
      { nome: 'rack_touro', tipo: 'character varying', nullable: true },
      { nome: 'botijao', tipo: 'character varying', nullable: true },
      { nome: 'caneca', tipo: 'character varying', nullable: true },
      { nome: 'tipo_operacao', tipo: 'character varying', nullable: true },
      { nome: 'fornecedor', tipo: 'character varying', nullable: true },
      { nome: 'destino', tipo: 'character varying', nullable: true },
      { nome: 'numero_nf', tipo: 'character varying', nullable: true },
      { nome: 'valor_compra', tipo: 'numeric', nullable: true },
      { nome: 'data_compra', tipo: 'date', nullable: true },
      { nome: 'quantidade_doses', tipo: 'integer', nullable: true },
      { nome: 'doses_disponiveis', tipo: 'integer', nullable: true },
      { nome: 'doses_usadas', tipo: 'integer', nullable: true },
      { nome: 'certificado', tipo: 'character varying', nullable: true },
      { nome: 'data_validade', tipo: 'date', nullable: true },
      { nome: 'origem', tipo: 'character varying', nullable: true },
      { nome: 'linhagem', tipo: 'character varying', nullable: true },
      { nome: 'observacoes', tipo: 'text', nullable: true },
      { nome: 'status', tipo: 'character varying', nullable: true },
      { nome: 'created_at', tipo: 'timestamp without time zone', nullable: true },
      { nome: 'updated_at', tipo: 'timestamp without time zone', nullable: true }
    ],
    indices: ['idx_semen_status', 'idx_semen_nome_touro']
  },
  
  mortes: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'animal_id', tipo: 'integer', nullable: true },
      { nome: 'data_morte', tipo: 'date', nullable: false },
      { nome: 'causa_morte', tipo: 'character varying', nullable: false },
      { nome: 'observacoes', tipo: 'text', nullable: true },
      { nome: 'valor_perda', tipo: 'numeric', nullable: true },
      { nome: 'created_at', tipo: 'timestamp without time zone', nullable: true }
    ]
  },
  
  causas_morte: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'causa', tipo: 'character varying', nullable: false },
      { nome: 'created_at', tipo: 'timestamp without time zone', nullable: true }
    ]
  },
  
  nascimentos: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'gestacao_id', tipo: 'integer', nullable: true },
      { nome: 'serie', tipo: 'character varying', nullable: false },
      { nome: 'rg', tipo: 'character varying', nullable: false },
      { nome: 'sexo', tipo: 'character varying', nullable: false },
      { nome: 'data_nascimento', tipo: 'date', nullable: false },
      { nome: 'hora_nascimento', tipo: 'time without time zone', nullable: true },
      { nome: 'peso', tipo: 'numeric', nullable: true },
      { nome: 'cor', tipo: 'character varying', nullable: true },
      { nome: 'tipo_nascimento', tipo: 'character varying', nullable: true },
      { nome: 'dificuldade_parto', tipo: 'character varying', nullable: true },
      { nome: 'custo_nascimento', tipo: 'numeric', nullable: true },
      { nome: 'veterinario', tipo: 'character varying', nullable: true },
      { nome: 'observacoes', tipo: 'text', nullable: true },
      { nome: 'created_at', tipo: 'timestamp without time zone', nullable: true }
    ]
  },
  
  lotes_operacoes: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'numero_lote', tipo: 'character varying', nullable: false },
      { nome: 'tipo_operacao', tipo: 'character varying', nullable: false },
      { nome: 'descricao', tipo: 'text', nullable: false },
      { nome: 'detalhes', tipo: 'jsonb', nullable: true },
      { nome: 'usuario', tipo: 'character varying', nullable: true },
      { nome: 'quantidade_registros', tipo: 'integer', nullable: true },
      { nome: 'modulo', tipo: 'character varying', nullable: false },
      { nome: 'ip_origem', tipo: 'inet', nullable: true },
      { nome: 'user_agent', tipo: 'text', nullable: true },
      { nome: 'status', tipo: 'character varying', nullable: true },
      { nome: 'data_criacao', tipo: 'timestamp without time zone', nullable: true },
      { nome: 'updated_at', tipo: 'timestamp without time zone', nullable: true }
    ]
  },
  
  notas_fiscais: {
    colunas: [
      { nome: 'id', tipo: 'integer', nullable: false },
      { nome: 'numero_nf', tipo: 'character varying', nullable: false },
      { nome: 'data_compra', tipo: 'date', nullable: false },
      { nome: 'data', tipo: 'date', nullable: true },
      { nome: 'origem', tipo: 'character varying', nullable: true },
      { nome: 'fornecedor', tipo: 'character varying', nullable: true },
      { nome: 'destino', tipo: 'character varying', nullable: true },
      { nome: 'valor_total', tipo: 'numeric', nullable: true },
      { nome: 'quantidade_receptoras', tipo: 'integer', nullable: true },
      { nome: 'valor_por_receptora', tipo: 'numeric', nullable: true },
      { nome: 'observacoes', tipo: 'text', nullable: true },
      { nome: 'natureza_operacao', tipo: 'character varying', nullable: true },
      { nome: 'tipo', tipo: 'character varying', nullable: false },
      { nome: 'tipo_produto', tipo: 'character varying', nullable: true },
      { nome: 'itens', tipo: 'jsonb', nullable: true },
      { nome: 'data_cadastro', tipo: 'timestamp without time zone', nullable: true },
      { nome: 'created_at', tipo: 'timestamp without time zone', nullable: true },
      { nome: 'updated_at', tipo: 'timestamp without time zone', nullable: true }
    ],
    indices: ['idx_nf_numero', 'idx_nf_data']
  }
}

/**
 * Busca informaÃ§Ãµes das colunas de uma tabela
 */
async function buscarColunasTabela(nomeTabela) {
  const query = `
    SELECT 
      column_name as nome,
      data_type as tipo,
      is_nullable as nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position
  `
  
  const result = await pool.query(query, [nomeTabela])
  return result.rows.map(row => ({
    nome: row.nome,
    tipo: row.tipo,
    nullable: row.nullable === 'YES'
  }))
}

/**
 * Busca Ã­ndices de uma tabela
 */
async function buscarIndicesTabela(nomeTabela) {
  const query = `
    SELECT indexname as nome
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = $1
      AND indexname NOT LIKE '%_pkey'
  `
  
  const result = await pool.query(query, [nomeTabela])
  return result.rows.map(row => row.nome)
}

/**
 * Verifica se uma tabela existe
 */
async function tabelaExiste(nomeTabela) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name = $1
    )
  `
  
  const result = await pool.query(query, [nomeTabela])
  return result.rows[0].exists
}

/**
 * Valida uma tabela especÃ­fica
 */
async function validarTabela(nomeTabela, schemaEsperado) {
  const problemas = []
  
  // Verificar se a tabela existe
  const existe = await tabelaExiste(nomeTabela)
  if (!existe) {
    problemas.push(`â�Å’ Tabela '${nomeTabela}' nÃ£o existe`)
    return { valida: false, problemas }
  }
  
  // Buscar colunas reais
  const colunasReais = await buscarColunasTabela(nomeTabela)
  const colunasEsperadas = schemaEsperado.colunas
  
  // Verificar colunas obrigatÃ³rias
  for (const colunaEsperada of colunasEsperadas.filter(c => !c.nullable)) {
    const colunaReal = colunasReais.find(c => c.nome === colunaEsperada.nome)
    
    if (!colunaReal) {
      problemas.push(`â�Å’ Coluna obrigatÃ³ria '${colunaEsperada.nome}' nÃ£o existe`)
    } else if (colunaReal.nullable && !colunaEsperada.nullable) {
      problemas.push(`âÅ¡ ï¸�  Coluna '${colunaEsperada.nome}' deveria ser NOT NULL`)
    }
  }
  
  // Verificar Ã­ndices (se especificados)
  if (schemaEsperado.indices) {
    const indicesReais = await buscarIndicesTabela(nomeTabela)
    
    for (const indiceEsperado of schemaEsperado.indices) {
      if (!indicesReais.includes(indiceEsperado)) {
        problemas.push(`âÅ¡ ï¸�  Ã�ndice '${indiceEsperado}' nÃ£o existe`)
      }
    }
  }
  
  return {
    valida: problemas.filter(p => p.startsWith('â�Å’')).length === 0,
    problemas
  }
}

/**
 * FunÃ§Ã£o principal de validaÃ§Ã£o
 */
async function validarSchema() {
  console.log('\nðÅ¸â€�� VALIDAÃâ€¡ÃÆ’O DO SCHEMA DO BANCO DE DADOS POSTGRESQL\n')
  console.log('='.repeat(70))
  
  try {
    // Testar conexÃ£o
    console.log('\nðÅ¸â€œ¡ Testando conexÃ£o com o banco de dados...')
    const conexao = await testConnection()
    
    if (!conexao.success) {
      console.error('â�Å’ Falha na conexÃ£o com o banco de dados:', conexao.error)
      process.exit(1)
    }
    
    console.log('âÅ“â€¦ ConexÃ£o estabelecida')
    console.log(`   Banco: ${conexao.database}`)
    console.log(`   UsuÃ¡rio: ${conexao.user}`)
    console.log(`   VersÃ£o: ${conexao.version}`)
    
    // Validar cada tabela
    console.log('\nðÅ¸â€œâ€¹ Validando estrutura das tabelas...\n')
    
    let tabelasValidas = 0
    let tabelasComProblemas = 0
    let tabelasFaltando = 0
    
    for (const [nomeTabela, schemaEsperado] of Object.entries(SCHEMA_ESPERADO)) {
      process.stdout.write(`   Validando '${nomeTabela}'... `)
      
      const resultado = await validarTabela(nomeTabela, schemaEsperado)
      
      if (!await tabelaExiste(nomeTabela)) {
        console.log('â�Å’ NÃÆ’O EXISTE')
        tabelasFaltando++
      } else if (resultado.valida) {
        console.log('âÅ“â€¦ OK')
        tabelasValidas++
      } else {
        console.log('âÅ¡ ï¸�  COM PROBLEMAS')
        tabelasComProblemas++
      }
      
      // Mostrar problemas se houver
      if (resultado.problemas.length > 0) {
        resultado.problemas.forEach(problema => {
          console.log(`      ${problema}`)
        })
      }
    }
    
    // Resumo
    console.log('\n' + '='.repeat(70))
    console.log('\nðÅ¸â€œÅ  RESUMO DA VALIDAÃâ€¡ÃÆ’O:\n')
    console.log(`   âÅ“â€¦ Tabelas vÃ¡lidas: ${tabelasValidas}`)
    console.log(`   âÅ¡ ï¸�  Tabelas com problemas: ${tabelasComProblemas}`)
    console.log(`   â�Å’ Tabelas faltando: ${tabelasFaltando}`)
    console.log(`   ðÅ¸â€œâ€¹ Total de tabelas: ${Object.keys(SCHEMA_ESPERADO).length}`)
    
    // EstatÃ­sticas do banco
    console.log('\nðÅ¸â€œË† ESTATÃ�STICAS DO BANCO:\n')
    
    const totalAnimais = await pool.query('SELECT COUNT(*) FROM animais')
    const totalGestacoes = await pool.query('SELECT COUNT(*) FROM gestacoes')
    const totalMortes = await pool.query('SELECT COUNT(*) FROM mortes')
    const totalSemen = await pool.query('SELECT COUNT(*) FROM estoque_semen')
    
    console.log(`   ðÅ¸�â€ž Animais cadastrados: ${totalAnimais.rows[0].count}`)
    console.log(`   ðÅ¸¤° GestaÃ§Ãµes registradas: ${totalGestacoes.rows[0].count}`)
    console.log(`   ðÅ¸â€™â‚¬ Mortes registradas: ${totalMortes.rows[0].count}`)
    console.log(`   ðÅ¸§¬ Estoque de sÃªmen: ${totalSemen.rows[0].count}`)
    
    // Status final
    console.log('\n' + '='.repeat(70))
    
    if (tabelasFaltando > 0) {
      console.log('\nâ�Å’ VALIDAÃâ€¡ÃÆ’O FALHOU: HÃ¡ tabelas faltando no banco de dados')
      console.log('   Execute o script de inicializaÃ§Ã£o: npm run db:init\n')
      process.exit(1)
    } else if (tabelasComProblemas > 0) {
      console.log('\nâÅ¡ ï¸�  VALIDAÃâ€¡ÃÆ’O PARCIAL: HÃ¡ problemas nÃ£o crÃ­ticos no schema')
      console.log('   O sistema pode funcionar, mas recomenda-se correÃ§Ãµes\n')
      process.exit(0)
    } else {
      console.log('\nâÅ“â€¦ VALIDAÃâ€¡ÃÆ’O COMPLETA: Schema do banco de dados estÃ¡ correto!\n')
      process.exit(0)
    }
    
  } catch (error) {
    console.error('\nâ�Å’ Erro durante a validaÃ§Ã£o:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Executar validaÃ§Ã£o
if (require.main === module) {
  validarSchema()
}

module.exports = { validarSchema, validarTabela, tabelaExiste }

