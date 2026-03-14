import { query } from '../../../lib/database';

// Função para converter data - VERSÃO ROBUSTA
function converterData(data) {
  if (!data) return null;
  
  // Limpar a string
  data = String(data).trim();
  
  console.log(`Convertendo data: "${data}"`);
  
  // Formato DD/MM/AAAA ou DD/MM/AA
  const partes = data.split('/');
  if (partes.length === 3) {
    let [dia, mes, ano] = partes;
    
    // Limpar cada parte
    dia = dia.trim();
    mes = mes.trim();
    ano = ano.trim();
    
    // Se ano tem 2 dígitos, converter para 4
    if (ano.length === 2) {
      const anoNum = parseInt(ano);
      ano = anoNum >= 50 ? `19${ano}` : `20${ano}`;
    }
    
    // Validar valores
    const diaNum = parseInt(dia);
    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);
    
    if (diaNum >= 1 && diaNum <= 31 && mesNum >= 1 && mesNum <= 12 && anoNum >= 1900 && anoNum <= 2100) {
      const resultado = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      console.log(`  → Convertido para: ${resultado}`);
      return resultado;
    } else {
      console.log(`  → Valores inválidos: dia=${diaNum}, mes=${mesNum}, ano=${anoNum}`);
    }
  }
  
  // Tentar formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    console.log(`  → Já está no formato ISO: ${data}`);
    return data;
  }
  
  console.log(`  → Formato não reconhecido`);
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { texto, modo } = req.body;

  if (!texto) {
    return res.status(400).json({ error: 'Texto não fornecido' });
  }

  try {
    const linhas = texto.split('\n').filter(l => l.trim());
    
    // Remover cabeçalho se existir
    const primeiraLinha = linhas[0].toUpperCase();
    const temCabecalho = primeiraLinha.includes('SÉRIE') || primeiraLinha.includes('SERIE');
    const dadosLinhas = temCabecalho ? linhas.slice(1) : linhas;

    const dadosProcessados = [];
    const errosValidacao = [];

    // Processar cada linha
    for (let i = 0; i < dadosLinhas.length; i++) {
      const linha = dadosLinhas[i].trim();
      if (!linha) continue;

      const numeroLinha = i + (temCabecalho ? 2 : 1);

      // Separar por TAB ou múltiplos espaços
      const colunas = linha.split(/\t+/).map(c => c.trim());

      console.log(`Linha ${numeroLinha}: ${colunas.length} colunas`, colunas);

      if (colunas.length < 3) {
        errosValidacao.push({
          linha: numeroLinha,
          erro: `Linha com poucas colunas (${colunas.length}). Esperado: pelo menos 3 (SÉRIE, RG, LOCAL)`
        });
        continue;
      }

      const serie = colunas[0] || '';
      const rg = colunas[1] || '';
      const local = colunas[2] || colunas[3] || ''; // Aceitar coluna 2 ou 3 como LOCAL
      const touroIA = colunas[4] || '';
      const seriePai = colunas[5] || '';
      const rgPai = colunas[6] || '';
      const dataIA = colunas[7] || '';
      const dataDG = colunas[8] || '';
      const resultado = colunas[9] || '';

      // Validações
      if (!serie) {
        errosValidacao.push({ linha: numeroLinha, erro: 'SÉRIE vazia' });
        continue;
      }
      if (!rg) {
        errosValidacao.push({ linha: numeroLinha, erro: 'RG vazio' });
        continue;
      }
      if (!local) {
        errosValidacao.push({ linha: numeroLinha, erro: 'LOCAL vazio' });
        continue;
      }

      // Converter datas - ACEITAR QUALQUER FORMATO
      let dataIAFormatada = null;
      let dataDGFormatada = null;
      
      if (dataIA) {
        dataIAFormatada = converterData(dataIA);
        if (!dataIAFormatada) {
          // Tentar remover espaços e caracteres especiais
          const dataLimpa = dataIA.replace(/\s+/g, '').trim();
          dataIAFormatada = converterData(dataLimpa);
        }
      }
      
      if (dataDG) {
        dataDGFormatada = converterData(dataDG);
        if (!dataDGFormatada) {
          const dataLimpa = dataDG.replace(/\s+/g, '').trim();
          dataDGFormatada = converterData(dataLimpa);
        }
      }

      if (dataIA && !dataIAFormatada) {
        errosValidacao.push({ 
          linha: numeroLinha, 
          erro: `Data IA inválida: "${dataIA}". Use formato DD/MM/AAAA ou DD/MM/AA` 
        });
      }

      if (dataDG && !dataDGFormatada) {
        errosValidacao.push({ 
          linha: numeroLinha, 
          erro: `Data DG inválida: "${dataDG}". Use formato DD/MM/AAAA ou DD/MM/AA` 
        });
      }

      dadosProcessados.push({
        linha: numeroLinha,
        serie,
        rg,
        local,
        touroIA,
        seriePai,
        rgPai,
        dataIA: dataIAFormatada,
        dataDG: dataDGFormatada,
        resultado,
        tatuagem: `${serie} ${rg}`.trim()
      });
    }

    // Se modo for "validar", apenas retornar validação
    if (modo === 'validar') {
      return res.status(200).json({
        success: true,
        modo: 'validacao',
        totalLinhas: dadosProcessados.length,
        erros: errosValidacao,
        preview: dadosProcessados.slice(0, 10),
        valido: errosValidacao.length === 0
      });
    }

    // Se modo for "importar", processar no banco
    if (modo === 'importar') {
      if (errosValidacao.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Existem erros de validação. Corrija antes de importar.',
          erros: errosValidacao
        });
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

      for (const dado of dadosProcessados) {
        try {
          // 1. Criar/atualizar piquete
          if (dado.local) {
            const piqueteExiste = await query(
              'SELECT id FROM piquetes WHERE codigo = $1',
              [dado.local]
            );

            if (piqueteExiste.rows.length === 0) {
              await query(
                'INSERT INTO piquetes (codigo, nome, ativo) VALUES ($1, $2, true)',
                [dado.local, dado.local]
              );
              resultados.piquetesCriados++;
            }
            resultados.piquetesProcessados++;
          }

          // 2. Criar/atualizar animal - SEMPRE FÊMEA
          const animalExiste = await query(
            'SELECT id FROM animais WHERE serie = $1 AND rg = $2',
            [dado.serie, dado.rg]
          );

          const dataEntrada = new Date().toISOString().split('T')[0];

          if (animalExiste.rows.length === 0) {
            await query(
              `INSERT INTO animais (
                serie, rg, tatuagem, nome, sexo, situacao, 
                piquete_atual, data_entrada_piquete, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [dado.serie, dado.rg, dado.tatuagem, dado.tatuagem, 'Fêmea', 'Ativo', dado.local, dataEntrada]
            );
            resultados.animaisCriados++;
          } else {
            await query(
              `UPDATE animais 
               SET piquete_atual = $1, data_entrada_piquete = $2, sexo = $3, updated_at = CURRENT_TIMESTAMP
               WHERE serie = $4 AND rg = $5`,
              [dado.local, dataEntrada, 'Fêmea', dado.serie, dado.rg]
            );
            resultados.animaisAtualizados++;
          }
          resultados.animaisProcessados++;

          // 3. Registrar IA
          if (dado.dataIA && dado.touroIA) {
            const animalId = animalExiste.rows.length > 0 
              ? animalExiste.rows[0].id 
              : (await query('SELECT id FROM animais WHERE serie = $1 AND rg = $2', [dado.serie, dado.rg])).rows[0].id;

            const iaExiste = await query(
              'SELECT id FROM inseminacoes WHERE animal_id = $1 AND data_ia = $2',
              [animalId, dado.dataIA]
            );

            if (iaExiste.rows.length === 0) {
              await query(
                `INSERT INTO inseminacoes (
                  animal_id, numero_ia, data_ia, data_dg, 
                  touro_nome, status_gestacao, observacoes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  animalId, 1, dado.dataIA, dado.dataDG,
                  dado.touroIA, dado.resultado || 'Pendente',
                  `Importado via texto - Piquete: ${dado.local}`
                ]
              );
              resultados.iasRegistradas++;
            }
          }
        } catch (error) {
          resultados.erros.push({
            linha: dado.linha,
            serie: dado.serie,
            rg: dado.rg,
            erro: error.message
          });
        }
      }

      return res.status(200).json({
        success: true,
        modo: 'importacao',
        resultados
      });
    }

    return res.status(400).json({ error: 'Modo inválido. Use "validar" ou "importar"' });

  } catch (error) {
    console.error('Erro ao processar texto:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar texto',
      details: error.message 
    });
  }
}
