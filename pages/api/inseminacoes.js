import { query } from '../../lib/database';
import { broadcast } from '../../lib/sseClients';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { animal_id } = req.query
      const params = animal_id ? [parseInt(animal_id, 10)] : []
      const whereClause = animal_id ? 'WHERE i.animal_id = $1' : ''
      // Listar inseminaÃ§Ãµes (todas ou por animal_id)
      try {
        const result = await query(`
          SELECT 
            i.*,
            a.serie,
            a.rg,
            a.nome as animal_nome,
            a.tatuagem,
            es.nome_touro as semen_nome_touro
          FROM inseminacoes i
          LEFT JOIN animais a ON i.animal_id = a.id
          LEFT JOIN estoque_semen es ON i.semen_id = es.id
          ${whereClause}
          ORDER BY i.data_ia DESC, i.created_at DESC
        `, params);

        // Enriquecer: usar nome do sÃªmen quando touro_nome parece ser sÃ³ sÃ©rie (ex: FGPA, CJCJ)
        const isPiqueteOuSerie = (v) => {
          if (!v || typeof v !== 'string') return false
          const t = v.trim()
          return /^PIQUETE\s*\d*$/i.test(t) || /^PIQ\s*\d*$/i.test(t) || /^[A-Z]{2,6}$/i.test(t)
        }

        // Enriquecer com serie_touro, rg_touro e corrigir touro_nome quando for sÃ³ sÃ©rie
        const rows = result.rows.map(row => {
          let serieTouro = row.serie_touro
          let rgTouro = row.rg_touro
          let touroNome = row.touro_nome || row.touro
          const touroRg = (row.touro_rg || '').toString().trim()
          const semenNome = row.semen_nome_touro
          if ((!serieTouro || !rgTouro) && touroRg && touroRg.includes(' ')) {
            const parts = touroRg.split(/\s+/)
            if (parts.length >= 2) {
              serieTouro = serieTouro || parts[0]
              rgTouro = rgTouro || parts.slice(1).join(' ')
            }
          } else if (!rgTouro && touroRg) {
            rgTouro = touroRg
          }
          if (isPiqueteOuSerie(touroNome) && semenNome) {
            touroNome = semenNome
          } else if (!touroNome && semenNome) {
            touroNome = semenNome
          } else if (isPiqueteOuSerie(touroNome) && (serieTouro && rgTouro)) {
            touroNome = `${serieTouro} ${rgTouro}`.trim()
          } else if (isPiqueteOuSerie(touroNome) && touroRg) {
            touroNome = touroRg
          }
          const { semen_nome_touro, ...rest } = row
          return {
            ...rest,
            data_inseminacao: rest.data_ia || rest.data_inseminacao,
            touro_nome: touroNome || rest.touro_nome,
            serie_touro: serieTouro || null,
            rg_touro: rgTouro || null
          }
        })

        return res.status(200).json({
          success: true,
          data: rows,
          count: rows.length
        });
      } catch (queryError) {
        console.error('Erro na query de inseminaÃ§Ãµes:', queryError);
        // Tentar sem o JOIN se der erro
        const result = await query(`
          SELECT * FROM inseminacoes 
          ORDER BY data_ia DESC, created_at DESC
        `);
        const rows = result.rows.map(row => {
          let serieTouro = row.serie_touro
          let rgTouro = row.rg_touro
          const touroRg = (row.touro_rg || '').toString().trim()
          if ((!serieTouro || !rgTouro) && touroRg && touroRg.includes(' ')) {
            const parts = touroRg.split(/\s+/)
            if (parts.length >= 2) {
              serieTouro = serieTouro || parts[0]
              rgTouro = rgTouro || parts.slice(1).join(' ')
            }
          } else if (!rgTouro && touroRg) {
            rgTouro = touroRg
          }
          return {
            ...row,
            data_inseminacao: row.data_ia || row.data_inseminacao,
            serie_touro: serieTouro || null,
            rg_touro: rgTouro || null
          }
        })
        return res.status(200).json({
          success: true,
          data: rows,
          count: rows.length
        });
      }
    }

    if (req.method === 'POST') {
      // Criar nova inseminaÃ§Ã£o
      const body = req.body || {};
      const modoAtualizar = body.modo === 'atualizar' || body.modoAtualizar === true;
      const animalId = body.animalId ?? body.animal_id;
      const numeroIA = body.numeroIA ?? body.numero_ia ?? 1;
      const dataIA = body.dataIA ?? body.data_inseminacao ?? body.data_ia;
      const dataDG = body.dataDG ?? body.data_dg ?? null;
      const resultadoDG = body.resultadoDG ?? body.resultado_dg ?? null;
      const touroNome = body.touroNome ?? body.touro_nome ?? body.touro ?? null;
      const touroRG = body.touroRG ?? body.touro_rg ?? null;
      const serieTouro = body.serie_touro ?? body.serieTouro ?? null;
      const semenId = body.semen_id ?? body.semenId ?? null;
      const tecnico = body.tecnico ?? null;
      const protocolo = body.protocolo ?? null;
      const statusGestacao = body.statusGestacao ?? body.status_gestacao ?? 'Pendente';
      const observacoes = body.observacoes ?? null;
      const custoDose = body.custoDose ?? body.custo_dose ?? null;

      // Validar dados obrigatÃ³rios
      if (!animalId || !dataIA) {
        return res.status(400).json({ 
          error: 'Dados obrigatÃ³rios nÃ£o fornecidos',
          required: ['animalId', 'dataIA']
        });
      }

      // Garantir data_ia em formato YYYY-MM-DD (converter Excel serial se necessÃ¡rio)
      let dataIAFinal = dataIA
      if (typeof dataIA === 'number' || (typeof dataIA === 'string' && /^\d+\.?\d*$/.test(String(dataIA).trim()))) {
        const num = parseFloat(dataIA)
        if (num > 0 && num < 1000000) {
          const excelEpoch = new Date(1899, 11, 30)
          const d = new Date(excelEpoch.getTime() + Math.floor(num) * 86400000)
          if (!isNaN(d.getTime())) dataIAFinal = d.toISOString().split('T')[0]
        }
      } else if (typeof dataIA === 'string' && dataIA.includes('T')) {
        dataIAFinal = dataIA.split('T')[0]
      }

      // Garantir colunas existem (migraÃ§Ã£o automÃ¡tica)
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS valida BOOLEAN DEFAULT true').catch(() => {})
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS serie_touro VARCHAR(50)').catch(() => {})
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS semen_id INTEGER').catch(() => {})

      // Modo Atualizar: se jÃ¡ existe IA com animal_id + data_ia, atualizar em vez de inserir
      if (modoAtualizar) {
        const dataFormatada = dataIAFinal;
        const existente = await query(
          'SELECT id FROM inseminacoes WHERE animal_id = $1 AND data_ia::date = $2::date LIMIT 1',
          [parseInt(animalId, 10), dataFormatada]
        );
        if (existente.rows.length > 0) {
          const id = existente.rows[0].id;
          await query(`
            UPDATE inseminacoes SET
              touro_nome = COALESCE($1, touro_nome),
              touro_rg = COALESCE($2, touro_rg),
              data_dg = COALESCE($3, data_dg), resultado_dg = COALESCE($4, resultado_dg),
              status_gestacao = COALESCE($5, status_gestacao), custo_dose = COALESCE($6, custo_dose),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
          `, [touroNome, touroRG, dataDG, resultadoDG, statusGestacao || 'Pendente', custoDose, id]);
          const updated = await query('SELECT * FROM inseminacoes WHERE id = $1', [id]);
          broadcast('inseminacao.updated', { animalId: parseInt(animalId, 10) });
          return res.status(200).json({ success: true, data: updated.rows[0], updated: true });
        }
      }

      // INSERT usando apenas colunas que existem na tabela base (sem serie_touro, semen_id)
      const result = await query(`
          INSERT INTO inseminacoes (
            animal_id, numero_ia, data_ia, data_dg, resultado_dg,
            touro_nome, touro_rg, tecnico, protocolo,
            status_gestacao, observacoes, custo_dose, valida,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [
          animalId,
        numeroIA || 1,
        dataIAFinal,
        dataDG || null,
        resultadoDG || null,
        touroNome || null,
        touroRG || null,
        tecnico || null,
        protocolo || null,
        statusGestacao || 'Pendente',
        observacoes || null,
        custoDose || null
      ]);

      const newInsem = result.rows[0]
      broadcast('inseminacao.created', { animalId: newInsem?.animal_id })
      return res.status(201).json({
        success: true,
        data: newInsem
      });
    }

    if (req.method === 'PUT') {
      // Atualizar inseminaÃ§Ã£o
      const { id } = req.query;
      const {
        numeroIA,
        dataIA,
        dataDG,
        touroNome,
        touroRG,
        tecnico,
        protocolo,
        statusGestacao,
        observacoes,
        custoDose
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID nÃ£o fornecido' });
      }

      const result = await query(`
        UPDATE inseminacoes SET
          numero_ia = COALESCE($1, numero_ia),
          data_ia = COALESCE($2, data_ia),
          data_dg = COALESCE($3, data_dg),
          touro_nome = COALESCE($4, touro_nome),
          touro_rg = COALESCE($5, touro_rg),
          tecnico = COALESCE($6, tecnico),
          protocolo = COALESCE($7, protocolo),
          status_gestacao = COALESCE($8, status_gestacao),
          observacoes = COALESCE($9, observacoes),
          custo_dose = COALESCE($10, custo_dose),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING *
      `, [
        numeroIA,
        dataIA,
        dataDG,
        touroNome,
        touroRG,
        tecnico,
        protocolo,
        statusGestacao,
        observacoes,
        custoDose,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'InseminaÃ§Ã£o nÃ£o encontrada' });
      }

      const updatedInsem = result.rows[0]
      broadcast('inseminacao.updated', { animalId: updatedInsem?.animal_id })
      return res.status(200).json({
        success: true,
        data: updatedInsem
      });
    }

    if (req.method === 'DELETE') {
      const { id, todos } = req.query;

      // Limpar todas as inseminaÃ§Ãµes
      if (todos === 'true' || todos === '1') {
        // Verificar senha de desenvolvedor
        const senha = req.headers['x-dev-password'] || req.body?.senha
        
        if (senha !== 'bfzk26') {
          return res.status(403).json({ 
            success: false,
            error: 'ðÅ¸â€�â€™ Acesso negado. Senha de desenvolvedor incorreta.' 
          })
        }
        
        const result = await query('DELETE FROM inseminacoes RETURNING id');
        const count = result.rowCount || 0;
        
        broadcast('inseminacao.deleted', { all: true })
        
        return res.status(200).json({
          success: true,
          message: `${count} inseminaÃ§Ã£o(Ãµes) removida(s)`,
          count
        });
      }

      // Deletar inseminaÃ§Ã£o por ID
      if (!id) {
        return res.status(400).json({ error: 'ID nÃ£o fornecido. Use ?todos=true para limpar todas.' });
      }

      const existing = await query('SELECT animal_id FROM inseminacoes WHERE id = $1', [id])
      const animalId = existing.rows[0]?.animal_id

      await query('DELETE FROM inseminacoes WHERE id = $1', [id]);

      if (animalId) {
        broadcast('inseminacao.deleted', { animalId, id })
      }

      return res.status(200).json({
        success: true,
        message: 'InseminaÃ§Ã£o deletada'
      });
    }

    return res.status(405).json({ error: 'MÃ©todo nÃ£o permitido' });

  } catch (error) {
    console.error('Erro na API de inseminaÃ§Ãµes:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
