// Gerenciador centralizado de dados dos animais - Refatorado para usar API calls

class AnimalDataManager {
  constructor() {
    this.listeners = []
    this.useLocalStorage = false // SerÃ¡ definida apÃ³s teste de conexÃ£o
    
    // Verificar conexÃ£o com banco na inicializaÃ§Ã£o
    this.checkDatabaseConnection()
  }

  // Verificar conexÃ£o com banco de dados
  async checkDatabaseConnection() {
    try {
      // Verificar se estamos no lado do cliente (browser)
      if (typeof window === 'undefined') {
        // No servidor, desativamos localStorage e esperamos conexÃ£o do banco
        this.useLocalStorage = false
        return
      }

      const response = await fetch('/api/database/test')
      const result = await response.json()
      
      if (result.connected) {
        console.log('âÅ“â€¦ AnimalDataManager: ConexÃ£o com PostgreSQL OK')
        this.useLocalStorage = false
      } else {
        throw new Error('Database not connected')
      }
    } catch (error) {
      console.error('â�Å’ AnimalDataManager: Erro na conexÃ£o PostgreSQL:', error)
      // Fallback desativado para garantir que tudo seja salvo no banco
      this.useLocalStorage = false
      console.error('âÅ¡ ï¸� Sistema operando sem fallback para localStorage para garantir integridade no PostgreSQL')
    }
  }

  // Adicionar listener para mudanÃ§as nos dados
  addListener(callback) {
    this.listeners.push(callback)
  }

