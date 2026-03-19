/**
 * API para relatórios visíveis no mobile.
 * GET sem params: retorna config (enabled + allTypes)
 * GET ?tipo=X&startDate=&endDate=: retorna dados do relatório
 */
import { query } from '../../../lib/database'
import { sendError, sendMethodNotAllowed, sendSuccess } from '../../../utils/apiResponse'
import { ensureNitrogenioTables } from '../../../utils/nitrogenioSchema'

const TIPOS_RELATORIOS = [
  { key: 'resumo_geral', label: '📊 Visão Geral', category: 'Gestão' },
  { key: 'agenda_atividades', label: 'Agenda de Atividades', category: 'Gestão' },
  { key: 'animais_dgt', label: '📋 Animais para DGT', category: 'Sanidade' },
  { key: 'pesagens', label: 'Pesagens', category: 'Manejo' },
  { key: 'resumo_pesagens', label: 'Resumo de Pesagens', category: 'Manejo' },
  { key: 'inseminacoes', label: 'Inseminações', category: 'Reprodução' },
  { key: 'resumo_femeas_ia', label: 'Resumo de Fêmeas IA', category: 'Reprodução' },
  { key: 'gestacoes', label: 'Gestações', category: 'Reprodução' },
  { key: 'nascimentos', label: 'Nascimentos', category: 'Reprodução' },
  { key: 'resumo_nascimentos', label: 'Resumo de Nascimentos', category: 'Reprodução' },
  { key: 'previsoes_parto', label: 'Previsões de Parto', category: 'Reprodução' },
  { key: 'exames_andrologicos', label: 'Exames Andrológicos', category: 'Reprodução' },
  { key: 'transferencias_embrioes', label: 'Transferências de Embriões', category: 'Reprodução' },
  { key: 'coleta_fiv', label: 'Coleta FIV', category: 'Reprodução' },
  { key: 'receptoras_chegaram', label: 'Receptoras que Chegaram', category: 'Reprodução' },
  { key: 'receptoras_faltam_parir', label: 'Receptoras que Faltam Parir', category: 'Reprodução' },
  { key: 'receptoras_faltam_diagnostico', label: 'Receptoras que Faltam Diagnóstico', category: 'Reprodução' },
  { key: 'calendario_reprodutivo', label: 'Calendário Reprodutivo', category: 'Reprodução' },
  { key: 'mortes', label: 'Mortes', category: 'Sanidade' },
  { key: 'vacinacoes', label: 'Vacinações', category: 'Sanidade' },
  { key: 'ocorrencias', label: 'Ocorrências', category: 'Sanidade' },
  { key: 'estoque_semen', label: 'Estoque de Sêmen', category: 'Estoque' },
  { key: 'estoque_embrioes', label: 'Estoque de Embriões', category: 'Estoque' },
  { key: 'abastecimento_nitrogenio', label: 'Abastecimento de Nitrogênio', category: 'Estoque' },
  { key: 'animais_piquetes', label: 'Animais por Piquete', category: 'Localização' },
  { key: 'notas_fiscais', label: 'Notas Fiscais', category: 'Documentos' },
  { key: 'relatorio_vendas', label: '📊 Relatório de Vendas', category: 'Documentos' },
  { key: 'movimentacoes_financeiras', label: 'Movimentações Financeiras', category: 'Financeiro' },
  { key: 'custos', label: 'Custos', category: 'Financeiro' },
  { key: 'ranking_animais_avaliados', label: 'Ranking dos Animais Avaliados', category: 'Gestão' },
  { key: 'ranking_pmgz', label: '🏆 Ranking de animais', category: 'Gestão' },
  { key: 'ranking_mgte', label: '🏆 Ranking MGTe', category: 'Gestão' },
  { key: 'boletim_rebanho', label: 'Boletim do Rebanho', category: 'Gestão' },
  { key: 'boletim_defesa', label: '📋 Boletim Defesa', category: 'Gestão' },
  { key: 'boletim_campo', label: '📋 Boletim Campo', category: 'Gestão' }
]

async function getEnabled() {
  const r = await query('SELECT value FROM system_settings WHERE key = $1', ['mobile_reports_enabled'])
  const val = r.rows[0]?.value
  if (!val) return []
  try {
    const arr = JSON.parse(val)
    return Array.isArray(arr) ? arr : []
  } catch (_) {
    return []
  }
}

function toDateStr(v) {
  if (!v) return null
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.split('T')[0]
  if (v instanceof Date) return v.toISOString().split('T')[0]
  return String(v)
}

function validarDataRange(str) {
  if (!str || typeof str !== 'string') return null
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const y = parseInt(m[1], 10)
  if (y < 1900 || y > 2100) return null
  return str.split('T')[0]
}

// Filtrar nomes de touros (LANDROVER, MALCOM SANT ANNA, etc.) que foram cadastrados como piquete por engano.
// Só retorna true para locais reais: PIQUETE 1-99, PROJETO X, CONFINA, etc.
function ehPiqueteValido(nome) {
  if (!nome || typeof nome !== 'string') return false
  const n = nome.trim()
  if (!n || /^(VAZIO|NÃO INFORMADO|NAO INFORMADO|-)$/i.test(n)) return false
  if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return true
  if (/^PROJETO\s+[\dA-Za-z\-]+$/i.test(n)) return true
  if (/^CONFINA$/i.test(n)) return true
  if (/^PIQ\s+\d+$/i.test(n)) return true
  if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return true
  return false
}

function piqueteOuNaoInformado(val) {
  return (val && ehPiqueteValido(val)) ? val : 'Não informado'
}

