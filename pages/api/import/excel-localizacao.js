import { query } from '../../../lib/database';
import formidable from 'formidable';
import ExcelJS from 'exceljs';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Importa localização e observações de animais a partir de Excel.
 * Formato esperado: Série (A) | RGN/RG (B) | LOCAL (C) | OBSERVAÇÕES (D)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erro ao fazer parse do formulário:', err);
      return res.status(500).json({ error: 'Erro ao processar arquivo', details: String(err?.message || err) });
    }

    const file = Array.isArray(files?.file) ? files.file[0] : files?.file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const filepath = file.filepath || file.path;
    if (!filepath) {
      return res.status(400).json({ error: 'Arquivo inválido' });
    }

    try {
      // Garantir que colunas existam (migração silenciosa)
      try {
        await query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='animais' AND column_name='piquete_atual') THEN
              ALTER TABLE animais ADD COLUMN piquete_atual VARCHAR(200);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='animais' AND column_name='data_entrada_piquete') THEN
              ALTER TABLE animais ADD COLUMN data_entrada_piquete DATE;
            END IF;
          END $$;
        `);
      } catch (migErr) {
        console.warn('Migração colunas:', migErr.message);
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filepath);

      const worksheet = workbook.worksheets[0];
      if (!worksheet || !worksheet.rowCount) {
        return res.status(400).json({ error: 'Planilha vazia ou sem dados' });
      }

      const resultados = {
        animaisAtualizados: 0,
        localizacoesRegistradas: 0,
        naoEncontrados: [],
        erros: []
      };

      // Detectar linha inicial (pular cabeçalho se existir)
      let startRow = 1;
      try {
        const primeiraLinha = worksheet.getRow(1);
        const cellA1 = (primeiraLinha.getCell(1).value ?? '').toString().toUpperCase();
        const cellB1 = (primeiraLinha.getCell(2).value ?? '').toString().toUpperCase();
        if (cellA1.includes('SÉRIE') || cellA1.includes('SERIE') || cellB1.includes('RGN') || cellB1.includes('RG')) {
          startRow = 2;
        }
      } catch (e) {
        console.warn('Detecção de cabeçalho:', e.message);
      }

      console.log(`\n📊 Importando localizações - processando a partir da linha ${startRow}...\n`);

      for (let i = startRow; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const serie = String(row.getCell(1).value ?? '').trim();
        const rg = String(row.getCell(2).value ?? '').trim();
        const local = String(row.getCell(3).value ?? '').trim();
        const cellObs = row.getCell(4).value;
        const observacoesVal = (cellObs == null || cellObs === '') ? '' : String(cellObs).trim();
        const observacoes = observacoesVal || null;

        if (!serie && !rg) continue;

        try {
          const animalResult = await query(
            'SELECT id, serie, rg FROM animais WHERE UPPER(COALESCE(serie, \'\')) = UPPER($1) AND CAST(rg AS TEXT) = $2',
            [serie, String(rg)]
          );

          if (animalResult.rows.length === 0) {
            resultados.naoEncontrados.push({ linha: i, serie, rg });
            continue;
          }

          const animal = animalResult.rows[0];
          const dataEntrada = new Date().toISOString().split('T')[0];

          // 1. Atualizar animal: piquete_atual, data_entrada_piquete, observacoes
          try {
            await query(
              `UPDATE animais 
               SET piquete_atual = COALESCE(NULLIF($1, ''), piquete_atual), 
                   data_entrada_piquete = $2, 
                   observacoes = $3,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $4`,
              [local || null, dataEntrada, observacoes, animal.id]
            );
          } catch (updErr) {
            // Fallback: tentar com pasto_atual (coluna alternativa) ou só observacoes
            const msg = String(updErr.message || '');
            if (msg.includes('piquete_atual') || msg.includes('data_entrada_piquete') || msg.includes('column')) {
              try {
                await query(
                  `UPDATE animais SET pasto_atual = $1, observacoes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
                  [local || null, observacoes, animal.id]
                );
              } catch (fallbackErr) {
                await query(
                  `UPDATE animais SET observacoes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                  [observacoes, animal.id]
                );
              }
            } else {
              throw updErr;
            }
          }
          resultados.animaisAtualizados++;

          // 2. Registrar em localizacoes_animais (se a tabela existir)
          if (local) {
            try {
              await query(
                `UPDATE localizacoes_animais 
                 SET data_saida = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE animal_id = $2 AND data_saida IS NULL`,
                [dataEntrada, animal.id]
              );
              await query(
                `INSERT INTO localizacoes_animais (animal_id, piquete, data_entrada, motivo_movimentacao, observacoes)
                 VALUES ($1, $2, $3, $4, $5)`,
                [animal.id, local, dataEntrada, 'Importado do Excel', observacoes]
              );
              resultados.localizacoesRegistradas++;
            } catch (locErr) {
              console.warn(`Localização ${animal.serie}${animal.rg}: tabela localizacoes_animais -`, locErr.message);
            }
          }

          if (i <= startRow + 5 || i % 500 === 0) {
            console.log(`  ✅ Linha ${i}: ${serie} ${rg} → ${local || '(sem local)'}`);
          }
        } catch (rowError) {
          console.error(`Erro linha ${i}:`, rowError);
          resultados.erros.push({
            linha: i,
            serie,
            rg,
            erro: rowError.message
          });
        }
      }

      try { fs.unlinkSync(filepath); } catch (e) { /* ignorar */ }

      console.log(`\n✅ Importação de localizações concluída!`);
      console.log(`   Animais atualizados: ${resultados.animaisAtualizados}`);
      console.log(`   Localizações registradas: ${resultados.localizacoesRegistradas}`);
      console.log(`   Não encontrados: ${resultados.naoEncontrados.length}`);
      console.log(`   Erros: ${resultados.erros.length}\n`);

      return res.status(200).json({
        success: true,
        message: `Importação concluída: ${resultados.animaisAtualizados} animais atualizados`,
        resultados
      });
    } catch (error) {
      console.error('❌ Erro ao processar Excel:', error);
      try { if (filepath) fs.unlinkSync(filepath); } catch (e) { /* ignorar */ }
      return res.status(500).json({
        error: 'Erro ao processar arquivo Excel',
        details: String(error?.message || error)
      });
    }
  });
}
