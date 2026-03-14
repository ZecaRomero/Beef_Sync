import { query } from '../../lib/database'

export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'POST':
        await handlePost(req, res)
        break
      default:
        res.setHeader('Allow', ['POST'])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  } catch (error) {
    console.error('Erro na API de geração de notificações:', error)
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message })
  }
}

async function handlePost(req, res) {
  try {
    const { tipo } = req.body

    if (!tipo) {
      return res.status(400).json({ message: 'Tipo de notificação é obrigatório' })
    }

    let notificationsCreated = []

    switch (tipo) {
      case 'nascimentos':
        notificationsCreated = await generateBirthNotifications()
        break
      case 'estoque':
        notificationsCreated = await generateStockNotifications()
        break
      case 'gestacao':
        notificationsCreated = await generateGestationNotifications()
        break
      case 'saude':
        notificationsCreated = await generateHealthNotifications()
        break
      case 'financeiro':
        notificationsCreated = await generateFinancialNotifications()
        break
      case 'sistema':
        notificationsCreated = await generateSystemNotifications()
        break
      case 'nitrogenio':
        notificationsCreated = await generateNitrogenNotifications()
        break
      case 'andrologico':
      case 'reproducao':
        notificationsCreated = await generateAndrologicoNotifications()
        break
      case 'all':
        notificationsCreated = await generateAllNotifications()
        break
      default:
        return res.status(400).json({ message: 'Tipo de notificação inválido' })
    }

    res.status(200).json({ 
      message: `${notificationsCreated.length} notificações criadas`,
      notifications: notificationsCreated
    })
  } catch (error) {
    console.error('Erro ao gerar notificações:', error)
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message })
  }
}

// Gerar notificações de nascimentos
async function generateBirthNotifications() {
  const notifications = []
  
  try {
    // Buscar nascimentos recentes (últimos 7 dias)
    const recentBirths = await query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN data_nascimento >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recentes
      FROM animais 
      WHERE data_nascimento IS NOT NULL
    `)

    const { total, recentes } = recentBirths.rows[0]

    if (recentes > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'nascimento',
        'Novos Nascimentos',
        `${recentes} nascimento(s) registrado(s) nos últimos 7 dias`,
        'medium',
        JSON.stringify({ total_nascimentos: parseInt(total), nascimentos_recentes: parseInt(recentes) })
      ])
      
      notifications.push(result.rows[0])
    }

    // Verificar animais próximos ao parto (280-290 dias de gestação)
    const nearBirth = await query(`
      SELECT COUNT(*) as total
      FROM animais 
      WHERE situacao = 'gestante' 
      AND data_cobertura IS NOT NULL
      AND data_cobertura <= CURRENT_DATE - INTERVAL '280 days'
      AND data_cobertura >= CURRENT_DATE - INTERVAL '290 days'
    `)

    if (nearBirth.rows[0].total > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'nascimento',
        'Animais Próximos ao Parto',
        `${nearBirth.rows[0].total} animal(is) próximo(s) ao parto (280-290 dias)`,
        'high',
        JSON.stringify({ animais_proximos_parto: parseInt(nearBirth.rows[0].total) })
      ])
      
      notifications.push(result.rows[0])
    }

  } catch (error) {
    console.error('Erro ao gerar notificações de nascimento:', error)
  }

  return notifications
}

// Gerar notificações de estoque
async function generateStockNotifications() {
  const notifications = []
  
  try {
    // Verificar estoque de sêmen baixo
    const semenStock = await query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN quantidade <= 5 THEN 1 END) as baixo
      FROM semen_estoque 
      WHERE ativo = true
    `)

    if (semenStock.rows[0].baixo > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'estoque',
        'Estoque de Sêmen Baixo',
        `${semenStock.rows[0].baixo} tipo(s) de sêmen com estoque baixo (≤5 doses)`,
        'high',
        JSON.stringify({ tipos_baixo: parseInt(semenStock.rows[0].baixo) })
      ])
      
      notifications.push(result.rows[0])
    }

  } catch (error) {
    console.error('Erro ao gerar notificações de estoque:', error)
  }

  return notifications
}

// Gerar notificações de gestação
async function generateGestationNotifications() {
  const notifications = []
  
  try {
    // Verificar gestações atrasadas (mais de 300 dias)
    const delayedGestation = await query(`
      SELECT COUNT(*) as total
      FROM animais 
      WHERE situacao = 'gestante' 
      AND data_cobertura IS NOT NULL
      AND data_cobertura < CURRENT_DATE - INTERVAL '300 days'
    `)

    if (delayedGestation.rows[0].total > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'gestacao',
        'Gestações Atrasadas',
        `${delayedGestation.rows[0].total} animal(is) com gestação atrasada (>300 dias)`,
        'high',
        JSON.stringify({ gestacoes_atrasadas: parseInt(delayedGestation.rows[0].total) })
      ])
      
      notifications.push(result.rows[0])
    }

  } catch (error) {
    console.error('Erro ao gerar notificações de gestação:', error)
  }

  return notifications
}

