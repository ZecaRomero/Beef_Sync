// Serviço de acesso ao banco de dados PostgreSQL
const { query, testConnection, getPoolInfo } = require('../lib/database');
const loggerModule = require('../utils/logger');
const logger = loggerModule.default || loggerModule;

class DatabaseService {
  
  // Testar conexão
  async testConnection() {
    return await testConnection()
  }

  // Executar query
  async query(text, params) {
    return await query(text, params)
  }
  
  // Obter informações do pool
  getPoolInfo() {
    return getPoolInfo()
  }

  // Contar registros em uma tabela (whitelist para evitar SQL injection)
  static ALLOWED_TABLES = ['animais', 'nascimentos', 'custos', 'estoque_semen', 'inseminacoes', 'gestacoes', 'mortes', 'pesagens', 'localizacoes_animais', 'notas_fiscais', 'servicos', 'notificacoes'];

  async getTableCount(tableName) {
    const safeName = String(tableName || '').trim().toLowerCase();
    if (!DatabaseService.ALLOWED_TABLES.includes(safeName)) {
      throw new Error(`Tabela inválida: ${tableName}`);
    }
    const result = await query(`SELECT COUNT(*) as count FROM ${safeName}`);
    return parseInt(result.rows[0].count, 10);
  }

  // Obter estatísticas do sistema
  async getSystemStats() {
    try {
      const [totalAnimals, totalBirths, totalCosts, totalSemen] = await Promise.all([
        this.getTableCount('animais'),
        this.getTableCount('nascimentos'),
        this.getTableCount('custos'),
        this.getTableCount('estoque_semen')
      ]);

      return {
        totalAnimals,
        totalBirths,
        totalCosts,
        totalSemen,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  }
  
  // ============ OPERAÇÕES COM ANIMAIS ============
  
  // Método buscarAnimalPorId removido daqui pois estava duplicado
  // Veja a implementação completa mais abaixo na classe (linha ~750)
  
  // Buscar histórico completo do animal
  async buscarHistoricoAnimal(id) {
    try {
      // Buscar dados básicos do animal
      const animal = await this.buscarAnimalPorId(id);
      if (!animal) return null;

      // Buscar pesagens
      const pesagens = await query(`
        SELECT * FROM pesagens WHERE animal_id = $1 ORDER BY data DESC
      `, [animal.id]);

      // Buscar inseminações
      const inseminacoes = await query(`
        SELECT * FROM inseminacoes WHERE animal_id = $1 ORDER BY data_ia DESC
      `, [animal.id]);

      // Buscar custos
      const custos = await query(`
        SELECT * FROM custos WHERE animal_id = $1 ORDER BY data DESC
      `, [animal.id]);

      // Buscar gestações (como mãe ou receptora)
      const gestacoes = await query(`
        SELECT * FROM gestacoes 
        WHERE (mae_serie = $1 AND mae_rg = $2) 
           OR (receptora_serie = $1 AND receptora_rg = $2)
        ORDER BY created_at DESC
      `, [animal.serie, animal.rg]);

      // Buscar nascimentos (filhos) - onde este animal é a mãe
      // Busca por: serie-rg no mae, serie+rg, ou nome da mãe (ex: MOSCA SANT ANNA)
      const filhosParams = [`%${animal.serie}-${animal.rg}%`, `${animal.serie} ${animal.rg}`]
      let filhosSql = `SELECT * FROM animais WHERE mae LIKE $1 OR mae = $2`
      if (animal.nome) {
        filhosParams.push(animal.nome.trim())
        filhosSql += ` OR UPPER(TRIM(mae)) = UPPER(TRIM($${filhosParams.length}))`
      }
      filhosSql += ` ORDER BY data_nascimento DESC NULLS LAST`
      const filhosResult = await query(filhosSql, filhosParams)
      
      // Buscar protocolos sanitários
      const protocolos = await query(`
        SELECT * FROM protocolos_aplicados WHERE animal_id = $1 ORDER BY data_inicio DESC
      `, [animal.id]);

      // Buscar movimentações
      const localizacoes = await query(`
        SELECT * FROM localizacoes_animais WHERE animal_id = $1 ORDER BY data_entrada DESC
      `, [animal.id]);

      // Buscar coletas FIV
      const fivs = await query(`
        SELECT * FROM coleta_fiv WHERE doadora_id = $1 ORDER BY data_fiv DESC
      `, [animal.id]);

      return {
        ...animal,
        pesagens: pesagens.rows,
        inseminacoes: inseminacoes.rows,
        custos: custos.rows,
        gestacoes: gestacoes.rows,
        filhos: filhosResult.rows,
        protocolos: protocolos.rows,
        localizacoes: localizacoes.rows,
        fivs: fivs.rows
      };
    } catch (error) {
      throw new Error(`Erro ao buscar histórico do animal: ${error.message}`);
    }
  }
  
  // Atualizar situação do animal
  async atualizarSituacaoAnimal(id, situacao) {
    try {
      const result = await query(`
        UPDATE animais 
        SET situacao = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `, [situacao, id]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao atualizar situação do animal: ${error.message}`);
    }
  }
  
  // ============ OPERAÇÕES COM CUSTOS ============
  
  // Registrar custo
  async registrarCusto(custoData) {
    const {
      animal_id,
      tipo,
      subtipo,
      valor,
      data,
      observacoes,
      detalhes,
      created_at
    } = custoData;

    try {
      const result = await query(`
        INSERT INTO custos (
          animal_id, tipo, subtipo, valor, data, observacoes, detalhes, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `, [
        animal_id, tipo, subtipo, valor, data, observacoes, detalhes, created_at
      ]);

      logger.debug('Custo registrado com sucesso:', { custoId: result.rows[0].id });

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao registrar custo: ${error.message}`);
    }
  }

  // ============ OPERAÇÕES COM SÊMEN ============
  
  // Criar sêmen
  async criarSemen(semenData) {
    const {
      nome_touro,
      rg_touro,
      raca,
      quantidade_doses,
      valor_unitario,
      botijao,
      caneca,
      certificado,
      data_validade,
      fornecedor,
      nota_fiscal,
      situacao,
      created_at
    } = semenData;

    try {
      const result = await query(`
        INSERT INTO semen (
          nome_touro, rg_touro, raca, quantidade_doses, valor_unitario,
          botijao, caneca, certificado, data_validade, fornecedor,
          nota_fiscal, situacao, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *
      `, [
        nome_touro, rg_touro, raca, quantidade_doses, valor_unitario,
        botijao, caneca, certificado, data_validade, fornecedor,
        nota_fiscal, situacao, created_at
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao criar sêmen: ${error.message}`);
    }
  }

  // ============ OPERAÇÕES COM EMBRIÕES ============
  
  // Criar embrião
  async criarEmbriao(embriaoData) {
    const {
      doadora,
      touro,
      raca,
      quantidade,
      valor_unitario,
      tipo,
      qualidade,
      data_coleta,
      fornecedor,
      nota_fiscal,
      situacao,
      created_at
    } = embriaoData;

    try {
      const result = await query(`
        INSERT INTO embrioes (
          doadora, touro, raca, quantidade, valor_unitario, tipo,
          qualidade, data_coleta, fornecedor, nota_fiscal, situacao, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *
      `, [
        doadora, touro, raca, quantidade, valor_unitario, tipo,
        qualidade, data_coleta, fornecedor, nota_fiscal, situacao, created_at
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao criar embrião: ${error.message}`);
    }
  }

  // ============ OPERAÇÕES COM MORTES ============
  
  // Registrar morte
  async registrarMorte(morteData) {
    const {
      animal_id,
      data_morte,
      causa_morte,
      observacoes,
      valor_perda,
      created_at
    } = morteData;

    try {
      const result = await query(`
        INSERT INTO mortes (
          animal_id, data_morte, causa_morte, observacoes, valor_perda, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        ) RETURNING *
      `, [
        animal_id, data_morte, causa_morte, observacoes, valor_perda, created_at
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao registrar morte: ${error.message}`);
    }
  }
  
  // Buscar mortes
  async buscarMortes(filtros = {}) {
    try {
      let queryText = `
        SELECT m.*, 
               a.serie, a.rg, a.sexo, a.raca, a.peso, a.custo_total, a.data_nascimento, a.valor_venda
        FROM mortes m
        JOIN animais a ON m.animal_id = a.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 1;
      
      if (filtros.startDate) {
        queryText += ` AND m.data_morte >= $${paramCount}`;
        params.push(filtros.startDate);
        paramCount++;
      }
      
      if (filtros.endDate) {
        queryText += ` AND m.data_morte <= $${paramCount}`;
        params.push(filtros.endDate);
        paramCount++;
      }
      
      if (filtros.causa) {
        queryText += ` AND m.causa_morte ILIKE $${paramCount}`;
        params.push(`%${filtros.causa}%`);
        paramCount++;
      }
      
      if (filtros.animalId) {
        queryText += ` AND m.animal_id = $${paramCount}`;
        params.push(parseInt(filtros.animalId));
        paramCount++;
      }
      
      queryText += ` ORDER BY m.data_morte DESC, m.created_at DESC`;
      
      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao buscar mortes: ${error.message}`);
    }
  }

  // Buscar morte por ID
  async buscarMortePorId(id) {
    try {
      const result = await query(`
        SELECT m.*, 
               a.serie, a.rg, a.sexo, a.raca, a.peso, a.custo_total
        FROM mortes m
        JOIN animais a ON m.animal_id = a.id
        WHERE m.id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erro ao buscar morte por ID: ${error.message}`);
    }
  }

  // Atualizar morte
  async atualizarMorte(id, dadosAtualizacao) {
    const {
      data_morte,
      causa_morte,
      observacoes,
      valor_perda,
      updated_at
    } = dadosAtualizacao;

    try {
      const result = await query(`
        UPDATE mortes SET
          data_morte = $2,
          causa_morte = $3,
          observacoes = $4,
          valor_perda = $5,
          updated_at = $6
        WHERE id = $1
        RETURNING *
      `, [
        id, data_morte, causa_morte, observacoes, valor_perda, updated_at
      ]);

      if (result.rows.length === 0) {
        throw new Error('Registro de morte não encontrado');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao atualizar morte: ${error.message}`);
    }
  }

  // Excluir morte
  async excluirMorte(id) {
    try {
      const result = await query(`
        DELETE FROM mortes 
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        throw new Error('Registro de morte não encontrado');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao excluir morte: ${error.message}`);
    }
  }
  
  // ============ OPERAÇÕES COM CAUSAS DE MORTE ============
  
  // Buscar causas de morte
  async buscarCausasMorte() {
    try {
      const result = await query(`
        SELECT * FROM causas_morte 
        ORDER BY causa ASC
      `);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao buscar causas de morte: ${error.message}`);
    }
  }
  
  // Adicionar causa de morte
  async adicionarCausaMorte(causa) {
    try {
      const result = await query(`
        INSERT INTO causas_morte (causa, created_at) 
        VALUES ($1, CURRENT_TIMESTAMP) 
        RETURNING *
      `, [causa]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao adicionar causa de morte: ${error.message}`);
    }
  }
  
  // Remover causa de morte
  async removerCausaMorte(id) {
    try {
      const result = await query(`
        DELETE FROM causas_morte 
        WHERE id = $1 
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Causa de morte não encontrada');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao remover causa de morte: ${error.message}`);
    }
  }
  
  // ============ OPERAÇÕES COM BOLETIM CONTÁBIL ============
  
  // Obter ou criar boletim do período
  async obterBoletimPeriodo(periodo) {
    try {
      let result = await query(`
        SELECT * FROM boletim_contabil 
        WHERE periodo = $1
      `, [periodo]);
      
      if (result.rows.length === 0) {
        // Criar novo boletim
        result = await query(`
          INSERT INTO boletim_contabil (periodo, resumo) 
          VALUES ($1, $2) 
          RETURNING *
        `, [periodo, JSON.stringify({
          totalEntradas: 0,
          totalSaidas: 0,
          totalCustos: 0,
          totalReceitas: 0,
          saldoPeriodo: 0
        })]);
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao obter boletim: ${error.message}`);
    }
  }
  
  // Registrar movimentação contábil
  async registrarMovimentacao(dadosMovimentacao) {
    const {
      periodo,
      tipo,
      subtipo,
      dataMovimento,
      animalId,
      valor,
      descricao,
      observacoes,
      localidade,
      dadosExtras
    } = dadosMovimentacao;

    try {
      // Obter boletim do período
      const boletim = await this.obterBoletimPeriodo(periodo);
      
      // Inserir movimentação
      const result = await query(`
        INSERT INTO movimentacoes_contabeis (
          boletim_id, tipo, subtipo, data_movimento, animal_id, 
          valor, descricao, observacoes, localidade, dados_extras
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) RETURNING *
      `, [
        boletim.id, tipo, subtipo, dataMovimento, animalId,
        valor, descricao, observacoes, localidade || null, JSON.stringify(dadosExtras || {})
      ]);
      
      // Atualizar resumo do boletim
      await this.atualizarResumoBoletim(boletim.id);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao registrar movimentação: ${error.message}`);
    }
  }
  
  // Atualizar resumo do boletim
  async atualizarResumoBoletim(boletimId) {
    try {
      const result = await query(`
        SELECT 
          SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as total_entradas,
          SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as total_saidas,
          SUM(CASE WHEN tipo = 'custo' THEN valor ELSE 0 END) as total_custos,
          SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas
        FROM movimentacoes_contabeis 
        WHERE boletim_id = $1
      `, [boletimId]);
      
      const totais = result.rows[0];
      const resumo = {
        totalEntradas: parseFloat(totais.total_entradas || 0),
        totalSaidas: parseFloat(totais.total_saidas || 0),
        totalCustos: parseFloat(totais.total_custos || 0),
        totalReceitas: parseFloat(totais.total_receitas || 0),
        saldoPeriodo: parseFloat(totais.total_receitas || 0) - parseFloat(totais.total_custos || 0)
      };
      
      await query(`
        UPDATE boletim_contabil 
        SET resumo = $1, data_atualizacao = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [JSON.stringify(resumo), boletimId]);
      
      return resumo;
    } catch (error) {
      throw new Error(`Erro ao atualizar resumo: ${error.message}`);
    }
  }
  
  // Buscar movimentações do período
  async buscarMovimentacoes(periodo, filtros = {}) {
    try {
      let queryText = `
        SELECT m.*, a.serie, a.rg, a.sexo, a.raca
        FROM movimentacoes_contabeis m
        LEFT JOIN animais a ON m.animal_id = a.id
        JOIN boletim_contabil b ON m.boletim_id = b.id
        WHERE b.periodo = $1
      `;
      
      const params = [periodo];
      let paramCount = 2;
      
      if (filtros.tipo) {
        queryText += ` AND m.tipo = $${paramCount}`;
        params.push(filtros.tipo);
        paramCount++;
      }
      
      if (filtros.subtipo) {
        queryText += ` AND m.subtipo = $${paramCount}`;
        params.push(filtros.subtipo);
        paramCount++;
      }
      
      if (filtros.startDate) {
        queryText += ` AND m.data_movimento >= $${paramCount}`;
        params.push(filtros.startDate);
        paramCount++;
      }
      
      if (filtros.endDate) {
        queryText += ` AND m.data_movimento <= $${paramCount}`;
        params.push(filtros.endDate);
        paramCount++;
      }
      
      queryText += ` ORDER BY m.data_movimento DESC, m.created_at DESC`;
      
      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao buscar movimentações: ${error.message}`);
    }
  }
  
  // Inserir novo animal
  async criarAnimal(animalData) {
    const {
      nome, serie, rg, tatuagem, sexo, raca, data_nascimento, hora_nascimento,
      peso, cor, tipo_nascimento, dificuldade_parto, meses, situacao,
      pai, mae, avo_materno, receptora, is_fiv, custo_total, valor_venda, valor_real,
      veterinario, abczg, deca, iqg, pt_iqg, observacoes, boletim, local_nascimento, pasto_atual,
      serie_pai, rg_pai, serie_mae, rg_mae
    } = animalData;

    try {
      const result = await query(`
        INSERT INTO animais (
          nome, serie, rg, tatuagem, sexo, raca, data_nascimento, hora_nascimento,
          peso, cor, tipo_nascimento, dificuldade_parto, meses, situacao,
          pai, mae, avo_materno, receptora, is_fiv, custo_total, valor_venda, valor_real,
          veterinario, abczg, deca, iqg, pt_iqg, observacoes, boletim, local_nascimento, pasto_atual,
          serie_pai, rg_pai, serie_mae, rg_mae
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        ) RETURNING *
      `, [
        nome, serie, rg, tatuagem, sexo, raca, data_nascimento, hora_nascimento,
        peso, cor, tipo_nascimento, dificuldade_parto, meses, situacao,
        pai, mae, avo_materno, receptora, is_fiv, custo_total, valor_venda, valor_real,
        veterinario, abczg, deca, iqg ?? null, pt_iqg ?? null, observacoes, boletim, local_nascimento, pasto_atual,
        serie_pai, rg_pai, serie_mae, rg_mae
      ]);

      return result.rows[0];
    } catch (error) {
      // Se for erro de duplicata, buscar o animal existente
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        const existingAnimal = await this.buscarAnimais({ serie, rg });
        if (existingAnimal.length > 0) {
          // Retornar o animal existente com aviso
          return {
            ...existingAnimal[0],
            _duplicate: true,
            _duplicateMessage: `⚠️ RG "${rg}" já existe no sistema!`
          };
        }
      }
      throw error;
    }
  }

  // Buscar todos os animais
  async buscarAnimais(filtros = {}) {
    let queryText = `
      SELECT a.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', c.id,
                   'tipo', c.tipo,
                   'subtipo', c.subtipo,
                   'valor', c.valor,
                   'data', c.data,
                   'observacoes', c.observacoes,
                   'detalhes', c.detalhes
                 ) ORDER BY c.data DESC
               ) FILTER (WHERE c.id IS NOT NULL), 
               '[]'::json
             ) as custos
      FROM animais a
      LEFT JOIN custos c ON a.id = c.animal_id
    `;
    
    const params = [];
    const conditions = [];

    // Aplicar filtros
    if (filtros.situacao) {
      conditions.push(`a.situacao = $${params.length + 1}`);
      params.push(filtros.situacao);
    }
    
    if (filtros.raca) {
      conditions.push(`a.raca = $${params.length + 1}`);
      params.push(filtros.raca);
    }
    
    if (filtros.sexo) {
      conditions.push(`a.sexo = $${params.length + 1}`);
      params.push(filtros.sexo);
    }
    
    if (filtros.serie) {
      // Busca case-insensitive e remove espaços
      conditions.push(`UPPER(TRIM(a.serie)) = UPPER(TRIM($${params.length + 1}))`);
      params.push(filtros.serie);
    }
    
    if (filtros.rg) {
      // Busca flexível: tenta como texto e como número
      const rgValue = filtros.rg.toString().trim();
      const rgNum = parseInt(rgValue);
      
      if (!isNaN(rgNum) && rgValue === rgNum.toString()) {
        // Se é um número válido sem zeros à esquerda, tentar ambas comparações
        conditions.push(`(TRIM(a.rg::text) = $${params.length + 1} OR a.rg = $${params.length + 2})`);
        params.push(rgValue, rgNum);
      } else {
        // Busca como texto (remove espaços)
        conditions.push(`TRIM(a.rg::text) = $${params.length + 1}`);
        params.push(rgValue);
      }
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += `
      GROUP BY a.id
    `;

    // Ordenação
    if (filtros.orderBy === 'created_at') {
      queryText += ` ORDER BY a.created_at DESC`;
    } else {
      queryText += ` ORDER BY a.data_nascimento DESC, a.created_at DESC`;
    }

    // Limite (usar parâmetro para evitar SQL injection)
    if (filtros.limit) {
      const limitVal = Math.min(Math.max(parseInt(filtros.limit, 10) || 0, 1), 10000);
      if (limitVal > 0) {
        params.push(limitVal);
        queryText += ` LIMIT $${params.length}`;
      }
    }

    const result = await query(queryText, params);
    // Compatibilidade: mapear genetica_2/decile_2 -> iqg/pt_iqg
    return result.rows.map(a => ({
      ...a,
      iqg: a.iqg ?? a.genetica_2,
      pt_iqg: a.pt_iqg ?? a.decile_2
    }));
  }

  /**
   * Enriquece animal com último DG de historia_ocorrencias quando o animal
   * não tem data_dg em animais (ex: DG lançado antes da correção).
   */
  async enriquecerComDGDeHistoria(animal) {
    if (!animal?.id) return animal
    if (animal.data_dg || animal.dataDG) return animal // Já tem DG no animal
    try {
      const dgResult = await query(`
        SELECT data, observacoes, descricao FROM historia_ocorrencias
        WHERE animal_id = $1 AND tipo = 'DG' AND data IS NOT NULL
        ORDER BY data DESC LIMIT 1
      `, [animal.id])
      if (dgResult.rows.length === 0) return animal
      const row = dgResult.rows[0]
      const dataDG = row.data
      let resultadoDG = 'Vazia'
      const texto = (row.observacoes || row.descricao || '').toLowerCase()
      if (texto.includes('prenha') || texto.includes('positivo')) resultadoDG = 'Prenha'
      else if (texto.includes('negativo') || texto.includes('vazia') || texto.includes('não') || texto.includes('nao')) resultadoDG = 'Vazia'
      else if (texto.includes('diagnóstico')) {
        const match = (row.observacoes || row.descricao || '').match(/Diagnóstico de Gestação:\s*(\w+)/i)
        if (match) resultadoDG = match[1].trim()
      }
      return {
        ...animal,
        data_dg: dataDG,
        dataDG: dataDG,
        resultado_dg: resultadoDG,
        resultadoDG: resultadoDG
      }
    } catch (e) {
      logger.warn('Erro ao enriquecer DG de historia_ocorrencias:', e.message)
      return animal
    }
  }

  /**
   * Enriquece dados de receptoras (mestiças) com data_te da NF de entrada,
   * data_chegada, data_dg, resultado_dg e previsão de parto (9 meses após TE).
   * Previsão de parto só é adicionada quando DG = Prenha (não vazia).
   */
  async enriquecerDadosReceptora(animal) {
    if (!animal) return animal;
    const raca = (animal.raca || '').toLowerCase();
    const ehReceptora = raca.includes('mestiça') || raca.includes('mestica') || raca.includes('receptora');
    if (!ehReceptora) return animal;

    try {
      const serie = (animal.serie || '').trim();
      const rg = String(animal.rg || '').trim();
      const animalId = animal.id;

      // 1. Buscar data_te: prioridade transferencias_embrioes (receptora_id) > notas_fiscais
      let dataTE = null;
      let dataChegada = animal.data_chegada || animal.dataChegada;
      let nfNumero = animal.nf_numero || animal.numero_nf_entrada || animal.origem;

      const teResult = await query(`
        SELECT data_te, observacoes FROM transferencias_embrioes
        WHERE receptora_id = $1 AND data_te IS NOT NULL
        ORDER BY data_te DESC LIMIT 1
      `, [animalId]);
      if (teResult.rows.length > 0) {
        dataTE = teResult.rows[0].data_te;
        // Extrair NF da observação se existir (ex: "NF de Entrada: 2141")
        const obs = teResult.rows[0].observacoes || '';
        const nfMatch = obs.match(/NF[^0-9]*(\d+)/i);
        if (nfMatch && !nfNumero) nfNumero = nfMatch[1];
      }

      // 2. Se não tem TE, buscar da NF de entrada (notas_fiscais)
      if (!dataTE) {
        // 2a. Por numero_nf/origem do animal (se existir)
        if (nfNumero && typeof nfNumero === 'string' && nfNumero.trim()) {
          const nfByNum = await query(`
            SELECT data_te, data_chegada_animais, data_compra, numero_nf
            FROM notas_fiscais
            WHERE eh_receptoras = true AND tipo = 'entrada'
              AND numero_nf = $1 AND data_te IS NOT NULL
            LIMIT 1
          `, [nfNumero]);
          if (nfByNum.rows.length > 0) {
            dataTE = nfByNum.rows[0].data_te;
            dataChegada = dataChegada || nfByNum.rows[0].data_chegada_animais || nfByNum.rows[0].data_compra;
          }
        }
        // 2b. Por item tatuagem (nf com itens que tenham tatuagem = serie+rg)
        if (!dataTE && serie && rg) {
          const tatuagemVariantes = [`${serie}${rg}`, `${serie} ${rg}`, `${serie}-${rg}`, rg];
          for (const tat of tatuagemVariantes) {
            const nfByItem = await query(`
              SELECT nf.data_te, nf.data_chegada_animais, nf.data_compra, nf.numero_nf
              FROM notas_fiscais nf
              INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
              WHERE nf.eh_receptoras = true AND nf.tipo = 'entrada'
                AND nf.data_te IS NOT NULL
                AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
                AND (
                  item.dados_item::jsonb->>'tatuagem' = $1
                  OR REPLACE(LOWER(COALESCE(item.dados_item::jsonb->>'tatuagem','')), ' ', '') = REPLACE(LOWER($1), ' ', '')
                )
              ORDER BY nf.data_te DESC
              LIMIT 1
            `, [tat]);
            if (nfByItem.rows.length > 0) {
              dataTE = nfByItem.rows[0].data_te;
              dataChegada = dataChegada || nfByItem.rows[0].data_chegada_animais || nfByItem.rows[0].data_compra;
              nfNumero = nfNumero || nfByItem.rows[0].numero_nf;
              break;
            }
          }
        }
        // 2c. Por receptora_letra + receptora_numero na NF (ex: M + 1815 = M1815)
        if (!dataTE && serie && rg) {
          const nfFallback = await query(`
            SELECT data_te, data_chegada_animais, data_compra, numero_nf
            FROM notas_fiscais
            WHERE eh_receptoras = true AND tipo = 'entrada'
              AND (
                (TRIM(COALESCE(receptora_letra,'')) || TRIM(COALESCE(receptora_numero::text,''))) = $1
                OR (TRIM(receptora_letra) = $2 AND TRIM(receptora_numero::text) = $3)
              )
            ORDER BY data_te DESC NULLS LAST
            LIMIT 1
          `, [serie, serie.replace(/\d+$/, '').trim() || serie, rg]);
          if (nfFallback.rows.length > 0 && nfFallback.rows[0].data_te) {
            dataTE = nfFallback.rows[0].data_te;
            dataChegada = dataChegada || nfFallback.rows[0].data_chegada_animais || nfFallback.rows[0].data_compra;
            nfNumero = nfNumero || nfFallback.rows[0].numero_nf;
          }
        }
        // 2d. NF 2141: receptoras M1815, M3233... - buscar por numero_nf quando série = M+numero
        if (!dataTE && serie && rg && /^M\d+$/i.test(serie)) {
          const nf2141 = await query(`
            SELECT data_te, data_chegada_animais, data_compra, numero_nf
            FROM notas_fiscais
            WHERE numero_nf = '2141' AND tipo = 'entrada'
              AND (eh_receptoras = true OR data_te IS NOT NULL)
            LIMIT 1
          `);
          if (nf2141.rows.length > 0) {
            dataTE = nf2141.rows[0].data_te || dataTE;
            dataChegada = dataChegada || nf2141.rows[0].data_chegada_animais || nf2141.rows[0].data_compra;
            nfNumero = nfNumero || nf2141.rows[0].numero_nf;
          }
        }
      }

      const resultadoDG = (animal.resultado_dg || animal.resultadoDG || '').toString().trim();
      const ehPrenha = resultadoDG.toLowerCase().includes('pren');
      const ehVazia = resultadoDG.toLowerCase().includes('vazia') || resultadoDG === '';

      // Previsão de parto: 9 meses após TE - APENAS quando Prenha (não vazia no DG)
      let previsaoParto = null;
      if (dataTE && ehPrenha && !ehVazia) {
        const teDate = new Date(dataTE);
        const parto = new Date(teDate);
        parto.setMonth(parto.getMonth() + 9);
        previsaoParto = parto.toISOString().split('T')[0];
      }

      // Buscar fornecedor da NF quando tiver nf_numero
      let fornecedor = animal.fornecedor;
      if (nfNumero && !fornecedor) {
        try {
          const nfFornec = await query(`
            SELECT fornecedor FROM notas_fiscais WHERE numero_nf = $1 AND eh_receptoras = true LIMIT 1
          `, [nfNumero]);
          if (nfFornec.rows.length > 0 && nfFornec.rows[0].fornecedor) {
            fornecedor = nfFornec.rows[0].fornecedor;
          }
        } catch (e) { /* ignorar */ }
      }

      return {
        ...animal,
        data_te: dataTE || animal.data_te,
        dataTE: dataTE || animal.dataTE || animal.data_te,
        data_chegada: dataChegada || animal.data_chegada,
        dataChegada: dataChegada || animal.dataChegada || animal.data_chegada,
        nf_numero: nfNumero || animal.nf_numero,
        nfNumero: nfNumero || animal.nf_numero || animal.origem,
        fornecedor: fornecedor || animal.fornecedor,
        previsao_parto: previsaoParto || animal.previsao_parto,
        resultado_dg: animal.resultado_dg || resultadoDG || null,
        resultadoDG: animal.resultadoDG || animal.resultado_dg || resultadoDG || null,
        data_dg: animal.data_dg || animal.dataDG || null,
        dataDG: animal.data_dg || animal.dataDG || null
      };
    } catch (err) {
      logger.warn('Erro ao enriquecer dados receptora:', err.message);
      return animal;
    }
  }

  // Buscar animal por ID (ou RG)
  async buscarAnimalPorId(id) {
    // Base query for animal details with costs
    const baseQuery = `
      SELECT 
        a.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'tipo', c.tipo,
                'subtipo', c.subtipo,
                'valor', c.valor,
                'data', c.data,
                'data_registro', c.data_registro,
                'observacoes', c.observacoes,
                'detalhes', c.detalhes
              ) ORDER BY c.data DESC
            )
            FROM custos c
            WHERE c.animal_id = a.id
          ),
          '[]'::json
        ) as custos,
        COALESCE(
          (SELECT SUM(valor) FROM custos WHERE animal_id = a.id AND (data IS NULL OR data <= CURRENT_DATE)),
          0
        ) as custo_total_calculado
      FROM animais a
    `;

    // Helper to process result
    const processResult = async (result) => {
      if (result.rows[0]) {
        const animal = result.rows[0]
        // Calcular custo total a partir dos custos ou usar o calculado (exclui custos com data futura)
        let custoTotal = parseFloat(animal.custo_total_calculado || 0)
        
        // Se tiver custos no array, também calcular a partir deles para garantir
        if (animal.custos && Array.isArray(animal.custos) && animal.custos.length > 0) {
          const hoje = new Date()
          hoje.setHours(23, 59, 59, 999)
          const somaCustos = animal.custos.reduce((sum, custo) => {
            const dataCusto = custo.data || custo.data_custo
            if (dataCusto && new Date(dataCusto) > hoje) return sum // Excluir custos futuros
            return sum + parseFloat(custo.valor || 0)
          }, 0)
          // Usar o maior valor entre os dois cálculos
          custoTotal = Math.max(custoTotal, somaCustos)
        }
        
        // Se o custo_total da tabela estiver diferente, atualizar
        const custoTotalTabela = parseFloat(animal.custo_total || 0)
        if (Math.abs(custoTotal - custoTotalTabela) > 0.01) {
          // Atualizar na tabela para manter sincronizado
          try {
            await query(`
              UPDATE animais 
              SET custo_total = $1, updated_at = NOW()
              WHERE id = $2
            `, [custoTotal, animal.id])
            logger.info(`Custo total atualizado para animal ${animal.id}: R$ ${custoTotal.toFixed(2)}`)
          } catch (updateError) {
            // Se falhar a atualização, apenas logar e continuar
            logger.warn('Erro ao atualizar custo_total:', updateError.message)
          }
        }
        
        // Compatibilidade: mapear genetica_2/decile_2 -> iqg/pt_iqg quando colunas antigas existem
        const iqg = animal.iqg ?? animal.genetica_2
        const pt_iqg = animal.pt_iqg ?? animal.decile_2
        return {
          ...animal,
          iqg,
          pt_iqg,
          custo_total: custoTotal
        }
      }
      return null;
    };

    // 1. Tenta buscar por ID (garantir que seja número)
    try {
      const animalId = parseInt(id, 10)
      if (isNaN(animalId)) {
        logger.warn(`ID inválido fornecido: ${id}`)
        return null
      }
      
      logger.debug(`Buscando animal por ID numérico: ${animalId}`)
      const resultId = await query(`${baseQuery} WHERE a.id = $1`, [animalId]);
      
      if (resultId.rows.length === 0) {
        logger.debug(`Animal com ID ${animalId} não encontrado no banco de dados, tentando buscar por RG...`)
        // Forçar erro para cair no catch e tentar buscar por RG
        throw new Error('Animal não encontrado por ID')
      }

      logger.info(`Animal com ID ${animalId} encontrado. Processando dados...`)
      
      const processedId = await processResult(resultId);
      if (processedId) {
        // Buscar dados de FIV para determinar se é doadora e listar coletas
        // Priorizar busca por doadora_id (mais preciso)
        // Se não houver doadora_id, buscar por correspondência exata ou específica do nome/RG
        const nomeAnimal = processedId.nome || ''
        const rgAnimal = processedId.rg || ''
        const serieAnimal = processedId.serie || ''
        
        // Query: buscar APENAS por doadora_id para garantir precisão
        // Se não houver doadora_id, buscar por correspondência exata do nome/RG
        let fivQuery = 'SELECT * FROM coleta_fiv WHERE doadora_id = $1'
        const fivParams = [processedId.id]
        
        // Se não houver doadora_id nas coletas, buscar por correspondência exata
        // Construir possíveis formatos do nome da doadora (apenas correspondências exatas)
        const possiveisNomes = []
        if (rgAnimal) {
          // RG é o identificador mais único, priorizar busca por RG
          possiveisNomes.push(rgAnimal) // Apenas RG
          if (serieAnimal) {
            possiveisNomes.push(`${serieAnimal}-${rgAnimal}`) // Série-RG
            possiveisNomes.push(`${serieAnimal} ${rgAnimal}`) // Série RG
            // Também tentar sem espaço
            possiveisNomes.push(`${serieAnimal}${rgAnimal}`) // SérieRG
          }
          if (nomeAnimal) {
            possiveisNomes.push(`${nomeAnimal} ${rgAnimal}`) // Nome + RG
            possiveisNomes.push(nomeAnimal) // Nome exato
          }
        } else if (nomeAnimal) {
          possiveisNomes.push(nomeAnimal)
        }
        
        // Adicionar busca por nome apenas se doadora_id for NULL (correspondência exata)
        if (possiveisNomes.length > 0) {
          const nomeConditions = possiveisNomes.map((nome) => {
            fivParams.push(nome)
            return `(doadora_id IS NULL AND doadora_nome = $${fivParams.length})`
          })
          fivQuery += ` OR ${nomeConditions.join(' OR ')}`
        }
        
        fivQuery += ' ORDER BY data_fiv DESC'
        
        const fivResult = await query(fivQuery, fivParams);
        
        // Filtrar resultados para garantir que são realmente desta doadora
        // Verificar se o nome da doadora na coleta corresponde exatamente ao animal
        const coletasFiltradas = fivResult.rows.filter(coleta => {
          // Se tem doadora_id e corresponde, incluir
          if (coleta.doadora_id && coleta.doadora_id === processedId.id) return true
          
          // Se não tem doadora_id, verificar correspondência exata do nome
          if (!coleta.doadora_id && coleta.doadora_nome) {
            const nomeColeta = coleta.doadora_nome.trim()
            // Verificar correspondência exata com os possíveis formatos
            return possiveisNomes.some(nome => nome.trim() === nomeColeta)
          }
          
          return false
        })
        
        const animalCompleto = {
          ...processedId,
          fivs: coletasFiltradas,
          is_doadora: coletasFiltradas.length > 0
        };
        // Enriquecer com dados de receptora (data_te da NF, previsão de parto)
        const receptoraEnriquecido = await this.enriquecerDadosReceptora(animalCompleto);
        // Enriquecer com DG de historia_ocorrencias se animal não tiver data_dg
        return await this.enriquecerComDGDeHistoria(receptoraEnriquecido);
      }
    } catch (e) {
      if (e.message !== 'Animal não encontrado por ID') {
        logger.error(`Erro inesperado ao buscar animal por ID ${id}: ${e.message}`)
      }
      // Ignorar erro se busca por ID falhar
    }

    // 2. Se não encontrou por ID, tenta buscar por RG
    try {
      const resultRg = await query(`${baseQuery} WHERE a.rg = $1`, [id]);
      const processedRg = await processResult(resultRg);
      if (processedRg) {
        // Buscar dados de FIV para determinar se é doadora e listar coletas
        // Priorizar busca por doadora_id (mais preciso)
        // Se não houver doadora_id, buscar por correspondência exata ou específica do nome/RG
        const nomeAnimal = processedRg.nome || ''
        const rgAnimal = processedRg.rg || ''
        const serieAnimal = processedRg.serie || ''
        
        // Construir possíveis formatos do nome da doadora (apenas correspondências exatas)
        const possiveisNomes = []
        if (rgAnimal) {
          // RG é o identificador mais único, priorizar busca por RG
          possiveisNomes.push(rgAnimal) // Apenas RG
          if (serieAnimal) {
            possiveisNomes.push(`${serieAnimal}-${rgAnimal}`) // Série-RG
            possiveisNomes.push(`${serieAnimal} ${rgAnimal}`) // Série RG
            // Também tentar sem espaço
            possiveisNomes.push(`${serieAnimal}${rgAnimal}`) // SérieRG
          }
          if (nomeAnimal) {
            possiveisNomes.push(`${nomeAnimal} ${rgAnimal}`) // Nome + RG
            possiveisNomes.push(nomeAnimal) // Nome exato
          }
        } else if (nomeAnimal) {
          possiveisNomes.push(nomeAnimal)
        }
        
        // Query: buscar por ID primeiro, depois por correspondência exata do nome
        let fivQuery = 'SELECT * FROM coleta_fiv WHERE doadora_id = $1'
        const fivParams = [processedRg.id]
        
        // Se houver possíveis nomes, adicionar busca por nome (apenas se doadora_id for NULL)
        // Usar APENAS correspondência exata para evitar falsos positivos
        if (possiveisNomes.length > 0) {
          const nomeConditions = possiveisNomes.map((nome) => {
            fivParams.push(nome)
            return `(doadora_id IS NULL AND doadora_nome = $${fivParams.length})`
          })
          fivQuery += ` OR ${nomeConditions.join(' OR ')}`
        }
        
        fivQuery += ' ORDER BY data_fiv DESC'
        
        const fivResult = await query(fivQuery, fivParams);
        
        // Filtrar resultados para garantir que são realmente desta doadora
        const coletasFiltradas = fivResult.rows.filter(coleta => {
          // Se tem doadora_id e corresponde, incluir
          if (coleta.doadora_id && coleta.doadora_id === processedRg.id) return true
          
          // Se não tem doadora_id, verificar correspondência exata do nome
          if (!coleta.doadora_id && coleta.doadora_nome) {
            const nomeColeta = coleta.doadora_nome.trim()
            // Verificar correspondência exata com os possíveis formatos
            return possiveisNomes.some(nome => nome.trim() === nomeColeta)
          }
          
          return false
        })
        
        const animalCompleto = {
          ...processedRg,
          fivs: coletasFiltradas,
          is_doadora: coletasFiltradas.length > 0
        };
        // Enriquecer com dados de receptora (data_te da NF, previsão de parto)
        const receptoraEnriquecido = await this.enriquecerDadosReceptora(animalCompleto);
        // Enriquecer com DG de historia_ocorrencias se animal não tiver data_dg
        return await this.enriquecerComDGDeHistoria(receptoraEnriquecido);
      }
    } catch (e) {
      logger.error(`Erro ao buscar animal por RG: ${e.message}`);
    }

    return null;
  }

  // Atualizar animal
  async atualizarAnimal(id, dadosAtualizados) {
    // Resolver o ID real caso seja passado um RG
    let targetId = id
    try {
      const check = await query('SELECT id FROM animais WHERE CAST(id AS TEXT) = $1 OR rg = $1 LIMIT 1', [id])
      if (check.rows.length > 0) {
        targetId = check.rows[0].id
      }
    } catch (e) {
      // Ignorar erro na verificação; continuar com ID original
    }

    // Garantir que colunas existam (migração automática)
    try {
      await query(`ALTER TABLE animais ADD COLUMN IF NOT EXISTS pasto_atual VARCHAR(100)`)
      await query(`ALTER TABLE animais ADD COLUMN IF NOT EXISTS piquete_atual VARCHAR(200)`)
      await query(`ALTER TABLE animais ADD COLUMN IF NOT EXISTS situacao_abcz VARCHAR(100)`)
      await query(`ALTER TABLE animais ADD COLUMN IF NOT EXISTS iqg VARCHAR(50)`)
      await query(`ALTER TABLE animais ADD COLUMN IF NOT EXISTS pt_iqg VARCHAR(50)`)
    } catch (e) {
      if (!e.message?.includes('already exists')) logger?.warn?.('Migração colunas:', e.message)
    }

    // Buscar colunas válidas da tabela para filtrar o payload
    const colsRes = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'animais'
    `)
    const colSet = new Set(colsRes.rows.map(r => r.column_name))

    // Mapeamentos de alias (payload -> coluna real)
    const aliasMap = {
      dataDG: 'data_dg',
      resultadoDG: 'resultado_dg',
      veterinarioDG: 'veterinario_dg',
      observacoesDG: 'observacoes_dg',
      dataTE: 'data_te',
      dataChegada: 'data_chegada',
      precoVenda: 'valor_venda',
      status: 'situacao',
      situacaoAbcz: 'situacao_abcz',
      dataNascimento: 'data_nascimento',
      pastoAtual: 'pasto_atual',
      piqueteAtual: 'piquete_atual',
      localNascimento: 'local_nascimento'
    }

    const campos = []
    const valores = []
    let paramCount = 0

    for (const [campoOriginal, valor] of Object.entries(dadosAtualizados || {})) {
      if (campoOriginal === 'id') continue
      // Converter string vazia em null para data_nascimento (PostgreSQL DATE)
      let valorFinal = valor
      if ((campoOriginal === 'data_nascimento' || campoOriginal === 'dataNascimento') && (valor === '' || valor === undefined)) {
        valorFinal = null
      } else if (valor === undefined) {
        continue
      }
      const coluna = aliasMap[campoOriginal] || campoOriginal
      // Não permitir sobrescrever chaves internas
      if (coluna === 'created_at' || coluna === 'updated_at') continue
      if (colSet.has(coluna)) {
        campos.push(`${coluna} = $${++paramCount}`)
        valores.push(valorFinal)
      }
    }

    // Se não há campos válidos, retornar registro atual sem atualizar
    if (campos.length === 0) {
      const current = await query('SELECT * FROM animais WHERE id = $1 LIMIT 1', [targetId])
      return current.rows[0] || null
    }

    valores.push(targetId)

    const result = await query(`
      UPDATE animais 
      SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${++paramCount}
      RETURNING *
    `, valores)

    return result.rows[0]
  }

  // Deletar animal
  async deletarAnimal(id) {
    // Tentar resolver o ID real caso seja passado um RG
    let targetId = id;
    try {
      const check = await query('SELECT id FROM animais WHERE CAST(id AS TEXT) = $1 OR rg = $1 LIMIT 1', [id]);
      if (check.rows.length > 0) {
        targetId = check.rows[0].id;
      }
    } catch (e) {
      // Ignorar erro na verificação
    }

    const result = await query('DELETE FROM animais WHERE id = $1 RETURNING *', [targetId]);
    return result.rows[0];
  }

  // ============ OPERAÇÕES COM CUSTOS ============
  
  // Adicionar custo a um animal
  async adicionarCusto(animalId, custoData) {
    const { tipo, subtipo, valor, data, observacoes, detalhes } = custoData;

    const result = await query(`
      INSERT INTO custos (animal_id, tipo, subtipo, valor, data, observacoes, detalhes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [animalId, tipo, subtipo, valor, data, observacoes, detalhes ? JSON.stringify(detalhes) : null]);

    // Atualizar custo total do animal
    await this.atualizarCustoTotalAnimal(animalId);

    return result.rows[0];
  }

  // Buscar custos de um animal
  async buscarCustosAnimal(animalId) {
    const result = await query(`
      SELECT c.*, c.detalhes::json as detalhes_json
      FROM custos c
      WHERE c.animal_id = $1
      ORDER BY c.data DESC
    `, [animalId]);

    return result.rows;
  }

  // Buscar todos os custos
  async buscarTodosCustos(limit = 100) {
    const result = await query(`
      SELECT c.*, c.detalhes::json as detalhes_json
      FROM custos c
      ORDER BY c.data_registro DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  // Atualizar custo total do animal (exclui custos com data futura - exames agendados não contam ainda)
  async atualizarCustoTotalAnimal(animalId) {
    const result = await query(`
      UPDATE animais 
      SET custo_total = (
        SELECT COALESCE(SUM(valor), 0) 
        FROM custos 
        WHERE animal_id = $1
          AND (data IS NULL OR data <= CURRENT_DATE)
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING custo_total
    `, [animalId]);

    return result.rows[0]?.custo_total || 0;
  }

  // Calcular custo de medicamento baseado na quantidade aplicada e preço
  calcularCustoMedicamento(medicamento, quantidadeAplicada, quantidadeFrasco) {
    if (!medicamento || !medicamento.preco) {
      return 0
    }

    const precoFrasco = parseFloat(medicamento.preco) || 0
    const qtdAplicada = parseFloat(quantidadeAplicada) || 0
    const qtdFrasco = parseFloat(quantidadeFrasco) || 0

    // Se tiver quantidade aplicada e quantidade do frasco, calcular proporcionalmente
    if (qtdAplicada > 0 && qtdFrasco > 0 && precoFrasco > 0) {
      // Fórmula: (preço do frasco / quantidade total do frasco) * quantidade aplicada por animal
      return (precoFrasco / qtdFrasco) * qtdAplicada
    }

    // Se não tiver quantidade do frasco, usar preço fixo por animal se disponível
    if (medicamento.porAnimal) {
      return parseFloat(medicamento.porAnimal) * (qtdAplicada || 1)
    }

    // Fallback: usar preço do medicamento
    return precoFrasco
  }

  // Buscar custos de medicamentos de um animal
  async buscarCustosMedicamentosAnimal(animalId) {
    const result = await query(`
      SELECT c.*, c.detalhes::json as detalhes_json
      FROM custos c
      WHERE c.animal_id = $1
        AND c.tipo = 'Medicamento'
      ORDER BY c.data DESC, c.data_registro DESC
    `, [animalId]);

    return result.rows;
  }

  // Calcular custo total de medicamentos de um animal
  async calcularCustoTotalMedicamentosAnimal(animalId) {
    const result = await query(`
      SELECT COALESCE(SUM(valor), 0) as total
      FROM custos
      WHERE animal_id = $1
        AND tipo = 'Medicamento'
    `, [animalId]);

    return parseFloat(result.rows[0]?.total || 0);
  }

  // ============ OPERAÇÕES COM GESTAÇÕES ============
  
  // Criar gestação
  async criarGestacao(gestacaoData) {
    const {
      pai_serie, pai_rg, mae_serie, mae_rg, receptora_nome,
      receptora_serie, receptora_rg, data_cobertura, custo_acumulado,
      situacao, observacoes
    } = gestacaoData;

    const result = await query(`
      INSERT INTO gestacoes (
        pai_serie, pai_rg, mae_serie, mae_rg, receptora_nome,
        receptora_serie, receptora_rg, data_cobertura, custo_acumulado,
        situacao, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      pai_serie, pai_rg, mae_serie, mae_rg, receptora_nome,
      receptora_serie, receptora_rg, data_cobertura, custo_acumulado,
      situacao, observacoes
    ]);

    return result.rows[0];
  }

  // Buscar gestações
  async buscarGestacoes(filtros = {}) {
    let queryText = 'SELECT * FROM gestacoes';
    const params = [];
    const conditions = [];

    if (filtros.situacao) {
      conditions.push(`situacao = $${params.length + 1}`);
      params.push(filtros.situacao);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ' ORDER BY data_cobertura DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  // ============ OPERAÇÕES COM NASCIMENTOS ============
  
  // Registrar nascimento
  async registrarNascimento(nascimentoData) {
    const {
      gestacao_id, serie, rg, sexo, data_nascimento, hora_nascimento,
      peso, cor, tipo_nascimento, dificuldade_parto, custo_nascimento,
      veterinario, observacoes
    } = nascimentoData;

    const result = await query(`
      INSERT INTO nascimentos (
        gestacao_id, serie, rg, sexo, data_nascimento, hora_nascimento,
        peso, cor, tipo_nascimento, dificuldade_parto, custo_nascimento,
        veterinario, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      gestacao_id, serie, rg, sexo, data_nascimento, hora_nascimento,
      peso, cor, tipo_nascimento, dificuldade_parto, custo_nascimento,
      veterinario, observacoes
    ]);

    return result.rows[0];
  }

  // Buscar nascimentos
  async buscarNascimentos(filtros = {}) {
    let queryText = 'SELECT * FROM nascimentos';
    const params = [];
    const conditions = [];

    // Adicionar filtros
    if (filtros.gestacaoId) {
      conditions.push(`gestacao_id = $${params.length + 1}`);
      params.push(filtros.gestacaoId);
    }
    if (filtros.serie) {
      conditions.push(`serie = $${params.length + 1}`);
      params.push(filtros.serie);
    }
    if (filtros.rg) {
      conditions.push(`rg = $${params.length + 1}`);
      params.push(filtros.rg);
    }
    if (filtros.sexo) {
      conditions.push(`sexo = $${params.length + 1}`);
      params.push(filtros.sexo);
    }
    if (filtros.startDate) {
      conditions.push(`data_nascimento >= $${params.length + 1}`);
      params.push(filtros.startDate);
    }
    if (filtros.endDate) {
      conditions.push(`data_nascimento <= $${params.length + 1}`);
      params.push(filtros.endDate);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY data_nascimento DESC';

    if (filtros.limit) {
      queryText += ` LIMIT $${params.length + 1}`;
      params.push(filtros.limit);
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  // ============ ESTATÍSTICAS ============
  
  // Obter estatísticas gerais
  async obterEstatisticas() {
    const results = await Promise.all([
      query('SELECT COUNT(*) as total FROM animais'),
      query("SELECT COUNT(*) as ativos FROM animais WHERE situacao = 'Ativo'"),
      query("SELECT COUNT(*) as vendidos FROM animais WHERE situacao = 'Vendido'"),
      query("SELECT COUNT(*) as mortos FROM animais WHERE situacao = 'Morto'"),
      query(`SELECT COUNT(*) as nascimentos FROM nascimentos WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'`),
      query('SELECT COALESCE(SUM(custo_total), 0) as total_investido FROM animais'),
      query('SELECT COALESCE(SUM(valor_venda), 0) as total_recibido FROM animais WHERE valor_venda IS NOT NULL')
    ]);

    const [
      totalAnimais, animaisAtivos, animaisVendidos, animaisMortos,
      nascimentos, totalInvestido, totalRecibido
    ] = results.map(r => r.rows[0]);

    // Estatísticas por raça
    const racasResult = await query(`
      SELECT raca, COUNT(*) as quantidade
      FROM animais
      GROUP BY raca
      ORDER BY quantidade DESC
    `);

    // Estatísticas por sexo
    const sexosResult = await query(`
      SELECT sexo, COUNT(*) as quantidade
      FROM animais
      GROUP BY sexo
    `);

    // Estatísticas de estoque de sêmen
    const semenResult = await query(`
      SELECT 
        COUNT(*) as total_touros,
        COALESCE(SUM(doses_disponiveis), 0) as total_doses
      FROM estoque_semen
      WHERE status = 'disponivel'
    `);

    const semenStats = semenResult.rows[0] || { total_touros: 0, total_doses: 0 };

    return {
      total_animais: parseInt(totalAnimais.total),
      totalAnimais: parseInt(totalAnimais.total),
      animaisAtivos: parseInt(animaisAtivos.ativos),
      animaisVendidos: parseInt(animaisVendidos.vendidos),
      animaisMortos: parseInt(animaisMortos.mortos),
      total_nascimentos: parseInt(nascimentos.nascimentos),
      nascimentos: parseInt(nascimentos.nascimentos),
      totalInvestido: parseFloat(totalInvestido.total_investido),
      totalRecibido: parseFloat(totalRecibido.total_recibido),
      total_receita: parseFloat(totalRecibido.total_recibido),
      total_semen: parseInt(semenStats.total_touros),
      total_doses: parseInt(semenStats.total_doses),
      animaisPorRaca: racasResult.rows.reduce((acc, row) => {
        acc[row.raca] = parseInt(row.quantidade);
        return acc;
      }, {}),
      animaisPorSexo: sexosResult.rows.reduce((acc, row) => {
        acc[row.sexo] = parseInt(row.quantidade);
        return acc;
      }, {})
    };
  }

  // ============ OPERAÇÕES COM ESTOQUE DE SÊMEN ============
  
  // Buscar todo o estoque de sêmen
  async buscarEstoqueSemen(filtros = {}) {
    try {
      // Tentar com a estrutura nova
      let queryText = 'SELECT * FROM estoque_semen';
      const params = [];
      const conditions = [];

      // Aplicar filtros
      if (filtros.nomeTouro) {
        conditions.push(`nome_touro ILIKE $${params.length + 1}`);
        params.push(`%${filtros.nomeTouro}%`);
      }
      
      if (filtros.fornecedor) {
        conditions.push(`fornecedor ILIKE $${params.length + 1}`);
        params.push(`%${filtros.fornecedor}%`);
      }
      
      if (filtros.localizacao) {
        conditions.push(`localizacao ILIKE $${params.length + 1}`);
        params.push(`%${filtros.localizacao}%`);
      }
      
      if (filtros.status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filtros.status);
      }

      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      // Se falhar, tentar com a estrutura antiga
      if (error.code === '42703') {
        const logger = require('../utils/logger.cjs');
        logger.debug('Usando estrutura antiga para buscar estoque');
        
        let queryText = 'SELECT * FROM estoque_semen';
        const params = [];
        const conditions = [];

        // Aplicar filtros com estrutura antiga
        if (filtros.nomeTouro) {
          conditions.push(`serie ILIKE $${params.length + 1}`);
          params.push(`%${filtros.nomeTouro}%`);
        }
        
        if (filtros.fornecedor) {
          conditions.push(`fornecedor ILIKE $${params.length + 1}`);
          params.push(`%${filtros.fornecedor}%`);
        }

        if (conditions.length > 0) {
          queryText += ` WHERE ${conditions.join(' AND ')}`;
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, params);
        return result.rows;
      } else {
        throw error;
      }
    }
  }

  // Buscar entradas disponíveis para saída
  async buscarEntradasDisponiveis() {
    try {
      // Tentar com a estrutura nova
      const result = await query(`
        SELECT id, nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
               quantidade_doses, doses_disponiveis, doses_usadas, fornecedor, data_compra,
               certificado, data_validade, origem, linhagem, observacoes
        FROM estoque_semen 
        WHERE tipo_operacao = 'entrada' 
        AND doses_disponiveis > 0 
        AND status = 'disponivel'
        ORDER BY nome_touro, data_compra DESC
      `);
      return result.rows;
    } catch (error) {
      // Se falhar, tentar com a estrutura antiga
      if (error.code === '42703') {
        const logger = require('../utils/logger.cjs');
        logger.debug('Usando estrutura antiga para buscar entradas disponíveis');
        
        const result = await query(`
          SELECT id, serie as nome_touro, rg as rg_touro, raca, 
                 quantidade_doses, fornecedor, data_chegada as data_compra,
                 validade as data_validade, observacoes
          FROM estoque_semen 
          WHERE quantidade_doses > 0
          ORDER BY serie, data_chegada DESC
        `);
        return result.rows;
      } else {
        throw error;
      }
    }
  }

  // Buscar sêmen por ID
  async buscarSemenPorId(id) {
    const result = await query('SELECT * FROM estoque_semen WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Adicionar sêmen ao estoque
  async adicionarSemen(semenData) {
    const {
      nomeTouro, rgTouro, raca, localizacao, rackTouro, botijao, caneca,
      tipoOperacao, fornecedor, destino, numeroNF, valorCompra, dataCompra,
      quantidadeDoses, dosesDisponiveis, certificado, dataValidade, origem,
      linhagem, observacoes, entradaId, dataOperacao
    } = semenData;

    // Função para tratar valores de data
    const treatDateValue = (value) => {
      if (!value || value === '' || value.trim() === '') {
        return null;
      }
      return value;
    };

    // Se for operação de saída, validar e atualizar entrada
    if (tipoOperacao === 'saida') {
      if (!entradaId) {
        throw new Error('ID da entrada é obrigatório para operações de saída');
      }

      const quantidadeSaida = parseInt(quantidadeDoses) || 0;
      if (quantidadeSaida <= 0) {
        throw new Error('Quantidade de doses deve ser maior que zero');
      }

      // Buscar entrada para validação com log detalhado
      const entradaResult = await query('SELECT * FROM estoque_semen WHERE id = $1', [entradaId]);
      if (entradaResult.rows.length === 0) {
        throw new Error('Entrada não encontrada');
      }

      const entrada = entradaResult.rows[0];
      const dosesDisponiveis = entrada.doses_disponiveis || entrada.quantidade_doses || 0;

      // Log detalhado para debug
      const logger = require('../utils/logger.cjs');
      logger.debug('Validação de saída de sêmen:', {
        entradaId,
        quantidadeSaida,
        dosesDisponiveis,
        entrada: {
          id: entrada.id,
          nome_touro: entrada.nome_touro,
          quantidade_doses: entrada.quantidade_doses,
          doses_disponiveis: entrada.doses_disponiveis,
          doses_usadas: entrada.doses_usadas,
          status: entrada.status
        }
      });

      if (quantidadeSaida > dosesDisponiveis) {
        throw new Error(`Quantidade solicitada (${quantidadeSaida}) excede doses disponíveis (${dosesDisponiveis}). Entrada ID: ${entradaId}, Touro: ${entrada.nome_touro}`);
      }

      // Atualizar doses disponíveis na entrada
      const novasDosesDisponiveis = dosesDisponiveis - quantidadeSaida;
      const novoStatus = novasDosesDisponiveis === 0 ? 'esgotado' : 'disponivel';

      await query(`
        UPDATE estoque_semen 
        SET doses_disponiveis = $1, 
            doses_usadas = COALESCE(doses_usadas, 0) + $2,
            status = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [novasDosesDisponiveis, quantidadeSaida, novoStatus, entradaId]);

      // Registrar saída com dados da entrada
      const result = await query(`
        INSERT INTO estoque_semen (
          nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
          tipo_operacao, fornecedor, destino, numero_nf, valor_compra, data_compra,
          quantidade_doses, doses_disponiveis, certificado, data_validade, origem,
          linhagem, observacoes, doses_usadas, status, entrada_referencia, data_operacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, $15, $16, $17, $18, $19, $20, 'saida', $21, $22
        ) RETURNING *
      `, [
        entrada.nome_touro,
        entrada.rg_touro,
        entrada.raca,
        entrada.localizacao,
        entrada.rack_touro,
        entrada.botijao,
        entrada.caneca,
        'saida',
        entrada.fornecedor,
        destino || null,
        entrada.numero_nf,
        entrada.valor_compra,
        entrada.data_compra,
        quantidadeSaida,
        entrada.certificado,
        entrada.data_validade,
        entrada.origem,
        entrada.linhagem,
        observacoes || null,
        quantidadeSaida,
        entradaId,
        dataOperacao || new Date().toISOString().split('T')[0]
      ]);

      return result.rows[0];
    }

    // Operação de entrada (código original)
    try {
      // Tentar inserir com a estrutura nova
      const result = await query(`
        INSERT INTO estoque_semen (
          nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
          tipo_operacao, fornecedor, destino, numero_nf, valor_compra, data_compra,
          quantidade_doses, doses_disponiveis, certificado, data_validade, origem,
          linhagem, observacoes, doses_usadas, status, data_operacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 0, 'disponivel', $21
        ) RETURNING *
      `, [
        nomeTouro || 'Sem nome',
        rgTouro || null,
        raca || null,
        localizacao || 'Sem localização',
        rackTouro || null,
        botijao || null,
        caneca || null,
        tipoOperacao || 'entrada',
        fornecedor || null,
        destino || null,
        numeroNF || null,
        parseFloat(valorCompra) || 0,
        dataCompra || new Date().toISOString().split('T')[0],
        parseInt(quantidadeDoses) || 0,
        parseInt(dosesDisponiveis) || parseInt(quantidadeDoses) || 0,
        certificado || null,
        treatDateValue(dataValidade),
        origem || null,
        linhagem || null,
        observacoes || null,
        dataOperacao || new Date().toISOString().split('T')[0]
      ]);

      return result.rows[0];
    } catch (error) {
      // Se falhar, tentar com a estrutura antiga
      if (error.code === '42703') { // Coluna não existe
        const logger = require('../utils/logger.cjs');
        logger.debug('Usando estrutura antiga da tabela');
        
        const result = await query(`
          INSERT INTO estoque_semen (
            serie, rg, raca, quantidade_doses, preco_por_dose, fornecedor, 
            data_chegada, validade, observacoes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) RETURNING *
        `, [
          nomeTouro || 'Sem nome', // serie
          rgTouro || null, // rg
          raca || null, // raca
          parseInt(quantidadeDoses) || 0, // quantidade_doses
          parseFloat(valorCompra) || 0, // preco_por_dose
          fornecedor || null, // fornecedor
          dataCompra || new Date().toISOString().split('T')[0], // data_chegada
          treatDateValue(dataValidade), // validade (pode ser null)
          observacoes || null // observacoes
        ]);

        return result.rows[0];
      } else {
        throw error;
      }
    }
  }

  // Atualizar sêmen
  async atualizarSemen(id, dadosAtualizados) {
    try {
      const campos = [];
      const valores = [];
      let paramCount = 0;

      // Mapeamento de campos para garantir compatibilidade
      const mapeamentoCampos = {
        'nomeTouro': 'nome_touro',
        'rgTouro': 'rg_touro',
        'raca': 'raca',
        'localizacao': 'localizacao',
        'rackTouro': 'rack_touro',
        'botijao': 'botijao',
        'caneca': 'caneca',
        'tipoOperacao': 'tipo_operacao',
        'fornecedor': 'fornecedor',
        'destino': 'destino',
        'numeroNF': 'numero_nf',
        'valorCompra': 'valor_compra',
        'dataCompra': 'data_compra',
        'quantidadeDoses': 'quantidade_doses',
        'dosesDisponiveis': 'doses_disponiveis',
        'dosesUsadas': 'doses_usadas',
        'certificado': 'certificado',
        'dataValidade': 'data_validade',
        'origem': 'origem',
        'linhagem': 'linhagem',
        'observacoes': 'observacoes',
        'status': 'status'
      };

      for (const [campo, valor] of Object.entries(dadosAtualizados)) {
        if (campo !== 'id') {
          // Usar mapeamento ou converter camelCase para snake_case
          const campoBanco = mapeamentoCampos[campo] || campo.replace(/([A-Z])/g, '_$1').toLowerCase();
          campos.push(`${campoBanco} = $${++paramCount}`);
          
          // Tratar valores especiais
          if (campo === 'dataValidade' && (!valor || valor.trim() === '')) {
            valores.push(null);
          } else if (['valorCompra', 'quantidadeDoses', 'dosesDisponiveis', 'dosesUsadas'].includes(campo)) {
            valores.push(parseFloat(valor) || 0);
          } else {
            valores.push(valor);
          }
        }
      }

      if (campos.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      valores.push(id);

      const result = await query(`
        UPDATE estoque_semen 
        SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${++paramCount}
        RETURNING *
      `, valores);

      if (result.rows.length === 0) {
        throw new Error('Sêmen não encontrado para atualização');
      }

      return result.rows[0];
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error('Erro detalhado ao atualizar sêmen:', error);
      
      // Se falhar com estrutura nova, tentar com estrutura antiga
      if (error.code === '42703') {
        logger.debug('Tentando atualizar com estrutura antiga');
        
        const campos = [];
        const valores = [];
        let paramCount = 0;

        // Mapeamento para estrutura antiga
        const mapeamentoAntigo = {
          'nomeTouro': 'serie',
          'rgTouro': 'rg',
          'raca': 'raca',
          'quantidadeDoses': 'quantidade_doses',
          'valorCompra': 'preco_por_dose',
          'fornecedor': 'fornecedor',
          'dataCompra': 'data_chegada',
          'dataValidade': 'validade',
          'observacoes': 'observacoes'
        };

        for (const [campo, valor] of Object.entries(dadosAtualizados)) {
          if (campo !== 'id' && mapeamentoAntigo[campo]) {
            const campoBanco = mapeamentoAntigo[campo];
            campos.push(`${campoBanco} = $${++paramCount}`);
            
            if (campo === 'dataValidade' && (!valor || valor.trim() === '')) {
              valores.push(null);
            } else {
              valores.push(valor);
            }
          }
        }

        if (campos.length === 0) {
          throw new Error('Nenhum campo compatível para atualizar na estrutura antiga');
        }

        valores.push(id);

        const result = await query(`
          UPDATE estoque_semen 
          SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${++paramCount}
          RETURNING *
        `, valores);

        if (result.rows.length === 0) {
          throw new Error('Sêmen não encontrado para atualização');
        }

        return result.rows[0];
      } else {
        throw error;
      }
    }
  }

  // Deletar sêmen
  async deletarSemen(id) {
    // Primeiro, obter os dados do sêmen antes de excluir
    const semenResult = await query('SELECT * FROM estoque_semen WHERE id = $1', [id]);
    
    if (semenResult.rows.length === 0) {
      return null;
    }
    
    const semen = semenResult.rows[0];
    
    // Criar tabela de exclusões se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS semen_exclusoes (
        id SERIAL PRIMARY KEY,
        nome_touro VARCHAR(100),
        raca VARCHAR(50),
        fornecedor VARCHAR(100),
        data_exclusao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nome_touro, raca, fornecedor)
      )
    `);
    
    // Marcar como excluído na tabela de exclusões
    try {
      await query(`
        INSERT INTO semen_exclusoes (nome_touro, raca, fornecedor)
        VALUES ($1, $2, $3)
        ON CONFLICT (nome_touro, raca, fornecedor) DO NOTHING
      `, [semen.nome_touro || semen.serie, semen.raca, semen.fornecedor]);
    } catch (error) {
      const logger = require('../utils/logger');
      logger.debug('Registro já marcado como excluído ou erro ao marcar exclusão:', error.message);
    }
    
    // Agora excluir da tabela principal
    const result = await query('DELETE FROM estoque_semen WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Usar dose de sêmen
  async usarDoseSemen(id, quantidadeUsada = 1) {
    const result = await query(`
      UPDATE estoque_semen 
      SET 
        doses_disponiveis = GREATEST(0, doses_disponiveis - $2),
        doses_usadas = doses_usadas + $2,
        status = CASE 
          WHEN (doses_disponiveis - $2) <= 0 THEN 'esgotado'
          ELSE 'disponivel'
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, quantidadeUsada]);

    return result.rows[0];
  }

  // ============ RELATÓRIOS ============
  
  // Relatório de custos por animal
  async relatorioCustosAnimal(animalId) {
    const custos = await this.buscarCustosAnimal(animalId);
    const total = custos.reduce((sum, custo) => sum + parseFloat(custo.valor), 0);

    const custosPorTipo = custos.reduce((acc, custo) => {
      if (!acc[custo.tipo]) {
        acc[custo.tipo] = { total: 0, itens: [] };
      }
      acc[custo.tipo].total += parseFloat(custo.valor);
      acc[custo.tipo].itens.push(custo);
      return acc;
    }, {});

    return {
      animalId,
      custos,
      custosPorTipo,
      total,
      quantidadeItens: custos.length
    };
  }

  // Relatório geral de custos
  async relatorioGeral() {
    const result = await query(`
      SELECT 
        COUNT(DISTINCT c.animal_id) as animais_com_custos,
        SUM(c.valor) as total_geral,
        CASE 
          WHEN COUNT(DISTINCT c.animal_id) > 0 
          THEN SUM(c.valor) / COUNT(DISTINCT c.animal_id)
          ELSE 0 
        END as media_por_animal
      FROM custos c
    `);

    const animaisComCustos = await query(`
      SELECT 
        a.id,
        a.serie,
        a.rg,
        a.custo_total,
        COUNT(c.id) as qtd_custos
      FROM animais a
      LEFT JOIN custos c ON a.id = c.animal_id
      GROUP BY a.id, a.serie, a.rg, a.custo_total
      ORDER BY a.custo_total DESC
    `);

    return {
      animaisComCustos: result.rows[0]?.animais_com_custos || 0,
      totalGeral: parseFloat(result.rows[0]?.total_geral || 0),
      mediaPorAnimal: parseFloat(result.rows[0]?.media_por_animal || 0),
      custoPorAnimal: animaisComCustos.rows
    };
  }
}

// Instância singleton
const databaseService = new DatabaseService();

module.exports = databaseService;
module.exports.DatabaseService = DatabaseService;
module.exports.default = databaseService;
