/**
 * Serviço de Boletim Contábil - Beef Sync
 * Gerencia automaticamente as operações contábeis dos animais
 */

class BoletimContabilService {
  constructor() {
    this.listeners = []
    this.boletimAtual = null
    this.periodoAtual = this.getPeriodoAtual()
  }

  // Obter período atual (mês/ano)
  getPeriodoAtual() {
    const agora = new Date()
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const ano = agora.getFullYear()
    return `${ano}-${mes}`
  }

  // Inicializar boletim do período atual
  async inicializarBoletim(periodo = null) {
    const periodoBoletim = periodo || this.periodoAtual
    this.boletimAtual = await this.carregarBoletim(periodoBoletim)
    
    if (!this.boletimAtual) {
      this.boletimAtual = await this.criarBoletimVazio(periodoBoletim)
    }

    return this.boletimAtual
  }

  // Criar boletim vazio para novo período
  async criarBoletimVazio(periodo) {
    const boletim = {
      id: `boletim_${periodo}`,
      periodo,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      status: 'aberto',
      entradas: {
        nascimentos: [],
        compras: [],
        outrasEntradas: []
      },
      saidas: {
        vendas: [],
        mortes: [],
        outrasSaidas: []
      },
      custos: [],
      receitas: [],
      resumo: {
        totalEntradas: 0,
        totalSaidas: 0,
        totalCustos: 0,
        totalReceitas: 0,
        saldoPeriodo: 0
      }
    }

    await this.salvarBoletim(boletim)
    return boletim
  }

  // Carregar boletim do localStorage
  async carregarBoletim(periodo) {
    try {
      const boletins = JSON.parse(localStorage.getItem('boletinsContabeis') || '{}')
      return boletins[periodo] || null
    } catch (error) {
      console.error('Erro ao carregar boletim:', error)
      return null
    }
  }

  // Salvar boletim no localStorage
  async salvarBoletim(boletim) {
    try {
      const boletins = JSON.parse(localStorage.getItem('boletinsContabeis') || '{}')
      boletins[boletim.periodo] = boletim
      localStorage.setItem('boletinsContabeis', JSON.stringify(boletins))
      
      this.notificarListeners('boletimAtualizado', boletim)
      return true
    } catch (error) {
      console.error('Erro ao salvar boletim:', error)
      return false
    }
  }

  // Registrar nascimento automaticamente
  async registrarNascimento(dadosNascimento, periodo = null) {
    let boletim = this.boletimAtual
    
    if (periodo) {
      // Se um período específico foi solicitado
      if (!boletim || boletim.periodo !== periodo) {
        boletim = await this.carregarBoletim(periodo)
        if (!boletim) {
          boletim = await this.criarBoletimVazio(periodo)
        }
      }
    } else if (!boletim) {
      // Se não tem boletim carregado e não foi especificado período, carrega o atual
      await this.inicializarBoletim()
      boletim = this.boletimAtual
    }

    const entrada = {
      id: `nasc_${Date.now()}`,
      tipo: 'nascimento',
      data: dadosNascimento.dataNascimento,
      animal: {
        serie: dadosNascimento.serie,
        rg: dadosNascimento.rg,
        sexo: dadosNascimento.sexo,
        raca: dadosNascimento.raca,
        peso: dadosNascimento.peso
      },
      valor: dadosNascimento.custoNascimento || 0,
      observacoes: `Nascimento ${dadosNascimento.tipoNascimento} - Peso: ${dadosNascimento.peso}kg`,
      dataRegistro: new Date().toISOString()
    }

    boletim.entradas.nascimentos.push(entrada)
    await this.atualizarResumo(boletim)
    await this.salvarBoletim(boletim)

    return entrada
  }

