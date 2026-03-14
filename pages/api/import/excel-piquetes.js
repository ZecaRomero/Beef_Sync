import { query } from '../../../lib/database';
import formidable from 'formidable';
import ExcelJS from 'exceljs';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Função robusta para converter qualquer formato de data do Excel
function converterDataExcel(data) {
  if (!data) return null;
  
  // Se for Date object
  if (data instanceof Date || Object.prototype.toString.call(data) === '[object Date]') {
    if (isNaN(data.getTime())) return null;
    const ano = data.getUTCFullYear();
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(data.getUTCDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  
  // Se for string DD/MM/AAAA ou DD/MM/AA
  if (typeof data === 'string') {
    data = data.trim();
    const partes = data.split('/');
    if (partes.length === 3) {
      let [dia, mes, ano] = partes;
      if (ano.length === 2) {
        const anoNum = parseInt(ano);
        ano = anoNum >= 50 ? `19${ano}` : `20${ano}`;
      }
      const diaNum = parseInt(dia);
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      if (diaNum >= 1 && diaNum <= 31 && mesNum >= 1 && mesNum <= 12 && anoNum >= 1900) {
        return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    }
    // Formato ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
      return data.substring(0, 10);
    }
  }
  
  // Se for número (serial date do Excel)
  if (typeof data === 'number') {
    let dias = data;
    if (dias > 59) dias -= 1; // Corrigir bug do Excel (1900 não é bissexto)
    const excelEpoch = new Date(Date.UTC(1899, 11, 31));
    const dataConvertida = new Date(excelEpoch.getTime() + dias * 86400000);
    const ano = dataConvertida.getUTCFullYear();
    const mes = String(dataConvertida.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(dataConvertida.getUTCDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  
  // Último recurso: tentar converter
  try {
    const tentativa = new Date(data);
    if (!isNaN(tentativa.getTime())) {
      const ano = tentativa.getUTCFullYear();
      const mes = String(tentativa.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(tentativa.getUTCDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }
  } catch (e) {}
  
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erro ao fazer parse do formulário:', err);
      return res.status(500).json({ error: 'Erro ao processar arquivo' });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.filepath);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return res.status(400).json({ error: 'Planilha vazia' });
      }

      const resultados = {
        piquetesProcessados: 0,
        piquetesCriados: 0,
        animaisProcessados: 0,
        animaisCriados: 0,
        animaisAtualizados: 0,
        iasRegistradas: 0,
        erros: []
      };

      console.log(`\n📊 Processando ${worksheet.rowCount} linhas...\n`);

      // Processar cada linha (pular cabeçalho)
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        
        const serie = row.getCell(1).value?.toString().trim() || '';
        const rg = row.getCell(2).value?.toString().trim() || '';
        const localCol3 = row.getCell(3).value?.toString().trim() || '';
        const col4 = row.getCell(4).value?.toString().trim() || '';
        const col5 = row.getCell(5).value?.toString().trim() || '';
        // Formato com 2 colunas LOCAL: A=SÉRIE, B=RG, C=LOCAL(PIQ), D=LOCAL(PIQUETE), E=TOURO, F=SÉRIE, G=RG, H=DATA IA, I=DATA DG, J=Result
        const ehFormatoComDoisLocal = /^PIQUETE\s*\d*$/i.test(col4) || /^PIQ\s*\d*$/i.test(col4);
        const local = localCol3 || col4;
        const touroIA = ehFormatoComDoisLocal ? col5 : col4;  // Col 5 = TOURO quando há 2 colunas LOCAL
        const seriePai = ehFormatoComDoisLocal ? (row.getCell(6).value?.toString().trim() || '') : (row.getCell(5).value?.toString().trim() || '');
        const rgPai = ehFormatoComDoisLocal ? (row.getCell(7).value?.toString().trim() || '') : (row.getCell(6).value?.toString().trim() || '');
        const dataIA = ehFormatoComDoisLocal ? row.getCell(8).value : row.getCell(7).value;
        const dataDG = ehFormatoComDoisLocal ? row.getCell(9).value : row.getCell(8).value;
        let resultado = ehFormatoComDoisLocal 
          ? (row.getCell(10).value ?? row.getCell(9).value)?.toString().trim() || ''
          : (row.getCell(9).value ?? row.getCell(10).value)?.toString().trim() || '';
        // Normalizar P -> Prenha (coluna Result do Excel)
        if (resultado && (resultado.toUpperCase() === 'P' || resultado.toUpperCase().includes('POSITIVO'))) resultado = 'Prenha';
        else if (resultado && (resultado.toUpperCase() === 'V' || resultado.toUpperCase() === 'N' || resultado.toUpperCase().includes('VAZIA') || resultado.toUpperCase().includes('NEGATIVO'))) resultado = 'Vazia';

        // Pular linhas vazias
        if (!serie && !rg && !local) continue;

        console.log(`Linha ${i}: ${serie} ${rg} - ${local}`);

        try {
          // 1. Criar/atualizar piquete
          if (local) {
            const piqueteExiste = await query(
              'SELECT id FROM piquetes WHERE codigo = $1',
              [local]
            );

            if (piqueteExiste.rows.length === 0) {
              await query(
                `INSERT INTO piquetes (codigo, nome, ativo) 
                 VALUES ($1, $2, true)`,
                [local, local]
              );
              resultados.piquetesCriados++;
              console.log(`  ✅ Piquete criado: ${local}`);
            }
            resultados.piquetesProcessados++;
          }

          // 2. Criar/atualizar animal - SEMPRE FÊMEA
          if (serie && rg) {
            const animalExiste = await query(
              'SELECT id FROM animais WHERE serie = $1 AND rg = $2',
              [serie, rg]
            );

            const tatuagem = `${serie} ${rg}`.trim();
            const dataEntradaPiquete = new Date().toISOString().split('T')[0];

            if (animalExiste.rows.length === 0) {
              await query(
                `INSERT INTO animais (
                  serie, rg, tatuagem, nome, sexo, situacao, 
                  piquete_atual, data_entrada_piquete, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [serie, rg, tatuagem, tatuagem, 'Fêmea', 'Ativo', local, dataEntradaPiquete]
              );
              resultados.animaisCriados++;
              console.log(`  ✅ Animal criado: ${tatuagem}`);
            } else {
              await query(
                `UPDATE animais 
                 SET piquete_atual = $1, data_entrada_piquete = $2, sexo = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE serie = $4 AND rg = $5`,
                [local, dataEntradaPiquete, 'Fêmea', serie, rg]
              );
              resultados.animaisAtualizados++;
              console.log(`  ✅ Animal atualizado: ${tatuagem}`);
            }
            resultados.animaisProcessados++;

            // 3. Registrar IA se houver dados
            if (dataIA && touroIA) {
              const animalId = animalExiste.rows.length > 0 
                ? animalExiste.rows[0].id 
                : (await query('SELECT id FROM animais WHERE serie = $1 AND rg = $2', [serie, rg])).rows[0].id;

              const dataIAFormatada = converterDataExcel(dataIA);
              const dataDGFormatada = converterDataExcel(dataDG);

              console.log(`  📅 Data IA: ${dataIA} → ${dataIAFormatada}`);
              console.log(`  📅 Data DG: ${dataDG} → ${dataDGFormatada}`);

              if (dataIAFormatada) {
                const iaExiste = await query(
                  'SELECT id FROM inseminacoes WHERE animal_id = $1 AND data_ia = $2',
                  [animalId, dataIAFormatada]
                );

                if (iaExiste.rows.length === 0) {
                  await query(
                    `INSERT INTO inseminacoes (
                      animal_id, numero_ia, data_ia, data_dg, 
                      touro_nome, status_gestacao, observacoes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                      animalId,
                      1,
                      dataIAFormatada,
                      dataDGFormatada,
                      touroIA,
                      resultado || 'Pendente',
                      `Importado do Excel - Piquete: ${local}`
                    ]
                  );
                  resultados.iasRegistradas++;
                  console.log(`  ✅ IA registrada`);
                } else if (touroIA && !/^PIQUETE\s*\d*$/i.test(touroIA) && !/^PIQ\s*\d*$/i.test(touroIA)) {
                  // IA já existe mas touro pode estar errado (ex: PIQUETE 1) - atualizar com touro correto
                  await query(
                    `UPDATE inseminacoes SET touro_nome = $1, status_gestacao = COALESCE(NULLIF($2,''), status_gestacao) WHERE animal_id = $3 AND data_ia = $4`,
                    [touroIA, resultado || 'Pendente', animalId, dataIAFormatada]
                  );
                  resultados.iasRegistradas++;
                  console.log(`  ✅ IA atualizada (touro corrigido)`);
                } else {
                  console.log(`  ℹ️ IA já existe`);
                }
              } else {
                console.log(`  ⚠️ Data IA inválida: ${dataIA}`);
                resultados.erros.push({
                  linha: i,
                  serie,
                  rg,
                  erro: `Data IA inválida: ${dataIA} (tipo: ${typeof dataIA})`
                });
              }
            }
          }
        } catch (error) {
          console.error(`❌ Erro na linha ${i}:`, error.message);
          resultados.erros.push({
            linha: i,
            serie,
            rg,
            erro: error.message
          });
        }
      }

      // Limpar arquivo temporário
      fs.unlinkSync(file.filepath);

      console.log(`\n✅ Importação concluída!`);
      console.log(`   Piquetes: ${resultados.piquetesCriados} novos / ${resultados.piquetesProcessados} total`);
      console.log(`   Animais: ${resultados.animaisCriados} novos, ${resultados.animaisAtualizados} atualizados`);
      console.log(`   IAs: ${resultados.iasRegistradas} registradas`);
      console.log(`   Erros: ${resultados.erros.length}\n`);

      return res.status(200).json({
        success: true,
        message: 'Importação concluída',
        resultados
      });

    } catch (error) {
      console.error('❌ Erro ao processar Excel:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar arquivo Excel',
        details: error.message 
      });
    }
  });
}
