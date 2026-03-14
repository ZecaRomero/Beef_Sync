import { pool } from '../lib/database';
let infraInicializada = false;
async function ensureInfra() {
  if (infraInicializada) return;
  const client = await pool.connect();
  try {
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
      )
    `);
    // Verificar se a sequência existe, se não, criar
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'lotes_seq') THEN
          CREATE SEQUENCE lotes_seq START 1;
          
          -- Sincronizar a sequência com o maior número existente (apenas formato LOTE-XXXXX)
          PERFORM setval('lotes_seq', (
            SELECT COALESCE(MAX(CAST(SUBSTRING(numero_lote FROM 'LOTE-(\\d+)') AS INTEGER)), 0)
            FROM lotes_operacoes
            WHERE numero_lote ~ '^LOTE-\\d+$'
          ));
        END IF;
      END
      $$;
    `);

    await client.query(`
      DROP FUNCTION IF EXISTS gerar_proximo_lote();

      CREATE OR REPLACE FUNCTION gerar_proximo_lote() 
      RETURNS VARCHAR AS $$
      DECLARE
        novo_numero BIGINT;
      BEGIN
        novo_numero := nextval('lotes_seq');
        RETURN 'LOTE-' || LPAD(novo_numero::TEXT, 5, '0');
      END;
      $$ LANGUAGE plpgsql;
    `);
    infraInicializada = true;
  } finally {
    client.release();
  }
}

// Middleware para capturar operações e gerar lotes automaticamente
export function withLoteTracking(handler, config = {}) {
  return async (req, res) => {
    // Se config é uma função, executá-la para obter a configuração
    const actualConfig = typeof config === 'function' ? config(req) : config;
    
    // Se não há configuração (ex: GET requests), apenas executar o handler
    if (!actualConfig) {
      return await handler(req, res);
    }

    const {
      tipo_operacao,
      modulo,
      descricao_template,
      capturar_body = false,
      capturar_resultado = false,
      quantidade_callback = null
    } = actualConfig;

    // Executar o handler original
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;
    let responseData = null;
    let responseSent = false;
    
    res.json = function(data) {
      responseData = data;
      responseSent = true;
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      responseSent = true;
      return originalSend.call(this, data);
    };

    res.end = function(data) {
      responseSent = true;
      return originalEnd.call(this, data);
    };

    try {
      await ensureInfra();
      const result = await handler(req, res);

      // Se a operação foi bem-sucedida e é uma operação de modificação, criar o lote
      if (res.statusCode >= 200 && res.statusCode < 300 && tipo_operacao && modulo) {
        // Só criar lotes para operações que modificam dados (não para GET)
        const isModifyingOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
        
        if (isModifyingOperation) {
          await criarLoteAutomatico({
            req,
            res,
            responseData,
            tipo_operacao,
            modulo,
            descricao_template,
            capturar_body,
            capturar_resultado,
            quantidade_callback
          });
        }
      }

      return result;
    } catch (error) {
      // Em caso de erro, ainda tentar criar o lote com status de erro (apenas para operações de modificação)
      if (tipo_operacao && modulo) {
        const isModifyingOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
        
        if (isModifyingOperation) {
          await criarLoteAutomatico({
            req,
            res,
            responseData: { error: error.message },
            tipo_operacao,
            modulo,
            descricao_template,
            capturar_body,
            capturar_resultado,
            quantidade_callback,
            erro: true
          });
        }
      }
      
      throw error;
    }
  };
}

async function criarLoteAutomatico({
  req,
  res,
  responseData,
  tipo_operacao,
  modulo,
  descricao_template,
  capturar_body,
  capturar_resultado,
  quantidade_callback,
  erro = false
}) {
  await ensureInfra();
  const client = await pool.connect();
  
  try {
    // Gerar descrição
    let descricao = descricao_template || `Operação ${tipo_operacao}`;
    
    // Substituir placeholders na descrição
    if (descricao_template && req.body) {
      descricao = descricao_template.replace(/\{(\w+)\}/g, (match, key) => {
        return req.body[key] || match;
      });
    }

    // Calcular quantidade de registros
    let quantidade_registros = 1;
    if (quantidade_callback && typeof quantidade_callback === 'function') {
      quantidade_registros = quantidade_callback(req, responseData) || 1;
    } else if (responseData && responseData.count) {
      quantidade_registros = responseData.count;
    } else if (responseData && Array.isArray(responseData)) {
      quantidade_registros = responseData.length;
    }

    // Preparar detalhes
    const detalhes = {};
    
    if (capturar_body && req.body) {
      detalhes.request_body = req.body;
    }
    
    if (capturar_resultado && responseData) {
      detalhes.response_data = responseData;
    }

    // Informações da requisição
    detalhes.method = req.method;
    detalhes.url = req.url;
    detalhes.timestamp = new Date().toISOString();

    if (erro) {
      detalhes.erro = true;
      detalhes.status_code = res.statusCode;
    }

    // Capturar informações do usuário (se disponível)
    const usuario = req.headers['x-user'] || req.body?.usuario || 'sistema';
    const ip_origem = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    // Criar o lote
    const query = `
      INSERT INTO lotes_operacoes 
      (numero_lote, tipo_operacao, descricao, detalhes, usuario, quantidade_registros, modulo, ip_origem, user_agent, status)
      VALUES (gerar_proximo_lote(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING numero_lote
    `;

    const result = await client.query(query, [
      tipo_operacao,
      descricao,
      JSON.stringify(detalhes),
      usuario,
      quantidade_registros,
      modulo,
      ip_origem,
      user_agent,
      erro ? 'erro' : 'concluido'
    ]);

    console.log(`✅ Lote criado: ${result.rows[0].numero_lote} - ${descricao}`);

  } catch (error) {
    console.error('❌ Erro ao criar lote automático:', error);
    // Não propagar o erro para não afetar a operação principal
  } finally {
    client.release();
  }
}

