// Sistema de Gestão de Custos Individuais por Animal - Refatorado para PostgreSQL
class CostManager {
  constructor() {
    this.protocolos = this.initializeProtocolos()
    this.medicamentos = this.initializeMedicamentos()
    this.custosPorAnimal = new Map()
    this.useLocalStorage = false
    this.dbChecked = false
    
    // Não verificar conexão no constructor para evitar problemas no build
    // A verificação será feita na primeira chamada de método que precisar do banco
  }

  // Verificar conexão com banco de dados (lazy loading)
  async checkDatabaseConnection() {
    if (this.dbChecked) return
    
    // Só verificar se estiver no browser
    if (typeof window === 'undefined') {
      this.dbChecked = true
      return
    }
    
    try {
      const response = await fetch('/api/database/test')
      const result = await response.json()
      
      if (result.connected) {
        console.log('✅ CostManager: Conexão com PostgreSQL OK')
        this.useLocalStorage = false
      } else {
        throw new Error('Database not connected')
      }
    } catch (error) {
      console.error('❌ CostManager: Erro na conexão PostgreSQL:', error)
      // Fallback desativado - garantir que o erro seja visível mas não use localStorage para escrita
      this.useLocalStorage = false 
      console.error('⚠️ CostManager: Sistema operando sem persistência local para garantir integridade do PostgreSQL')
    } finally {
      this.dbChecked = true
    }
  }

  // Protocolos baseados na planilha fornecida
  initializeProtocolos() {
    return {
      machos: {
        '0/7': {
          nome: 'ERA 0/7 - MACHOS',
          medicamentos: [
            { nome: 'PANACOXX', quantidade: 7, unidade: 'ML' },
            { nome: 'BOVILIS', quantidade: 5, unidade: 'ML' },
            { nome: 'SUPLENUT', quantidade: 1, unidade: 'ML' },
            { nome: 'IODO 10%', quantidade: 10, unidade: 'ML' },
            { nome: 'DNA VIRGEM', condicional: 'FIV_OU_RECEPTORA' },
            { nome: 'DNA GENOMICA', condicional: 'TODOS_0_7' }
          ]
        },
        '7/15': {
          nome: 'ERA 7/15 - MACHOS',
          medicamentos: [
            { nome: 'RGNiveloir', quantidade: 1, unidade: 'DOSE' },
            { nome: 'BOVILUS', quantidade: 10, unidade: 'ML' },
            { nome: 'IVOMEC GOLD', quantidade: 4, unidade: 'ML' },
            { nome: 'RAIVACEL', quantidade: 4, unidade: 'ML' }
          ]
        },
        '15/18': {
          nome: 'ERA 15/18 - MACHOS',
          medicamentos: [
            { nome: 'CONTROLE ABCZ', quantidade: 1, unidade: 'DOSE' },
            { nome: 'RGNiveloir', quantidade: 1, unidade: 'DOSE' },
            { nome: 'BOVILUS', quantidade: 5, unidade: 'ML' },
            { nome: 'MLTREO', quantidade: 5, unidade: 'ML' }
          ]
        },
        '18/22': {
          nome: 'ERA 18/22 - MACHOS',
          medicamentos: [
            { nome: 'CASQUEAR', quantidade: 1, unidade: 'APLICACAO' }
          ]
        },
        '22_acima': {
          nome: '22 ACIMA - MACHOS',
          medicamentos: [
            { nome: 'RACAO', quantidade: 1, unidade: 'KG_DIA' }
          ]
        },
        '25/36': {
          nome: 'ERA 25/36 - MACHOS',
          medicamentos: [
            { nome: 'RACAO', quantidade: 1, unidade: 'KG_DIA' }
          ]
        },
        'acima_36': {
          nome: 'ERA ACIMA 36 - MACHOS',
          medicamentos: [
            { nome: 'RACAO', quantidade: 1, unidade: 'KG_DIA' }
          ]
        }
      },
      femeas: {
        '0/7': {
          nome: 'ERA 0/7 - FÊMEAS',
          medicamentos: [
            { nome: 'PANACOXX', quantidade: 7, unidade: 'ML' },
            { nome: 'BOVILIS', quantidade: 5, unidade: 'ML' },
            { nome: 'SUPLENUT', quantidade: 1, unidade: 'ML' },
            { nome: 'IODO 10%', quantidade: 10, unidade: 'ML' },
            { nome: 'VACINA BRUCELOSE', quantidade: 1, unidade: 'DOSE' },
            { nome: 'DNA VIRGEM', condicional: 'FIV_OU_RECEPTORA' },
            { nome: 'DNA GENOMICA', condicional: 'TODOS_0_7' }
          ]
        },
        '7/12': {
          nome: 'ERA 7/12 - FÊMEAS',
          medicamentos: [
            { nome: 'CONTROLE ABCZ', quantidade: 1, unidade: 'DOSE' },
            { nome: 'RGNiveloir', quantidade: 1, unidade: 'DOSE' },
            { nome: 'BOVILUS', quantidade: 10, unidade: 'ML' },
            { nome: 'IVOMEC GOLD', quantidade: 4, unidade: 'ML' },
            { nome: 'RAIVACEL', quantidade: 4, unidade: 'ML' }
          ]
        },
        '12/18': {
          nome: 'ERA 12/18 - FÊMEAS',
          medicamentos: [
            { nome: 'CONTROLE ABCZ', quantidade: 1, unidade: 'DOSE' },
            { nome: 'RGNiveloir', quantidade: 1, unidade: 'DOSE' },
            { nome: 'BOVILUS', quantidade: 5, unidade: 'ML' },
            { nome: 'MLTREO', quantidade: 5, unidade: 'ML' }
          ]
        },
        '18/24': {
          nome: 'ERA 18/24 - FÊMEAS',
          medicamentos: [
            { nome: 'CASQUEAR', quantidade: 1, unidade: 'APLICACAO' },
            { nome: 'INSEMINACAO', quantidade: 1, unidade: 'PROCEDIMENTO' }
          ]
        },
        '24_acima': {
          nome: '24 ACIMA - FÊMEAS',
          medicamentos: [
            { nome: 'RACAO', quantidade: 1, unidade: 'KG_DIA' }
          ]
        },
        '25/36': {
          nome: 'ERA 25/36 - FÊMEAS',
          medicamentos: [
            { nome: 'RACAO', quantidade: 1, unidade: 'KG_DIA' }
          ]
        },
        'acima_36': {
          nome: 'ERA ACIMA 36 - FÊMEAS',
          medicamentos: [
            { nome: 'RACAO', quantidade: 1, unidade: 'KG_DIA' }
          ]
        }
      }
    }
  }