  // Remover listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback)
  }

  // Notificar todos os listeners sobre mudanÃ§as
  notifyListeners() {
    // Para PostgreSQL, vamos buscar os dados atualizados antes de notificar
    if (!this.useLocalStorage) {
      this.getAllAnimals().then(animals => {
        this.listeners.forEach(callback => callback(animals))
      })
    } else {
      const salvos = JSON.parse(localStorage.getItem('animalData') || '[]')
      this.listeners.forEach(callback => callback(salvos))
    }
  }

  // FunÃ§Ã£o auxiliar para mapear campos do frontend para o banco
  mapearCampoFrontendParaBanco(campoFrontend) {
    const mapeamentos = {
      'dataNascimento': 'data_nascimento',
      'horaNascimento': 'hora_nascimento',
      'tipoNascimento': 'tipo_nascimento',
      'dificuldadeParto': 'dificuldade_parto',
      'isFiv': 'is_fiv',
      'custoTotal': 'custo_total',
      'valorVenda': 'valor_venda',
      'valorReal': 'valor_real',
      'avoMaterno': 'avo_materno',
      'localNascimento': 'local_nascimento',
      'pastoAtual': 'pasto_atual',
      'situacaoAbcz': 'situacao_abcz'
    }
    return mapeamentos[campoFrontend] || campoFrontend
  }

  // FunÃ§Ã£o auxiliar para mapear campos do banco para o frontend
  mapearCampoBancoParaFrontend(campoBanco) {
    const mapeamentos = {
      'data_nascimento': 'dataNascimento',
      'hora_nascimento': 'horaNascimento',
      'tipo_nascimento': 'tipoNascimento',
      'dificuldade_parto': 'dificuldadeParto',
      'is_fiv': 'isFiv',
      'custo_total': 'custoTotal',
      'valor_venda': 'valorVenda',
      'valor_real': 'valorReal',
      'avo_materno': 'avoMaterno',
      'local_nascimento': 'localNascimento',
      'pasto_atual': 'pastoAtual',
      'situacao_abcz': 'situacaoAbcz',
      'created_at': 'createdAt',
      'updated_at': 'updatedAt'
    }
    return mapeamentos[campoBanco] || campoBanco
  }

  // Adicionar novo animal
  async addAnimal(novoAnimal) {
    try {
      // Se estiver usando PostgreSQL
      if (!this.useLocalStorage) {
        const response = await fetch('/api/animals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: novoAnimal.nome,
            serie: novoAnimal.serie,
            rg: novoAnimal.rg,
            tatuagem: novoAnimal.tatuagem,
            sexo: novoAnimal.sexo,
            raca: novoAnimal.raca,
            data_nascimento: novoAnimal.dataNascimento,
            hora_nascimento: novoAnimal.horaNascimento,
            peso: novoAnimal.peso,
            cor: novoAnimal.cor,
            tipo_nascimento: novoAnimal.tipoNascimento,
            dificuldade_parto: novoAnimal.dificuldadeParto,
            meses: novoAnimal.meses,
            situacao: novoAnimal.situacao || 'Ativo',
            pai: novoAnimal.pai,
            mae: novoAnimal.mae,
            avo_materno: novoAnimal.avoMaterno,
            receptora: novoAnimal.receptora,
            is_fiv: novoAnimal.isFiv || false,
            custo_total: novoAnimal.custoTotal || 0,
            valor_venda: novoAnimal.valorVenda,
            valor_real: novoAnimal.valorReal,
            veterinario: novoAnimal.veterinario,
            abczg: novoAnimal.abczg,
            deca: novoAnimal.deca,
            iqg: novoAnimal.iqg,
            pt_iqg: novoAnimal.pt_iqg,
            serie_pai: novoAnimal.paiSerie,
            rg_pai: novoAnimal.paiRg,
            serie_mae: novoAnimal.maeSerie,
            rg_mae: novoAnimal.maeRg,
            observacoes: novoAnimal.observacoes,
            boletim: novoAnimal.boletim,
            local_nascimento: novoAnimal.localNascimento,
            pasto_atual: novoAnimal.pastoAtual
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao criar animal')
        }
        
        const result = await response.json()
        const animalSalvo = result.data
        
        this.notifyListeners()
        return animalSalvo
      }
      
      // Fallback DESATIVADO - ForÃ§ar erro se banco nÃ£o disponÃ­vel
      throw new Error('Banco de dados PostgreSQL nÃ£o disponÃ­vel para salvar novo animal.')
    
    } catch (error) {
      console.error('â�Å’ Erro ao adicionar animal:', error)
      throw error
    }
  }

  // Atualizar animal existente
  async updateAnimal(id, dadosAtualizados) {
    try {
      if (!this.useLocalStorage) {
        const dadosParaAtualizar = {}
        
        // Lista de colunas vÃ¡lidas no banco de dados
        const validColumns = [
          'nome', 'serie', 'rg', 'tatuagem', 'sexo', 'raca', 
          'data_nascimento', 'hora_nascimento', 'peso', 'cor', 
          'tipo_nascimento', 'dificuldade_parto', 'meses', 'situacao', 
          'pai', 'mae', 'avo_materno', 'receptora', 'is_fiv', 
          'custo_total', 'valor_venda', 'valor_real', 'veterinario', 
          'abczg', 'deca', 'iqg', 'pt_iqg', 'situacao_abcz', 'observacoes', 'boletim', 'local_nascimento', 'pasto_atual', 'piquete_atual',
          'serie_pai', 'rg_pai', 'serie_mae', 'rg_mae'
        ]

        // Mapear campos do frontend para o banco
        Object.keys(dadosAtualizados).forEach(key => {
          const campoBanco = this.mapearCampoFrontendParaBanco(key)
          // Apenas incluir se for uma coluna vÃ¡lida
          if (campoBanco && validColumns.includes(campoBanco)) {
            let valor = dadosAtualizados[key]
            // Normalizar data vazia para null (evita erro no PostgreSQL DATE)
            if (campoBanco === 'data_nascimento' && (valor === '' || valor === undefined)) {
              valor = null
            }
            dadosParaAtualizar[campoBanco] = valor
          }
        })
        // Garantir que pasto_atual e piquete_atual fiquem sincronizados
        if (dadosParaAtualizar.pasto_atual !== undefined) {
          dadosParaAtualizar.piquete_atual = dadosParaAtualizar.pasto_atual
        }

        // Garantir envio explÃ­cito de campos que costumam falhar ao salvar
        const dataNasc = dadosAtualizados.dataNascimento ?? dadosAtualizados.data_nascimento
        const pasto = dadosAtualizados.pastoAtual ?? dadosAtualizados.pasto_atual
        const situacaoAbcz = dadosAtualizados.situacaoAbcz ?? dadosAtualizados.situacao_abcz
        if (dataNasc !== undefined && dataNasc !== null && dataNasc !== '') {
          dadosParaAtualizar.data_nascimento = String(dataNasc).substring(0, 10)
        }
        if (pasto !== undefined && pasto !== null && pasto !== '') {
          dadosParaAtualizar.pasto_atual = String(pasto).trim()
          dadosParaAtualizar.piquete_atual = dadosParaAtualizar.pasto_atual
        }
        if (situacaoAbcz !== undefined && situacaoAbcz !== null) {
          dadosParaAtualizar.situacao_abcz = String(situacaoAbcz).trim() || null
        }
        
        const response = await fetch(`/api/animals/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dadosParaAtualizar)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao atualizar animal')
        }
        
        const result = await response.json()
        const animalAtualizado = result.data
        
        this.notifyListeners()
        return animalAtualizado
      }
      
      // Fallback DESATIVADO
      throw new Error('Banco de dados PostgreSQL nÃ£o disponÃ­vel para atualizar animal.')
      
    } catch (error) {
      console.error('â�Å’ Erro ao atualizar animal:', error)
      throw error
    }
  }

  // Obter todos os animais
  async getAllAnimals(filtros = {}) {
    try {
      if (!this.useLocalStorage) {
        const queryParams = new URLSearchParams()
        if (filtros.situacao) queryParams.append('situacao', filtros.situacao)
        if (filtros.raca) queryParams.append('raca', filtros.raca)
        if (filtros.sexo) queryParams.append('sexo', filtros.sexo)
        
        const response = await fetch(`/api/animals?${queryParams.toString()}`)
        
        if (!response.ok) {
          throw new Error('Erro ao buscar animais')
        }
        
        const result = await response.json()
        return Array.isArray(result.data) ? result.data : []
      }
      
      // Fallback para localStorage (Apenas leitura como Ãºltima opÃ§Ã£o se configurado, mas preferencialmente falhar)
      console.warn('âÅ¡ ï¸� AnimalDataManager: PostgreSQL indisponÃ­vel, tentando ler do localStorage (obsoleto)')
      const salvos = JSON.parse(localStorage.getItem('animalData') || '[]')
      
      // Aplicar filtros bÃ¡sicos
      return salvos.filter(animal => {
        if (filtros.situacao && animal.situacao !== filtros.situacao) return false
        if (filtros.raca && animal.raca !== filtros.raca) return false
        if (filtros.sexo && animal.sexo !== filtros.sexo) return false
        return true
      })
      
    } catch (error) {
      console.error('â�Å’ Erro ao buscar animais:', error)
      return []
    }
  }

  // Obter animal por ID
  async getAnimalById(id) {
    try {
      if (!this.useLocalStorage) {
        const response = await fetch(`/api/animals/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error('Erro ao buscar animal')
        }
        
        const result = await response.json()
        const animal = result.data
        
        // Converter custos de JSONB para array normal
        if (animal && animal.custos) {
          animal.custos = Array.isArray(animal.custos) ? animal.custos : []
        }
        
        return animal
      }
      
      // Fallback para localStorage
      const salvos = JSON.parse(localStorage.getItem('animalData') || '[]')
      return salvos.find(a => a.id === id) || null
      
    } catch (error) {
      console.error('â�Å’ Erro ao buscar animal:', error)
      return null
    }
  }

  // Obter estatÃ­sticas atualizadas
  async getStatistics() {
    try {
      if (!this.useLocalStorage) {
        const response = await fetch('/api/statistics')
        
        if (!response.ok) {
          throw new Error('Erro ao buscar estatÃ­sticas')
        }
        
        const result = await response.json()
        return result.data
      }
      
      // Fallback para localStorage
      const salvos = JSON.parse(localStorage.getItem('animalData') || '[]')
      
      const totalAnimais = salvos.length
      const animaisAtivos = salvos.filter(a => a.situacao === 'Ativo').length
      const animaisVendidos = salvos.filter(a => a.situacao === 'Vendido').length
      const animaisMortos = salvos.filter(a => a.situacao === 'Morto').length
      
      const totalInvestido = salvos.reduce((acc, a) => acc + (a.custoTotal || 0), 0)
      const totalRecebido = salvos
      .filter(a => a.valorVenda)
      .reduce((acc, a) => acc + a.valorVenda, 0)
    
      const lucroTotal = salvos
      .filter(a => a.valorReal !== null)
      .reduce((acc, a) => acc + a.valorReal, 0)

    // EstatÃ­sticas por raÃ§a
      const animaisPorRaca = salvos.reduce((acc, animal) => {
      acc[animal.raca] = (acc[animal.raca] || 0) + 1
      return acc
    }, {})

    // EstatÃ­sticas por sexo
      const animaisPorSexo = salvos.reduce((acc, animal) => {
      acc[animal.sexo] = (acc[animal.sexo] || 0) + 1
      return acc
    }, {})

    // Animais FIV
      const animaisFIV = salvos.filter(a => a.isFiv).length
      const animaisNaturais = salvos.filter(a => !a.isFiv).length

    // Nascimentos por mÃªs (Ãºltimos 12 meses)
      const nascimentosPorMes = salvos
      .filter(a => a.dataNascimento)
      .reduce((acc, animal) => {
        const mes = new Date(animal.dataNascimento).toISOString().slice(0, 7) // YYYY-MM
        acc[mes] = (acc[mes] || 0) + 1
        return acc
      }, {})

    return {
      totalAnimais,
      animaisAtivos,
      animaisVendidos,
      animaisMortos,
      totalInvestido,
      totalRecebido,
      lucroTotal,
      animaisPorRaca,
      animaisPorSexo,
      animaisFIV,
      animaisNaturais,
      nascimentosPorMes,
      roiMedio: totalInvestido > 0 ? (lucroTotal / totalInvestido * 100) : 0
      }
      
    } catch (error) {
      console.error('â�Å’ Erro ao obter estatÃ­sticas:', error)
      return {
        totalAnimais: 0,
        animaisAtivos: 0,
        animaisVendidos: 0,
        animaisMortos: 0,
        totalInvestido: 0,
        totalRecebido: 0,
        lucroTotal: 0,
        animaisPorRaca: {},
        animaisPorSexo: {},
        animaisFIV: 0,
        animaisNaturais: 0,
        nascimentosPorMes: {},
        roiMedio: 0
      }
    }
  }

  // Obter raÃ§a pela sÃ©rie
  getRacaBySerie(serie) {
    const racasPorSerie = {
      'CJCJ': 'Nelore',
      'BENT': 'Brahman',
      'JDHF': 'Brahman',
      'CJCG': 'Gir',
      'RPT': 'Receptora',
      'PA': 'Nelore PA'
    }
    return racasPorSerie[serie] || 'Nelore'
  }

  // Calcular idade em meses
  calcularIdadeEmMeses(dataNascimento) {
    if (!dataNascimento) return 0
    
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    const diffTime = hoje - nascimento
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.floor(diffDays / 30) // AproximaÃ§Ã£o de meses
  }

  // Adicionar custo a um animal
  async addCustoToAnimal(animalId, novoCusto) {
    try {
      if (!this.useLocalStorage) {
        const response = await fetch(`/api/animals/${animalId}/custos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipo: novoCusto.tipo,
            subtipo: novoCusto.subtipo,
            valor: novoCusto.valor,
            data: novoCusto.data,
            observacoes: novoCusto.observacoes,
            detalhes: novoCusto.detalhes
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao adicionar custo')
        }
        
        const result = await response.json()
        return result.data
      }
      
      // Fallsback para localStorage
      const animal = await this.getAnimalById(animalId)
    if (!animal) return null

    const custoComId = {
      ...novoCusto,
      id: Date.now()
    }

    const custosAtualizados = [...(animal.custos || []), custoComId]
    const custoTotalAtualizado = animal.custoTotal + novoCusto.valor

      return await this.updateAnimal(animalId, {
      custos: custosAtualizados,
      custoTotal: custoTotalAtualizado
    })
      
    } catch (error) {
      console.error('â�Å’ Erro ao adicionar custo:', error)
      throw error
    }
  }


  // Registrar nascimento completo
  async registrarNascimento(dadosGestacao, dadosNascimento) {
    try {
      const custoReceptora = (dadosGestacao.custoAcumulado || 0) * 0.3

    const novoBezerro = {
      serie: dadosNascimento.serie,
      rg: dadosNascimento.rg,
      tatuagem: dadosNascimento.tatuagem,
      sexo: dadosNascimento.sexo,
      raca: this.getRacaBySerie(dadosNascimento.serie),
      dataNascimento: dadosNascimento.dataNascimento,
      horaNascimento: dadosNascimento.horaNascimento,
      peso: parseFloat(dadosNascimento.peso),
      cor: dadosNascimento.cor,
      tipoNascimento: dadosNascimento.tipoNascimento,
      dificuldadeParto: dadosNascimento.dificuldadeParto,
      meses: this.calcularIdadeEmMeses(dadosNascimento.dataNascimento),
      situacao: 'Ativo',
      pai: `${dadosGestacao.paiSerie} ${dadosGestacao.paiRg}`,
      mae: `${dadosGestacao.maeSerie} ${dadosGestacao.maeRg}`,
      receptora: dadosGestacao.receptoraNome,
      isFiv: true,
      custoTotal: 0, // SerÃ¡ calculado pelo costManager
      valorVenda: null,
      valorReal: null,
      veterinario: dadosNascimento.veterinario
    }

      const animalCriado = await this.addAnimal(novoBezerro)

    // Integrar com o sistema de custos
    if (typeof window !== 'undefined') {
      // Importar dinamicamente para evitar problemas de SSR
        import('./costManager').then(({ default: costManager }) => {
        // Adicionar custos iniciais
        costManager.adicionarCusto(animalCriado.id, {
          tipo: 'Nascimento',
          valor: dadosNascimento.custoNascimento || 0,
          data: dadosNascimento.dataNascimento,
          observacoes: `Nascimento ${dadosNascimento.tipoNascimento} - Peso: ${dadosNascimento.peso}kg`
        })

        costManager.adicionarCusto(animalCriado.id, {
          tipo: 'Receptora',
          valor: custoReceptora,
          data: dadosNascimento.dataNascimento,
          observacoes: `Rateio 30% da receptora ${dadosGestacao.receptoraNome} (R$ ${dadosGestacao.custoAcumulado.toFixed(2)})`
        })

        // Aplicar DNA automÃ¡tico
        costManager.adicionarCustoDNA(animalCriado.id, animalCriado)

        // Aplicar protocolo inicial se aplicÃ¡vel
        costManager.aplicarProtocolo(animalCriado.id, animalCriado, 'Protocolo inicial automÃ¡tico')
      })

      // Integrar com o Boletim ContÃ¡bil
      import('./boletimContabilService').then(({ default: boletimContabilService }) => {
        boletimContabilService.registrarNascimento({
          dataNascimento: dadosNascimento.dataNascimento,
          serie: dadosNascimento.serie,
          rg: dadosNascimento.rg,
          sexo: dadosNascimento.sexo,
          raca: novoBezerro.raca,
          peso: dadosNascimento.peso,
          tipoNascimento: dadosNascimento.tipoNascimento,
          custoNascimento: dadosNascimento.custoNascimento || 0
        })
      })
    }

    return animalCriado
      
    } catch (error) {
      console.error('â�Å’ Erro ao registrar nascimento:', error)
      throw error
    }
  }

  // Exportar dados para relatÃ³rios
  async exportarDados() {
    try {
      const animals = await this.getAllAnimals()
      const statistics = await this.getStatistics()
      
    return {
        animals,
        statistics,
      exportDate: new Date().toISOString()
      }
    } catch (error) {
      console.error('â�Å’ Erro ao exportar dados:', error)
      throw error
    }
  }

  // Deletar animal
  async deletarAnimal(id) {
    try {
      if (!this.useLocalStorage) {
        const response = await fetch(`/api/animals/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao deletar animal')
        }
        
        this.notifyListeners()
        return true
      }
      
      // Fallback para localStorage
      const salvos = JSON.parse(localStorage.getItem('animalData') || '[]')
      const animalRemovido = salvos.find(a => a.id === id)
      const animaisAtualizados = salvos.filter(a => a.id !== id)
      localStorage.setItem('animalData', JSON.stringify(animaisAtualizados))
      
      // Integrar com o Boletim ContÃ¡bil para registrar baixa
      if (animalRemovido && typeof window !== 'undefined') {
        import('./boletimContabilService').then(({ default: boletimContabilService }) => {
          boletimContabilService.registrarMorte({
            dataMorte: new Date().toISOString().split('T')[0],
            serie: animalRemovido.serie,
            rg: animalRemovido.rg,
            sexo: animalRemovido.sexo,
            raca: animalRemovido.raca,
            peso: animalRemovido.peso,
            causa: 'ExclusÃ£o do sistema',
            observacoes: `Animal removido do sistema - ${animalRemovido.serie} ${animalRemovido.rg}`,
            valorPerda: animalRemovido.custoTotal || 0
          })
        })
      }
      
      this.notifyListeners()
      return true
      
    } catch (error) {
      console.error('â�Å’ Erro ao deletar animal:', error)
      throw error
    }
  }
}

// InstÃ¢ncia singleton
const animalDataManager = new AnimalDataManager()

export default animalDataManager
export { AnimalDataManager }