  // Registrar venda automaticamente
  async registrarVenda(dadosVenda, periodo = null) {
    let boletim = this.boletimAtual

    if (periodo) {
      // Se um período específico foi solicitado
      if (!boletim || boletim.periodo !== periodo) {
        boletim = await this.carregarBoletim(periodo)
        if (!boletim) {
          boletim = await this.criarBoletimVazio(periodo)
        }
      }
    } else if (!boletim) {
      await this.inicializarBoletim()
      boletim = this.boletimAtual
    }

    const saida = {
      id: `venda_${Date.now()}`,
      tipo: 'venda',
      data: dadosVenda.dataVenda,
      animal: {
        serie: dadosVenda.serie,
        rg: dadosVenda.rg,
        sexo: dadosVenda.sexo,
        raca: dadosVenda.raca,
        peso: dadosVenda.peso
      },
      valor: dadosVenda.valorVenda,
      comprador: dadosVenda.comprador,
      observacoes: dadosVenda.observacoes || '',
      dataRegistro: new Date().toISOString()
    }

    boletim.saidas.vendas.push(saida)
    await this.atualizarResumo(boletim)
    await this.salvarBoletim(boletim)

    return saida
  }

  // Registrar morte automaticamente
  async registrarMorte(dadosMorte, periodo = null) {
    let boletim = this.boletimAtual

    if (periodo) {
      if (!boletim || boletim.periodo !== periodo) {
        boletim = await this.carregarBoletim(periodo)
        if (!boletim) {
          boletim = await this.criarBoletimVazio(periodo)
        }
      }
    } else if (!boletim) {
      await this.inicializarBoletim()
      boletim = this.boletimAtual
    }

    const saida = {
      id: `morte_${Date.now()}`,
      tipo: 'morte',
      data: dadosMorte.dataMorte,
      animal: {
        serie: dadosMorte.serie,
        rg: dadosMorte.rg,
        sexo: dadosMorte.sexo,
        raca: dadosMorte.raca,
        peso: dadosMorte.peso
      },
      valor: dadosMorte.valorPerda || 0,
      causa: dadosMorte.causa,
      observacoes: dadosMorte.observacoes || '',
      dataRegistro: new Date().toISOString()
    }

    boletim.saidas.mortes.push(saida)
    await this.atualizarResumo(boletim)
    await this.salvarBoletim(boletim)

    return saida
  }

  // Registrar compra de animal automaticamente
  async registrarCompra(dadosCompra, periodo = null) {
    let boletim = this.boletimAtual

    if (periodo) {
      if (!boletim || boletim.periodo !== periodo) {
        boletim = await this.carregarBoletim(periodo)
        if (!boletim) {
          boletim = await this.criarBoletimVazio(periodo)
        }
      }
    } else if (!boletim) {
      await this.inicializarBoletim()
      boletim = this.boletimAtual
    }

    const entrada = {
      id: `compra_${Date.now()}`,
      tipo: 'compra',
      data: dadosCompra.dataCompra || new Date().toISOString().split('T')[0],
      animal: {
        serie: dadosCompra.serie,
        rg: dadosCompra.rg,
        sexo: dadosCompra.sexo,
        raca: dadosCompra.raca,
        peso: dadosCompra.pesoCompra
      },
      valor: dadosCompra.valorCompra || 0,
      fornecedor: dadosCompra.fornecedor,
      notaFiscal: dadosCompra.notaFiscal,
      observacoes: `Compra de ${dadosCompra.raca} - ${dadosCompra.serie} ${dadosCompra.rg}`,
      dataRegistro: new Date().toISOString()
    }

    boletim.entradas.compras.push(entrada)
    await this.atualizarResumo(boletim)
    await this.salvarBoletim(boletim)

    return entrada
  }

  // Registrar custo automaticamente
  async registrarCusto(dadosCusto, periodo = null) {
    let boletim = this.boletimAtual

    if (periodo) {
      if (!boletim || boletim.periodo !== periodo) {
        boletim = await this.carregarBoletim(periodo)
        if (!boletim) {
          boletim = await this.criarBoletimVazio(periodo)
        }
      }
    } else if (!boletim) {
      await this.inicializarBoletim()
      boletim = this.boletimAtual
    }

    const custo = {
      id: `custo_${Date.now()}`,
      tipo: dadosCusto.tipo,
      subtipo: dadosCusto.subtipo,
      data: dadosCusto.data,
      animal: dadosCusto.animalId ? {
        id: dadosCusto.animalId,
        serie: dadosCusto.serie,
        rg: dadosCusto.rg
      } : null,
      valor: dadosCusto.valor,
      observacoes: dadosCusto.observacoes,
      dataRegistro: new Date().toISOString()
    }

    boletim.custos.push(custo)
    await this.atualizarResumo(boletim)
    await this.salvarBoletim(boletim)

    return custo
  }

