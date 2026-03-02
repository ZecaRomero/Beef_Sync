import { query } from '../../lib/database';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { animal_id } = req.query
      const params = animal_id ? [parseInt(animal_id, 10)] : []
      const whereClause = animal_id ? 'WHERE i.animal_id = $1' : ''
      // Listar inseminações (todas ou por animal_id)
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

        // Enriquecer: usar nome do sêmen quando touro_nome parece ser só série (ex: FGPA, CJCJ)
        const isPiqueteOuSerie = (v) => {
          if (!v || typeof v !== 'string') return false
          const t = v.trim()
          return /^PIQUETE\s*\d*$/i.test(t) || /^PIQ\s*\d*$/i.test(t) || /^[A-Z]{2,6}$/i.test(t)
        }

        // Enriquecer com serie_touro, rg_touro e corrigir touro_nome quando for só série
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
        console.error('Erro na query de inseminações:', queryError);
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
      // Criar nova inseminação
      const body = req.body || {};
      const animalId = body.animalId ?? body.animal_id;
      const numeroIA = body.numeroIA ?? body.numero_ia ?? 1;
      const dataIA = body.dataIA ?? body.data_inseminacao ?? body.data_ia;
      const dataDG = body.dataDG ?? body.data_dg ?? null;
      const resultadoDG = body.resultadoDG ?? body.resultado_dg ?? null;
      const touroNome = body.touroNome ?? body.touro_nome ?? body.touro ?? null;
      const touroRG = body.touroRG ?? body.touro_rg ?? null;
      const serieTouro = body.serie_touro ?? body.serieTouro ?? null;
      const tecnico = body.tecnico ?? null;
      const protocolo = body.protocolo ?? null;
      const statusGestacao = body.statusGestacao ?? body.status_gestacao ?? 'Pendente';
      const observacoes = body.observacoes ?? null;
      const custoDose = body.custoDose ?? body.custo_dose ?? null;

      // Validar dados obrigatórios
      if (!animalId || !dataIA) {
        return res.status(400).json({ 
          error: 'Dados obrigatórios não fornecidos',
          required: ['animalId', 'dataIA']
        });
      }

      // Garantir coluna valida existe e invalidar IAs anteriores da mesma fêmea
      await query('ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS valida BOOLEAN DEFAULT true').catch(() => {})
      await query(`
        UPDATE inseminacoes 
        SET valida = false, status_gestacao = 'Vazia', 
            resultado_dg = COALESCE(NULLIF(TRIM(resultado_dg), ''), 'Vazia'),
            updated_at = CURRENT_TIMESTAMP
        WHERE animal_id = $1
      `, [parseInt(animalId, 10)])

      // Adicionar serie_touro se a coluna existir (compatibilidade)
      let result;
      try {
        result = await query(`
          INSERT INTO inseminacoes (
            animal_id, numero_ia, data_ia, data_dg, resultado_dg,
            touro_nome, touro_rg, serie_touro, tecnico, protocolo,
            status_gestacao, observacoes, custo_dose, valida,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [
          animalId,
          numeroIA || 1,
          dataIA,
          dataDG || null,
          resultadoDG || null,
          touroNome || null,
          touroRG || null,
          serieTouro || null,
          tecnico || null,
          protocolo || null,
          statusGestacao || 'Pendente',
          observacoes || null,
          custoDose || null
        ]);
      } catch (insertErr) {
        if (insertErr.message && insertErr.message.includes('serie_touro')) {
          result = await query(`
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
            dataIA,
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
        } else {
          throw insertErr;
        }
      }

      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }

    if (req.method === 'PUT') {
      // Atualizar inseminação
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
        return res.status(400).json({ error: 'ID não fornecido' });
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
        return res.status(404).json({ error: 'Inseminação não encontrada' });
      }

      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    }

    if (req.method === 'DELETE') {
      const { id, todos } = req.query;

      // Limpar todas as inseminações
      if (todos === 'true' || todos === '1') {
        const result = await query('DELETE FROM inseminacoes RETURNING id');
        const count = result.rowCount || 0;
        return res.status(200).json({
          success: true,
          message: `${count} inseminação(ões) removida(s)`,
          count
        });
      }

      // Deletar inseminação por ID
      if (!id) {
        return res.status(400).json({ error: 'ID não fornecido. Use ?todos=true para limpar todas.' });
      }

      await query('DELETE FROM inseminacoes WHERE id = $1', [id]);

      return res.status(200).json({
        success: true,
        message: 'Inseminação deletada'
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('Erro na API de inseminações:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