function formatarSexo(sexo) {
  if (!sexo) return '-'
  const s = String(sexo).trim().toUpperCase()
  if (s.startsWith('M') || s === 'M') return 'Macho'
  if (s.startsWith('F') || s === 'F') return 'Fêmea'
  return sexo
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  try {
    const { tipo, startDate, endDate, serie } = req.query
    const enabled = await getEnabled()
    const serieFiltro = (serie || '').trim().toUpperCase() || null

    // GET sem tipo: retorna config (quando enabled vazio, retorna todos como habilitados)
    if (!tipo) {
      const allKeys = TIPOS_RELATORIOS.map(t => t.key)
      // Garantir que resumo_geral esteja sempre habilitado
      const enabledOut = enabled.length > 0 ? [...new Set([...enabled, 'resumo_geral'])] : allKeys
      let series = []
      try {
        const qSeries = await query(`
          SELECT DISTINCT serie FROM animais
          WHERE serie IS NOT NULL AND TRIM(serie) != '' AND situacao = 'Ativo'
          ORDER BY serie
        `)
        series = (qSeries.rows || []).map(r => r.serie).filter(Boolean)
      } catch (_) {}
      return sendSuccess(res, {
        enabled: enabledOut,
        allTypes: TIPOS_RELATORIOS,
        series
      })
    }

    // Verificar se o tipo está habilitado (quando vazio, permite todos)
    const allKeys = TIPOS_RELATORIOS.map(t => t.key)
    const enabledEffective = enabled.length > 0 ? [...new Set([...enabled, 'resumo_geral'])] : allKeys
    if (!enabledEffective.includes(tipo)) {
      return sendError(res, 'Relatório não disponível para mobile', 403)
    }

    const hoje = new Date()
    const start = validarDataRange(startDate) || validarDataRange(toDateStr(startDate)) || new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
    const end = validarDataRange(endDate) || validarDataRange(toDateStr(endDate)) || hoje.toISOString().split('T')[0]

    let data = []
    let resumo = null

    switch (tipo) {
      case 'resumo_geral': {
        try {
          // 1. Totais do Rebanho - quando Boletim Campo tem dados, usa TUDO dele (fonte oficial do campo)
          let statsRebanho
          try {
            const qBoletim = await query(`
              SELECT
                COALESCE(SUM(COALESCE(quant::int, 0)), 0) as total,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(sexo,''))) LIKE 'M%' THEN COALESCE(quant::int, 0) ELSE 0 END), 0) as machos,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(sexo,''))) LIKE 'F%' THEN COALESCE(quant::int, 0) ELSE 0 END), 0) as femeas,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(categoria,''))) LIKE '%BEZERRO%' OR UPPER(TRIM(COALESCE(categoria,''))) LIKE '%DESMAMA%' OR TRIM(COALESCE(era,'')) IN ('0/7','08/12') THEN COALESCE(quant::int, 0) ELSE 0 END), 0) as bezerros,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(categoria,''))) LIKE '%NOVILHA%' OR TRIM(COALESCE(era,'')) = '12/23' THEN COALESCE(quant::int, 0) ELSE 0 END), 0) as novilhas,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(COALESCE(categoria,''))) LIKE '%TOURO%' OR UPPER(TRIM(COALESCE(categoria,''))) LIKE '%VACA%' OR UPPER(TRIM(COALESCE(categoria,''))) LIKE '%GARROTE%' OR TRIM(COALESCE(era,'')) IN ('+23','+25') THEN COALESCE(quant::int, 0) ELSE 0 END), 0) as adultos
              FROM boletim_campo
            `)
            const totalBoletim = parseInt(qBoletim.rows[0]?.total || 0)
            if (totalBoletim > 0) {
              statsRebanho = qBoletim.rows[0]
            } else {
              throw new Error('Boletim vazio')
            }
          } catch (_) {
            // Fallback: usar animais quando boletim_campo vazio ou erro
            const qRebanho = await query(`
              SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN sexo = 'Macho' THEN 1 END) as machos,
                COUNT(CASE WHEN sexo = 'Fêmea' THEN 1 END) as femeas,
                COUNT(CASE WHEN data_nascimento > NOW() - INTERVAL '12 months' THEN 1 END) as bezerros,
                COUNT(CASE WHEN data_nascimento <= NOW() - INTERVAL '12 months' AND data_nascimento > NOW() - INTERVAL '24 months' THEN 1 END) as novilhas,
                COUNT(CASE WHEN data_nascimento <= NOW() - INTERVAL '24 months' THEN 1 END) as adultos
              FROM animais 
              WHERE situacao = 'Ativo'
            `)
            statsRebanho = qRebanho.rows[0]
          }

          // 2. Reprodução (Gestações Ativas) - gestacoes + inseminacoes prenhas
          let gestacoesAtivas = 0
          try {
            const qGestacoes = await query(`
              SELECT COUNT(*) as total FROM gestacoes WHERE situacao IN ('Ativa', 'Em Gestação')
            `)
            gestacoesAtivas = parseInt(qGestacoes.rows[0]?.total || 0, 10)
          } catch (_) {}
          let prenhasIA = 0
          try {
            const colIA = await query(`
              SELECT column_name FROM information_schema.columns
              WHERE table_name = 'inseminacoes' AND column_name IN ('resultado_dg', 'status_gestacao')
            `)
            const temRd = colIA.rows?.some(r => r.column_name === 'resultado_dg')
            const temSg = colIA.rows?.some(r => r.column_name === 'status_gestacao')
            if (temRd || temSg) {
              const prenhaCond = [
                temRd && "(TRIM(COALESCE(i.resultado_dg,'')) = 'P' OR LOWER(COALESCE(i.resultado_dg,'')) LIKE '%pren%' OR LOWER(COALESCE(i.resultado_dg,'')) LIKE '%positivo%')",
                temSg && "(TRIM(COALESCE(i.status_gestacao,'')) = 'P' OR LOWER(COALESCE(i.status_gestacao,'')) LIKE '%pren%' OR LOWER(COALESCE(i.status_gestacao,'')) LIKE '%positivo%')"
              ].filter(Boolean).join(' OR ')
              const qPrenhas = await query(`
                SELECT COUNT(DISTINCT i.animal_id) as total
                FROM inseminacoes i
                JOIN animais a ON a.id = i.animal_id AND a.situacao = 'Ativo'
                WHERE (${prenhaCond})
              `)
              prenhasIA = parseInt(qPrenhas.rows[0]?.total || 0, 10)
            }
          } catch (_) {}
          const totalGestacoesAtivas = gestacoesAtivas + prenhasIA
          
          // 3. Nascimentos (no período)
          const qNascimentos = await query(`
            SELECT COUNT(*) as total
            FROM nascimentos
            WHERE data_nascimento >= $1 AND data_nascimento <= $2
          `, [start, end])

          // Nascimentos recentes (últimos 30 dias) para o card de Reprodução
          const qNascimentos30d = await query(`
            SELECT COUNT(*) as total
            FROM nascimentos
            WHERE data_nascimento BETWEEN (CURRENT_DATE - INTERVAL '30 days') AND CURRENT_DATE
          `)

          // 4. Peso Médio (Última pesagem de animais ativos)
          // Aproximação: média das últimas pesagens dos últimos 90 dias
          const qPeso = await query(`
            SELECT AVG(p.peso) as media
            FROM pesagens p
            JOIN animais a ON a.id = p.animal_id
            WHERE a.situacao = 'Ativo'
              AND p.data >= NOW() - INTERVAL '90 days'
          `)

          // 5. Financeiro (Custos e Vendas no período)
          // Custos (Excluindo Nutrição/Alimentação conforme solicitado)
          const qCustos = await query(`
            SELECT SUM(valor) as total
            FROM custos
            WHERE data >= $1 AND data <= $2
              AND tipo NOT IN ('Alimentação', 'Nutrição', 'Ração', 'Suplementação')
          `, [start, end])
          
          // Vendas (Animais vendidos ou notas de saída)
          // Tentando pegar de animais vendidos primeiro
          const qVendasAnimais = await query(`
            SELECT SUM(valor_venda) as total
            FROM animais
            WHERE situacao = 'Vendido' AND updated_at >= $1 AND updated_at <= $2
          `, [start, end])

          // 6. Sanidade (Vacinas no período)
          let vacinasTotal = 0
          try {
            const qVacinas = await query(`
              SELECT COUNT(*) as total FROM vacinacoes WHERE data_vacinacao >= $1 AND data_vacinacao <= $2
            `, [start, end])
            vacinasTotal = parseInt(qVacinas.rows[0]?.total || 0)
          } catch (e) { console.log('Sem tabela vacinacoes ou erro', e.message) }

          // 7. Mortes (no período)
          let mortesTotal = 0
          try {
             const qMortes = await query(`
               SELECT COUNT(*) as total FROM mortes WHERE data_morte >= $1 AND data_morte <= $2
             `, [start, end])
             mortesTotal = parseInt(qMortes.rows[0]?.total || 0)
          } catch (e) { console.log('Sem tabela mortes ou erro', e.message) }

          // 8. Top Piquetes (Ocupação Atual) - usar localizacoes_animais (igual ao app)
          let topPiquetes = []
          try {
            const qPiquetes = await query(`
              SELECT l.piquete, COUNT(*) as qtd 
              FROM localizacoes_animais l
              JOIN animais a ON l.animal_id = a.id
              WHERE a.situacao = 'Ativo' 
                AND l.data_saida IS NULL 
                AND l.piquete IS NOT NULL 
                AND TRIM(l.piquete) != ''
                AND COALESCE(LOWER(a.raca), '') NOT LIKE '%receptora%'
              GROUP BY l.piquete 
              ORDER BY qtd DESC 
              LIMIT 5
            `)
            topPiquetes = qPiquetes.rows
              .filter(r => ehPiqueteValido(r.piquete))
              .map(r => ({ label: r.piquete.trim(), valor: parseInt(r.qtd) }))
          } catch (e) { console.log('Erro top piquetes', e.message) }

          // 9. Previsão de Partos (Próximos 30 dias)
          let partosPrevistos = 0
          try {
             // Gestação bovina ~290 dias (ou 9 meses e meio). 
             // Buscamos gestações ativas onde (data_cobertura + 290 dias) está entre hoje e hoje+30
             const qPartos = await query(`
               SELECT COUNT(*) as total 
               FROM gestacoes 
               WHERE situacao = 'Ativa' 
               AND (data_cobertura + INTERVAL '290 days') BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
             `)
             partosPrevistos = parseInt(qPartos.rows[0]?.total || 0)
          } catch (e) { console.log('Erro previsao partos', e.message) }

          // 10. Feed de Últimas Atividades (Recentes)
          let ultimasAtividades = []
          try {
            // Union de Pesagens, Nascimentos, Vacinações (Serviços se tiver, ou vacinacoes tab)
            // Assumindo tabelas: pesagens, nascimentos, vacinacoes
            const qFeed = await query(`
              SELECT * FROM (
                SELECT 'Pesagem' as tipo, 'Animal ID ' || animal_id || ': ' || peso || 'kg' as detalhe, data as data_evento FROM pesagens
                UNION ALL
                SELECT 'Nascimento' as tipo, 'Série ' || serie || ' (' || sexo || ')' as detalhe, data_nascimento as data_evento FROM nascimentos
                UNION ALL
                SELECT 'Vacinação' as tipo, 'Animal ID ' || animal_id as detalhe, data_vacinacao as data_evento FROM vacinacoes
              ) as combined
              ORDER BY data_evento DESC
              LIMIT 7
            `)
            ultimasAtividades = qFeed.rows
          } catch (e) { console.log('Erro feed atividades', e.message) }

          // 11. Estoque de Sêmen e Embriões — totais para o resumo
          let totalTouros = 0, totalDosesSemen = 0, totalAcasalamentos = 0, totalDosesEmbriao = 0
          try {
            const qSemenResumo = await query(`
              SELECT
                COUNT(*) FILTER (WHERE tipo = 'semen' OR (tipo IS NULL
                  AND nome_touro NOT ILIKE '%ACASALAMENTO%'
                  AND nome_touro NOT ILIKE '% X %')) AS touros,
                COALESCE(SUM(doses_disponiveis) FILTER (WHERE tipo = 'semen' OR (tipo IS NULL
                  AND nome_touro NOT ILIKE '%ACASALAMENTO%'
                  AND nome_touro NOT ILIKE '% X %')), 0) AS doses_semen,
                COUNT(*) FILTER (WHERE tipo = 'embriao'
                  OR nome_touro ILIKE '%ACASALAMENTO%'
                  OR nome_touro ILIKE '% X %') AS acasalamentos,
                COALESCE(SUM(doses_disponiveis) FILTER (WHERE tipo = 'embriao'
                  OR nome_touro ILIKE '%ACASALAMENTO%'
                  OR nome_touro ILIKE '% X %'), 0) AS doses_embriao
              FROM estoque_semen
              WHERE tipo_operacao = 'entrada' AND doses_disponiveis > 0
            `)
            totalTouros = parseInt(qSemenResumo.rows[0]?.touros || 0)
            totalDosesSemen = parseInt(qSemenResumo.rows[0]?.doses_semen || 0)
            totalAcasalamentos = parseInt(qSemenResumo.rows[0]?.acasalamentos || 0)
            totalDosesEmbriao = parseInt(qSemenResumo.rows[0]?.doses_embriao || 0)
          } catch (_) {}

          resumo = {
            rebanho: {
              total: parseInt(statsRebanho.total || 0),
              machos: parseInt(statsRebanho.machos || 0),
              femeas: parseInt(statsRebanho.femeas || 0),
              bezerros: parseInt(statsRebanho.bezerros || 0),
              novilhas: parseInt(statsRebanho.novilhas || 0),
              adultos: parseInt(statsRebanho.adultos || 0)
            },
            reproducao: {
              gestacoes_ativas: totalGestacoesAtivas,
              nascimentos_periodo: parseInt(qNascimentos.rows[0]?.total || 0),
              nascimentos_30d: parseInt(qNascimentos30d.rows[0]?.total || 0),
              partos_previstos_30d: partosPrevistos
            },
            peso: {
              media_recente: parseFloat(qPeso.rows[0]?.media || 0).toFixed(1)
            },
            financeiro: {
              custos: parseFloat(qCustos.rows[0]?.total || 0),
              vendas: parseFloat(qVendasAnimais.rows[0]?.total || 0)
            },
            extras: {
               top_piquetes: topPiquetes,
               ultimas_atividades: ultimasAtividades
            },
            estoque: {
              touros_semen: totalTouros,
              doses_semen: totalDosesSemen,
              acasalamentos: totalAcasalamentos,
              doses_embriao: totalDosesEmbriao
            }
          }

          // Dados estruturados em Módulos para os Cards do Mobile
          const modules = [
            {
              modulo: 'Rebanho',
              dados: {
                'Total': statsRebanho.total || 0,
                'Machos': statsRebanho.machos || 0,
                'Fêmeas': statsRebanho.femeas || 0,
                'Bezerros': statsRebanho.bezerros || 0,
                'Novilhas': statsRebanho.novilhas || 0,
                'Adultos': statsRebanho.adultos || 0
              }
            },
            {
              modulo: 'Reprodução',
              dados: {
                'Gestações Ativas': totalGestacoesAtivas,
                'Para Parir (30d)': partosPrevistos,
                'Nascimentos (30d)': parseInt(qNascimentos30d.rows[0]?.total || 0)
              }
            },
            {
              modulo: 'Peso',
              dados: {
                'Média Recente': (parseFloat(qPeso.rows[0]?.media || 0).toFixed(1)) + ' kg'
              }
            },
            {
              modulo: 'Financeiro',
              dados: {
                'Custos': 'R$ ' + (parseFloat(qCustos.rows[0]?.total || 0).toFixed(2)),
                'Vendas': 'R$ ' + (parseFloat(qVendasAnimais.rows[0]?.total || 0).toFixed(2))
              }
            }
          ]
          
          if (vacinasTotal > 0 || mortesTotal > 0) {
            modules.push({
              modulo: 'Sanidade',
              dados: {
                'Vacinações': vacinasTotal,
                'Mortes': mortesTotal
              }
            })
          }

          if (totalDosesSemen > 0 || totalDosesEmbriao > 0) {
            modules.push({
              modulo: 'Estoque',
              dados: {
                'Touros (sêmen)': totalTouros,
                'Doses Sêmen': totalDosesSemen,
                'Acasalamentos': totalAcasalamentos,
                'Embriões Disp.': totalDosesEmbriao
              }
            })
          }

          // Dados para gráficos
          const chartData = [
            { label: 'Bezerros (0-12m)', valor: statsRebanho.bezerros, categoria: 'Idade' },
            { label: 'Novilhas/os (12-24m)', valor: statsRebanho.novilhas, categoria: 'Idade' },
            { label: 'Adultos (>24m)', valor: statsRebanho.adultos, categoria: 'Idade' },
            { label: 'Machos', valor: statsRebanho.machos, categoria: 'Sexo' },
            { label: 'Fêmeas', valor: statsRebanho.femeas, categoria: 'Sexo' }
          ]
          
          // Retornar modules em data (para os cards) e chartData em graficos
          // Hack: Atribuir modules a data para compatibilidade com o frontend atual
          data = modules
          // Adicionar propriedade extra ao objeto data se fosse array, mas JS arrays são objetos
          // Melhor retornar um objeto wrapper no json final, mas a estrutura espera { data: ... }
          // Vou injetar 'graficos' no json final modificando a logica de retorno lá embaixo ou aqui
          
          // A estrutura de retorno padrão é res.json({ data: data, resumo: resumo })
          // Vou retornar data = modules. E vou adicionar graficos no resumo ou em um campo extra se eu puder alterar o handler
          
          // Workaround: Anexar graficos ao primeiro item de data ou usar um campo especial
          // Mas o ideal é retornar { data: modules, graficos: chartData }
          // O handler lá embaixo faz: return sendSuccess(res, { data, resumo }) -> que vira { success: true, data: { data, resumo } } ??
          // Não, sendSuccess(res, payload) -> { success: true, data: payload } se payload for array?
          // Ver utils/apiResponse.js se possível. Mas geralmente é res.json({ success: true, data: ... })
          
          // O handler atual faz:
          // return sendSuccess(res, { data, resumo }) se eu mudar a variavel data para ser os modulos.
          // Vou adicionar a propriedade graficos ao objeto de retorno.
          
          // Mas 'data' é declarado como let data = [].
          // Se eu atribuir data = modules, o retorno será { data: modules, resumo: ... }
          // Eu preciso passar 'graficos' também.
          
          // Vou monkey-patch o objeto de resposta dentro deste bloco se possível, mas o return está no fim da função.
          // Vou adicionar 'graficos' ao objeto 'resumo' por enquanto, ou melhor:
          resumo.graficos = chartData


        } catch (e) {
          console.error('Erro no Resumo Geral:', e)
          data = []
          resumo = { erro: 'Falha ao carregar resumo geral' }
        }
        break
      }

      case 'agenda_atividades': {
        try {
          // Buscar eventos de Brucelose e DGT usando a mesma lógica da API agenda-eventos
          const hoje = new Date()
          const mesAtual = hoje.getMonth() + 1
          const anoAtual = hoje.getFullYear()
          
          // Brucelose: Fêmeas entre 3 e 8 meses (90-240 dias) sem vacina prévia
          const bruceloseQuery = await query(`
            SELECT 
              a.id, a.serie, a.rg, a.sexo, a.raca, a.data_nascimento,
              (CURRENT_DATE - a.data_nascimento::date) as idade_dias,
              COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete,
              p.peso
            FROM animais a
            LEFT JOIN LATERAL (
              SELECT piquete FROM localizacoes_animais 
              WHERE animal_id = a.id AND data_saida IS NULL 
              ORDER BY data_entrada DESC LIMIT 1
            ) l ON TRUE
            LEFT JOIN LATERAL (
              SELECT peso FROM pesagens 
              WHERE animal_id = a.id 
              ORDER BY data DESC LIMIT 1
            ) p ON TRUE
            WHERE a.situacao = 'Ativo'
              AND a.sexo = 'Fêmea'
              AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 90 AND 240
              AND NOT EXISTS (
                SELECT 1 FROM historia_ocorrencias h
                WHERE h.animal_id = a.id 
                AND (LOWER(h.tipo) LIKE '%brucelose%' OR LOWER(h.descricao) LIKE '%brucelose%')
              )
            ORDER BY a.data_nascimento DESC
          `)

          // DGT: Animais entre 330 e 640 dias que ainda não fizeram a avaliação
          const dgtQuery = await query(`
            SELECT 
              a.id, a.serie, a.rg, a.sexo, a.raca, a.data_nascimento,
              (CURRENT_DATE - a.data_nascimento::date) as idade_dias,
              COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete,
              p.peso
            FROM animais a
            LEFT JOIN LATERAL (
              SELECT piquete FROM localizacoes_animais 
              WHERE animal_id = a.id AND data_saida IS NULL 
              ORDER BY data_entrada DESC LIMIT 1
            ) l ON TRUE
            LEFT JOIN LATERAL (
              SELECT peso FROM pesagens 
              WHERE animal_id = a.id 
              ORDER BY data DESC LIMIT 1
            ) p ON TRUE
            WHERE a.situacao = 'Ativo'
              AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 330 AND 640
              AND NOT EXISTS (
                SELECT 1 FROM custos c
                WHERE c.animal_id = a.id
                AND (c.subtipo ILIKE '%androl%' OR c.observacoes ILIKE '%dgt%')
              )
              AND NOT EXISTS (
                SELECT 1 FROM exames_andrologicos e
                WHERE e.rg = a.rg::text
              )
            ORDER BY a.data_nascimento DESC
          `)

          const brucelose = bruceloseQuery.rows.map(r => ({
            ...r,
            tipo: 'Vacina Brucelose',
            categoria: 'brucelose',
            idade_meses: Math.floor((r.idade_dias || 0) / 30.44)
          }))

          const dgt = dgtQuery.rows.map(r => ({
            ...r,
            tipo: 'Avaliação DGT',
            categoria: 'dgt',
            idade_meses: Math.floor((r.idade_dias || 0) / 30.44)
          }))

          // Combinar todos os eventos
          data = [...brucelose, ...dgt]

          resumo = {
            total: data.length,
            brucelose: brucelose.length,
            dgt: dgt.length,
            periodo: `${mesAtual}/${anoAtual}`
          }

        } catch (e) {
          console.error('Erro na Agenda de Atividades:', e)
          data = []
          resumo = { erro: 'Falha ao carregar agenda' }
        }
        break
      }

      case 'animais_dgt': {
        try {
          // Animais entre 330 e 640 dias que ainda não fizeram DGT
          const dgtQuery = await query(`
            SELECT 
              a.id, a.serie, a.rg, a.sexo, a.raca, a.data_nascimento,
              (CURRENT_DATE - a.data_nascimento::date) as idade_dias,
              COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete,
              p.peso
            FROM animais a
            LEFT JOIN LATERAL (
              SELECT piquete FROM localizacoes_animais 
              WHERE animal_id = a.id AND data_saida IS NULL 
              ORDER BY data_entrada DESC LIMIT 1
            ) l ON TRUE
            LEFT JOIN LATERAL (
              SELECT peso FROM pesagens 
              WHERE animal_id = a.id 
              ORDER BY data DESC LIMIT 1
            ) p ON TRUE
            WHERE a.situacao = 'Ativo'
              AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 330 AND 640
              AND NOT EXISTS (
                SELECT 1 FROM custos c
                WHERE c.animal_id = a.id
                AND (c.subtipo ILIKE '%androl%' OR c.observacoes ILIKE '%dgt%')
              )
              AND NOT EXISTS (
                SELECT 1 FROM exames_andrologicos e
                WHERE e.rg = a.rg::text
              )
            ORDER BY a.data_nascimento DESC
          `)

          data = dgtQuery.rows.map(r => ({
            animal: `${r.serie || ''} ${r.rg || ''}`.trim(),
            sexo: r.sexo,
            raca: r.raca,
            idade_dias: r.idade_dias,
            idade_meses: Math.floor((r.idade_dias || 0) / 30.44),
            piquete: r.piquete || 'Não informado',
            peso: r.peso ? `${r.peso} kg` : '-',
            data_nascimento: toDateStr(r.data_nascimento)
          }))

          resumo = {
            'Total de animais': data.length,
            'Idade': '11-21 meses (330-640 dias)',
            'Tipo': 'Elegíveis para avaliação DGT'
          }

        } catch (e) {
          console.error('Erro ao buscar animais para DGT:', e)
          data = []
          resumo = { erro: 'Falha ao carregar dados' }
        }
        break
      }

      case 'pesagens': {
        const r = await query(`
          SELECT p.id, p.animal_id, p.peso, p.ce, p.data, p.observacoes,
                 a.serie, a.rg, a.nome as animal_nome, a.sexo as animal_sexo,
                 a.mgte, a.top
          FROM pesagens p
          JOIN animais a ON a.id = p.animal_id
          WHERE p.data >= $1 AND p.data <= $2
          ORDER BY p.data DESC, p.created_at DESC
          LIMIT 500
        `, [start, end])
        data = (r.rows || []).map(row => ({
          animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.animal_nome,
          peso: row.peso,
          ce: row.ce,
          data: toDateStr(row.data),
          sexo: row.animal_sexo,
          observacoes: row.observacoes,
          mgte: row.mgte,
          top: row.top
        }))
        break
      }

      case 'resumo_pesagens': {
        function extrairLocal(obs) {
          if (!obs || typeof obs !== 'string') return null
          const s = obs.trim().replace(/CONFINAÇÃO/gi, 'CONFINA').replace(/CONFINACAO/gi, 'CONFINA')
          const m = s.match(/(PIQUETE\s*\d+|PROJETO\s*[\dA-Za-z\-]+|LOTE\s*\d+|CONFINA\w*|GUARITA|CABANHA|PISTA\s*\d*)/i)
          if (m) {
            let loc = m[1].trim().toUpperCase().replace(/\s+/g, ' ')
            if (/^CONFINA/.test(loc)) loc = 'CONFINA'
            return loc
          }
          return s.length <= 35 ? s.toUpperCase() : s.substring(0, 35).toUpperCase()
        }
        function normalizarPiquete(p) {
          if (!p || p === 'Não informado') return p || 'Não informado'
          const s = String(p).trim().toUpperCase()
          const mPiq = s.match(/^PIQUETE\s*(\d+)$/i)
          const mProj = s.match(/^PROJETO\s*([\dA-Za-z\-]+)$/i)
          if (mPiq) return `PROJETO ${mPiq[1]}`
          if (mProj) return `PROJETO ${mProj[1]}`
          return s
        }

        let r
        try {
          r = await query(`
            SELECT p.id, p.animal_id, p.peso, p.ce, p.data, p.observacoes, a.sexo, a.serie, a.rg,
                   la.piquete as piquete_loc,
                   a.piquete_atual, a.pasto_atual,
                   a.mgte, a.top
            FROM pesagens p
            JOIN animais a ON a.id = p.animal_id
            LEFT JOIN LATERAL (
              SELECT l.piquete FROM localizacoes_animais l
              WHERE l.animal_id = p.animal_id AND (l.data_saida IS NULL OR l.data_saida >= p.data)
              ORDER BY l.data_entrada DESC LIMIT 1
            ) la ON TRUE
            WHERE p.data >= $1 AND p.data <= $2
            ORDER BY p.data DESC
          `, [start, end])
        } catch (colErr) {
          if (/column.*does not exist/i.test(colErr?.message || '')) {
            r = await query(`
              SELECT p.id, p.animal_id, p.peso, p.ce, p.data, p.observacoes, a.sexo, a.serie, a.rg,
                     la.piquete as piquete_loc,
                     a.pasto_atual as piquete_atual,
                     a.pasto_atual,
                     a.mgte, a.top
              FROM pesagens p
              JOIN animais a ON a.id = p.animal_id
              LEFT JOIN LATERAL (
                SELECT l.piquete FROM localizacoes_animais l
                WHERE l.animal_id = p.animal_id AND (l.data_saida IS NULL OR l.data_saida >= p.data)
                ORDER BY l.data_entrada DESC LIMIT 1
              ) la ON TRUE
              WHERE p.data >= $1 AND p.data <= $2
              ORDER BY p.data DESC
            `, [start, end])
          } else throw colErr
        }
        const rows = r.rows || []

        // Última pesagem por animal (para médias por animal)
        const porAnimal = {}
        rows.forEach(x => {
          const aid = x.animal_id
          if (!aid) return
          const d = x.data || ''
          const prev = porAnimal[aid]
          if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (x.id || 0) > (prev.id || 0))) {
            porAnimal[aid] = x
          }
        })
        const ultimasPesagens = Object.values(porAnimal)

        const pesos = rows.map(x => parseFloat(x.peso)).filter(n => !isNaN(n))
        const ces = rows.map(x => parseFloat(x.ce)).filter(n => !isNaN(n) && n > 0)
        const machos = ultimasPesagens.filter(x => (x.sexo || '').toLowerCase().startsWith('m'))
        const femeas = ultimasPesagens.filter(x => (x.sexo || '').toLowerCase().startsWith('f'))
        const pesosUltima = ultimasPesagens.map(x => parseFloat(x.peso)).filter(n => !isNaN(n))
        const mediaPorAnimal = pesosUltima.length ? (pesosUltima.reduce((a, b) => a + b, 0) / pesosUltima.length).toFixed(1) : '-'

        // Por piquete (fallback: localizacoes_animais -> piquete_atual/pasto_atual do cadastro -> observações)
        // Filtrar nomes de touros (ex: LANDROVER, MALCOM SANT ANNA) que não são locais
        const porPiquete = {}
        ultimasPesagens.forEach(x => {
          const pBruto = x.piquete_loc || x.piquete_atual || x.pasto_atual || extrairLocal(x.observacoes) || 'Não informado'
          const pValidado = piqueteOuNaoInformado(pBruto)
          const p = normalizarPiquete(pValidado)
          if (!porPiquete[p]) porPiquete[p] = { total: 0, machos: 0, femeas: 0, pesos: [], ces: [], animais: [] }
          porPiquete[p].total++
          if ((x.sexo || '').toLowerCase().startsWith('m')) porPiquete[p].machos++
          else if ((x.sexo || '').toLowerCase().startsWith('f')) porPiquete[p].femeas++
          const pv = parseFloat(x.peso)
          if (!isNaN(pv)) porPiquete[p].pesos.push(pv)
          const cv = parseFloat(x.ce)
          if (!isNaN(cv) && cv > 0) porPiquete[p].ces.push(cv)
          porPiquete[p].animais.push({
            animal_id: x.animal_id,
            serie: x.serie || '',
            rg: x.rg || '',
            animal: `${(x.serie || '').trim()} ${(x.rg || '').trim()}`.trim() || null,
            sexo: x.sexo,
            peso: pv,
            mgte: x.mgte,
            top: x.top
          })
        })

        const piquetesValidos = Object.keys(porPiquete).filter(p => !/^(não informado|nao informado|-|vazio)$/i.test(String(p).trim()))
        resumo = {
          'Total de pesagens': rows.length,
          'Animais únicos': ultimasPesagens.length,
          'Machos': machos.length,
          'Fêmeas': femeas.length,
          'Piquetes': piquetesValidos.length,
          'Peso médio geral (kg)': pesos.length ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : '-',
          'Média por animal (kg)': mediaPorAnimal,
          'Peso mínimo (kg)': pesos.length ? Math.min(...pesos).toFixed(1) : '-',
          'Peso máximo (kg)': pesos.length ? Math.max(...pesos).toFixed(1) : '-',
          'CE média (cm)': ces.length ? (ces.reduce((a, b) => a + b, 0) / ces.length).toFixed(1) : '-'
        }

        data = Object.keys(porPiquete)
          .filter(p => !/^(não informado|nao informado|-|vazio)$/i.test(String(p).trim()))
          .sort()
          .map(p => {
            const s = porPiquete[p]
            const mediaPeso = s.pesos.length ? (s.pesos.reduce((a, b) => a + b, 0) / s.pesos.length).toFixed(1) : '-'
            const pesoMinP = s.pesos.length ? Math.min(...s.pesos).toFixed(1) : '-'
            const pesoMaxP = s.pesos.length ? Math.max(...s.pesos).toFixed(1) : '-'
            const mediaCE = s.ces.length ? (s.ces.reduce((a, b) => a + b, 0) / s.ces.length).toFixed(1) : '-'
            return {
              Piquete: p,
              piquete: p,
              Animais: s.total,
              Machos: s.machos,
              Fêmeas: s.femeas,
              'Média Peso (kg)': mediaPeso,
              'Peso Min (kg)': pesoMinP,
              'Peso Max (kg)': pesoMaxP,
              'Média CE (cm)': mediaCE,
              animais: s.animais || []
            }
          })
        break
      }

      case 'femeas_ia':
      case 'inseminacoes': {
        const col = await query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'inseminacoes' AND column_name IN ('data_ia', 'data_inseminacao', 'data', 'resultado_dg', 'status_gestacao', 'touro_nome', 'touro')
        `)
        const dateCol = col.rows?.find(r => r.column_name === 'data_ia') ? 'data_ia'
          : col.rows?.find(r => r.column_name === 'data_inseminacao') ? 'data_inseminacao' : 'data'
        const colsExtras = ['i.id', 'i.animal_id', `i.${dateCol}`, 'i.tecnico', 'a.serie', 'a.rg', 'a.nome as animal_nome']
        if (col.rows?.some(r => r.column_name === 'resultado_dg')) colsExtras.push('i.resultado_dg')
        if (col.rows?.some(r => r.column_name === 'status_gestacao')) colsExtras.push('i.status_gestacao')
        if (col.rows?.some(r => r.column_name === 'touro_nome')) colsExtras.push('i.touro_nome')
        if (col.rows?.some(r => r.column_name === 'touro')) colsExtras.push('i.touro')

        const r = await query(`
          SELECT ${colsExtras.join(', ')}
          FROM inseminacoes i
          LEFT JOIN animais a ON a.id = i.animal_id
          WHERE i.${dateCol} >= $1 AND i.${dateCol} <= $2
          ORDER BY i.${dateCol} DESC
          LIMIT 1500
        `, [start, end])
        data = (r.rows || []).map(row => {
          const dataVal = row.data_ia || row.data_inseminacao || row.data
          return {
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.animal_nome,
            data: toDateStr(dataVal),
            touro: row.touro_nome || row.touro,
            resultado: row.resultado_dg || row.status_gestacao,
            tecnico: row.tecnico
          }
        })
        break
      }

      case 'resumo_femeas_ia': {
        const col = await query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'inseminacoes' AND column_name IN ('data_ia', 'data_inseminacao', 'data', 'resultado_dg', 'status_gestacao')
        `)
        const dateCol = col.rows?.find(r => r.column_name === 'data_ia') ? 'data_ia'
          : col.rows?.find(r => r.column_name === 'data_inseminacao') ? 'data_inseminacao' : 'data'
        const temResultadoDg = col.rows?.some(r => r.column_name === 'resultado_dg')
        const temStatusGestacao = col.rows?.some(r => r.column_name === 'status_gestacao')

        let r
        if (temResultadoDg || temStatusGestacao) {
          // P, Prenha, Prenhez, Positivo e variações (DG costuma usar P ou Positivo)
          const prenhaCond = [
            temResultadoDg && "(TRIM(COALESCE(resultado_dg,'')) = 'P' OR LOWER(COALESCE(resultado_dg,'')) LIKE '%pren%' OR LOWER(COALESCE(resultado_dg,'')) LIKE '%positivo%')",
            temStatusGestacao && "(TRIM(COALESCE(status_gestacao,'')) = 'P' OR LOWER(COALESCE(status_gestacao,'')) LIKE '%pren%' OR LOWER(COALESCE(status_gestacao,'')) LIKE '%positivo%')"
          ].filter(Boolean).join(' OR ')
          r = await query(`
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN ${prenhaCond} THEN 1 END) as prenhas
            FROM inseminacoes
            WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
          `, [start, end])
        } else {
          r = await query(`
            SELECT COUNT(*) as total, 0 as prenhas
            FROM inseminacoes
            WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
          `, [start, end])
        }
        const row = r.rows?.[0]
        const total = parseInt(row?.total || 0, 10)
        const prenhas = parseInt(row?.prenhas || 0, 10)
        resumo = { total, prenhas, taxaPrenhez: total > 0 ? ((prenhas / total) * 100).toFixed(1) + '%' : '0%' }
        data = [{ _resumo: resumo }]
        if (prenhas > 0 && (temResultadoDg || temStatusGestacao)) {
          const prenhaCondList = [
            temResultadoDg && "(TRIM(COALESCE(i.resultado_dg,'')) = 'P' OR LOWER(COALESCE(i.resultado_dg,'')) LIKE '%pren%' OR LOWER(COALESCE(i.resultado_dg,'')) LIKE '%positivo%')",
            temStatusGestacao && "(TRIM(COALESCE(i.status_gestacao,'')) = 'P' OR LOWER(COALESCE(i.status_gestacao,'')) LIKE '%pren%' OR LOWER(COALESCE(i.status_gestacao,'')) LIKE '%positivo%')"
          ].filter(Boolean).join(' OR ')
          const colsList = ['i.id', 'i.animal_id', `i.${dateCol}`, 'a.serie', 'a.rg', 'a.nome']
          if (col.rows?.some(r => r.column_name === 'touro_nome')) colsList.push('i.touro_nome')
          else if (col.rows?.some(r => r.column_name === 'touro')) colsList.push('i.touro')
          const rList = await query(`
            SELECT ${colsList.join(', ')}
            FROM inseminacoes i
            JOIN animais a ON a.id = i.animal_id
            WHERE i.${dateCol} >= $1 AND i.${dateCol} <= $2 AND (${prenhaCondList})
            ORDER BY i.${dateCol} DESC
            LIMIT 1000
          `, [start, end])
          const listaPrenhas = (rList.rows || []).map(row => ({
            animal: row.nome || `${row.serie || ''} ${row.rg || ''}`.trim(),
            data: toDateStr(row.data_ia || row.data_inseminacao || row.data),
            touro: row.touro_nome || row.touro
          }))
          data = [{ _resumo: resumo }, ...listaPrenhas]
        }
        break
      }

      case 'gestacoes': {
        try {
          const colCheck = await query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'gestacoes' AND column_name IN ('data_gestacao', 'data_cobertura')
          `)
          const temDataGestacao = colCheck.rows?.some(r => r.column_name === 'data_gestacao')
          const whereExtra = temDataGestacao ? ' OR (g.data_gestacao >= $1 AND g.data_gestacao <= $2)' : ''
          const orderCol = temDataGestacao ? 'COALESCE(g.data_cobertura, g.data_gestacao)' : 'g.data_cobertura'

          const r = await query(`
            SELECT g.*, a.id as animal_id, a.serie, a.rg, a.nome as animal_nome
            FROM gestacoes g
            LEFT JOIN animais a ON (
              (g.receptora_serie IS NOT NULL AND g.receptora_rg IS NOT NULL AND a.serie = g.receptora_serie AND a.rg = g.receptora_rg)
              OR (g.mae_serie IS NOT NULL AND g.mae_rg IS NOT NULL AND a.serie = g.mae_serie AND a.rg = g.mae_rg)
            )
            WHERE (g.data_cobertura >= $1 AND g.data_cobertura <= $2)${whereExtra}
            ORDER BY ${orderCol} DESC
            LIMIT 1000
          `, [start, end])
          data = (r.rows || []).map(row => ({
            animal: row.animal_nome || row.receptora_nome || `${row.receptora_serie || row.mae_serie || ''} ${row.receptora_rg || row.mae_rg || ''}`.trim(),
            rg: row.rg || row.receptora_rg || row.mae_rg || '-',
            data: toDateStr(row.data_cobertura || row.data_gestacao),
            situacao: row.situacao,
            origem: 'TE',
            animal_id: row.animal_id
          }))

          // Incluir inseminações prenhas (IA) quando tabela gestacoes vazia ou para complementar
          const colIA = await query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'inseminacoes' AND column_name IN ('data_ia', 'data_inseminacao', 'data', 'resultado_dg', 'status_gestacao')
          `)
          const dateColIA = colIA.rows?.find(r => r.column_name === 'data_ia') ? 'data_ia'
            : colIA.rows?.find(r => r.column_name === 'data_inseminacao') ? 'data_inseminacao' : 'data'
          const temResultadoIA = colIA.rows?.some(r => r.column_name === 'resultado_dg') || colIA.rows?.some(r => r.column_name === 'status_gestacao')
          if (temResultadoIA) {
            const temRd = colIA.rows?.some(r => r.column_name === 'resultado_dg')
            const temSg = colIA.rows?.some(r => r.column_name === 'status_gestacao')
            const prenhaCondIA = [
              temRd && "(TRIM(COALESCE(i.resultado_dg,'')) = 'P' OR LOWER(COALESCE(i.resultado_dg,'')) LIKE '%pren%' OR LOWER(COALESCE(i.resultado_dg,'')) LIKE '%positivo%')",
              temSg && "(TRIM(COALESCE(i.status_gestacao,'')) = 'P' OR LOWER(COALESCE(i.status_gestacao,'')) LIKE '%pren%' OR LOWER(COALESCE(i.status_gestacao,'')) LIKE '%positivo%')"
            ].filter(Boolean).join(' OR ')
            const ri = await query(`
              SELECT i.${dateColIA} as data_gest, a.id as animal_id, a.serie, a.rg, a.nome
              FROM inseminacoes i
              JOIN animais a ON a.id = i.animal_id
              WHERE i.${dateColIA} >= $1 AND i.${dateColIA} <= $2
                AND (${prenhaCondIA})
              ORDER BY i.${dateColIA} DESC
              LIMIT 1000
            `, [start, end])
            ;(ri.rows || []).forEach(row => {
              data.push({
                animal: row.nome || `${row.serie || ''} ${row.rg || ''}`.trim(),
                rg: row.rg || '-',
                data: toDateStr(row.data_gest),
                situacao: 'Prenha',
                origem: 'IA',
                animal_id: row.animal_id
              })
            })
            data.sort((a, b) => (b.data || '').localeCompare(a.data || ''))
          }
        } catch (e) {
          data = []
        }
        break
      }

      case 'nascimentos': {
        try {
          const r = await query(`
            SELECT n.*, a.serie, a.rg, a.nome as animal_nome
            FROM nascimentos n
            LEFT JOIN animais a ON CONCAT(a.serie, a.rg) = CONCAT(COALESCE(n.serie,''), COALESCE(n.rg,''))
            WHERE n.data_nascimento >= $1 AND n.data_nascimento <= $2
            ORDER BY n.data_nascimento DESC
            LIMIT 500
          `, [start, end])
          data = (r.rows || []).map(row => ({
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.animal_nome,
            data: toDateStr(row.data_nascimento),
            sexo: row.sexo,
            peso: row.peso
          }))
        } catch (e) {
          data = []
        }
        break
      }

      case 'mortes': {
        try {
          const r = await query(`
            SELECT m.*, a.serie, a.rg, a.nome as animal_nome
            FROM mortes m
            LEFT JOIN animais a ON a.id = m.animal_id
            WHERE m.data_morte >= $1 AND m.data_morte <= $2
            ORDER BY m.data_morte DESC
            LIMIT 200
          `, [start, end])
          data = (r.rows || []).map(row => ({
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.animal_nome,
            data: toDateStr(row.data_morte),
            causa: row.causa_morte || row.causa
          }))
        } catch (e) {
          data = []
        }
        break
      }

      case 'estoque_semen': {
        const r = await query(`
          SELECT id, nome_touro, rg_touro, raca, rack_touro, botijao, caneca,
                 quantidade_doses, doses_disponiveis, doses_usadas, status,
                 localizacao, observacoes, tipo, created_at
          FROM estoque_semen
          WHERE tipo_operacao = 'entrada'
            AND doses_disponiveis > 0
            AND (tipo = 'semen' 
                 OR (tipo IS NULL
                     AND nome_touro NOT ILIKE '%ACASALAMENTO%'
                     AND nome_touro NOT ILIKE '% X %'))
          ORDER BY nome_touro
          LIMIT 300
        `)
        data = (r.rows || []).map(row => ({
          touro: row.nome_touro,
          rg: row.rg_touro,
          raca: row.raca,
          rack: row.rack_touro,
          botijao: row.botijao,
          caneca: row.caneca,
          quantidade: row.doses_disponiveis || 0,
          totalDoses: row.quantidade_doses || 0,
          dosesUsadas: row.doses_usadas || 0,
          status: row.status,
          localizacao: row.localizacao,
          observacoes: row.observacoes,
          atualizado: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : null
        }))
        break
      }

      case 'estoque_embrioes': {
        const r = await query(`
          SELECT id, nome_touro, raca, rack_touro, botijao, caneca,
                 quantidade_doses, doses_disponiveis, doses_usadas, status,
                 localizacao, observacoes, created_at
          FROM estoque_semen
          WHERE tipo_operacao = 'entrada'
            AND doses_disponiveis > 0
            AND (tipo = 'embriao'
                 OR nome_touro ILIKE '%ACASALAMENTO%')
          ORDER BY nome_touro
          LIMIT 300
        `)
        data = (r.rows || []).map(row => ({
          acasalamento: row.nome_touro,
          raca: row.raca,
          rack: row.rack_touro,
          botijao: row.botijao,
          caneca: row.caneca,
          quantidade: row.doses_disponiveis || 0,
          totalDoses: row.quantidade_doses || 0,
          dosesUsadas: row.doses_usadas || 0,
          status: row.status,
          localizacao: row.localizacao,
          observacoes: row.observacoes,
          atualizado: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : null
        }))
        break
      }

      case 'abastecimento_nitrogenio': {
        try {
          await ensureNitrogenioTables()

          const r = await query(`
            SELECT 
              id, 
              data_abastecimento, 
              quantidade_litros, 
              motorista, 
              valor_unitario, 
              valor_total, 
              observacoes,
              proximo_abastecimento,
              created_at
            FROM abastecimento_nitrogenio
            WHERE data_abastecimento >= $1 AND data_abastecimento <= $2
            ORDER BY data_abastecimento DESC
            LIMIT 200
          `, [start, end])
          
          const rows = r.rows || []
          const totalLitros = rows.reduce((sum, row) => sum + (parseFloat(row.quantidade_litros) || 0), 0)
          const totalValor = rows.reduce((sum, row) => sum + (parseFloat(row.valor_total) || 0), 0)
          const mediaValorUnitario = rows.length > 0 
            ? rows.reduce((sum, row) => sum + (parseFloat(row.valor_unitario) || 0), 0) / rows.length 
            : 0
          
          resumo = {
            'Total de abastecimentos': rows.length,
            'Total de litros': totalLitros.toFixed(1) + ' L',
            'Valor total': 'R$ ' + totalValor.toFixed(2),
            'Média valor/litro': 'R$ ' + mediaValorUnitario.toFixed(2)
          }
          
          data = rows.map(row => ({
            data: toDateStr(row.data_abastecimento),
            quantidade: row.quantidade_litros + ' L',
            motorista: row.motorista,
            valor_unitario: row.valor_unitario ? 'R$ ' + parseFloat(row.valor_unitario).toFixed(2) : '-',
            valor_total: row.valor_total ? 'R$ ' + parseFloat(row.valor_total).toFixed(2) : '-',
            proximo: row.proximo_abastecimento ? toDateStr(row.proximo_abastecimento) : '-',
            observacoes: row.observacoes
          }))
        } catch (e) {
          console.error('Erro ao buscar abastecimento de nitrogênio:', e)
          data = []
        }
        break
      }

      case 'exames_andrologicos': {
        try {
          const r = await query(`
            SELECT id, touro, rg, data_exame, resultado, ce, defeitos, observacoes
            FROM exames_andrologicos
            WHERE data_exame >= $1 AND data_exame <= $2
            ORDER BY data_exame DESC
            LIMIT 300
          `, [start, end])
          data = (r.rows || []).map(row => ({
            touro: row.touro,
            rg: row.rg,
            data: toDateStr(row.data_exame),
            resultado: row.resultado,
            ce: row.ce,
            defeitos: row.defeitos,
            observacoes: row.observacoes
          }))
        } catch (e) {
          data = []
        }
        break
      }

      case 'previsoes_parto': {
        try {
          const todas = []
          // 1. Gestações ativas - filtrar por previsão no período (parto previsto)
          try {
            const rg = await query(`
              SELECT g.id, g.receptora_nome, g.receptora_serie, g.receptora_rg,
                     g.data_cobertura, g.situacao, g.pai_serie, g.pai_rg,
                     (g.data_cobertura::date + INTERVAL '285 days')::date as previsao
              FROM gestacoes g
              WHERE (g.situacao = 'Em Gestação' OR g.situacao = 'Ativa' OR g.situacao IS NULL)
                AND (g.data_cobertura::date + INTERVAL '285 days')::date >= $1
                AND (g.data_cobertura::date + INTERVAL '285 days')::date <= $2
              ORDER BY previsao ASC
              LIMIT 500
            `, [start, end])
            ;(rg.rows || []).forEach(row => {
              const touro = row.pai_serie && row.pai_rg ? `${row.pai_serie} ${row.pai_rg}` : null
              todas.push({
                animal: row.receptora_nome || `${row.receptora_serie || ''} ${row.receptora_rg || ''}`.trim(),
                data_cobertura: toDateStr(row.data_cobertura),
                previsao_parto: toDateStr(row.previsao),
                touro,
                origem: 'gestacao'
              })
            })
          } catch (_) {}

          // 2. Inseminações prenhas (data_ia + 285 dias)
          try {
            const colCheck = await query(`
              SELECT column_name FROM information_schema.columns
              WHERE table_name = 'inseminacoes' AND column_name IN ('resultado_dg', 'status_gestacao')
            `)
            const temPrenha = colCheck.rows?.length > 0
            if (temPrenha) {
              const ri = await query(`
                SELECT i.data_ia, i.touro_nome, i.touro, a.serie, a.rg, a.nome,
                       (i.data_ia::date + INTERVAL '285 days')::date as previsao
                FROM inseminacoes i
                JOIN animais a ON a.id = i.animal_id
                WHERE (i.data_ia::date + INTERVAL '285 days')::date >= $1
                  AND (i.data_ia::date + INTERVAL '285 days')::date <= $2
                  AND (TRIM(COALESCE(i.resultado_dg,'') || COALESCE(i.status_gestacao,'')) = 'P'
                    OR LOWER(COALESCE(i.resultado_dg,'') || COALESCE(i.status_gestacao,'')) LIKE '%pren%'
                    OR LOWER(COALESCE(i.resultado_dg,'') || COALESCE(i.status_gestacao,'')) LIKE '%positivo%')
                ORDER BY previsao ASC
                LIMIT 500
              `, [start, end])
              ;(ri.rows || []).forEach(row => {
                todas.push({
                  animal: row.nome || `${row.serie || ''} ${row.rg || ''}`.trim(),
                  data_cobertura: toDateStr(row.data_ia),
                  previsao_parto: toDateStr(row.previsao),
                  touro: row.touro_nome || row.touro,
                  origem: 'IA'
                })
              })
            }
          } catch (_) {}

          // Ordenar por previsão e limitar
          data = todas
            .sort((a, b) => (a.previsao_parto || '').localeCompare(b.previsao_parto || ''))
            .slice(0, 200)

          // Resumo: total e por touro
          const porTouro = {}
          data.forEach(d => {
            const t = (d.touro || 'Não informado').trim() || 'Não informado'
            porTouro[t] = (porTouro[t] || 0) + 1
          })
          const totaisTouro = Object.entries(porTouro)
            .sort((a, b) => b[1] - a[1])
            .map(([nome, qtd]) => `${nome}: ${qtd}`)
          resumo = {
            'Total de previsões': data.length,
            'Prenhas por touro': totaisTouro.slice(0, 10).join(' | ') || '-'
          }
        } catch (e) {
          data = []
        }
        break
      }

      case 'transferencias_embrioes': {
        try {
          const colCheck = await query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'transferencias_embrioes' AND column_name IN ('data_te', 'data_transferencia')
          `)
          const dateCol = colCheck.rows?.find(r => r.column_name === 'data_te') ? 'data_te' : 'data_transferencia'
          const r = await query(`
            SELECT te.*
            FROM transferencias_embrioes te
            WHERE te.${dateCol} >= $1 AND te.${dateCol} <= $2
            ORDER BY te.${dateCol} DESC
            LIMIT 500
          `, [start, end])
          data = (r.rows || []).map(row => ({
            receptora: row.receptora_nome || row.receptora_id,
            doadora: row.doadora_nome || row.doadora_id,
            data: toDateStr(row.data_te || row.data_transferencia),
            touro: row.touro,
            status: row.status
          }))
        } catch (e) {
          data = []
        }
        break
      }

      case 'calendario_reprodutivo': {
        try {
          // Usar a mesma API do desktop (eventos manuais, receptoras, partos previstos, refazer andrológico)
          const protocol = req.headers['x-forwarded-proto'] || (req.connection?.encrypted ? 'https' : 'http')
          const host = req.headers.host || 'localhost:3000'
          const baseUrl = `${protocol}://${host}`
          const resCal = await fetch(`${baseUrl}/api/calendario-reprodutivo?data_inicio=${start}&data_fim=${end}&limit=5000`)
          const jsonCal = resCal.ok ? await resCal.json() : {}
          const eventos = Array.isArray(jsonCal?.data) ? jsonCal.data : (jsonCal?.eventos || [])
          data = eventos.map(row => ({
            animal_id: row.animal_id,
            animal: row.animal_id ? `${row.animal_serie || ''} ${row.animal_rg || ''}`.trim() || row.animal_nome || '-' : (row.titulo || '-'),
            data: toDateStr(row.data_evento),
            tipo: row.tipo_evento || row.tipo || 'Evento',
            titulo: row.titulo || 'Sem título',
            descricao: row.descricao || '',
            status: row.status || 'pendente',
            origem: row.origem,
            numero_nf: row.numero_nf,
            fornecedor: row.fornecedor,
            data_te: row.data_te ? toDateStr(row.data_te) : null
          }))

          // Incluir Brucelose e DGT - consulta direta ao banco (evita fetch que falha em serverless)
          try {
            const bruceloseResult = await query(`
              SELECT a.id, a.serie, a.rg, a.nome, a.data_nascimento,
                COALESCE((SELECT l2.piquete FROM localizacoes_animais l2 WHERE l2.animal_id = a.id AND l2.data_saida IS NULL ORDER BY l2.data_entrada DESC LIMIT 1), a.piquete_atual, a.pasto_atual) as piquete,
                (CURRENT_DATE - a.data_nascimento::date)::int as idade_dias
              FROM animais a
              WHERE a.situacao = 'Ativo' AND a.sexo = 'Fêmea' AND a.data_nascimento IS NOT NULL
                AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 90 AND 240
                AND NOT EXISTS (
                  SELECT 1 FROM custos c WHERE c.animal_id = a.id AND (c.tipo ILIKE '%brucelose%' OR c.subtipo ILIKE '%brucelose%' OR c.observacoes ILIKE '%brucelose%')
                )
                AND NOT EXISTS (
                  SELECT 1 FROM historia_ocorrencias h WHERE h.animal_id = a.id AND (LOWER(h.tipo) LIKE '%brucelose%' OR LOWER(h.descricao) LIKE '%brucelose%')
                )
            `)
            const dgtResult = await query(`
              SELECT a.id, a.serie, a.rg, a.nome, a.data_nascimento,
                COALESCE((SELECT l2.piquete FROM localizacoes_animais l2 WHERE l2.animal_id = a.id AND l2.data_saida IS NULL ORDER BY l2.data_entrada DESC LIMIT 1), a.piquete_atual, a.pasto_atual) as piquete,
                (CURRENT_DATE - a.data_nascimento::date)::int as idade_dias
              FROM animais a
              WHERE a.situacao = 'Ativo' AND a.data_nascimento IS NOT NULL
                AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 330 AND 640
            `)
            const eventosBruceloseDgt = []
            const addEvento = (a, tipo, dataEv, descBase) => {
              const piquete = a.piquete || 'Não informado'
              const ident = `${a.serie || ''} ${a.rg || ''}`.trim() || a.nome || '-'
              eventosBruceloseDgt.push({
                animal_id: a.id,
                animal: ident,
                data: dataEv,
                tipo,
                titulo: `${tipo} - ${ident}`,
                descricao: `${descBase} • Piquete: ${piquete}` + (a.idade_dias ? (tipo === 'Brucelose' ? ` • ${Math.floor(a.idade_dias / 30)} meses` : ` • ${a.idade_dias} dias`) : ''),
                status: 'Agendado',
                origem: 'agenda'
              })
            }
            bruceloseResult.rows.forEach(a => {
              const dataNasc = a.data_nascimento ? new Date(a.data_nascimento) : null
              if (!dataNasc || isNaN(dataNasc.getTime())) return
              const di = new Date(dataNasc)
              di.setDate(di.getDate() + 90)
              const df = new Date(dataNasc)
              df.setDate(df.getDate() + 240)
              const dataInicio = di.toISOString().split('T')[0]
              const dataFim = df.toISOString().split('T')[0]
              const entraNoPeriodo = dataInicio >= start && dataInicio <= end
              const jaNaJanela = dataInicio < start && dataFim >= start
              if (entraNoPeriodo) addEvento(a, 'Brucelose', dataInicio, 'Fêmea na janela 3-8 meses')
              else if (jaNaJanela) addEvento(a, 'Brucelose', start, 'Fêmea na janela 3-8 meses')
            })
            dgtResult.rows.forEach(a => {
              const dataNasc = a.data_nascimento ? new Date(a.data_nascimento) : null
              if (!dataNasc || isNaN(dataNasc.getTime())) return
              const di = new Date(dataNasc)
              di.setDate(di.getDate() + 330)
              const df = new Date(dataNasc)
              df.setDate(df.getDate() + 640)
              const dataInicio = di.toISOString().split('T')[0]
              const dataFim = df.toISOString().split('T')[0]
              const entraNoPeriodo = dataInicio >= start && dataInicio <= end
              const jaNaJanela = dataInicio < start && dataFim >= start
              if (entraNoPeriodo) addEvento(a, 'DGT', dataInicio, 'Animal na janela 330-640 dias')
              else if (jaNaJanela) addEvento(a, 'DGT', start, 'Animal na janela 330-640 dias')
            })
            data = [...data, ...eventosBruceloseDgt].sort((a, b) => (a.data || '').localeCompare(b.data || ''))
          } catch (eAgenda) {
            console.error('Erro ao buscar Brucelose/DGT para calendário:', eAgenda)
          }
        } catch (e) {
          console.error('Erro ao buscar calendário reprodutivo:', e)
          data = []
        }
        break
      }

      case 'vacinacoes': {
        try {
          const r = await query(`
            SELECT h.id, h.animal_id, h.tipo, h.data, h.descricao, h.medicamento, h.dosagem,
                   a.serie, a.rg, a.nome as animal_nome
            FROM historia_ocorrencias h
            LEFT JOIN animais a ON a.id = h.animal_id
            WHERE (h.tipo ILIKE '%vacina%' OR h.tipo ILIKE '%tratamento%' OR h.tipo ILIKE '%medic%')
              AND h.data >= $1 AND h.data <= $2
            ORDER BY h.data DESC
            LIMIT 200
          `, [start, end])
          data = (r.rows || []).map(row => ({
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.animal_nome,
            data: toDateStr(row.data),
            tipo: row.tipo,
            medicamento: row.medicamento,
            descricao: row.descricao
          }))
        } catch (e) {
          data = []
        }
        break
      }

      case 'animais_piquetes': {
        try {
          // Usar APENAS localizacoes_animais (mesma fonte do app Histórico de Movimentações) para manter app e mobile sincronizados
          // Tenta iqg/pt_iqg; se colunas não existirem, usa genetica_2/decile_2
          let r
          try {
            r = await query(`
              SELECT
                l.piquete,
                l.data_entrada::date as data_entrada,
                a.id as animal_id,
                a.serie, a.rg, a.nome as animal_nome,
                a.sexo, a.data_nascimento, a.raca,
                a.pai, a.avo_materno, a.abczg as iabcz, a.deca, a.iqg, a.pt_iqg
              FROM localizacoes_animais l
              JOIN animais a ON l.animal_id = a.id
              WHERE a.situacao = 'Ativo'
                AND l.data_saida IS NULL
                AND l.piquete IS NOT NULL
                AND TRIM(l.piquete) != ''
                AND COALESCE(LOWER(a.raca), '') NOT LIKE '%receptora%'
              ORDER BY l.piquete, a.serie, a.rg
              LIMIT 10000
            `)
          } catch (colErr) {
            if (/column.*does not exist|coluna.*não existe/i.test(colErr?.message || '')) {
              r = await query(`
                SELECT
                  l.piquete,
                  l.data_entrada::date as data_entrada,
                  a.id as animal_id,
                  a.serie, a.rg, a.nome as animal_nome,
                  a.sexo, a.data_nascimento, a.raca,
                  a.pai, a.avo_materno, a.abczg as iabcz, a.deca, a.genetica_2 as iqg, a.decile_2 as pt_iqg
                FROM localizacoes_animais l
                JOIN animais a ON l.animal_id = a.id
                WHERE a.situacao = 'Ativo'
                  AND l.data_saida IS NULL
                  AND l.piquete IS NOT NULL
                  AND TRIM(l.piquete) != ''
                  AND COALESCE(LOWER(a.raca), '') NOT LIKE '%receptora%'
                ORDER BY l.piquete, a.serie, a.rg
                LIMIT 10000
              `)
            } else throw colErr
          }

          // Buscar última pesagem (peso e CE) de cada animal
          const animalIds = r.rows.map(row => row.animal_id).filter(Boolean)
          let pesagensMap = {}
          if (animalIds.length > 0) {
            try {
              const pesagensResult = await query(`
                SELECT DISTINCT ON (animal_id) animal_id, peso, ce
                FROM pesagens
                WHERE animal_id = ANY($1::int[])
                ORDER BY animal_id, data DESC, created_at DESC
              `, [animalIds])
              pesagensResult.rows.forEach(p => {
                pesagensMap[p.animal_id] = {
                  peso: parseFloat(p.peso) || 0,
                  ce: p.ce ? parseFloat(p.ce) : null
                }
              })
            } catch (e) {
              console.log('Erro ao buscar pesagens:', e.message)
            }
          }

          // Agrupar por piquete (apenas piquetes válidos - igual ao app)
          const porPiquete = {}
          r.rows.forEach(row => {
            if (!ehPiqueteValido(row.piquete)) return // Ignorar piquetes inválidos para manter sync com app
            const piq = row.piquete.trim()
            if (!porPiquete[piq]) {
              porPiquete[piq] = {
                piquete: piq,
                total: 0,
                machos: 0,
                femeas: 0,
                pesos: [],
                animais: []
              }
            }
            porPiquete[piq].total++
            const sexo = (row.sexo || '').toLowerCase()
            const ehMacho = sexo.startsWith('m')
            if (ehMacho) porPiquete[piq].machos++
            else if (sexo.startsWith('f')) porPiquete[piq].femeas++
            
            const pesagem = pesagensMap[row.animal_id] || {}
            const peso = pesagem.peso || 0
            if (peso > 0) porPiquete[piq].pesos.push(peso)
            
            // Calcular idade em meses
            let idadeMeses = null
            if (row.data_nascimento) {
              const nascimento = new Date(row.data_nascimento)
              const hoje = new Date()
              const diffMs = hoje - nascimento
              const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
              idadeMeses = Math.floor(diffDias / 30.44)
            }
            
            porPiquete[piq].animais.push({
              animal_id: row.animal_id,
              animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.animal_nome,
              sexo: formatarSexo(row.sexo),
              raca: row.raca,
              peso: peso > 0 ? `${peso.toFixed(1)} kg` : '-',
              ce: (ehMacho && pesagem.ce) ? pesagem.ce.toFixed(1) : null,
              idade_meses: idadeMeses,
              pai: row.pai,
              avo_materno: row.avo_materno,
              iabcz: row.iabcz,
              deca: row.deca,
              iqg: row.iqg,
              pt_iqg: row.pt_iqg,
              data_entrada: toDateStr(row.data_entrada)
            })
          })

          // Calcular médias e montar resultado (excluir "Não informado")
          data = Object.keys(porPiquete)
            .filter(piq => !/^(não informado|nao informado|-|vazio)$/i.test(piq.trim()))
            .sort()
            .map(piq => {
              const info = porPiquete[piq]
              const mediaPeso = info.pesos.length > 0
                ? (info.pesos.reduce((a, b) => a + b, 0) / info.pesos.length).toFixed(1)
                : '-'
              
              return {
                piquete: piq,
                total_animais: info.total,
                machos: info.machos,
                femeas: info.femeas,
                media_peso: mediaPeso,
                animais: info.animais
              }
            })

          // Calcular resumo geral
          const totalAnimais = Object.values(porPiquete).reduce((sum, p) => sum + p.total, 0)
          const totalMachos = Object.values(porPiquete).reduce((sum, p) => sum + p.machos, 0)
          const totalFemeas = Object.values(porPiquete).reduce((sum, p) => sum + p.femeas, 0)
          const todosPesos = Object.values(porPiquete).flatMap(p => p.pesos)
          const mediaPesoGeral = todosPesos.length > 0
            ? (todosPesos.reduce((a, b) => a + b, 0) / todosPesos.length).toFixed(1)
            : '-'

          resumo = {
            'Total de animais': totalAnimais,
            'Total de machos': totalMachos,
            'Total de fêmeas': totalFemeas,
            'Piquetes ocupados': Object.keys(porPiquete).length,
            'Média de peso geral': mediaPesoGeral + (mediaPesoGeral !== '-' ? ' kg' : '')
          }
        } catch (e) {
          console.error('Erro em animais_piquetes:', e)
          data = []
        }
        break
      }

      case 'movimentacoes_financeiras': {
        try {
          const r = await query(`
            SELECT c.id, c.data, c.tipo, c.valor, c.descricao, a.serie, a.rg
            FROM custos c
            LEFT JOIN animais a ON a.id = c.animal_id
            WHERE c.data >= $1 AND c.data <= $2
            ORDER BY c.data DESC
            LIMIT 300
          `, [start, end])
          data = (r.rows || []).map(row => ({
            data: toDateStr(row.data),
            tipo: row.tipo,
            valor: row.valor,
            animal: row.serie && row.rg ? `${row.serie} ${row.rg}` : null,
            descricao: row.descricao
          }))
        } catch (e) {
          data = []
        }
        break
      }

      case 'ranking_animais_avaliados': {
        try {
          const condSerie = serieFiltro ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $1' : ''
          const paramsRankAval = serieFiltro ? [serieFiltro] : []
          const condExcluirDuplicado = `AND NOT (
            (a.iqg IS NOT NULL OR a.genetica_2 IS NOT NULL)
            AND TRIM(REPLACE(COALESCE(a.abczg,''), ',', '.')) = TRIM(REPLACE(COALESCE(a.iqg::text, a.genetica_2::text,''), ',', '.'))
          )`
          let r
          try {
            r = await query(`
              SELECT a.id, a.serie, a.rg, a.nome, a.abczg, a.deca, a.raca, a.sexo,
                COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete
              FROM animais a
              LEFT JOIN LATERAL (
                SELECT l2.piquete FROM localizacoes_animais l2
                WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
                ORDER BY l2.data_entrada DESC LIMIT 1
              ) l ON TRUE
              WHERE a.situacao = 'Ativo' AND a.abczg IS NOT NULL AND TRIM(a.abczg) != ''
              ${condExcluirDuplicado}
              ${condSerie}
              ORDER BY
                CASE
                  WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
                  THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
                  ELSE NULL
                END DESC NULLS LAST
              LIMIT 100
            `, paramsRankAval)
          } catch (colErrExcl) {
            if (/column.*does not exist/i.test(colErrExcl?.message || '')) {
              try {
                r = await query(`
                  SELECT a.id, a.serie, a.rg, a.nome, a.abczg, a.deca, a.raca, a.sexo,
                    COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete
                  FROM animais a
                  LEFT JOIN LATERAL (
                    SELECT l2.piquete FROM localizacoes_animais l2
                    WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
                    ORDER BY l2.data_entrada DESC LIMIT 1
                  ) l ON TRUE
                  WHERE a.situacao = 'Ativo' AND a.abczg IS NOT NULL AND TRIM(a.abczg) != '' ${condSerie}
                  ORDER BY
                    CASE
                      WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
                      THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
                      ELSE NULL
                    END DESC NULLS LAST
                  LIMIT 100
                `, paramsRankAval)
              } catch (colErr) {
                if (/column.*does not exist/i.test(colErr?.message || '')) {
                  r = await query(`
                    SELECT a.id, a.serie, a.rg, a.nome, a.abczg, a.deca, a.raca, a.sexo,
                      COALESCE(l.piquete, a.pasto_atual) as piquete
                    FROM animais a
                    LEFT JOIN LATERAL (
                      SELECT l2.piquete FROM localizacoes_animais l2
                      WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
                      ORDER BY l2.data_entrada DESC LIMIT 1
                    ) l ON TRUE
                    WHERE a.situacao = 'Ativo' AND a.abczg IS NOT NULL AND TRIM(a.abczg) != '' ${condSerie}
                    ORDER BY
                      CASE
                        WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
                        THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
                        ELSE NULL
                      END DESC NULLS LAST
                    LIMIT 100
                  `, paramsRankAval)
                } else throw colErr
              }
            } else throw colErrExcl
          }
          if (!r?.rows) r = { rows: [] }
          data = (r.rows || []).map((row, i) => ({
            posicao: i + 1,
            animal_id: row.id,
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.nome,
            iABCZ: row.abczg,
            deca: row.deca,
            raca: row.raca,
            sexo: formatarSexo(row.sexo),
            piquete: piqueteOuNaoInformado(row.piquete) || '-'
          }))
        } catch (e) {
          data = []
        }
        break
      }

      case 'ranking_pmgz': {
        try {
          const condSeriePmgz = serieFiltro ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $1' : ''
          const paramsPmgz = serieFiltro ? [serieFiltro] : []
          const condExcluirDuplicadoPmgz = `AND NOT (
            (a.iqg IS NOT NULL OR a.genetica_2 IS NOT NULL)
            AND TRIM(REPLACE(COALESCE(a.abczg,''), ',', '.')) = TRIM(REPLACE(COALESCE(a.iqg::text, a.genetica_2::text,''), ',', '.'))
          )`
          const sqlPiquete = `
            COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete
          `
          const joinLateral = `
            LEFT JOIN LATERAL (
              SELECT l2.piquete FROM localizacoes_animais l2
              WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
              ORDER BY l2.data_entrada DESC LIMIT 1
            ) l ON TRUE
          `
          let rankingIABCZ, rankingPeso, rankingCE, rankingGenetica2
          try {
            try {
              rankingIABCZ = await query(`
                SELECT a.id, a.serie, a.rg, a.nome, a.abczg, a.raca, a.sexo, ${sqlPiquete}
                FROM animais a ${joinLateral}
                WHERE a.situacao = 'Ativo' AND a.abczg IS NOT NULL AND TRIM(a.abczg) != ''
                ${condExcluirDuplicadoPmgz}
                ${condSeriePmgz}
                ORDER BY
                  CASE
                    WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
                    THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
                    ELSE NULL
                  END DESC NULLS LAST
                LIMIT 10
              `, paramsPmgz)
            } catch (exclErr) {
              if (/column.*does not exist/i.test(exclErr?.message || '')) {
                rankingIABCZ = await query(`
                  SELECT a.id, a.serie, a.rg, a.nome, a.abczg, a.raca, a.sexo, ${sqlPiquete}
                  FROM animais a ${joinLateral}
                  WHERE a.situacao = 'Ativo' AND a.abczg IS NOT NULL AND TRIM(a.abczg) != '' ${condSeriePmgz}
                  ORDER BY
                    CASE
                      WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
                      THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
                      ELSE NULL
                    END DESC NULLS LAST
                  LIMIT 10
                `, paramsPmgz)
              } else throw exclErr
            }
            rankingPeso = await query(`
              SELECT a.id, a.serie, a.rg, a.nome, a.peso, a.raca, a.sexo, ${sqlPiquete}
              FROM animais a ${joinLateral}
              WHERE a.situacao = 'Ativo' AND a.peso IS NOT NULL AND a.peso > 0 ${condSeriePmgz}
              ORDER BY a.peso DESC
              LIMIT 10
            `, paramsPmgz)
            rankingCE = await query(`
              SELECT a.id, a.serie, a.rg, a.nome, p.ce, a.raca, a.sexo, ${sqlPiquete}
              FROM animais a
              JOIN (
                SELECT DISTINCT ON (animal_id) animal_id, ce
                FROM pesagens
                WHERE ce IS NOT NULL AND ce > 0
                ORDER BY animal_id, data DESC
              ) p ON a.id = p.animal_id
              ${joinLateral}
              WHERE a.situacao = 'Ativo' AND (a.sexo ILIKE 'M%' OR a.sexo = 'M') ${condSeriePmgz}
              ORDER BY p.ce DESC
              LIMIT 10
            `, paramsPmgz)
            try {
              rankingGenetica2 = await query(`
                SELECT a.id, a.serie, a.rg, a.nome, a.iqg, a.pt_iqg, a.raca, a.sexo, ${sqlPiquete}
                FROM animais a ${joinLateral}
                WHERE a.situacao = 'Ativo' AND a.iqg IS NOT NULL AND TRIM(a.iqg::text) != '' ${condSeriePmgz}
                ORDER BY
                  CASE WHEN a.iqg::text ~ '^[0-9]+[.,]?[0-9]*$'
                  THEN (REPLACE(REPLACE(TRIM(a.iqg::text), ',', '.'), ' ', '')::numeric)
                  ELSE NULL END DESC NULLS LAST
                LIMIT 10
              `, paramsPmgz)
            } catch (iqgErr) {
              if (/column.*does not exist/i.test(iqgErr?.message || '')) {
                try {
                  rankingGenetica2 = await query(`
                    SELECT a.id, a.serie, a.rg, a.nome, a.genetica_2 as iqg, a.decile_2 as pt_iqg, a.raca, a.sexo, ${sqlPiquete}
                    FROM animais a ${joinLateral}
                    WHERE a.situacao = 'Ativo' AND a.genetica_2 IS NOT NULL AND TRIM(a.genetica_2::text) != '' ${condSeriePmgz}
                    ORDER BY CASE WHEN a.genetica_2::text ~ '^[0-9]+[.,]?[0-9]*$'
                    THEN (REPLACE(REPLACE(TRIM(a.genetica_2::text), ',', '.'), ' ', '')::numeric) ELSE NULL END DESC NULLS LAST
                    LIMIT 10
                  `, paramsPmgz)
                } catch (_) { rankingGenetica2 = { rows: [] } }
              } else { rankingGenetica2 = { rows: [] } }
            }
          } catch (colErr) {
            if (/column.*does not exist/i.test(colErr?.message || '')) {
              const sqlPiqueteAlt = `COALESCE(l.piquete, a.pasto_atual) as piquete`
              try {
                rankingIABCZ = await query(`
                  SELECT a.id, a.serie, a.rg, a.nome, a.abczg, a.raca, a.sexo, ${sqlPiqueteAlt}
                  FROM animais a ${joinLateral}
                  WHERE a.situacao = 'Ativo' AND a.abczg IS NOT NULL AND TRIM(a.abczg) != ''
                  ${condExcluirDuplicadoPmgz}
                  ${condSeriePmgz}
                  ORDER BY
                    CASE WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
                    THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
                    ELSE NULL END DESC NULLS LAST
                  LIMIT 10
                `, paramsPmgz)
              } catch (_) {
                rankingIABCZ = await query(`
                  SELECT a.id, a.serie, a.rg, a.nome, a.abczg, a.raca, a.sexo, ${sqlPiqueteAlt}
                  FROM animais a ${joinLateral}
                  WHERE a.situacao = 'Ativo' AND a.abczg IS NOT NULL AND TRIM(a.abczg) != '' ${condSeriePmgz}
                  ORDER BY
                    CASE WHEN a.abczg ~ '^[0-9]+[.,]?[0-9]*$'
                    THEN (REPLACE(REPLACE(TRIM(a.abczg), ',', '.'), ' ', '')::numeric)
                    ELSE NULL END DESC NULLS LAST
                  LIMIT 10
                `, paramsPmgz)
              }
              rankingPeso = await query(`
                SELECT a.id, a.serie, a.rg, a.nome, a.peso, a.raca, a.sexo, ${sqlPiqueteAlt}
                FROM animais a ${joinLateral}
                WHERE a.situacao = 'Ativo' AND a.peso IS NOT NULL AND a.peso > 0 ${condSeriePmgz}
                ORDER BY a.peso DESC LIMIT 10
              `, paramsPmgz)
              rankingCE = await query(`
                SELECT a.id, a.serie, a.rg, a.nome, p.ce, a.raca, a.sexo, ${sqlPiqueteAlt}
                FROM animais a
                JOIN (SELECT DISTINCT ON (animal_id) animal_id, ce FROM pesagens
                  WHERE ce IS NOT NULL AND ce > 0 ORDER BY animal_id, data DESC) p ON a.id = p.animal_id
                ${joinLateral}
                WHERE a.situacao = 'Ativo' AND (a.sexo ILIKE 'M%' OR a.sexo = 'M') ${condSeriePmgz}
                ORDER BY p.ce DESC LIMIT 10
              `, paramsPmgz)
              try {
                rankingGenetica2 = await query(`
                  SELECT a.id, a.serie, a.rg, a.nome, a.iqg, a.pt_iqg, a.raca, a.sexo, ${sqlPiqueteAlt}
                  FROM animais a ${joinLateral}
                  WHERE a.situacao = 'Ativo' AND a.iqg IS NOT NULL AND TRIM(a.iqg::text) != '' ${condSeriePmgz}
                  ORDER BY CASE WHEN a.iqg::text ~ '^[0-9]+[.,]?[0-9]*$'
                  THEN (REPLACE(REPLACE(TRIM(a.iqg::text), ',', '.'), ' ', '')::numeric) ELSE NULL END DESC NULLS LAST
                  LIMIT 10
                `, paramsPmgz)
              } catch (iqgErr2) {
                if (/column.*does not exist/i.test(iqgErr2?.message || '')) {
                  try {
                    rankingGenetica2 = await query(`
                      SELECT a.id, a.serie, a.rg, a.nome, a.genetica_2 as iqg, a.decile_2 as pt_iqg, a.raca, a.sexo, ${sqlPiqueteAlt}
                      FROM animais a ${joinLateral}
                      WHERE a.situacao = 'Ativo' AND a.genetica_2 IS NOT NULL AND TRIM(a.genetica_2::text) != '' ${condSeriePmgz}
                      ORDER BY CASE WHEN a.genetica_2::text ~ '^[0-9]+[.,]?[0-9]*$'
                      THEN (REPLACE(REPLACE(TRIM(a.genetica_2::text), ',', '.'), ' ', '')::numeric) ELSE NULL END DESC NULLS LAST
                      LIMIT 10
                    `, paramsPmgz)
                  } catch (_) { rankingGenetica2 = { rows: [] } }
                } else { rankingGenetica2 = { rows: [] } }
              }
            } else throw colErr
          }

          const genetica2Rows = (rankingGenetica2?.rows || []).map((row, i) => ({
            ranking: 'IQG',
            posicao: i + 1,
            animal_id: row.id,
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.nome,
            valor: row.iqg,
            raca: row.raca,
            sexo: formatarSexo(row.sexo),
            piquete: piqueteOuNaoInformado(row.piquete) || '-'
          }))

          // Ranking MGTe
          let rankingMGTe = { rows: [] }
          try {
            rankingMGTe = await query(`
              SELECT a.id, a.serie, a.rg, a.nome, a.mgte, a.top, a.raca, a.sexo, ${sqlPiquete}
              FROM animais a ${joinLateral}
              WHERE a.situacao = 'Ativo' AND a.mgte IS NOT NULL AND TRIM(a.mgte::text) != '' ${condSeriePmgz}
              ORDER BY
                CASE WHEN a.mgte::text ~ '^[0-9]+[.,]?[0-9]*$'
                THEN (REPLACE(REPLACE(TRIM(a.mgte::text), ',', '.'), ' ', '')::numeric)
                ELSE NULL END DESC NULLS LAST
              LIMIT 10
            `, paramsPmgz)
          } catch (mgteErr) {
            console.error('Erro ao buscar ranking MGTe:', mgteErr)
            rankingMGTe = { rows: [] }
          }

          const mgteRows = (rankingMGTe?.rows || []).map((row, i) => ({
            ranking: 'MGTe',
            posicao: i + 1,
            animal_id: row.id,
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.nome,
            valor: row.mgte,
            top: row.top,
            raca: row.raca,
            sexo: formatarSexo(row.sexo),
            piquete: piqueteOuNaoInformado(row.piquete) || '-'
          }))

          data = [
            { _resumo: true, tipo: 'iABCZ', titulo: 'Top 10 iABCZ', descricao: 'Quanto maior o iABCZ, melhor o animal' },
            ...rankingIABCZ.rows.map((row, i) => ({
              ranking: 'iABCZ',
              posicao: i + 1,
              animal_id: row.id,
              animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.nome,
              valor: row.abczg,
              raca: row.raca,
              sexo: formatarSexo(row.sexo),
              piquete: piqueteOuNaoInformado(row.piquete) || '-'
            })),
            { _resumo: true, tipo: 'peso', titulo: 'Top 10 Peso', descricao: 'Maiores pesos registrados' },
            ...rankingPeso.rows.map((row, i) => ({
              ranking: 'Peso',
              posicao: i + 1,
              animal_id: row.id,
              animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.nome,
              valor: `${row.peso} kg`,
              raca: row.raca,
              sexo: formatarSexo(row.sexo),
              piquete: piqueteOuNaoInformado(row.piquete) || '-'
            })),
            { _resumo: true, tipo: 'ce', titulo: 'Top 10 CE', descricao: 'Maiores circunferências escrotais (machos)' },
            ...rankingCE.rows.map((row, i) => ({
              ranking: 'CE',
              posicao: i + 1,
              animal_id: row.id,
              animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.nome,
              valor: `${row.ce} cm`,
              raca: row.raca,
              sexo: formatarSexo(row.sexo),
              piquete: piqueteOuNaoInformado(row.piquete) || '-'
            })),
            ...(genetica2Rows.length > 0 ? [
              { _resumo: true, tipo: 'genetica2', titulo: 'Top 10 IQG', descricao: 'Maior valor = melhor animal' },
              ...genetica2Rows
            ] : []),
            ...(mgteRows.length > 0 ? [
              { _resumo: true, tipo: 'mgte', titulo: 'Top 10 MGTe', descricao: 'Quanto maior o MGTe, melhor o animal' },
              ...mgteRows
            ] : [])
          ]
        } catch (e) {
          console.error('Erro ao buscar ranking PMGZ:', e)
          data = []
        }
        break
      }

      case 'ranking_mgte': {
        try {
          const condSerie = serieFiltro ? 'AND UPPER(TRIM(COALESCE(a.serie, \'\'))) = $1' : ''
          const params = serieFiltro ? [serieFiltro] : []
          
          const r = await query(`
            SELECT a.id, a.serie, a.rg, a.nome, a.mgte, a.top, a.raca, a.sexo,
              COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) as piquete
            FROM animais a
            LEFT JOIN LATERAL (
              SELECT l2.piquete FROM localizacoes_animais l2
              WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
              ORDER BY l2.data_entrada DESC LIMIT 1
            ) l ON TRUE
            WHERE a.situacao = 'Ativo' 
              AND a.mgte IS NOT NULL 
              AND TRIM(a.mgte::text) != ''
              ${condSerie}
            ORDER BY 
              CASE 
                WHEN a.mgte::text ~ '^[0-9]+[.,]?[0-9]*$'
                THEN (REPLACE(REPLACE(TRIM(a.mgte::text), ',', '.'), ' ', '')::numeric)
                ELSE NULL
              END DESC NULLS LAST,
              a.rg DESC
            LIMIT 100
          `, params)

          data = (r.rows || []).map((row, i) => ({
            posicao: i + 1,
            animal_id: row.id,
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.nome,
            mgte: row.mgte,
            top: row.top,
            raca: row.raca,
            sexo: formatarSexo(row.sexo),
            piquete: piqueteOuNaoInformado(row.piquete) || '-'
          }))
        } catch (e) {
          console.error('Erro ao buscar ranking MGTe exclusivo:', e)
          data = []
        }
        break
      }

      case 'coleta_fiv': {
        try {
          const r = await query(`
            SELECT cf.id, cf.data_fiv, cf.data_transferencia, cf.doadora_nome, cf.quantidade_oocitos, cf.touro, cf.laboratorio, cf.veterinario, cf.observacoes
            FROM coleta_fiv cf
            WHERE cf.data_fiv >= $1 AND cf.data_fiv <= $2
            ORDER BY cf.data_fiv DESC
            LIMIT 500
          `, [start, end])
          data = (r.rows || []).map(row => ({
            data: toDateStr(row.data_fiv),
            doadora: row.doadora_nome,
            oocitos: row.quantidade_oocitos,
            touro: row.touro,
            data_transferencia: toDateStr(row.data_transferencia),
            laboratorio: row.laboratorio
          }))
          const totalOocitos = data.reduce((s, d) => s + (parseInt(d.oocitos) || 0), 0)
          resumo = { 'Total de coletas': data.length, 'Total de oócitos': totalOocitos }
        } catch (e) {
          data = []
        }
        break
      }

      case 'receptoras_chegaram': {
        try {
          const colCheck = await query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'notas_fiscais' AND column_name IN ('eh_receptoras', 'data_chegada_animais', 'data_compra')
          `)
          const temEhReceptoras = colCheck.rows?.some(r => r.column_name === 'eh_receptoras')
          const dataCol = colCheck.rows?.some(r => r.column_name === 'data_chegada_animais') ? 'COALESCE(nf.data_chegada_animais, nf.data_compra)' : 'nf.data_compra'
          if (temEhReceptoras) {
            const r = await query(`
              SELECT nf.id, nf.numero_nf, nf.fornecedor, nf.quantidade_receptoras, ${dataCol}::date as data_chegada
              FROM notas_fiscais nf
              WHERE nf.eh_receptoras = true AND nf.tipo = 'entrada'
                AND ${dataCol}::date >= $1 AND ${dataCol}::date <= $2
              ORDER BY ${dataCol} DESC
              LIMIT 100
            `, [start, end])
            data = (r.rows || []).map(row => ({
              nf: row.numero_nf,
              fornecedor: row.fornecedor,
              quantidade: row.quantidade_receptoras,
              data: toDateStr(row.data_chegada)
            }))
            resumo = { 'NFs de receptoras': data.length, 'Total receptoras': data.reduce((s, d) => s + (parseInt(d.quantidade) || 0), 0) }
          } else {
            data = []
            resumo = { info: 'Tabela notas_fiscais sem coluna eh_receptoras' }
          }
        } catch (e) {
          data = []
        }
        break
      }

      case 'receptoras_faltam_parir': {
        try {
          const r = await query(`
            WITH gestacoes_ativas AS (
              SELECT g.id, g.receptora_nome, g.receptora_serie, g.receptora_rg, g.data_cobertura, g.situacao
              FROM gestacoes g
              WHERE COALESCE(g.situacao, 'Ativa') NOT IN ('Nasceu', 'Nascido', 'Cancelada', 'Cancelado', 'Perdeu', 'Aborto')
            )
            SELECT ga.*, (ga.data_cobertura::date + INTERVAL '285 days')::date as previsao_parto
            FROM gestacoes_ativas ga
            WHERE NOT EXISTS (SELECT 1 FROM nascimentos n WHERE n.gestacao_id = ga.id)
            ORDER BY ga.data_cobertura DESC
            LIMIT 500
          `)
          data = (r.rows || []).map(row => ({
            receptora: row.receptora_nome || `${row.receptora_serie || ''} ${row.receptora_rg || ''}`.trim(),
            data_cobertura: toDateStr(row.data_cobertura),
            previsao_parto: toDateStr(row.previsao_parto)
          }))
          resumo = { 'Receptoras aguardando parto': data.length }
        } catch (e) {
          data = []
        }
        break
      }

      case 'receptoras_faltam_diagnostico': {
        try {
          const colCheck = await query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'animais' AND column_name IN ('data_chegada', 'data_dg_prevista', 'resultado_dg', 'data_dg', 'categoria', 'raca')
          `)
          const cols = colCheck.rows?.map(r => r.column_name) || []
          const temDataChegada = cols.includes('data_chegada')
          const temDataDgPrevista = cols.includes('data_dg_prevista')
          const temResultadoDg = cols.includes('resultado_dg')
          const temCategoria = cols.includes('categoria')
          const temRaca = cols.includes('raca')
          if (temDataChegada || temDataDgPrevista) {
            const whereData = temDataDgPrevista
              ? `(a.data_dg_prevista >= $1 AND a.data_dg_prevista <= $2)`
              : `(a.data_chegada >= $1 AND a.data_chegada <= $2)`
            const whereReceptora = temCategoria
              ? `(a.categoria = 'Receptora' OR (${temRaca ? "a.raca ILIKE '%receptora%'" : 'false'}))`
              : (temRaca ? `a.raca ILIKE '%receptora%'` : '1=1')
            const whereDg = temResultadoDg
              ? `AND (a.resultado_dg IS NULL OR TRIM(COALESCE(a.resultado_dg,'')) = '' OR LOWER(a.resultado_dg) NOT IN ('prenha', 'p', 'positivo', 'vazia', 'vazio'))`
              : ''
            const r = await query(`
              SELECT a.id, a.serie, a.rg, a.nome, a.data_chegada, a.data_dg_prevista, a.data_dg, a.resultado_dg
              FROM animais a
              WHERE a.situacao = 'Ativo' AND ${whereReceptora} ${whereDg}
                AND ${whereData}
              ORDER BY a.data_chegada DESC NULLS LAST
              LIMIT 500
            `, [start, end])
            data = (r.rows || []).map(row => ({
              animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.nome,
              data_chegada: toDateStr(row.data_chegada),
              data_dg_prevista: toDateStr(row.data_dg_prevista),
              data_dg: toDateStr(row.data_dg)
            }))
            resumo = { 'Receptoras aguardando DG': data.length }
          } else {
            data = []
            resumo = { info: 'Colunas data_chegada/data_dg_prevista não encontradas' }
          }
        } catch (e) {
          data = []
        }
        break
      }

      case 'resumo_nascimentos': {
        try {
          const r = await query(`
            SELECT
              COUNT(*) as total,
              COUNT(CASE WHEN LOWER(sexo) LIKE 'm%' OR sexo = 'M' THEN 1 END) as machos,
              COUNT(CASE WHEN LOWER(sexo) LIKE 'f%' OR sexo = 'F' THEN 1 END) as femeas,
              ROUND(AVG(peso::numeric), 2) as peso_medio
            FROM nascimentos
            WHERE data_nascimento >= $1 AND data_nascimento <= $2
          `, [start, end])
          const row = r.rows?.[0]
          resumo = {
            total: parseInt(row?.total || 0),
            machos: parseInt(row?.machos || 0),
            femeas: parseInt(row?.femeas || 0),
            peso_medio: row?.peso_medio ? `${parseFloat(row.peso_medio).toFixed(1)} kg` : '-'
          }
          data = [{ _resumo: resumo }]
        } catch (e) {
          data = []
        }
        break
      }

      case 'ocorrencias': {
        try {
          const r = await query(`
            SELECT h.id, h.animal_id, h.tipo, h.data, h.descricao, h.medicamento, h.dosagem,
                   a.serie, a.rg, a.nome as animal_nome
            FROM historia_ocorrencias h
            LEFT JOIN animais a ON a.id = h.animal_id
            WHERE h.data >= $1 AND h.data <= $2
            ORDER BY h.data DESC
            LIMIT 200
          `, [start, end])
          data = (r.rows || []).map(row => ({
            animal: `${row.serie || ''} ${row.rg || ''}`.trim() || row.animal_nome,
            data: toDateStr(row.data),
            tipo: row.tipo,
            medicamento: row.medicamento,
            descricao: row.descricao
          }))
        } catch (e) {
          data = []
        }
        break
      }

      case 'notas_fiscais': {
        try {
          const colCheck = await query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'notas_fiscais' AND column_name IN ('data_compra', 'data_saida')
          `)
          const temDataSaida = colCheck.rows?.some(r => r.column_name === 'data_saida')
          const dataCol = temDataSaida
            ? `COALESCE(CASE WHEN nf.tipo = 'saida' THEN nf.data_saida END, nf.data_compra)`
            : 'nf.data_compra'
          const r = await query(`
            SELECT nf.id, nf.numero_nf, nf.tipo, nf.fornecedor, nf.destino, nf.valor_total, nf.data_compra, nf.data_saida
            FROM notas_fiscais nf
            WHERE ${dataCol}::date >= $1 AND ${dataCol}::date <= $2
            ORDER BY ${dataCol} DESC
            LIMIT 200
          `, [start, end])
          data = (r.rows || []).map(row => ({
            nf: row.numero_nf,
            tipo: row.tipo,
            fornecedor: row.fornecedor || row.destino,
            valor: row.valor_total,
            data: toDateStr(row.tipo === 'saida' && row.data_saida ? row.data_saida : row.data_compra)
          }))
          const entradas = data.filter(d => d.tipo === 'entrada').length
          const saidas = data.filter(d => d.tipo === 'saida').length

          // Resumo de vendas para exibição no mobile (cartões)
          const vendasRes = await query(`
            WITH base AS (
              SELECT
                nf.id,
                COALESCE(NULLIF(TRIM(nf.destino), ''), NULLIF(TRIM(nf.fornecedor), ''), 'Não informado') AS cliente,
                COALESCE(CASE WHEN nf.tipo = 'saida' THEN nf.data_saida END, nf.data_compra)::date AS data_venda,
                COALESCE(nf.valor_total, 0)::numeric AS valor_total
              FROM notas_fiscais nf
              WHERE nf.tipo = 'saida'
                AND ${dataCol}::date >= $1
                AND ${dataCol}::date <= $2
            ),
            por_cliente AS (
              SELECT cliente, MAX(data_venda) AS ultima_compra
              FROM base
              GROUP BY cliente
            )
            SELECT
              COALESCE((SELECT SUM(valor_total) FROM base), 0) AS total_vendido,
              COALESCE((SELECT COUNT(*) FROM por_cliente), 0) AS clientes_total,
              COALESCE((SELECT COUNT(*) FROM por_cliente WHERE ultima_compra < (CURRENT_DATE - INTERVAL '180 days')), 0) AS clientes_atencao
          `, [start, end])

          let animaisRes = { rows: [{ animais: 0 }] }
          try {
            animaisRes = await query(`
              SELECT COALESCE(SUM(
                COALESCE(NULLIF(regexp_replace(COALESCE(nfi.dados_item->>'quantidade', ''), '[^0-9.-]', '', 'g'), '')::numeric, 0)
              ), 0) AS animais
              FROM notas_fiscais_itens nfi
              INNER JOIN notas_fiscais nf ON nf.id = nfi.nota_fiscal_id
              WHERE nf.tipo = 'saida'
                AND ${dataCol}::date >= $1
                AND ${dataCol}::date <= $2
            `, [start, end])
          } catch (_) {
            // Alguns ambientes podem não ter itens consolidados para NF.
            animaisRes = { rows: [{ animais: 0 }] }
          }

          const totalVendido = parseFloat(vendasRes.rows?.[0]?.total_vendido || 0)
          const clientesTotal = parseInt(vendasRes.rows?.[0]?.clientes_total || 0, 10)
          const clientesAtencao = parseInt(vendasRes.rows?.[0]?.clientes_atencao || 0, 10)
          const totalAnimais = Math.round(parseFloat(animaisRes.rows?.[0]?.animais || 0))

          resumo = {
            'Total Vendido': `R$ ${totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            'Animais': Number.isFinite(totalAnimais) ? totalAnimais : 0,
            'Clientes': clientesTotal,
            'Precisam atenção': clientesAtencao,
            'Entradas': entradas,
            'Saídas': saidas,
            'Total NFs': data.length
          }
        } catch (e) {
          data = []
        }
        break
      }

      case 'custos': {
        try {
          const r = await query(`
            SELECT c.id, c.data, c.tipo, c.valor, c.descricao, a.serie, a.rg
            FROM custos c
            LEFT JOIN animais a ON a.id = c.animal_id
            WHERE c.data >= $1 AND c.data <= $2
            ORDER BY c.data DESC
            LIMIT 300
          `, [start, end])
          data = (r.rows || []).map(row => ({
            data: toDateStr(row.data),
            tipo: row.tipo,
            valor: row.valor,
            animal: row.serie && row.rg ? `${row.serie} ${row.rg}` : null,
            descricao: row.descricao
          }))
          const total = data.reduce((s, d) => s + (parseFloat(d.valor) || 0), 0)
          resumo = { 'Total de custos': data.length, 'Valor total': `R$ ${total.toFixed(2)}` }
        } catch (e) {
          data = []
        }
        break
      }

      case 'boletim_rebanho': {
        try {
          // Usa dados do boletim_campo (mesma fonte do Boletim Campo) para consistência
          const r = await query(`
            SELECT
              COALESCE(NULLIF(TRIM(raca), ''), 'Não informado') as raca,
              sexo,
              COALESCE(NULLIF(TRIM(era), ''), '-') as era,
              SUM(COALESCE(quant::int, 0)) as total
            FROM boletim_campo
            GROUP BY COALESCE(NULLIF(TRIM(raca), ''), 'Não informado'), sexo, COALESCE(NULLIF(TRIM(era), ''), '-')
            HAVING SUM(COALESCE(quant::int, 0)) > 0
            ORDER BY raca, sexo, era
          `)
          data = (r.rows || []).map(row => ({
            raca: row.raca || 'Não informado',
            sexo: formatarSexo(row.sexo),
            era: row.era || '-',
            total: parseInt(row.total || 0)
          }))
          const totalAnimais = data.reduce((s, d) => s + (d.total || 0), 0)
          const racasUnicas = [...new Set(data.map(d => d.raca))]
          resumo = { 'Total de animais': totalAnimais, 'Raças': racasUnicas.length }
          data.push({ raca: 'TOTAL GERAL', sexo: '-', era: '-', total: totalAnimais })
        } catch (e) {
          data = []
        }
        break
      }

      case 'boletim_defesa': {
        try {
          const r = await query(`
            SELECT id, nome, cnpj, quantidades
            FROM boletim_defesa_fazendas
            ORDER BY nome
          `)
          data = (r.rows || []).map(row => {
            const q = row.quantidades || {}
            const faixas = ['0a3', '3a8', '8a12', '12a24', '25a36', 'acima36']
            let total = 0
            faixas.forEach(f => {
              total += (q[f]?.M || 0) + (q[f]?.F || 0)
            })
            return {
              fazenda: row.nome,
              cnpj: row.cnpj,
              total,
              quantidades: q
            }
          })
          const totalGeral = data.reduce((s, d) => s + (d.total || 0), 0)
          resumo = { 'Fazendas': data.length, 'Total geral': totalGeral }
          data.push({ fazenda: 'TOTAL GERAL', cnpj: '-', total: totalGeral })
        } catch (e) {
          data = []
        }
        break
      }

      case 'boletim_campo': {
        try {
          const r = await query(`
            SELECT id, local, local_1, sub_local_2, quant, sexo, categoria, raca, era, observacao
            FROM boletim_campo
            ORDER BY local, local_1, sub_local_2
          `)
          data = (r.rows || []).map(row => ({
            id: row.id,
            local: row.local,
            local_1: row.local_1 || '-',
            sub_local_2: row.sub_local_2 || '-',
            quant: parseInt(row.quant) || 0,
            sexo: row.sexo || '-',
            categoria: row.categoria || '-',
            raca: row.raca || '-',
            era: row.era || '-',
            observacao: row.observacao || '-'
          }))
          const totalGeral = data.reduce((s, d) => s + (d.quant || 0), 0)
          resumo = { 'Registros': data.length, 'Total geral': totalGeral }
          data.push({ local: 'TOTAL GERAL', local_1: 'TOTAL GERAL', sub_local_2: 'TOTAL GERAL', quant: totalGeral, sexo: '-', categoria: '-', raca: '-', era: '-', observacao: '-' })
        } catch (e) {
          data = []
        }
        break
      }

      default:
        return sendError(res, 'Tipo de relatório não implementado para mobile', 400)
    }

    return sendSuccess(res, {
      tipo,
      periodo: { startDate: start, endDate: end },
      data,
      resumo,
      total: data.filter(d => !d._resumo).length
    })
  } catch (err) {
    console.error('Erro mobile-reports:', err)
    return sendError(res, err.message || 'Erro ao buscar relatório', 500)
  }
}