  // Atualizar resumo do boletim
  async atualizarResumo(boletim = null) {
    const boletimAlvo = boletim || this.boletimAtual
    if (!boletimAlvo) return

    const resumo = {
      totalEntradas: this.calcularTotalEntradas(boletimAlvo),
      totalSaidas: this.calcularTotalSaidas(boletimAlvo),
      totalCustos: this.calcularTotalCustos(boletimAlvo),
      totalReceitas: this.calcularTotalReceitas(boletimAlvo),
      saldoPeriodo: 0
    }

    resumo.saldoPeriodo = resumo.totalReceitas - resumo.totalCustos
    boletimAlvo.resumo = resumo
    boletimAlvo.dataAtualizacao = new Date().toISOString()
  }

  // Calcular total de entradas
  calcularTotalEntradas(boletim = null) {
    const boletimAlvo = boletim || this.boletimAtual
    if (!boletimAlvo) return 0

    const nascimentos = boletimAlvo.entradas.nascimentos.reduce((total, item) => total + item.valor, 0)
    const compras = boletimAlvo.entradas.compras.reduce((total, item) => total + item.valor, 0)
    const outras = boletimAlvo.entradas.outrasEntradas.reduce((total, item) => total + item.valor, 0)

    return nascimentos + compras + outras
  }

  // Calcular total de saídas
  calcularTotalSaidas(boletim = null) {
    const boletimAlvo = boletim || this.boletimAtual
    if (!boletimAlvo) return 0

    const vendas = boletimAlvo.saidas.vendas.reduce((total, item) => total + item.valor, 0)
    const mortes = boletimAlvo.saidas.mortes.reduce((total, item) => total + item.valor, 0)
    const outras = boletimAlvo.saidas.outrasSaidas.reduce((total, item) => total + item.valor, 0)

    return vendas + mortes + outras
  }

  // Calcular total de custos
  calcularTotalCustos(boletim = null) {
    const boletimAlvo = boletim || this.boletimAtual
    if (!boletimAlvo) return 0
    return boletimAlvo.custos.reduce((total, item) => total + item.valor, 0)
  }

  // Calcular total de receitas
  calcularTotalReceitas(boletim = null) {
    const boletimAlvo = boletim || this.boletimAtual
    if (!boletimAlvo) return 0
    return boletimAlvo.receitas.reduce((total, item) => total + item.valor, 0)
  }

  // Obter boletim atual
  getBoletimAtual() {
    return this.boletimAtual
  }

  // Listar todos os boletins
  async listarBoletins() {
    try {
      const boletins = JSON.parse(localStorage.getItem('boletinsContabeis') || '{}')
      return Object.values(boletins).sort((a, b) => b.periodo.localeCompare(a.periodo))
    } catch (error) {
      console.error('Erro ao listar boletins:', error)
      return []
    }
  }

  // Gerar relatório do boletim
  async gerarRelatorio(periodo) {
    const boletim = await this.carregarBoletim(periodo)
    if (!boletim) return null

    return {
      periodo: boletim.periodo,
      resumo: boletim.resumo,
      entradas: boletim.entradas,
      saidas: boletim.saidas,
      custos: boletim.custos,
      receitas: boletim.receitas,
      dataGeracao: new Date().toISOString()
    }
  }