// Função helper para criar lotes manuais em operações específicas
export async function criarLoteManual({
  tipo_operacao,
  descricao,
  detalhes = {},
  usuario = 'sistema',
  quantidade_registros = 1,
  modulo,
  req = null
}) {
  await ensureInfra();
  const client = await pool.connect();
  
  try {
    // Capturar informações da requisição se disponível
    const ip_origem = req?.headers['x-forwarded-for'] || req?.connection.remoteAddress;
    const user_agent = req?.headers['user-agent'];

    const query = `
      INSERT INTO lotes_operacoes 
      (numero_lote, tipo_operacao, descricao, detalhes, usuario, quantidade_registros, modulo, ip_origem, user_agent)
      VALUES (gerar_proximo_lote(), $1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await client.query(query, [
      tipo_operacao,
      descricao,
      JSON.stringify(detalhes),
      usuario,
      quantidade_registros,
      modulo,
      ip_origem,
      user_agent
    ]);

    return result.rows[0];
  } finally {
    client.release();
  }
}

// Configurações predefinidas para diferentes tipos de operação
export const LOTE_CONFIGS = {
  // Animais
  CADASTRO_ANIMAL: {
    tipo_operacao: 'CADASTRO_ANIMAL',
    modulo: 'ANIMAIS',
    descricao_template: 'Cadastro de animal - Brinco: {brinco}',
    capturar_body: true
  },
  
  CADASTRO_ANIMAIS_LOTE: {
    tipo_operacao: 'CADASTRO_ANIMAIS',
    modulo: 'ANIMAIS',
    descricao_template: 'Cadastro em lote de animais',
    capturar_body: true,
    quantidade_callback: (req, res) => req.body?.animais?.length || 1
  },

  EXCLUSAO_ANIMAL: {
    tipo_operacao: 'EXCLUSAO_ANIMAL',
    modulo: 'ANIMAIS',
    descricao_template: 'Exclusão de animal - ID: {id}',
    capturar_body: true
  },

  // Contabilidade
  ENTRADA_NF: {
    tipo_operacao: 'ENTRADA_NF',
    modulo: 'CONTABILIDADE',
    descricao_template: 'Entrada de Nota Fiscal - Número: {numero}',
    capturar_body: true
  },

  LANCAMENTO_CUSTO: {
    tipo_operacao: 'LANCAMENTO_CUSTO',
    modulo: 'CUSTOS',
    descricao_template: 'Lançamento de custo - Tipo: {tipo} - Valor: R$ {valor}',
    capturar_body: true
  },

  ATUALIZACAO_CUSTO: {
    tipo_operacao: 'ATUALIZACAO_CUSTO',
    modulo: 'CUSTOS',
    descricao_template: 'Atualização de custo - ID: {id}',
    capturar_body: true
  },

  EXCLUSAO_CUSTO: {
    tipo_operacao: 'EXCLUSAO_CUSTO',
    modulo: 'CUSTOS',
    descricao_template: 'Exclusão de custo - ID: {id}',
    capturar_body: true
  },

  // Gestação
  CADASTRO_GESTACAO: {
    tipo_operacao: 'CADASTRO_GESTACAO',
    modulo: 'GESTACAO',
    descricao_template: 'Cadastro de gestação - Receptora: {receptora_nome}',
    capturar_body: true
  },

  ATUALIZACAO_GESTACAO: {
    tipo_operacao: 'ATUALIZACAO_GESTACAO',
    modulo: 'GESTACAO',
    descricao_template: 'Atualização de gestação - ID: {id}',
    capturar_body: true
  },

  EXCLUSAO_GESTACAO: {
    tipo_operacao: 'EXCLUSAO_GESTACAO',
    modulo: 'GESTACAO',
    descricao_template: 'Exclusão de gestação - ID: {id}',
    capturar_body: true
  },

  // Estoque - Nitrogênio
  ABASTECIMENTO_NITROGENIO: {
    tipo_operacao: 'ABASTECIMENTO_NITROGENIO',
    modulo: 'ESTOQUE',
    descricao_template: 'Abastecimento de nitrogênio - {quantidade_litros}L - Motorista: {motorista}',
    capturar_body: true
  },

  // Nascimentos
  REGISTRO_NASCIMENTO: {
    tipo_operacao: 'REGISTRO_NASCIMENTO',
    modulo: 'NASCIMENTOS',
    descricao_template: 'Registro de nascimento - Touro: {touro}',
    capturar_body: true
  },

  EXCLUSAO_NASCIMENTO: {
    tipo_operacao: 'EXCLUSAO_NASCIMENTO',
    modulo: 'NASCIMENTOS',
    descricao_template: 'Exclusão de nascimento(s)',
    capturar_body: true,
    quantidade_callback: (req, res) => req.query?.ids?.split(',').length || 1
  },

  // Mortes
  REGISTRO_MORTE: {
    tipo_operacao: 'REGISTRO_MORTE',
    modulo: 'MORTES',
    descricao_template: 'Registro de morte - Animal: {animal_id}',
    capturar_body: true
  },

  // Sêmen
  ENTRADA_SEMEN: {
    tipo_operacao: 'ENTRADA_SEMEN',
    modulo: 'SEMEN',
    descricao_template: 'Entrada de sêmen - Touro: {nomeTouro} - RG: {rgTouro} - Raça: {raca} - Qtd: {quantidadeDoses} - Fornecedor: {fornecedor}',
    capturar_body: true
  },

  SAIDA_SEMEN: {
    tipo_operacao: 'SAIDA_SEMEN',
    modulo: 'SEMEN',
    descricao_template: 'Saída de sêmen - Destino: {destino} - Qtd: {quantidadeDoses}',
    capturar_body: true
  },

  SAIDA_SEMEN_LOTE: {
    tipo_operacao: 'SAIDA_SEMEN_LOTE',
    modulo: 'SEMEN',
    descricao_template: 'Saída de sêmen em lote',
    capturar_body: true,
    quantidade_callback: (req, res) => Array.isArray(req.body?.saidas) ? req.body.saidas.length : 1
  },

  // Receptoras
  CADASTRO_RECEPTORAS: {
    tipo_operacao: 'CADASTRO_RECEPTORAS',
    modulo: 'RECEPTORAS',
    descricao_template: 'Cadastro em lote de receptoras',
    capturar_body: true,
    quantidade_callback: (req, res) => req.body?.receptoras?.length || 1
  },

  // Protocolos e Medicamentos
  LANCAMENTO_PROTOCOLO: {
    tipo_operacao: 'LANCAMENTO_PROTOCOLO',
    modulo: 'PROTOCOLOS',
    descricao_template: 'Lançamento de protocolo/medicamento',
    capturar_body: true,
    quantidade_callback: (req, res) => {
      // Contar quantos medicamentos/protocolos foram salvos
      const { protocolos, medicamentos } = req.body || {};
      let count = 0;
      if (protocolos) count += Object.keys(protocolos).length;
      if (medicamentos) count += Object.keys(medicamentos).length;
      return count || 1;
    }
  },

  ATUALIZACAO_PROTOCOLO: {
    tipo_operacao: 'ATUALIZACAO_PROTOCOLO',
    modulo: 'PROTOCOLOS',
    descricao_template: 'Atualização de protocolo - ID: {id}',
    capturar_body: true
  },

  EXCLUSAO_PROTOCOLO: {
    tipo_operacao: 'EXCLUSAO_PROTOCOLO',
    modulo: 'PROTOCOLOS',
    descricao_template: 'Exclusão de protocolo - ID: {id}',
    capturar_body: true
  },

  // Exames Andrológicos
  CADASTRO_EXAME_ANDROLOGICO: {
    tipo_operacao: 'CADASTRO_EXAME_ANDROLOGICO',
    modulo: 'REPRODUCAO',
    descricao_template: 'Cadastro de exame andrológico - Touro: {touro} - Resultado: {resultado}',
    capturar_body: true
  },

  ATUALIZACAO_EXAME_ANDROLOGICO: {
    tipo_operacao: 'ATUALIZACAO_EXAME_ANDROLOGICO',
    modulo: 'REPRODUCAO',
    descricao_template: 'Atualização de exame andrológico - Touro: {touro} - Resultado: {resultado}',
    capturar_body: true
  },

  EXCLUSAO_EXAME_ANDROLOGICO: {
    tipo_operacao: 'EXCLUSAO_EXAME_ANDROLOGICO',
    modulo: 'REPRODUCAO',
    descricao_template: 'Exclusão de exame andrológico - ID: {id}',
    capturar_body: true
  }
};

export default { withLoteTracking, criarLoteManual, LOTE_CONFIGS };