  // Medicamentos com preços baseados na planilha
  initializeMedicamentos() {
    return {
      'TREO ACE': { preco: 470.00, unidade: 'FRASCO_500ML', porAnimal: 5.64 },
      'PANACOXX': { preco: 1300.00, unidade: 'FRASCO', porAnimal: 9.10 },
      'VACINA BOVILIS': { preco: 99.30, unidade: '50_DOSES', porAnimal: 0.61 },
      'SUPLENUT': { preco: 305.00, unidade: 'FRASCO', porAnimal: 1.67 },
      'TINTURA IODO': { preco: 166.94, unidade: 'LITRO', porAnimal: 2.39 },
      'IVOMEC GOLD': { preco: 597.00, unidade: 'LITRO', porAnimal: 0.96 },
      'VACINA RAIVACEL': { preco: 12.00, unidade: '50ML_250_DOSES', porAnimal: 2.70 },
      'VACINA ABORVAC': { preco: 41.50, unidade: 'FRASCO', porAnimal: 6.00 },
      'BRINCO AMARELO': { preco: 2.70, unidade: 'UNIDADE', porAnimal: 2.70 },
      'BOTTON': { preco: 6.00, unidade: 'UNIDADE', porAnimal: 6.00 },
      'DNA VIRGEM': { preco: 50.00, unidade: 'EXAME', porAnimal: 50.00 },
      'DNA GENOMICA': { preco: 80.00, unidade: 'EXAME', porAnimal: 80.00 },
      'CONTROLE ABCZ': { preco: 15.00, unidade: 'PROCEDIMENTO', porAnimal: 15.00 },
      'RGNiveloir': { preco: 25.00, unidade: 'DOSE', porAnimal: 25.00 },
      'BOVILUS': { preco: 99.30, unidade: '50_DOSES', porAnimal: 1.99 },
      'IVOMEC GOLD': { preco: 597.00, unidade: 'LITRO', porAnimal: 2.39 },
      'RAIVACEL': { preco: 12.00, unidade: '50ML_250_DOSES', porAnimal: 0.048 },
      'MLTREO': { preco: 166.94, unidade: 'LITRO', porAnimal: 0.83 },
      'CASQUEAR': { preco: 10.00, unidade: 'PROCEDIMENTO', porAnimal: 10.00 },
      'INSEMINACAO': { preco: 50.00, unidade: 'PROCEDIMENTO', porAnimal: 50.00 },
      'RACAO': { preco: 2.50, unidade: 'KG', porAnimal: 2.50 },
      'VACINA BRUCELOSE': { preco: 5.00, unidade: 'DOSE', porAnimal: 5.00 }
    }
  }

