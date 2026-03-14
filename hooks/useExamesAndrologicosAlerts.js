import { useState, useEffect } from 'react'

export function useExamesAndrologicosAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExamesAlerts()
  }, [])

  const loadExamesAlerts = async () => {
    try {
      const response = await fetch('/api/reproducao/exames-andrologicos')
      if (!response.ok) {
        setAlerts([])
        return
      }

      const exames = await response.json()
      const now = new Date()
      const alertsGenerated = []

      // Processar exames pendentes
      const examesPendentes = exames.filter(e => 
        e.resultado === 'Pendente' && 
        e.status === 'Ativo'
      )

      examesPendentes.forEach(exame => {
        const dataExame = new Date(exame.data_exame)
        const diasAteExame = Math.ceil((dataExame - now) / (1000 * 60 * 60 * 24))
        const isVencido = diasAteExame < 0

        if (isVencido) {
          // Exame vencido - prioridade alta
          alertsGenerated.push({
            id: `exame-vencido-${exame.id}`,
            type: 'exame-andrologico',
            priority: 'high',
            title: 'Exame Andrológico Vencido',
            message: `${exame.touro} (RG: ${exame.rg}) - ${Math.abs(diasAteExame)} dias de atraso`,
            animal: exame.touro,
            animalRg: exame.rg,
            exameId: exame.id,
            action: 'Realizar exame',
            icon: '🔬',
            color: 'red',
            createdAt: now.toISOString(),
            metadata: {
              dataExame: exame.data_exame,
              diasAtraso: Math.abs(diasAteExame),
              reagendado: exame.reagendado
            }
          })
        } else if (diasAteExame <= 7) {
          // Exame próximo - prioridade média
          alertsGenerated.push({
            id: `exame-proximo-${exame.id}`,
            type: 'exame-andrologico',
            priority: 'medium',
            title: 'Exame Andrológico Próximo',
            message: `${exame.touro} (RG: ${exame.rg}) - em ${diasAteExame} dias`,
            animal: exame.touro,
            animalRg: exame.rg,
            exameId: exame.id,
            action: 'Preparar exame',
            icon: '📅',
            color: 'yellow',
            createdAt: now.toISOString(),
            metadata: {
              dataExame: exame.data_exame,
              diasRestantes: diasAteExame,
              reagendado: exame.reagendado
            }
          })
        }
      })

      // Verificar animais que precisam de exame andrológico inicial
      try {
        const animalsResponse = await fetch('/api/animals')
        if (animalsResponse.ok) {
          const animals = await animalsResponse.json()
          const touros = animals.filter(a => 
            a.sexo === 'Macho' && 
            a.situacao === 'Ativo'
          )

          touros.forEach(touro => {
            const birthDate = new Date(touro.dataNascimento)
            const ageInMonths = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24 * 30))
            
            // Touros com mais de 24 meses precisam de exame
            if (ageInMonths >= 24) {
              const temExame = exames.some(e => 
                e.rg === touro.numero || 
                e.touro.toLowerCase().includes(touro.nome?.toLowerCase() || '')
              )

              if (!temExame) {
                alertsGenerated.push({
                  id: `exame-inicial-${touro.id}`,
                  type: 'exame-andrologico',
                  priority: 'medium',
                  title: 'Exame Andrológico Necessário',
                  message: `${touro.nome || touro.numero} precisa do primeiro exame andrológico`,
                  animal: touro.nome || touro.numero,
                  animalId: touro.id,
                  animalRg: touro.numero,
                  action: 'Agendar exame',
                  icon: '🔬',
                  color: 'blue',
                  createdAt: now.toISOString(),
                  metadata: {
                    idadeEmMeses: ageInMonths,
                    primeiroExame: true
                  }
                })
              }
            }
          })
        }
      } catch (error) {
        console.warn('Erro ao carregar animais para verificação de exames:', error)
      }

      setAlerts(alertsGenerated)
    } catch (error) {
      console.error('Erro ao carregar alertas de exames andrológicos:', error)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const getExamesVencidos = () => {
    return alerts.filter(a => a.priority === 'high' && a.type === 'exame-andrologico')
  }

  const getExamesProximos = () => {
    return alerts.filter(a => a.priority === 'medium' && a.type === 'exame-andrologico')
  }

  const getTotalExamesPendentes = () => {
    return alerts.filter(a => a.type === 'exame-andrologico').length
  }

  return {
    alerts,
    loading,
    examesVencidos: getExamesVencidos(),
    examesProximos: getExamesProximos(),
    totalPendentes: getTotalExamesPendentes(),
    refresh: loadExamesAlerts
  }
}