// Gerar notificações de saúde
async function generateHealthNotifications() {
  const notifications = []
  
  try {
    // Verificar animais com problemas de saúde
    const healthIssues = await query(`
      SELECT COUNT(*) as total
      FROM animais 
      WHERE situacao IN ('doente', 'tratamento')
    `)

    if (healthIssues.rows[0].total > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'saude',
        'Animais com Problemas de Saúde',
        `${healthIssues.rows[0].total} animal(is) necessitam atenção médica`,
        'high',
        JSON.stringify({ animais_doentes: parseInt(healthIssues.rows[0].total) })
      ])
      
      notifications.push(result.rows[0])
    }

  } catch (error) {
    console.error('Erro ao gerar notificações de saúde:', error)
  }

  return notifications
}

// Gerar notificações financeiras
async function generateFinancialNotifications() {
  const notifications = []
  
  try {
    // Verificar custos acumulados
    const totalCosts = await query(`
      SELECT 
        COALESCE(SUM(custo_aquisicao), 0) as custo_aquisicao,
        COALESCE(SUM(custo_total), 0) as custo_total
      FROM animais
    `)

    const { custo_aquisicao, custo_total } = totalCosts.rows[0]
    const custo_manutencao = custo_total - custo_aquisicao

    if (custo_manutencao > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'financeiro',
        'Custos de Manutenção',
        `R$ ${custo_manutencao.toFixed(2)} em custos de manutenção acumulados`,
        'medium',
        JSON.stringify({ 
          custo_aquisicao: parseFloat(custo_aquisicao),
          custo_manutencao: parseFloat(custo_manutencao),
          custo_total: parseFloat(custo_total)
        })
      ])
      
      notifications.push(result.rows[0])
    }

  } catch (error) {
    console.error('Erro ao gerar notificações financeiras:', error)
  }

  return notifications
}

// Gerar notificações do sistema
async function generateSystemNotifications() {
  const notifications = []
  
  try {
    // Verificar dados não migrados do localStorage
    const hasLocalStorageData = typeof window !== 'undefined' && (
      localStorage.getItem('nfsReceptoras') ||
      localStorage.getItem('naturezasOperacao') ||
      localStorage.getItem('origensReceptoras')
    )

    if (hasLocalStorageData) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'sistema',
        'Dados Não Migrados',
        'Existem dados antigos no localStorage que precisam ser migrados para o banco',
        'medium',
        JSON.stringify({ migracao_pendente: true })
      ])
      
      notifications.push(result.rows[0])
    }

  } catch (error) {
    console.error('Erro ao gerar notificações do sistema:', error)
  }

  return notifications
}