  // Carregar dados do localStorage
  loadFromStorage() {
    if (typeof window === 'undefined') return
    
    try {
      const savedCosts = localStorage.getItem('animalCosts')
      if (savedCosts) {
        const costsData = JSON.parse(savedCosts)
        this.custosPorAnimal = new Map(costsData)
      }
    } catch (error) {
      console.warn('Erro ao carregar custos:', error)
    }
  }

  // Salvar dados no localStorage
  saveToStorage() {
    if (typeof window === 'undefined') return
    
    try {
      const costsArray = Array.from(this.custosPorAnimal.entries())
      localStorage.setItem('animalCosts', JSON.stringify(costsArray))
    } catch (error) {
      console.warn('Erro ao salvar custos:', error)
    }
  }

  // Determinar era do animal baseado na idade em meses e sexo
  determinarEra(idadeMeses, sexo) {
    if (!idadeMeses || idadeMeses <= 0) return 'Não informado'
    
    const isFemea = sexo && (sexo.toLowerCase().includes('fêmea') || sexo.toLowerCase().includes('femea') || sexo === 'F' || sexo === 'Fêmea')
    const isMacho = sexo && (sexo.toLowerCase().includes('macho') || sexo === 'M' || sexo === 'Macho')
    
    if (isFemea) {
      // FÊMEA: 0-7 / 7-12 / 12-18 / 18-24 / 24+
      if (idadeMeses <= 7) return '0/7'
      if (idadeMeses <= 12) return '7/12'
      if (idadeMeses <= 18) return '12/18'
      if (idadeMeses <= 24) return '18/24'
      return '24+'
    } else if (isMacho) {
      // MACHO: 0-7 / 7-15 / 15-18 / 18-22 / 22+
      if (idadeMeses <= 7) return '0/7'
      if (idadeMeses <= 15) return '7/15'
      if (idadeMeses <= 18) return '15/18'
      if (idadeMeses <= 22) return '18/22'
      return '22+'
    }
    
    // Se não tem sexo definido, usar padrão
    if (idadeMeses <= 7) return '0/7'
    if (idadeMeses <= 12) return '7/12'
    if (idadeMeses <= 18) return '12/18'
    if (idadeMeses <= 24) return '18/24'
    return '24+'
  }

  // Calcular custos do protocolo para um animal
  calcularCustosProtocolo(animal) {
    const era = this.determinarEra(animal.meses, animal.sexo)
    const protocolo = this.protocolos[animal.sexo === 'M' ? 'machos' : 'femeas'][era]
    
    if (!protocolo) return { custos: [], total: 0 }

    const custos = []
    let total = 0

    protocolo.medicamentos.forEach(med => {
      // Verificar condições especiais
      if (med.condicional) {
        if (med.condicional === 'FIV' && !animal.isFiv) return
        if (med.condicional === 'FIV_OU_RECEPTORA' && !animal.isFiv && !animal.receptoraRg) return
        if (med.condicional === 'TODOS_0_7' && animal.meses > 7) return
      }

      const medicamento = this.medicamentos[med.nome]
      if (medicamento) {
        const custo = {
          medicamento: med.nome,
          quantidade: med.quantidade || 1,
          unidade: med.unidade,
          precoUnitario: medicamento.porAnimal,
          total: medicamento.porAnimal * (med.quantidade || 1)
        }
        custos.push(custo)
        total += custo.total
      }
    })

    return { protocolo: protocolo.nome, custos, total }
  }

