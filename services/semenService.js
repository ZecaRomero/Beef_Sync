const { query } = require('./databaseService');

class SemenService {
  // Adicionar entrada de sÃªmen
  async adicionarEntrada(semenData) {
    try {
      const {
        nomeTouro, rgTouro, raca, localizacao, rackTouro, botijao, caneca,
        fornecedor, numeroNF, valorCompra, dataCompra, quantidadeDoses,
        certificado, dataValidade, origem, linhagem, observacoes
      } = semenData;

      const result = await query(`
        INSERT INTO estoque_semen (
          nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
          tipo_operacao, fornecedor, numero_nf, valor_compra, data_compra,
          quantidade_doses, doses_disponiveis, certificado, data_validade, origem,
          linhagem, observacoes, doses_usadas, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'entrada', $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 0, 'disponivel', CURRENT_TIMESTAMP
        ) RETURNING *
      `, [
        nomeTouro || 'Sem nome',
        rgTouro || null,
        raca || null,
        localizacao || 'Sem localizaÃ§Ã£o',
        rackTouro || null,
        botijao || null,
        caneca || null,
        fornecedor || null,
        numeroNF || null,
        parseFloat(valorCompra) || 0,
        dataCompra || new Date().toISOString().split('T')[0],
        parseInt(quantidadeDoses) || 0,
        parseInt(quantidadeDoses) || 0, // doses_disponiveis = quantidade inicial
        certificado || null,
        dataValidade || null,
        origem || null,
        linhagem || null,
        observacoes || null
      ]);

      return {
        success: true,
        data: result.rows[0],
        message: 'SÃªmen adicionado ao estoque com sucesso'
      };
    } catch (error) {
      console.error('Erro ao adicionar entrada de sÃªmen:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao adicionar sÃªmen ao estoque'
      };
    }
  }

  // Registrar saÃ­da de sÃªmen
  async registrarSaida(saidaData) {
    try {
      console.log('ðÅ¸â€œ¤ Dados recebidos para saÃ­da:', saidaData);
      
      const {
        entradaId, destino, quantidadeDoses, observacoes, dataOperacao, numeroNF
      } = saidaData;

      // ValidaÃ§Ãµes bÃ¡sicas
      if (!entradaId) {
        throw new Error('ID da entrada Ã© obrigatÃ³rio para operaÃ§Ãµes de saÃ­da');
      }

      if (!quantidadeDoses || quantidadeDoses <= 0) {
        throw new Error('Quantidade de doses deve ser maior que zero');
      }

      if (!destino || destino.trim() === '') {
        throw new Error('Destino Ã© obrigatÃ³rio para saÃ­das');
      }

      // Validar entrada
      const entradaResult = await query('SELECT * FROM estoque_semen WHERE id = $1 AND tipo_operacao = $2', [entradaId, 'entrada']);
      if (entradaResult.rows.length === 0) {
        throw new Error('Entrada nÃ£o encontrada ou invÃ¡lida');
      }

      const entrada = entradaResult.rows[0];
      const dosesDisponiveis = Math.max(0, parseInt(entrada.doses_disponiveis) || 0);
      const quantidadeSaida = parseInt(quantidadeDoses) || 0;
      const touroNome = entrada.nome_touro || 'N/A';

      if (dosesDisponiveis <= 0) {
        throw new Error(`${touroNome}: Sem doses disponÃ­veis (estoque: ${entrada.doses_disponiveis ?? 0})`);
      }

      if (quantidadeSaida > dosesDisponiveis) {
        throw new Error(`${touroNome}: Quantidade (${quantidadeSaida}) excede disponÃ­vel (${dosesDisponiveis})`);
      }

      // Atualizar doses disponÃ­veis na entrada
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

      // Registrar saÃ­da
      const saidaResult = await query(`
        INSERT INTO estoque_semen (
          nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
          tipo_operacao, destino, quantidade_doses, doses_disponiveis, 
          observacoes, doses_usadas, status, entrada_referencia, data_compra, numero_nf, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'saida', $8, $9, 0, $10, $11, 'saida', $12, $13, $14, CURRENT_TIMESTAMP
        ) RETURNING *
      `, [
        entrada.nome_touro,
        entrada.rg_touro,
        entrada.raca,
        entrada.localizacao,
        entrada.rack_touro,
        entrada.botijao,
        entrada.caneca,
        destino.trim(),
        quantidadeSaida,
        observacoes || null,
        quantidadeSaida,
        entradaId,
        dataOperacao || new Date().toISOString().split('T')[0],
        numeroNF || null
      ]);

      console.log('âÅ“â€¦ SaÃ­da registrada com sucesso:', saidaResult.rows[0]);

      return {
        success: true,
        data: saidaResult.rows[0],
        message: 'SaÃ­da de sÃªmen registrada com sucesso'
      };
    } catch (error) {
      console.error('â�Å’ Erro ao registrar saÃ­da de sÃªmen:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao registrar saÃ­da de sÃªmen'
      };
    }
  }

  /**
   * Registrar saÃ­das em lote
   * saidas: Array<{ entradaId, destino, quantidadeDoses, observacoes, dataOperacao }>
   */
  async registrarSaidaLote(saidas = []) {
    const resultados = []
    let sucesso = 0
    let falhas = 0

    for (const item of saidas) {
      const result = await this.registrarSaida(item)
      resultados.push({ input: item, ...result })
      if (result.success) sucesso++
      else falhas++
    }

    const falhasDetalhes = resultados
      .filter(r => !r.success)
      .map(r => ({ entradaId: r.input?.entradaId, error: r.error }))

    return {
      success: falhas === 0,
      message: falhas === 0
        ? `SaÃ­das registradas: ${sucesso}`
        : `SaÃ­das registradas: ${sucesso}. Falhas: ${falhas}`,
      data: resultados,
      count: sucesso,
      errors: falhasDetalhes
    }
  }

  // Buscar estoque disponÃ­vel
  // tipo: 'semen' | 'embriao' | null (todos)
  async buscarEstoqueDisponivel(tipo = null) {
    try {
      let sql = `
        SELECT * FROM estoque_semen 
        WHERE tipo_operacao = 'entrada' AND doses_disponiveis > 0
      `;
      if (tipo === 'semen') {
        sql += ` AND (COALESCE(tipo, '') != 'embriao') AND (nome_touro NOT ILIKE '% X %' AND nome_touro NOT ILIKE '%ACASALAMENTO%')`;
      } else if (tipo === 'embriao') {
        sql += ` AND (tipo = 'embriao' OR nome_touro ILIKE '% X %' OR nome_touro ILIKE '%ACASALAMENTO%')`;
      }
      sql += ` ORDER BY created_at DESC`;
      const result = await query(sql);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Erro ao buscar estoque disponÃ­vel:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

module.exports = new SemenService();