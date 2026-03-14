import { query } from '../../../../lib/database';

function diffMonths(d1, d2) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      status: 'error',
      message: 'ID do animal Ã© obrigatÃ³rio'
    });
  }

  try {
    if (req.method === 'GET') {
      // 1. Buscar custos existentes
      const resultCustos = await query(`
        SELECT * FROM custos WHERE animal_id = $1 AND tipo NOT IN ('AlimentaÃ§Ã£o', 'NutriÃ§Ã£o', 'RaÃ§Ã£o', 'SuplementaÃ§Ã£o') ORDER BY data DESC, created_at DESC
      `, [id]);
      let custos = resultCustos.rows;

      // 2. Buscar dados do animal para autogeraÃ§Ã£o
      const resultAnimal = await query(`
        SELECT * FROM animais WHERE id = $1
      `, [id]);
      const animal = resultAnimal.rows[0];

      if (animal) {
        let novosCustos = [];
        const hoje = new Date();
        const nascimento = animal.data_nascimento ? new Date(animal.data_nascimento) : null;
        const idadeMeses = nascimento ? diffMonths(nascimento, hoje) : 0;
        const isFemea = animal.sexo && (animal.sexo.toLowerCase().includes('fÃªmea') || animal.sexo === 'F');

        // LÃâ€œGICA DE CUSTOS ESTIMADOS (AUTO-APLICAÃâ€¡ÃÆ’O)
        
        // A. IdentificaÃ§Ã£o (Botton/Brinco)
        const temIdentificacao = custos.some(c => c.tipo === 'Manejo' && (c.subtipo || '').includes('IdentificaÃ§Ã£o'));
        if (!temIdentificacao) {
          novosCustos.push({
            animal_id: id,
            tipo: 'Manejo',
            subtipo: 'IdentificaÃ§Ã£o (Botton/Brinco)',
            valor: 25.00,
            data: animal.data_nascimento || new Date().toISOString().split('T')[0],
            observacoes: 'Custo estimado automÃ¡tico: Botton + Brinco Amarelo'
          });
        }

        // B. Vacina de Brucelose (FÃªmeas > 3 meses)
        if (isFemea && idadeMeses >= 3) {
          const temBrucelose = custos.some(c => c.tipo === 'Vacina' && (c.subtipo || '').includes('Brucelose'));
          if (!temBrucelose) {
            let dataVacina = new Date();
            if (nascimento) {
              dataVacina = new Date(nascimento);
              dataVacina.setMonth(dataVacina.getMonth() + 6); // Idealmente aos 6 meses
            }
            if (dataVacina > hoje) dataVacina = hoje;

            novosCustos.push({
              animal_id: id,
              tipo: 'Vacina',
              subtipo: 'Brucelose (B19/RB51)',
              valor: 15.00,
              data: dataVacina.toISOString().split('T')[0],
              observacoes: 'Custo estimado automÃ¡tico (obrigatÃ³rio fÃªmeas 3-8 meses)'
            });
          }
        }

        // C. RaÃ§Ã£o / NutriÃ§Ã£o REMOVIDO conforme solicitaÃ§Ã£o do usuÃ¡rio

        // Persistir novos custos
        if (novosCustos.length > 0) {
          for (const c of novosCustos) {
            await query(`
              INSERT INTO custos (animal_id, tipo, subtipo, valor, data, observacoes, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            `, [c.animal_id, c.tipo, c.subtipo, c.valor, c.data, c.observacoes]);
          }
          
          // Recarregar lista atualizada
          const updated = await query(`
            SELECT * FROM custos WHERE animal_id = $1 ORDER BY data DESC, created_at DESC
          `, [id]);
          custos = updated.rows;
        }
      }

      res.status(200).json({
        status: 'success',
        data: custos,
        count: custos.length
      });

    } else if (req.method === 'POST') {
      const { tipo, subtipo, valor, data, observacoes, detalhes } = req.body;
      
      if (!tipo || !valor || !data) {
        return res.status(400).json({ error: 'Campos obrigatÃ³rios: tipo, valor, data' });
      }

      const result = await query(`
        INSERT INTO custos (
          animal_id, tipo, subtipo, valor, data, observacoes, detalhes, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP
        ) RETURNING *
      `, [
        id, tipo, subtipo, valor, data, observacoes, detalhes ? JSON.stringify(detalhes) : null
      ]);

      res.status(201).json({
        status: 'success',
        message: 'Custo adicionado com sucesso',
        data: result.rows[0]
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erro na API de custos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}