  // Aplicar protocolo a um animal
  async aplicarProtocolo(animalId, animal, observacoes = '') {
    try {
      const resultado = this.calcularCustosProtocolo(animal)
      
      if (resultado.total > 0) {
        const custoProtocolo = {
          tipo: 'Protocolo Sanitário',
          subtipo: resultado.protocolo,
          valor: resultado.total,
          data: new Date().toISOString().split('T')[0],
          observacoes: observacoes || `Aplicação automática do protocolo ${resultado.protocolo}`,
          detalhes: resultado.custos
        }

        await this.saveCost(animalId, custoProtocolo)
        return resultado
      }

      return null
    } catch (error) {
      console.error('❌ Erro ao aplicar protocolo:', error)
      throw error
    }
  }

  // Adicionar custo (alias para saveCost)
  async adicionarCusto(animalId, custo) {
    return this.saveCost(animalId, custo)
  }

  // Salvar custos no banco de dados
  async saveCost(animalId, custo) {
    try {
      if (!this.useLocalStorage) {
        const response = await fetch(`/api/animals/${animalId}/custos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            animal_id: animalId,
            ...custo
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar custo no banco');
        }

        console.log('✅ Custo salvo no PostgreSQL para o animal:', animalId);
        return true;
      }
      
      throw new Error('PostgreSQL indisponível para salvar custos.');
    } catch (error) {
      console.error('❌ Erro ao salvar custo:', error);
      throw error;
    }
  }

  // Obter custos de um animal
  async getCustosAnimal(animalId) {
    try {
      if (!this.useLocalStorage) {
        const response = await fetch(`/api/animals/${animalId}/custos`)
        
        if (!response.ok) {
          throw new Error('Erro ao buscar custos')
        }
        
        const result = await response.json()
        return result.data || []
      }
      
      console.warn('⚠️ CostManager: PostgreSQL indisponível, tentando ler do localStorage (obsoleto)')
      return this.custosPorAnimal.get(animalId) || []
    } catch (error) {
      console.error('❌ Erro ao buscar custos:', error)
      return []
    }
  }

  // Calcular custo total de um animal
  async getCustoTotal(animalId) {
    try {
      const custos = await this.getCustosAnimal(animalId)
      return custos.reduce((total, custo) => total + (parseFloat(custo.valor || 0) || 0), 0)
    } catch (error) {
      console.error('❌ Erro ao calcular custo total:', error)
      return 0
    }
  }

  // Adicionar custo de DNA baseado nas regras
  async adicionarCustoDNA(animalId, animal) {
    try {
      const custos = []

      // DNA Virgem - para animais de FIV OU quando há receptora
      if (animal.isFiv || animal.receptoraRg) {
        const motivo = animal.receptoraRg ? 'Obrigatório quando há receptora' : 'Obrigatório para animais FIV'
        const dnaVirgem = {
          id: Date.now(),
          tipo: 'DNA',
          subtipo: 'DNA Virgem (Paternidade)',
          valor: this.medicamentos['DNA VIRGEM'].porAnimal,
          data: animal.dataNascimento || new Date().toISOString().split('T')[0],
          observacoes: `DNA Virgem - ${motivo} - Confirmação de paternidade`
        }
        custos.push(dnaVirgem)
      }

      // DNA Genômica - para todos os bezerros de 0 a 7 meses
      if (animal.meses <= 7) {
        const dnaGenomica = {
          id: Date.now() + 1,
          tipo: 'DNA',
          subtipo: 'DNA Genômica',
          valor: this.medicamentos['DNA GENOMICA'].porAnimal,
          data: animal.dataNascimento || new Date().toISOString().split('T')[0],
          observacoes: 'DNA Genômica para bezerros de 0 a 7 meses - Análise genética completa'
        }
        custos.push(dnaGenomica)
      }

      // Adicionar os custos
      for (const custo of custos) {
        await this.adicionarCusto(animalId, custo)
      }
      
      return custos
    } catch (error) {
      console.error('❌ Erro ao adicionar custo DNA:', error)
      throw error
    }
  }

  // Relatório de custos por animal
  async getRelatorioCustos(animalId) {
    try {
      const custos = await this.getCustosAnimal(animalId)
      const total = await this.getCustoTotal(animalId)

      const custosPorTipo = custos.reduce((acc, custo) => {
        if (!acc[custo.tipo]) {
          acc[custo.tipo] = { total: 0, itens: [] }
        }
        acc[custo.tipo].total += custo.valor
        acc[custo.tipo].itens.push(custo)
        return acc
      }, {})

      return {
        animalId,
        custos,
        custosPorTipo,
        total,
        quantidadeItens: custos.length
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de custos:', error)
      return {
        animalId,
        custos: [],
        custosPorTipo: {},
        total: 0,
        quantidadeItens: 0
      }
    }
  }

  // Relatório geral de custos
  async getRelatorioGeral() {
    try {
      if (!this.useLocalStorage) {
        // Usar PostgreSQL - buscar todos os custos
        const response = await fetch('/api/custos')
        
        if (!response.ok) {
          throw new Error('Erro ao buscar custos')
        }
        
        const result = await response.json()
        const todosOsCustos = result.data || []
        
        // Agrupar por animal
        const custosPorAnimal = {}
        todosOsCustos.forEach(custo => {
          if (!custosPorAnimal[custo.animal_id]) {
            custosPorAnimal[custo.animal_id] = []
          }
          custosPorAnimal[custo.animal_id].push(custo)
        })
        
        const relatorio = []
        let totalGeral = 0
        
        Object.entries(custosPorAnimal).forEach(([animalId, custos]) => {
          const totalAnimal = custos.reduce((sum, custo) => sum + (parseFloat(custo.valor) || 0), 0)
          totalGeral += totalAnimal
          
          relatorio.push({
            animalId: parseInt(animalId),
            custos,
            total: totalAnimal
          })
        })
        
        return {
          animaisComCustos: relatorio.length,
          totalGeral,
          custoPorAnimal: relatorio,
          mediaPorAnimal: relatorio.length > 0 ? totalGeral / relatorio.length : 0
        }
      }
      
      // Fallback para localStorage
      const todosOsCustos = []
      let totalGeral = 0

      this.custosPorAnimal.forEach((custos, animalId) => {
        const totalAnimal = custos.reduce((sum, custo) => sum + custo.valor, 0)
        totalGeral += totalAnimal
        
        todosOsCustos.push({
          animalId,
          custos,
          total: totalAnimal
        })
      })

      return {
        animaisComCustos: todosOsCustos.length,
        totalGeral,
        custoPorAnimal: todosOsCustos,
        mediaPorAnimal: todosOsCustos.length > 0 ? totalGeral / todosOsCustos.length : 0
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório geral:', error)
      return {
        animaisComCustos: 0,
        totalGeral: 0,
        custoPorAnimal: [],
        mediaPorAnimal: 0
      }
    }
  }

  // Simular custos futuros baseado na idade
  simularCustosFuturos(animal, mesesFuturos = 12) {
    const custosSimulados = []
    let custoTotal = 0

    for (let mes = animal.meses + 1; mes <= animal.meses + mesesFuturos; mes++) {
      const animalSimulado = { ...animal, meses: mes }
      const resultado = this.calcularCustosProtocolo(animalSimulado)
      
      if (resultado.total > 0) {
        custosSimulados.push({
          mes,
          protocolo: resultado.protocolo,
          custo: resultado.total,
          detalhes: resultado.custos
        })
        custoTotal += resultado.total
      }
    }

    return {
      custosSimulados,
      custoTotal,
      mesesSimulados: mesesFuturos
    }
  }

  // Exportar dados de custos
  exportarDados() {
    return {
      protocolos: this.protocolos,
      medicamentos: this.medicamentos,
      custosPorAnimal: Array.from(this.custosPorAnimal.entries()),
      relatorioGeral: this.getRelatorioGeral(),
      dataExportacao: new Date().toISOString()
    }
  }
}

// Instância singleton
const costManager = new CostManager()

export default costManager
export { CostManager }