// Gerar notificações de nitrogênio
async function generateNitrogenNotifications() {
  const notifications = []
  
  try {
    // Buscar abastecimentos que precisam de notificação (5 dias antes de 1 mês)
    const result = await query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        motorista,
        proximo_abastecimento
      FROM abastecimento_nitrogenio 
      WHERE 
        notificacao_enviada = false 
        AND (proximo_abastecimento - INTERVAL '5 days') <= CURRENT_DATE
      ORDER BY proximo_abastecimento ASC
    `)

    for (const abastecimento of result.rows) {
      const diasRestantes = Math.ceil(
        (new Date(abastecimento.proximo_abastecimento) - new Date()) / (1000 * 60 * 60 * 24)
      )

      // Criar notificação
      const notificationResult = await query(`
        INSERT INTO notificacoes 
        (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'nitrogenio',
        'Lembrete de Abastecimento de Nitrogênio',
        `É hora de abastecer o nitrogênio! Último abastecimento foi em ${new Date(abastecimento.data_abastecimento).toLocaleDateString('pt-BR')} com ${abastecimento.quantidade_litros}L pelo motorista ${abastecimento.motorista}. ${diasRestantes <= 0 ? 'Prazo vencido!' : `Restam ${diasRestantes} dias.`}`,
        diasRestantes <= 0 ? 'high' : 'medium',
        JSON.stringify({
          abastecimento_id: abastecimento.id,
          data_ultimo_abastecimento: abastecimento.data_abastecimento,
          quantidade_anterior: abastecimento.quantidade_litros,
          motorista_anterior: abastecimento.motorista,
          proximo_abastecimento: abastecimento.proximo_abastecimento,
          dias_restantes: diasRestantes
        })
      ])

      // Marcar como notificação enviada
      await query(`
        UPDATE abastecimento_nitrogenio 
        SET notificacao_enviada = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [abastecimento.id])

      notifications.push(notificationResult.rows[0])
    }

  } catch (error) {
    console.error('Erro ao gerar notificações de nitrogênio:', error)
  }

  return notifications
}

// Gerar notificações de exames andrológicos
async function generateAndrologicoNotifications() {
  const notifications = []
  
  try {
    // Verificar se a tabela existe
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'exames_andrologicos'
      )
    `)

    if (!tableExists.rows[0].exists) {
      console.log('Tabela exames_andrologicos não existe, pulando geração de notificações')
      return notifications
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Buscar exames que precisam ser refeitos (reagendados para inaptos)
    // Exames pendentes que estão próximos (3 dias) ou vencidos
    const examesParaRefazer = await query(`
      SELECT 
        id,
        touro,
        rg,
        data_exame,
        resultado,
        reagendado,
        exame_origem_id,
        observacoes
      FROM exames_andrologicos
      WHERE resultado = 'Pendente'
        AND reagendado = true
        AND status = 'Ativo'
        AND data_exame <= CURRENT_DATE + INTERVAL '3 days'
      ORDER BY data_exame ASC
    `)

    // Agrupar por status (vencido, hoje, próximos 3 dias)
    const examesVencidos = []
    const examesHoje = []
    const examesProximos = []

    for (const exame of examesParaRefazer.rows) {
      const dataExame = new Date(exame.data_exame)
      dataExame.setHours(0, 0, 0, 0)
      const diasRestantes = Math.ceil((dataExame - hoje) / (1000 * 60 * 60 * 24))

      if (diasRestantes < 0) {
        examesVencidos.push(exame)
      } else if (diasRestantes === 0) {
        examesHoje.push(exame)
      } else {
        examesProximos.push(exame)
      }
    }

    // Criar notificação para exames vencidos (alta prioridade)
    if (examesVencidos.length > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'andrologico',
        '⚠️ Exames Andrológicos Vencidos',
        `${examesVencidos.length} exame(s) de touro(s) inapto(s) que precisam ser refeitos estão vencidos!`,
        'high',
        JSON.stringify({
          exames_vencidos: examesVencidos.length,
          exames: examesVencidos.slice(0, 5).map(e => ({
            id: e.id,
            touro: e.touro,
            rg: e.rg,
            data_exame: e.data_exame
          }))
        })
      ])
      notifications.push(result.rows[0])
    }

    // Criar notificação para exames hoje (alta prioridade)
    if (examesHoje.length > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'andrologico',
        '⏰ Exames Andrológicos para Hoje',
        `${examesHoje.length} exame(s) de touro(s) inapto(s) devem ser refeitos HOJE!`,
        'high',
        JSON.stringify({
          exames_hoje: examesHoje.length,
          exames: examesHoje.slice(0, 5).map(e => ({
            id: e.id,
            touro: e.touro,
            rg: e.rg,
            data_exame: e.data_exame
          }))
        })
      ])
      notifications.push(result.rows[0])
    }

    // Criar notificação para exames próximos (média prioridade)
    if (examesProximos.length > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'andrologico',
        '📅 Lembretes de Exames Andrológicos',
        `${examesProximos.length} exame(s) de touro(s) inapto(s) devem ser refeitos nos próximos 3 dias`,
        'medium',
        JSON.stringify({
          exames_proximos: examesProximos.length,
          exames: examesProximos.slice(0, 5).map(e => ({
            id: e.id,
            touro: e.touro,
            rg: e.rg,
            data_exame: e.data_exame
          }))
        })
      ])
      notifications.push(result.rows[0])
    }

    // Verificar exames inaptos que ainda não têm reagendamento criado
    const examesInaptosSemReagendamento = await query(`
      SELECT COUNT(*) as total
      FROM exames_andrologicos e1
      WHERE e1.resultado = 'Inapto'
        AND e1.status = 'Ativo'
        AND NOT EXISTS (
          SELECT 1 
          FROM exames_andrologicos e2 
          WHERE e2.exame_origem_id = e1.id 
            AND e2.reagendado = true
        )
    `)

    if (parseInt(examesInaptosSemReagendamento.rows[0].total) > 0) {
      const result = await query(`
        INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'andrologico',
        '🔬 Exames Inaptos sem Reagendamento',
        `${examesInaptosSemReagendamento.rows[0].total} exame(s) com resultado "Inapto" ainda não têm reagendamento criado`,
        'medium',
        JSON.stringify({
          exames_sem_reagendamento: parseInt(examesInaptosSemReagendamento.rows[0].total)
        })
      ])
      notifications.push(result.rows[0])
    }

  } catch (error) {
    console.error('Erro ao gerar notificações de exames andrológicos:', error)
    // Não falhar completamente se a tabela não existir ou houver erro
  }

  return notifications
}

// Gerar todas as notificações
async function generateAllNotifications() {
  const allNotifications = []
  
  allNotifications.push(...await generateBirthNotifications())
  allNotifications.push(...await generateStockNotifications())
  allNotifications.push(...await generateGestationNotifications())
  allNotifications.push(...await generateHealthNotifications())
  allNotifications.push(...await generateFinancialNotifications())
  allNotifications.push(...await generateSystemNotifications())
  allNotifications.push(...await generateNitrogenNotifications())
  allNotifications.push(...await generateAndrologicoNotifications())

  return allNotifications
}