  // Exportar boletim para contabilidade
  async exportarParaContabilidade(periodo, formato = 'json') {
    const boletim = await this.carregarBoletim(periodo)
    if (!boletim) return null

    const dadosExportacao = {
      empresa: 'Fazenda Beef-Sync',
      periodo: boletim.periodo,
      dataExportacao: new Date().toISOString(),
      resumo: boletim.resumo,
      movimentacoes: {
        entradas: boletim.entradas,
        saidas: boletim.saidas,
        custos: boletim.custos,
        receitas: boletim.receitas
      }
    }

    if (formato === 'csv') {
      return this.converterParaCSV(dadosExportacao)
    }

    return dadosExportacao
  }

  // Converter dados para CSV
  converterParaCSV(dados) {
    let csv = 'Tipo,Data,Descrição,Valor,Observações\n'
    
    // Entradas
    Object.values(dados.movimentacoes.entradas).flat().forEach(item => {
      csv += `Entrada,${item.data},${item.tipo},${item.valor},"${item.observacoes}"\n`
    })
    
    // Saídas
    Object.values(dados.movimentacoes.saidas).flat().forEach(item => {
      csv += `Saída,${item.data},${item.tipo},${item.valor},"${item.observacoes}"\n`
    })
    
    // Custos
    dados.movimentacoes.custos.forEach(item => {
      csv += `Custo,${item.data},${item.tipo},${item.valor},"${item.observacoes}"\n`
    })
    
    // Receitas
    dados.movimentacoes.receitas.forEach(item => {
      csv += `Receita,${item.data},${item.tipo},${item.valor},"${item.observacoes}"\n`
    })

    return csv
  }

  // Fechar boletim do período
  async fecharBoletim(periodo) {
    const boletim = await this.carregarBoletim(periodo)
    if (!boletim) return false

    boletim.status = 'fechado'
    boletim.dataFechamento = new Date().toISOString()
    
    return await this.salvarBoletim(boletim)
  }

  // Adicionar listener para mudanças
  addListener(callback) {
    this.listeners.push(callback)
  }

  // Remover listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback)
  }

  // Notificar listeners
  notificarListeners(evento, dados) {
    this.listeners.forEach(listener => {
      try {
        listener(evento, dados)
      } catch (error) {
        console.error('Erro ao notificar listener:', error)
      }
    })
  }

  // Sincronizar com operações existentes
  async sincronizarOperacoesExistentes() {
    try {
      // Carregar animais existentes
      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      const birthData = JSON.parse(localStorage.getItem('birthData') || '[]')
      
      // Processar nascimentos
      for (const nascimento of birthData) {
        if (nascimento.status === 'nascido' && nascimento.data) {
          await this.registrarNascimento({
            dataNascimento: nascimento.data,
            serie: nascimento.serie,
            rg: nascimento.rg,
            sexo: nascimento.sexo,
            raca: nascimento.raca,
            peso: nascimento.peso,
            tipoNascimento: nascimento.tipoNascimento,
            custoNascimento: nascimento.custoNascimento || 0
          })
        }
      }

      // Processar compras de animais (incluindo receptoras)
      for (const animal of animals) {
        if (animal.valorCompra && animal.dataCompra) {
          await this.registrarCompra({
            dataCompra: animal.dataCompra,
            serie: animal.serie,
            rg: animal.rg,
            sexo: animal.sexo,
            raca: animal.raca,
            pesoCompra: animal.pesoCompra,
            valorCompra: animal.valorCompra,
            fornecedor: animal.fornecedor,
            notaFiscal: animal.notaFiscal,
            observacoes: `Compra de ${animal.raca} - ${animal.serie} ${animal.rg}`
          })
        }
      }

      // Processar vendas
      for (const animal of animals) {
        if (animal.valorVenda && animal.dataVenda) {
          await this.registrarVenda({
            dataVenda: animal.dataVenda,
            serie: animal.serie,
            rg: animal.rg,
            sexo: animal.sexo,
            raca: animal.raca,
            peso: animal.peso,
            valorVenda: animal.valorVenda,
            comprador: animal.comprador,
            observacoes: `Venda do animal ${animal.serie} ${animal.rg}`
          })
        }
      }

      console.log('✅ Sincronização de operações concluída')
      return true
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
      return false
    }
  }
}

// Instância singleton
const boletimContabilService = new BoletimContabilService()

export default boletimContabilService
