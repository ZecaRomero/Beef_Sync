const { Pool } = require('pg')
const logger = require('../utils/logger.cjs')

// ConfiguraÃ§Ã£o do banco de dados
// Neon/Vercel/Supabase: use DATABASE_URL com SSL
// Local/Docker: use DATABASE_URL sem SSL (postgres nÃ£o tem SSL)
const needsSsl = () => {
  if (process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false }
  const url = process.env.DATABASE_URL || ''
  if (url.includes('supabase') || url.includes('neon') || url.includes('pooler') || url.includes('amazonaws')) return { rejectUnauthorized: false }
  return false
}
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: needsSsl(),
      // Supabase free tier suporta ~13 conexÃµes; manter abaixo do limite
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 8,
      // idleTimeout maior que o keepAlive para nÃ£o destruir conexÃµes boas
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 25000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
      query_timeout: 20000,
      statement_timeout: 20000,
      // keepAlive evita que Supabase/PgBouncer feche conexÃµes silenciosamente
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    }
  : (() => {
      const password = process.env.DB_PASSWORD;
      if (!password && process.env.NODE_ENV === 'production') {
        logger.warn('DB_PASSWORD nÃ£o definida em produÃ§Ã£o - conexÃ£o pode falhar');
      }
      if (!password) {
        logger.warn('DB_PASSWORD nÃ£o definida ââ‚¬â€� verifique o arquivo .env');
      }
      const resolvedPassword = password || '';
      return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'beef_sync',
        user: process.env.DB_USER || 'postgres',
        password: resolvedPassword,
        max: parseInt(process.env.DB_MAX_CONNECTIONS) || 8,
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 25000,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
        query_timeout: 20000,
        statement_timeout: 20000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      };
    })()

if (process.env.NODE_ENV !== 'production') {
  const safeConfig = { ...dbConfig };
  delete safeConfig.password;
  logger.debug('DB Connection Config:', safeConfig);
}

const pool = new Pool(dbConfig)

// FunÃ§Ã£o para testar conexÃ£o
async function testConnection() {
  let client
  try {
    client = await pool.connect()
    const result = await client.query('SELECT NOW() as timestamp, version(), current_database(), current_user')
    logger.info('ConexÃ£o com PostgreSQL estabelecida')
    logger.debug('Timestamp:', result.rows[0].timestamp)
    
    const versionInfo = result.rows[0].version.split(' ')
    
    return {
      success: true,
      timestamp: result.rows[0].timestamp,
      version: `${versionInfo[0]} ${versionInfo[1]}`,
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      poolInfo: getPoolInfo()
    }
  } catch (error) {
    logger.error('Erro de conexÃ£o:', error)
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  } finally {
    if (client) client.release()
  }
}

// Erros de conexÃ£o que justificam retry (Supabase/PgBouncer fecha conexÃµes silenciosamente)
function isRetryableError(err) {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  return (
    msg.includes('timeout') ||
    msg.includes('terminated unexpectedly') ||
    msg.includes('connection ended') ||
    msg.includes('connection closed') ||
    msg.includes('connection reset') ||
    msg.includes('broken pipe') ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ECONNRESET' ||
    err.code === 'EPIPE' ||
    err.code === 'ECONNREFUSED'
  )
}

// FunÃ§Ã£o para executar queries com retry automÃ¡tico para erros de conexÃ£o
async function query(text, params) {
  const start = Date.now()
  const maxRetries = 3
  let lastError = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let client
    try {
      client = await pool.connect()
      const result = await client.query(text, params)
      const duration = Date.now() - start
      logger.db('Query executada', 'database', { duration, rows: result.rowCount })
      return result
    } catch (err) {
      lastError = err
      if (isRetryableError(err) && attempt < maxRetries - 1) {
        logger.warn(`DB retry ${attempt + 1}/${maxRetries - 1}: ${err.message}`)
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
        continue
      }
      logger.error('Erro na query:', err)
      throw err
    } finally {
      if (client) {
        // destroy em vez de release quando a conexÃ£o foi terminada inesperadamente
        if (lastError && isRetryableError(lastError)) {
          client.release(lastError)
        } else {
          client.release()
        }
      }
    }
  }
  throw lastError
}

// FunÃ§Ã£o para obter informaÃ§Ãµes do pool
function getPoolInfo() {
  return {
    connected: pool.totalCount > 0,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  }
}

// FunÃ§Ã£o para inicializar o banco (compatibilidade)
function initDatabase() {
  return pool
}

// FunÃ§Ã£o para fechar o pool
async function closePool() {
  await pool.end()
}

