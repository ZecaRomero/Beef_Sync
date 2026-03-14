require('dotenv').config()
const { query } = require('../lib/database')

async function ensureTableExists() {
  // Create table with correct types if missing
  await query(`
    CREATE TABLE IF NOT EXISTS lotes_operacoes (
      id SERIAL PRIMARY KEY,
      numero_lote VARCHAR(100) UNIQUE NOT NULL,
      tipo_operacao VARCHAR(100) NOT NULL,
      descricao TEXT NOT NULL,
      detalhes JSONB,
      usuario VARCHAR(100),
      quantidade_registros INTEGER DEFAULT 1,
      modulo VARCHAR(50) NOT NULL,
      ip_origem INET,
      user_agent TEXT,
      status VARCHAR(20) DEFAULT 'concluido',
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function fixNumeroLoteColumn() {
  const res = await query(`
    SELECT data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'lotes_operacoes' 
      AND column_name = 'numero_lote'
  `)

  if (res.rows.length === 0) {
    // Table might not exist; create it with correct column type
    await ensureTableExists()
    return 'created'
  }

  const currentType = res.rows[0].data_type

  if (currentType !== 'character varying') {
    // Alter to VARCHAR(100), preserving existing values
    await query(`
      ALTER TABLE lotes_operacoes 
      ALTER COLUMN numero_lote TYPE VARCHAR(100) USING numero_lote::text
    `)
    return `altered_from_${currentType}`
  }
  return 'ok'
}

async function recreateGerarProximoLoteFunction() {
  // Create a robust generator using a sequence and string prefix
  await query(`DROP FUNCTION IF EXISTS gerar_proximo_lote()`)

  // Ensure sequence exists and aligned with current max
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'seq_lote_numero'
      ) THEN
        CREATE SEQUENCE seq_lote_numero START 1;
      END IF;
    END $$;
  `)

  // Reset sequence to start from 0 (avoid inheriting timestamp-based values)
  await query(`SELECT setval('seq_lote_numero', 1, true)`)

  // Create function that returns 'LOTE-000001' style identifiers
  await query(`
    CREATE OR REPLACE FUNCTION gerar_proximo_lote()
    RETURNS VARCHAR(100) AS $$
    DECLARE
      proximo BIGINT;
      numero_formatado VARCHAR(100);
    BEGIN
      proximo := nextval('seq_lote_numero');
      numero_formatado := 'LOTE-' || LPAD((proximo % 1000000)::TEXT, 6, '0');
      RETURN numero_formatado;
    END;
    $$ LANGUAGE plpgsql;
  `)
}

async function main() {
  console.log('🔧 Ajustando schema de lotes...')
  try {
    const tableStatus = await ensureTableExists()
    const colStatus = await fixNumeroLoteColumn()
    console.log(`📦 coluna numero_lote: ${colStatus}`)

    await recreateGerarProximoLoteFunction()
    console.log('✅ Função gerar_proximo_lote recriada com sucesso')

    // Smoke test: insert a sample lote
    const sample = await query(`
      INSERT INTO lotes_operacoes (
        numero_lote, tipo_operacao, descricao, detalhes, usuario, quantidade_registros, modulo
      ) VALUES (
        gerar_proximo_lote(), 'TESTE_SCHEMA', 'Teste de ajuste de schema', '{"verificacao":true}', 'sistema', 1, 'SISTEMA'
      ) RETURNING numero_lote
    `)
    console.log(`🧪 Lote gerado: ${sample.rows[0].numero_lote}`)

    console.log('🎉 Ajuste concluído')
    process.exit(0)
  } catch (err) {
    console.error('❌ Erro no ajuste:', err.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }