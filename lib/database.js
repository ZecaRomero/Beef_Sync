const { Pool } = require('pg')
const logger = require('../utils/logger.cjs')

// Configuração do banco de dados
// Neon/Vercel: use DATABASE_URL (connection string)
// Local: use DB_HOST, DB_PORT, etc.
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000
    }
  : (() => {
      const password = process.env.DB_PASSWORD;
      if (!password && process.env.NODE_ENV === 'production') {
        logger.warn('DB_PASSWORD não definida em produção - conexão pode falhar');
      }
      return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'beef_sync',
      user: process.env.DB_USER || 'postgres',
      password: password || '',
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
    })()

const pool = new Pool(dbConfig)

// Função para testar conexão
async function testConnection() {
  let client
  try {
    client = await pool.connect()
    const result = await client.query('SELECT NOW() as timestamp, version(), current_database(), current_user')
    logger.info('Conexão com PostgreSQL estabelecida')
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
    logger.error('Erro de conexão:', error)
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  } finally {
    if (client) client.release()
  }
}

// Função para executar queries
async function query(text, params) {
  const start = Date.now()
  let client
  try {
    // Retry simples para evitar falhas de timeout na conexão
    const maxRetries = 3
    let attempt = 0
    let lastError = null
    while (attempt < maxRetries) {
      try {
        client = await pool.connect()
        break
      } catch (err) {
        lastError = err
        const msg = (err && err.message || '').toLowerCase()
        const isTimeout = msg.includes('timeout') || err.code === 'ETIMEDOUT'
        if (!isTimeout) throw err
        attempt++
        const waitMs = 300 * attempt
        await new Promise(r => setTimeout(r, waitMs))
      }
    }
    if (!client && lastError) throw lastError
    const result = await client.query(text, params)
    const duration = Date.now() - start
    logger.db('Query executada', 'database', { duration, rows: result.rowCount })
    return result
  } catch (error) {
    logger.error('Erro na query:', error)
    throw error
  } finally {
    if (client) client.release()
  }
}

// Função para obter informações do pool
function getPoolInfo() {
  return {
    connected: pool.totalCount > 0,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  }
}

// Função para inicializar o banco (compatibilidade)
function initDatabase() {
  return pool
}

// Função para fechar o pool
async function closePool() {
  await pool.end()
}

// Função para criar todas as tabelas necessárias
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
        sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('Macho', 'Fêmea')),
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

    // Adicionar colunas novas caso a tabela já exista (migração)
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
      END $$;
    `)

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

    // Criar tabela de localizações/movimentações de animais
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

    // Criar tabela de gestações
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
        sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('Macho', 'Fêmea')),
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

    // Criar tabela de estoque de sêmen
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de destinos de sêmen
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

    // Criar índice para busca rápida
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_destinos_semen_nome ON destinos_semen(nome)
    `)

    // Criar tabela de fornecedores e destinatários
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

    // Criar índices para busca rápida
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores_destinatarios(nome)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo ON fornecedores_destinatarios(tipo)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores_destinatarios(cnpj_cpf)
    `)

    // Criar tabela de transferências de embriões
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

    // Inserir causas de morte padrão
    await client.query(`
      INSERT INTO causas_morte (causa) VALUES 
        ('Doença'),
        ('Acidente'),
        ('Parto'),
        ('Predação'),
        ('Intoxicação'),
        ('Desnutrição'),
        ('Idade avançada'),
        ('Problemas cardíacos'),
        ('Problemas respiratórios'),
        ('Outros')
      ON CONFLICT (causa) DO NOTHING
    `)

    // Criar tabela de boletim contábil
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

    // Criar tabela de movimentações contábeis
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

    // Adicionar coluna localidade se não existir (migração)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimentacoes_contabeis' AND column_name = 'localidade') THEN
          ALTER TABLE movimentacoes_contabeis ADD COLUMN localidade VARCHAR(100);
        END IF;
      END $$;
    `)

    // Criar índices para performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_boletim_periodo ON boletim_contabil(periodo);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_boletim ON movimentacoes_contabeis(boletim_id);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_contabeis(tipo);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes_contabeis(data_movimento);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_animal ON movimentacoes_contabeis(animal_id);
    `)

    // Criar tabela de serviços
    await client.query(`
      CREATE TABLE IF NOT EXISTS servicos (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Vacinação', 'Nutrição', 'Reprodução', 'Tratamento', 'Manutenção', 'Outro')),
        descricao TEXT NOT NULL,
        data_aplicacao DATE NOT NULL,
        custo DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Pendente' CHECK (status IN ('Ativo', 'Concluído', 'Pendente', 'Cancelado')),
        responsavel VARCHAR(100) DEFAULT 'Não informado',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de notificações
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
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('IATF', 'Sincronização', 'TE', 'Outro')),
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

    // Criar tabela de relatórios personalizados
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

    // Migração: Adicionar novas colunas se a tabela já existir com a estrutura antiga
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

    // Criar tabela de destinatários de relatórios
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

    // Adicionar coluna cnpj_origem_destino se não existir
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

    // Criar tabela de naturezas de operação
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

    // Criar tabela de histórico de ocorrências dos animais
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

    // Criar tabela de lotes de operações
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

      -- Migração para VARCHAR se for INTEGER
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes_operacoes' AND column_name = 'numero_lote' AND data_type = 'integer') THEN
          ALTER TABLE lotes_operacoes ALTER COLUMN numero_lote TYPE VARCHAR(20);
        END IF;
      END $$;

      DROP FUNCTION IF EXISTS gerar_proximo_lote();

      -- Criar sequência se não existir
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'lotes_seq') THEN
          CREATE SEQUENCE lotes_seq START 1;
          
          -- Sincronizar a sequência com o maior número existente
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

    // Criar tabela de abastecimento de nitrogênio
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

    // Adicionar colunas novas caso a tabela já exista (migração)
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

    // Criar índices para melhor performance
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

// Função para criar tabelas se não existirem (compatibilidade)
async function createTablesIfNotExist() {
  return await createTables()
}

// Métodos para movimentação em lote de animais
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
    logger.error('Erro ao finalizar localização atual:', error)
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
    logger.error('Erro ao criar localização:', error)
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
  // Novos métodos para movimentação em lote
  getAnimalsByIds,
  finalizeCurrentLocation,
  createLocation
}