// FunÃ§Ã£o para criar todas as tabelas necessÃ¡rias
async function createTables() {
  const client = await pool.connect()
  try {
    logger.info('Criando/verificando estrutura do banco de dados...')
    
    // Criar tabela de animais
    await client.query(`
      CREATE TABLE IF NOT EXISTS animais (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100),
        serie VARCHAR(10) NOT NULL,
        rg VARCHAR(20) NOT NULL,
        tatuagem VARCHAR(20),
        sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('Macho', 'FÃªmea')),
        raca VARCHAR(50) NOT NULL,
        data_nascimento DATE,
        hora_nascimento TIME,
        peso DECIMAL(6,2),
        cor VARCHAR(30),
        tipo_nascimento VARCHAR(20),
        dificuldade_parto VARCHAR(20),
        meses INTEGER,
        situacao VARCHAR(20) DEFAULT 'Ativo' CHECK (situacao IN ('Ativo', 'Vendido', 'Morto', 'Transferido')),
        pai VARCHAR(50),
        mae VARCHAR(50),
        avo_materno VARCHAR(50),
        receptora VARCHAR(50),
        is_fiv BOOLEAN DEFAULT false,
        custo_total DECIMAL(12,2) DEFAULT 0,
        valor_venda DECIMAL(12,2),
        valor_real DECIMAL(12,2),
        veterinario VARCHAR(100),
        abczg VARCHAR(50),
        deca VARCHAR(50),
        observacoes TEXT,
        boletim VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(serie, rg)
      )
    `)

    // Adicionar colunas novas caso a tabela jÃ¡ exista (migraÃ§Ã£o)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'nome') THEN
          ALTER TABLE animais ADD COLUMN nome VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'abczg') THEN
          ALTER TABLE animais ADD COLUMN abczg VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'deca') THEN
          ALTER TABLE animais ADD COLUMN deca VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'avo_materno') THEN
          ALTER TABLE animais ADD COLUMN avo_materno VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'boletim') THEN
          ALTER TABLE animais ADD COLUMN boletim VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'local_nascimento') THEN
          ALTER TABLE animais ADD COLUMN local_nascimento VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'pasto_atual') THEN
          ALTER TABLE animais ADD COLUMN pasto_atual VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'piquete_atual') THEN
          ALTER TABLE animais ADD COLUMN piquete_atual VARCHAR(200);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'data_entrada_piquete') THEN
          ALTER TABLE animais ADD COLUMN data_entrada_piquete DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'situacao_abcz') THEN
          ALTER TABLE animais ADD COLUMN situacao_abcz VARCHAR(100);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'genetica_2') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'iqg') THEN
          ALTER TABLE animais RENAME COLUMN genetica_2 TO iqg;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'iqg') THEN
          ALTER TABLE animais ADD COLUMN iqg VARCHAR(50);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'decile_2') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'pt_iqg') THEN
          ALTER TABLE animais RENAME COLUMN decile_2 TO pt_iqg;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'pt_iqg') THEN
          ALTER TABLE animais ADD COLUMN pt_iqg VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'mgte') THEN
          ALTER TABLE animais ADD COLUMN mgte VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'top') THEN
          ALTER TABLE animais ADD COLUMN "top" VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'carimbo_leilao') THEN
          ALTER TABLE animais ADD COLUMN carimbo_leilao VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'situacao_reprodutiva') THEN
          ALTER TABLE animais ADD COLUMN situacao_reprodutiva VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animais' AND column_name = 'prev_parto') THEN
          ALTER TABLE animais ADD COLUMN prev_parto VARCHAR(50);
        END IF;
      END $$;
    `)

    // MigraÃ§Ã£o: aumentar serie de VARCHAR(10) para VARCHAR(20) (planilhas com sÃ©ries longas)
    try {
      const check = await client.query(`
        SELECT character_maximum_length FROM information_schema.columns
        WHERE table_name = 'animais' AND column_name = 'serie'
      `)
      if (check.rows[0]?.character_maximum_length === 10) {
        await client.query(`ALTER TABLE animais ALTER COLUMN serie TYPE VARCHAR(20)`)
      }
    } catch (e) {
      logger.warn('MigraÃ§Ã£o serie VARCHAR(20):', e?.message)
    }

    // Criar tabela de custos
    await client.query(`
      CREATE TABLE IF NOT EXISTS custos (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        subtipo VARCHAR(50),
        valor DECIMAL(12,2) NOT NULL,
        data DATE NOT NULL,
        observacoes TEXT,
        detalhes JSONB,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de pesagens
    await client.query(`
      CREATE TABLE IF NOT EXISTS pesagens (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        peso DECIMAL(10,2) NOT NULL,
        ce DECIMAL(5,2),
        data DATE NOT NULL,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de localizaÃ§Ãµes/movimentaÃ§Ãµes de animais
    await client.query(`
      CREATE TABLE IF NOT EXISTS localizacoes_animais (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        piquete VARCHAR(50) NOT NULL,
        data_entrada DATE NOT NULL,
        data_saida DATE,
        motivo_movimentacao VARCHAR(100),
        observacoes TEXT,
        usuario_responsavel VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(animal_id)
      )
    `)

    // Criar tabela de gestaÃ§Ãµes
    await client.query(`
      CREATE TABLE IF NOT EXISTS gestacoes (
        id SERIAL PRIMARY KEY,
        pai_serie VARCHAR(10),
        pai_rg VARCHAR(20),
        mae_serie VARCHAR(10),
        mae_rg VARCHAR(20),
        receptora_nome VARCHAR(100),
        receptora_serie VARCHAR(10),
        receptora_rg VARCHAR(20),
        data_cobertura DATE NOT NULL,
        custo_acumulado DECIMAL(12,2) DEFAULT 0,
        situacao VARCHAR(20) DEFAULT 'Ativa' CHECK (situacao IN ('Ativa', 'Nasceu', 'Perdeu', 'Cancelada')),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de nascimentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS nascimentos (
        id SERIAL PRIMARY KEY,
        gestacao_id INTEGER REFERENCES gestacoes(id) ON DELETE SET NULL,
        serie VARCHAR(10) NOT NULL,
        rg VARCHAR(20) NOT NULL,
        sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('Macho', 'FÃªmea')),
        data_nascimento DATE NOT NULL,
        hora_nascimento TIME,
        peso DECIMAL(6,2),
        cor VARCHAR(30),
        tipo_nascimento VARCHAR(20),
        dificuldade_parto VARCHAR(20),
        custo_nascimento DECIMAL(12,2) DEFAULT 0,
        veterinario VARCHAR(100),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS inseminacoes (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        numero_ia INTEGER DEFAULT 1,
        data_ia DATE NOT NULL,
        data_dg DATE,
        resultado_dg VARCHAR(20),
        touro_nome VARCHAR(100),
        touro_rg VARCHAR(20),
        tecnico VARCHAR(100),
        protocolo VARCHAR(100),
        status_gestacao VARCHAR(20) DEFAULT 'Pendente',
        observacoes TEXT,
        custo_dose DECIMAL(12,2),
        valida BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`CREATE INDEX IF NOT EXISTS idx_inseminacoes_animal ON inseminacoes(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inseminacoes_data ON inseminacoes(data_ia)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inseminacoes_status ON inseminacoes(status_gestacao)`)

    // Criar tabela de estoque de sÃªmen
    await client.query(`
      CREATE TABLE IF NOT EXISTS estoque_semen (
        id SERIAL PRIMARY KEY,
        nome_touro VARCHAR(100) NOT NULL,
        rg_touro VARCHAR(20),
        raca VARCHAR(50),
        localizacao VARCHAR(100),
        rack_touro VARCHAR(20),
        botijao VARCHAR(20),
        caneca VARCHAR(20),
        tipo_operacao VARCHAR(20) DEFAULT 'entrada' CHECK (tipo_operacao IN ('entrada', 'saida', 'uso')),
        fornecedor VARCHAR(100),
        destino VARCHAR(100),
        numero_nf VARCHAR(50),
        valor_compra DECIMAL(12,2) DEFAULT 0,
        data_compra DATE,
        quantidade_doses INTEGER DEFAULT 0,
        doses_disponiveis INTEGER DEFAULT 0,
        doses_usadas INTEGER DEFAULT 0,
        certificado VARCHAR(100),
        data_validade DATE,
        origem VARCHAR(100),
        linhagem VARCHAR(100),
        observacoes TEXT,
        status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'esgotado', 'vencido')),
        tipo VARCHAR(20) DEFAULT 'semen' CHECK (tipo IN ('semen', 'embriao')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Garantir coluna tipo em instalaÃ§Ãµes existentes
    await client.query(`ALTER TABLE estoque_semen ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'semen' CHECK (tipo IN ('semen', 'embriao'))`)

    // Criar tabela de destinos de sÃªmen
    await client.query(`
      CREATE TABLE IF NOT EXISTS destinos_semen (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        ativo BOOLEAN DEFAULT true,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar Ã­ndice para busca rÃ¡pida
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_destinos_semen_nome ON destinos_semen(nome)
    `)

    // Criar tabela de fornecedores e destinatÃ¡rios
    await client.query(`
      CREATE TABLE IF NOT EXISTS fornecedores_destinatarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('fornecedor', 'destinatario')),
        endereco VARCHAR(300),
        municipio VARCHAR(100),
        estado VARCHAR(2),
        cnpj_cpf VARCHAR(20),
        telefone VARCHAR(20),
        email VARCHAR(100),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nome, tipo, cnpj_cpf)
      )
    `)

    // Criar tabela de coleta FIV
    await client.query(`
      CREATE TABLE IF NOT EXISTS coleta_fiv (
        id SERIAL PRIMARY KEY,
        doadora_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        doadora_nome VARCHAR(100),
        laboratorio VARCHAR(100),
        veterinario VARCHAR(100),
        data_fiv DATE NOT NULL,
        data_transferencia DATE,
        quantidade_oocitos INTEGER,
        touro VARCHAR(100),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // MigraÃ§Ã£o: adicionar colunas em coleta_fiv se nÃ£o existirem
    await client.query(`ALTER TABLE coleta_fiv ADD COLUMN IF NOT EXISTS doadora_identificador VARCHAR(80)`)
    await client.query(`ALTER TABLE coleta_fiv ADD COLUMN IF NOT EXISTS embrioes_produzidos INTEGER`)
    await client.query(`ALTER TABLE coleta_fiv ADD COLUMN IF NOT EXISTS embrioes_transferidos INTEGER`)

    // Criar Ã­ndices para busca rÃ¡pida
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores_destinatarios(nome)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo ON fornecedores_destinatarios(tipo)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores_destinatarios(cnpj_cpf)
    `)

    // Criar tabela de transferÃªncias de embriÃµes
    await client.query(`
      CREATE TABLE IF NOT EXISTS transferencias_embrioes (
        id SERIAL PRIMARY KEY,
        numero_te VARCHAR(50) NOT NULL UNIQUE,
        data_te DATE NOT NULL,
        receptora_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        doadora_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        touro_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        local_te VARCHAR(100),
        data_fiv DATE,
        raca VARCHAR(50),
        tecnico_responsavel VARCHAR(100),
        observacoes TEXT,
        status VARCHAR(20) DEFAULT 'realizada' CHECK (status IN ('realizada', 'cancelada', 'pendente')),
        resultado VARCHAR(20) CHECK (resultado IN ('positivo', 'negativo', 'pendente')),
        data_diagnostico DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de causas de morte
    await client.query(`
      CREATE TABLE IF NOT EXISTS causas_morte (
        id SERIAL PRIMARY KEY,
        causa VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de mortes
    await client.query(`
      CREATE TABLE IF NOT EXISTS mortes (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animais(id) ON DELETE CASCADE,
        data_morte DATE NOT NULL,
        causa_morte VARCHAR(100) NOT NULL,
        observacoes TEXT,
        valor_perda DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Inserir causas de morte padrÃ£o
    await client.query(`
      INSERT INTO causas_morte (causa) VALUES 
        ('DoenÃ§a'),
        ('Acidente'),
        ('Parto'),
        ('PredaÃ§Ã£o'),
        ('IntoxicaÃ§Ã£o'),
        ('Debilidade'),
        ('Idade avanÃ§ada'),
        ('Problemas cardÃ­acos'),
        ('Problemas respiratÃ³rios'),
        ('Outros')
      ON CONFLICT (causa) DO NOTHING
    `)

    // Criar tabela de baixas (MORTE/BAIXA e VENDA)
    await client.query(`
      CREATE TABLE IF NOT EXISTS baixas (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        serie VARCHAR(20) NOT NULL,
        rg VARCHAR(20) NOT NULL,
        tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('MORTE/BAIXA', 'VENDA')),
        causa VARCHAR(150),
        data_baixa DATE NOT NULL,
        comprador VARCHAR(200),
        valor DECIMAL(12,2),
        numero_nf VARCHAR(50),
        serie_mae VARCHAR(20),
        rg_mae VARCHAR(20),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_baixas_animal_id ON baixas(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_baixas_tipo ON baixas(tipo)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_baixas_serie_rg ON baixas(serie, rg)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_baixas_mae ON baixas(serie_mae, rg_mae)`)

    // Criar tabela de boletim contÃ¡bil
    await client.query(`
      CREATE TABLE IF NOT EXISTS boletim_contabil (
        id SERIAL PRIMARY KEY,
        periodo VARCHAR(7) NOT NULL UNIQUE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
        data_fechamento TIMESTAMP,
        resumo JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de movimentaÃ§Ãµes contÃ¡beis
    await client.query(`
      CREATE TABLE IF NOT EXISTS movimentacoes_contabeis (
        id SERIAL PRIMARY KEY,
        boletim_id INTEGER REFERENCES boletim_contabil(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'custo', 'receita')),
        subtipo VARCHAR(50) NOT NULL,
        data_movimento DATE NOT NULL,
        animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        valor DECIMAL(12,2) DEFAULT 0,
        descricao TEXT,
        observacoes TEXT,
        localidade VARCHAR(100),
        dados_extras JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Adicionar coluna localidade se nÃ£o existir (migraÃ§Ã£o)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimentacoes_contabeis' AND column_name = 'localidade') THEN
          ALTER TABLE movimentacoes_contabeis ADD COLUMN localidade VARCHAR(100);
        END IF;
      END $$;
    `)

    // Criar Ã­ndices para performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_boletim_periodo ON boletim_contabil(periodo);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_boletim ON movimentacoes_contabeis(boletim_id);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_contabeis(tipo);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes_contabeis(data_movimento);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_animal ON movimentacoes_contabeis(animal_id);
    `)

    // Criar tabela de serviÃ§os
    await client.query(`
      CREATE TABLE IF NOT EXISTS servicos (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('VacinaÃ§Ã£o', 'Manejo', 'ReproduÃ§Ã£o', 'Tratamento', 'ManutenÃ§Ã£o', 'Outro')),
        descricao TEXT NOT NULL,
        data_aplicacao DATE NOT NULL,
        custo DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Pendente' CHECK (status IN ('Ativo', 'ConcluÃ­do', 'Pendente', 'Cancelado')),
        responsavel VARCHAR(100) DEFAULT 'NÃ£o informado',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de notificaÃ§Ãµes
    await client.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('nascimento', 'estoque', 'gestacao', 'saude', 'financeiro', 'sistema')),
        titulo VARCHAR(200) NOT NULL,
        mensagem TEXT NOT NULL,
        prioridade VARCHAR(10) DEFAULT 'medium' CHECK (prioridade IN ('low', 'medium', 'high')),
        lida BOOLEAN DEFAULT false,
        dados_extras JSONB,
        animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de protocolos reprodutivos
    await client.query(`
      CREATE TABLE IF NOT EXISTS protocolos_reprodutivos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('IATF', 'SincronizaÃ§Ã£o', 'TE', 'Outro')),
        duracao_dias INTEGER,
        medicamentos JSONB,
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de protocolos aplicados
    await client.query(`
      CREATE TABLE IF NOT EXISTS protocolos_aplicados (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        protocolo_id INTEGER NOT NULL REFERENCES protocolos_reprodutivos(id) ON DELETE CASCADE,
        data_inicio DATE NOT NULL,
        data_fim DATE,
        status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'cancelado')),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de ciclos reprodutivos
    await client.query(`
      CREATE TABLE IF NOT EXISTS ciclos_reprodutivos (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        data_inicio DATE NOT NULL,
        data_fim DATE,
        tipo VARCHAR(50) NOT NULL,
        resultado VARCHAR(50),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de relatÃ³rios personalizados
    await client.query(`
      CREATE TABLE IF NOT EXISTS relatorios_personalizados (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        descricao TEXT,
        tipo VARCHAR(50) NOT NULL,
        parametros JSONB DEFAULT '{}',
        sql_query TEXT,
        campos_exibicao JSONB DEFAULT '[]',
        filtros JSONB DEFAULT '{}',
        agrupamento JSONB DEFAULT '{}',
        ordenacao JSONB DEFAULT '{}',
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // MigraÃ§Ã£o: Adicionar novas colunas se a tabela jÃ¡ existir com a estrutura antiga
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relatorios_personalizados' AND column_name = 'parametros') THEN
          ALTER TABLE relatorios_personalizados ADD COLUMN parametros JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relatorios_personalizados' AND column_name = 'sql_query') THEN
          ALTER TABLE relatorios_personalizados ADD COLUMN sql_query TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relatorios_personalizados' AND column_name = 'campos_exibicao') THEN
          ALTER TABLE relatorios_personalizados ADD COLUMN campos_exibicao JSONB DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relatorios_personalizados' AND column_name = 'filtros') THEN
          ALTER TABLE relatorios_personalizados ADD COLUMN filtros JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relatorios_personalizados' AND column_name = 'agrupamento') THEN
          ALTER TABLE relatorios_personalizados ADD COLUMN agrupamento JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relatorios_personalizados' AND column_name = 'ordenacao') THEN
          ALTER TABLE relatorios_personalizados ADD COLUMN ordenacao JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relatorios_personalizados' AND column_name = 'ativo') THEN
          ALTER TABLE relatorios_personalizados ADD COLUMN ativo BOOLEAN DEFAULT true;
        END IF;
      END $$;
    `)

    // Criar tabela de destinatÃ¡rios de relatÃ³rios
    await client.query(`
      CREATE TABLE IF NOT EXISTS destinatarios_relatorios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        email VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(20),
        cargo VARCHAR(100),
        ativo BOOLEAN DEFAULT true,
        recebe_email BOOLEAN DEFAULT true,
        recebe_whatsapp BOOLEAN DEFAULT false,
        tipos_relatorios JSONB DEFAULT '[]',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email)
      )
    `)

    // Criar tabela de notas fiscais
    await client.query(`
      CREATE TABLE IF NOT EXISTS notas_fiscais (
        id SERIAL PRIMARY KEY,
        numero_nf VARCHAR(50) NOT NULL,
        data_compra DATE NOT NULL,
        data DATE,
        origem VARCHAR(200),
        fornecedor VARCHAR(200),
        destino VARCHAR(200),
        cnpj_origem_destino VARCHAR(20),
        valor_total DECIMAL(12,2) DEFAULT 0,
        quantidade_receptoras INTEGER,
        valor_por_receptora DECIMAL(12,2),
        observacoes TEXT,
        natureza_operacao VARCHAR(100),
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
        tipo_produto VARCHAR(20) DEFAULT 'bovino' CHECK (tipo_produto IN ('bovino', 'semen', 'embriao')),
        itens JSONB DEFAULT '[]',
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Adicionar coluna cnpj_origem_destino se nÃ£o existir
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'notas_fiscais' 
          AND column_name = 'cnpj_origem_destino'
        ) THEN
          ALTER TABLE notas_fiscais ADD COLUMN cnpj_origem_destino VARCHAR(20);
        END IF;
      END $$;
    `)

    // Criar tabela de naturezas de operaÃ§Ã£o
    await client.query(`
      CREATE TABLE IF NOT EXISTS naturezas_operacao (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
        descricao TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de origens/receptoras
    await client.query(`
      CREATE TABLE IF NOT EXISTS origens_receptoras (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('origem', 'receptora')),
        documento VARCHAR(20),
        endereco TEXT,
        telefone VARCHAR(20),
        email VARCHAR(100),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de histÃ³rico de ocorrÃªncias dos animais
    await client.query(`
      CREATE TABLE IF NOT EXISTS historia_ocorrencias (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        data DATE NOT NULL,
        descricao TEXT,
        observacoes TEXT,
        peso DECIMAL(6,2),
        valor DECIMAL(12,2),
        veterinario VARCHAR(100),
        medicamento VARCHAR(200),
        dosagem VARCHAR(100),
        proxima_aplicacao DATE,
        local VARCHAR(100),
        responsavel VARCHAR(100),
        abczg VARCHAR(50),
        deca VARCHAR(50),
        avo_materno VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'Sistema',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS situacoes_abcz (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        situacao VARCHAR(100) NOT NULL,
        data DATE,
        abczg VARCHAR(50),
        deca VARCHAR(50),
        origem VARCHAR(100),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_situacoes_abcz_animal ON situacoes_abcz(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_situacoes_abcz_data ON situacoes_abcz(data)`)

    // Criar tabela de lotes de operaÃ§Ãµes
    await client.query(`
      CREATE TABLE IF NOT EXISTS lotes_operacoes (
        id SERIAL PRIMARY KEY,
        numero_lote VARCHAR(20) UNIQUE NOT NULL,
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
      );

      -- MigraÃ§Ã£o para VARCHAR se for INTEGER
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes_operacoes' AND column_name = 'numero_lote' AND data_type = 'integer') THEN
          ALTER TABLE lotes_operacoes ALTER COLUMN numero_lote TYPE VARCHAR(20);
        END IF;
      END $$;

      DROP FUNCTION IF EXISTS gerar_proximo_lote();

      -- Criar sequÃªncia se nÃ£o existir
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'lotes_seq') THEN
          CREATE SEQUENCE lotes_seq START 1;
          
          -- Sincronizar a sequÃªncia com o maior nÃºmero existente
          PERFORM setval('lotes_seq', (
            SELECT COALESCE(
              MAX(
                CASE 
                  WHEN numero_lote ~ '^[0-9]+$' THEN CAST(numero_lote AS INTEGER)
                  WHEN numero_lote ~ '^LOTE-(\\d+)$' THEN CAST(SUBSTRING(numero_lote FROM 'LOTE-(\\d+)') AS INTEGER)
                  ELSE 0
                END
              ), 0
            )
            FROM lotes_operacoes
          ));
        END IF;
      END
      $$;

      CREATE OR REPLACE FUNCTION gerar_proximo_lote() 
      RETURNS VARCHAR AS $$
      DECLARE
        novo_numero BIGINT;
      BEGIN
        novo_numero := nextval('lotes_seq');
        RETURN 'LOTE-' || LPAD(novo_numero::TEXT, 5, '0');
      END;
      $$ LANGUAGE plpgsql;

      CREATE INDEX IF NOT EXISTS idx_lotes_modulo ON lotes_operacoes(modulo);
      CREATE INDEX IF NOT EXISTS idx_lotes_tipo_operacao ON lotes_operacoes(tipo_operacao);
      CREATE INDEX IF NOT EXISTS idx_lotes_data_criacao ON lotes_operacoes(data_criacao);
      CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes_operacoes(status);
      CREATE INDEX IF NOT EXISTS idx_lotes_usuario ON lotes_operacoes(usuario);
    `)

    // Criar tabela de abastecimento de nitrogÃªnio
    await client.query(`
      CREATE TABLE IF NOT EXISTS abastecimento_nitrogenio (
        id SERIAL PRIMARY KEY,
        data_abastecimento DATE NOT NULL,
        quantidade_litros DECIMAL(10,2) NOT NULL,
        valor_unitario DECIMAL(10,2),
        valor_total DECIMAL(10,2),
        motorista VARCHAR(100) NOT NULL,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_abastecimento_nitrogenio_data ON abastecimento_nitrogenio(data_abastecimento);
      CREATE INDEX IF NOT EXISTS idx_abastecimento_nitrogenio_motorista ON abastecimento_nitrogenio(motorista);
    `)

    // Adicionar colunas novas caso a tabela jÃ¡ exista (migraÃ§Ã£o)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historia_ocorrencias' AND column_name = 'abczg') THEN
          ALTER TABLE historia_ocorrencias ADD COLUMN abczg VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historia_ocorrencias' AND column_name = 'deca') THEN
          ALTER TABLE historia_ocorrencias ADD COLUMN deca VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historia_ocorrencias' AND column_name = 'avo_materno') THEN
          ALTER TABLE historia_ocorrencias ADD COLUMN avo_materno VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'naturezas_operacao' AND column_name = 'descricao') THEN
          ALTER TABLE naturezas_operacao ADD COLUMN descricao TEXT;
        END IF;
      END $$;
    `)

    // Criar tabela de piquetes cadastrados
    await client.query(`
      CREATE TABLE IF NOT EXISTS piquetes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(50) NOT NULL UNIQUE,
        area DECIMAL(10,2),
        capacidade INTEGER,
        tipo VARCHAR(50),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Boletim Campo - campos LOCAL, LOCAL 1, SUB_LOCAL_2, QUANT., SEXO, CATEGORIA, RAÃâ€¡A, ERA, OBSERVAÃâ€¡ÃÆ’O
    await client.query(`
      CREATE TABLE IF NOT EXISTS boletim_campo (
        id SERIAL PRIMARY KEY,
        local VARCHAR(200) NOT NULL,
        local_1 VARCHAR(200),
        sub_local_2 VARCHAR(200),
        quant INTEGER DEFAULT 0,
        sexo CHAR(1),
        categoria VARCHAR(100),
        raca VARCHAR(100),
        era VARCHAR(50),
        observacao TEXT,
        usuario VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_boletim_campo_local ON boletim_campo(local)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_boletim_campo_sub_local ON boletim_campo(sub_local_2)`)

    // Boletim Campo - histÃ³rico de movimentaÃ§Ãµes (saÃ­da/entrada)
    await client.query(`
      CREATE TABLE IF NOT EXISTS boletim_campo_movimentacoes (
        id SERIAL PRIMARY KEY,
        boletim_campo_id INTEGER REFERENCES boletim_campo(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('saida', 'entrada')),
        destino_local VARCHAR(200),
        destino_sub_local VARCHAR(200),
        motivo VARCHAR(50) CHECK (motivo IN ('piquete', 'morte', 'venda', 'nascimento', 'entrada_externa')),
        quantidade INTEGER DEFAULT 1,
        sexo VARCHAR(20),
        era VARCHAR(50),
        raca VARCHAR(100),
        categoria VARCHAR(100),
        observacao TEXT,
        usuario VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletim_campo_movimentacoes' AND column_name = 'sexo') THEN
          ALTER TABLE boletim_campo_movimentacoes ADD COLUMN sexo VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletim_campo_movimentacoes' AND column_name = 'era') THEN
          ALTER TABLE boletim_campo_movimentacoes ADD COLUMN era VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletim_campo_movimentacoes' AND column_name = 'raca') THEN
          ALTER TABLE boletim_campo_movimentacoes ADD COLUMN raca VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletim_campo_movimentacoes' AND column_name = 'categoria') THEN
          ALTER TABLE boletim_campo_movimentacoes ADD COLUMN categoria VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletim_campo_movimentacoes' AND column_name = 'observacao') THEN
          ALTER TABLE boletim_campo_movimentacoes ADD COLUMN observacao TEXT;
        END IF;
      END $$
    `)

    // UsuÃ¡rio Adelso - senha para acesso ao boletim
    await client.query(`
      CREATE TABLE IF NOT EXISTS boletim_campo_users (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        senha_temporaria BOOLEAN DEFAULT true,
        whatsapp VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletim_campo_users' AND column_name = 'whatsapp') THEN
          ALTER TABLE boletim_campo_users ADD COLUMN whatsapp VARCHAR(20);
        END IF;
      END $$;
    `).catch(() => {})
    // Inserir Adelso com senha 123 (hash simples - em produÃ§Ã£o usar bcrypt)
    await client.query(`
      INSERT INTO boletim_campo_users (nome, senha_hash, senha_temporaria)
      VALUES ('Adelso', '123', true)
      ON CONFLICT (nome) DO NOTHING
    `).catch(() => {})

    // Criar Ã­ndices para melhor performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_animais_serie_rg ON animais(serie, rg)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_animais_situacao ON animais(situacao)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_animais_raca ON animais(raca)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_custos_animal_id ON custos(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_piquetes_nome ON piquetes(nome)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_piquetes_ativo ON piquetes(ativo)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_localizacoes_animal_id ON localizacoes_animais(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_localizacoes_piquete ON localizacoes_animais(piquete)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_localizacoes_data_entrada ON localizacoes_animais(data_entrada)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_gestacoes_situacao ON gestacoes(situacao)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_semen_status ON estoque_semen(status)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_semen_nome_touro ON estoque_semen(nome_touro)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nf_numero ON notas_fiscais(numero_nf)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nf_data ON notas_fiscais(data_compra)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_te_numero ON transferencias_embrioes(numero_te)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_te_data ON transferencias_embrioes(data_te)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_te_status ON transferencias_embrioes(status)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_servicos_animal_id ON servicos(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_servicos_tipo ON servicos(tipo)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_servicos_data ON servicos(data_aplicacao)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_protocolos_aplicados_animal_id ON protocolos_aplicados(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ciclos_animal_id ON ciclos_reprodutivos(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_historia_animal_id ON historia_ocorrencias(animal_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_historia_tipo ON historia_ocorrencias(tipo)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_historia_data ON historia_ocorrencias(data)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_historia_created_at ON historia_ocorrencias(created_at)`)

    logger.info('Estrutura do banco de dados criada/verificada com sucesso')
    
  } catch (error) {
    logger.error('Erro ao criar estrutura do banco:', error)
    throw error
  } finally {
    client.release()
  }
}

// FunÃ§Ã£o para criar tabelas se nÃ£o existirem (compatibilidade)
async function createTablesIfNotExist() {
  return await createTables()
}

// MÃ©todos para movimentaÃ§Ã£o em lote de animais
async function getAnimalsByIds(animalIds) {
  const client = await pool.connect()
  try {
    const placeholders = animalIds.map((_, index) => `$${index + 1}`).join(',')
    const query = `
      SELECT id, serie, rg, raca, sexo, situacao, peso, data_nascimento, valor_venda
      FROM animais 
      WHERE id IN (${placeholders})
    `
    const result = await client.query(query, animalIds)
    return result.rows
  } catch (error) {
    logger.error('Erro ao buscar animais por IDs:', error)
    throw error
  } finally {
    client.release()
  }
}

async function finalizeCurrentLocation(animalId, finalizeDate) {
  const client = await pool.connect()
  try {
    const query = `
      UPDATE localizacoes_animais 
      SET data_saida = $1, updated_at = NOW()
      WHERE animal_id = $2 AND data_saida IS NULL
    `
    const result = await client.query(query, [finalizeDate, animalId])
    return { success: true, affectedRows: result.rowCount }
  } catch (error) {
    logger.error('Erro ao finalizar localizaÃ§Ã£o atual:', error)
    throw error
  } finally {
    client.release()
  }
}

async function createLocation(locationData) {
  const client = await pool.connect()
  try {
    const query = `
      INSERT INTO localizacoes_animais (animal_id, piquete, data_entrada, data_saida, observacoes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `
    const values = [
      locationData.animal_id,
      locationData.piquete,
      locationData.data_entrada,
      locationData.data_saida,
      locationData.observacoes,
      locationData.created_at,
      locationData.updated_at
    ]
    
    const result = await client.query(query, values)
    return { 
      success: true, 
      data: { id: result.rows[0].id } 
    }
  } catch (error) {
    logger.error('Erro ao criar localizaÃ§Ã£o:', error)
    return { 
      success: false, 
      error: error.message 
    }
  } finally {
    client.release()
  }
}

module.exports = {
  query,
  testConnection,
  createTablesIfNotExist,
  createTables,
  initDatabase,
  closePool,
  getPoolInfo,
  pool,
  // Novos mÃ©todos para movimentaÃ§Ã£o em lote
  getAnimalsByIds,
  finalizeCurrentLocation,
  createLocation
}
