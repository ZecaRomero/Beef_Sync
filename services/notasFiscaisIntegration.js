// Integração entre Notas Fiscais e Boletim de Animais
import animalDataManager from './animalDataManager'
import boletimContabilService from './boletimContabilService'

class NotasFiscaisIntegration {
  constructor() {
    this.animalDataManager = animalDataManager
  }

  // Registrar NF de entrada como ocorrência no boletim
  async registrarNFEntrada(nfData) {
    try {
      const ocorrencias = []
      
      // Para cada item da NF de entrada
      for (const item of nfData.itens || []) {
        // Verificar tipo do produto (suporte a 'bovino', 'bovinos' e fallback)
        const isBovino = item.tipoProduto === 'bovino' || item.tipoItem === 'bovinos' || (!item.tipoProduto && !item.tipoItem && nfData.tipoProduto === 'bovino');
        
        if (isBovino) {
          // Buscar animal existente ou criar novo
          let animal = await this.buscarAnimalPorTatuagem(item.tatuagem)
          
          if (!animal) {
            // Criar novo animal se não existir
            animal = await this.criarAnimalDaNF(item, nfData)
          }

          // Registrar ocorrência de entrada
          const ocorrencia = {
            animalId: animal.id,
            tipo: 'entrada',
            data: nfData.data,
            descricao: `Entrada via NF ${nfData.numeroNF}`,
            observacoes: `Fornecedor: ${nfData.fornecedor}\nValor: R$ ${item.valorUnitario}\nNatureza: ${nfData.naturezaOperacao}`,
            valor: item.valorUnitario,
            peso: item.peso,
            responsavel: 'Sistema NF',
            nfId: nfData.id,
            nfNumero: nfData.numeroNF
          }

          ocorrencias.push(ocorrencia)

          // Registrar no boletim contábil
          await boletimContabilService.registrarCompra({
            dataCompra: nfData.data,
            serie: animal.serie,
            rg: animal.rg,
            sexo: animal.sexo,
            raca: animal.raca,
            pesoCompra: item.peso,
            valorCompra: item.valorUnitario,
            fornecedor: nfData.fornecedor,
            notaFiscal: nfData.numeroNF
          }, nfData.periodoBoletim)
        }
      }

      // Salvar todas as ocorrências
      await this.salvarOcorrencias(ocorrencias)
      
      return {
        success: true,
        message: `${ocorrencias.length} ocorrência(s) de entrada registrada(s) no boletim`,
        ocorrencias: ocorrencias.length
      }
    } catch (error) {
      console.error('Erro ao registrar NF de entrada:', error)
      return {
        success: false,
        message: 'Erro ao registrar NF de entrada no boletim',
        error: error.message
      }
    }
  }

  // Registrar NF de saída como ocorrência no boletim
  async registrarNFSaida(nfData) {
    console.log('🚀 Iniciando registrarNFSaida:', nfData);
    try {
      const ocorrencias = []
      const animais = JSON.parse(localStorage.getItem('animals') || '[]')
      console.log(`📊 Total de animais carregados do localStorage: ${animais.length}`);
      let animaisAtualizados = false
      
      // Para cada item da NF de saída
      for (const item of nfData.itens || []) {
        console.log('🔍 Processando item:', item);
        // Verificar tipo do produto (suporte a 'bovino', 'bovinos' e fallback)
        const isBovino = item.tipoProduto === 'bovino' || item.tipoItem === 'bovinos' || (!item.tipoProduto && !item.tipoItem && nfData.tipoProduto === 'bovino');
        console.log(`🐂 É bovino? ${isBovino}`);

        if (isBovino) {
          // Buscar animal existente na lista carregada
          const animalIndex = animais.findIndex(a => 
            (item.animalId && (a.id === item.animalId || a.id == item.animalId)) ||
            a.tatuagem === item.tatuagem || 
            a.rg === item.tatuagem ||
            a.serie === item.tatuagem
          )
          
          console.log(`🔎 Animal encontrado no índice: ${animalIndex}`);

          if (animalIndex >= 0) {
            const animal = animais[animalIndex]
            console.log('✅ Animal encontrado:', animal);
            
            // Registrar ocorrência de saída
            const ocorrencia = {
              animalId: animal.id,
              tipo: 'saida',
              data: nfData.data,
              descricao: `Saída via NF ${nfData.numeroNF}`,
              observacoes: `Destino: ${nfData.destino}\nValor: R$ ${item.valorUnitario}\nNatureza: ${nfData.naturezaOperacao}`,
              valor: item.valorUnitario,
              peso: item.peso,
              responsavel: 'Sistema NF',
              nfId: nfData.id,
              nfNumero: nfData.numeroNF
            }

            ocorrencias.push(ocorrencia)

            // Atualizar status do animal localmente
            animais[animalIndex] = {
              ...animal,
              ativo: false,
              vendido: true,
              situacao: 'Vendido', // Atualizar situacao também localmente
              dataVenda: nfData.data,
              valorVenda: item.valorUnitario,
              comprador: nfData.destino,
              nfSaida: nfData.numeroNF,
              observacoes: (animal.observacoes || '') + `\nVendido via NF ${nfData.numeroNF}`
            }
            animaisAtualizados = true

            // Tentar atualizar status via API para persistir no banco de dados
            try {
              console.log(`📡 Enviando PUT para /api/animals/${animal.id}...`);
              const response = await fetch(`/api/animals/${animal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  situacao: 'Vendido',
                  valor_venda: item.valorUnitario,
                  observacoes: (animal.observacoes || '') + `\nVendido via NF ${nfData.numeroNF}\nComprador: ${nfData.destino}`
                })
              });
              
              if (response.ok) {
                console.log(`✅ Animal ${animal.id} atualizado com sucesso via API`);
              } else {
                console.error(`❌ Falha ao atualizar animal ${animal.id} via API: ${response.status} ${response.statusText}`);
                const errorData = await response.json().catch(() => ({}));
                console.error('Detalhes do erro:', errorData);
              }
            } catch (apiError) {
              console.error(`❌ Erro ao atualizar animal ${animal.id} via API:`, apiError);
            }

            // Registrar venda no boletim contábil
            await boletimContabilService.registrarVenda({
              dataVenda: nfData.data,
              serie: animal.serie,
              rg: animal.rg,
              sexo: animal.sexo,
              raca: animal.raca,
              peso: item.peso || animal.peso,
              valorVenda: item.valorUnitario,
              comprador: nfData.destino,
              observacoes: `Venda via NF ${nfData.numeroNF}`
            }, nfData.periodoBoletim)
          } else if (item.animalId) {
            console.log(`⚠️ Animal não encontrado localmente, mas ID fornecido: ${item.animalId}. Tentando fallback via API.`);
            // Fallback: Tentar atualizar status via API mesmo se não encontrado localmente
            try {
              const response = await fetch(`/api/animals/${item.animalId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  situacao: 'Vendido',
                  valor_venda: item.valorUnitario,
                  observacoes: `Vendido via NF ${nfData.numeroNF}\nComprador: ${nfData.destino}`
                })
              });

              if (response.ok) {
                console.log(`✅ Animal ${item.animalId} atualizado via API (fallback)`);
              } else {
                console.error(`❌ Falha ao atualizar animal ${item.animalId} via API (fallback): ${response.status}`);
              }

              // Registrar venda no boletim contábil (Fallback)
              await boletimContabilService.registrarVenda({
                dataVenda: nfData.data,
                serie: '', // Desconhecido no fallback
                rg: item.tatuagem, // Usar tatuagem como identificador
                sexo: item.sexo || 'Desconhecido',
                raca: item.raca || 'Desconhecida',
                peso: item.peso || 0,
                valorVenda: item.valorUnitario,
                comprador: nfData.destino,
                observacoes: `Venda via NF ${nfData.numeroNF}`
              }, nfData.periodoBoletim)

            } catch (apiError) {
              console.error(`Erro ao atualizar animal ${item.animalId} via API (fallback):`, apiError);
            }
          }
        }
      }

      // Salvar animais atualizados
      if (animaisAtualizados) {
        localStorage.setItem('animals', JSON.stringify(animais))
      }

      // Salvar todas as ocorrências
      await this.salvarOcorrencias(ocorrencias)
      
      return {
        success: true,
        message: `${ocorrencias.length} ocorrência(s) de saída registrada(s) no boletim`,
        ocorrencias: ocorrencias.length
      }
    } catch (error) {
      console.error('Erro ao registrar NF de saída:', error)
      return {
        success: false,
        message: 'Erro ao registrar NF de saída no boletim',
        error: error.message
      }
    }
  }

  // Buscar animal por tatuagem
  async buscarAnimalPorTatuagem(tatuagem) {
    try {
      const animais = JSON.parse(localStorage.getItem('animals') || '[]')
      return animais.find(animal => 
        animal.tatuagem === tatuagem || 
        animal.rg === tatuagem ||
        animal.serie === tatuagem
      )
    } catch (error) {
      console.error('Erro ao buscar animal:', error)
      return null
    }
  }

  // Criar novo animal a partir da NF
  async criarAnimalDaNF(item, nfData) {
    try {
      const novoAnimal = {
        id: Date.now() + Math.random(),
        serie: item.serie || '',
        rg: item.tatuagem,
        tatuagem: item.tatuagem,
        sexo: item.sexo === 'macho' ? 'Macho' : 'Fêmea',
        raca: item.raca || 'Não informado',
        dataNascimento: this.calcularDataNascimento(item.era),
        peso: parseFloat(item.peso) || 0,
        origem: 'NF Entrada',
        fornecedor: nfData.fornecedor,
        valorCompra: parseFloat(item.valorUnitario) || 0,
        nfEntrada: nfData.numeroNF,
        dataEntrada: nfData.data,
        observacoes: `Animal criado automaticamente via NF ${nfData.numeroNF}`,
        ativo: true,
        vendido: false,
        baixado: false,
        createdAt: new Date().toISOString()
      }

      // Salvar animal
      const animais = JSON.parse(localStorage.getItem('animals') || '[]')
      animais.push(novoAnimal)
      localStorage.setItem('animals', JSON.stringify(animais))

      return novoAnimal
    } catch (error) {
      console.error('Erro ao criar animal da NF:', error)
      throw error
    }
  }

  // Calcular data de nascimento baseada na era
  calcularDataNascimento(era) {
    const hoje = new Date()
    const meses = this.eraParaMeses(era)
    
    if (meses > 0) {
      const dataNascimento = new Date(hoje)
      dataNascimento.setMonth(dataNascimento.getMonth() - meses)
      return dataNascimento.toISOString().split('T')[0]
    }
    
    return hoje.toISOString().split('T')[0]
  }

  // Converter era para meses
  eraParaMeses(era) {
    const eraMap = {
      '0/3': 2,
      '4/8': 6,
      '9/12': 10,
      '13/24': 18,
      '25/36': 30,
      '+36': 42
    }
    
    return eraMap[era] || 0
  }

  // Salvar ocorrências no histórico
  async salvarOcorrencias(ocorrencias) {
    try {
      const historico = JSON.parse(localStorage.getItem('animalHistory') || '[]')
      
      for (const ocorrencia of ocorrencias) {
        const evento = {
          id: Date.now() + Math.random(),
          ...ocorrencia,
          createdAt: new Date().toISOString(),
          createdBy: 'Sistema NF'
        }
        
        historico.push(evento)
      }
      
      localStorage.setItem('animalHistory', JSON.stringify(historico))
      
      return true
    } catch (error) {
      console.error('Erro ao salvar ocorrências:', error)
      throw error
    }
  }

  // Buscar ocorrências relacionadas a uma NF
  buscarOcorrenciasPorNF(nfId) {
    try {
      const historico = JSON.parse(localStorage.getItem('animalHistory') || '[]')
      return historico.filter(evento => evento.nfId === nfId)
    } catch (error) {
      console.error('Erro ao buscar ocorrências da NF:', error)
      return []
    }
  }

  // Remover ocorrências de uma NF (quando NF é excluída)
  async removerOcorrenciasPorNF(nfId) {
    try {
      const historico = JSON.parse(localStorage.getItem('animalHistory') || '[]')
      const historicoAtualizado = historico.filter(evento => evento.nfId !== nfId)
      
      localStorage.setItem('animalHistory', JSON.stringify(historicoAtualizado))
      
      return true
    } catch (error) {
      console.error('Erro ao remover ocorrências da NF:', error)
      throw error
    }
  }

  // Verificar se NF já foi integrada
  verificarNFIntegrada(nfId) {
    try {
      const historico = JSON.parse(localStorage.getItem('animalHistory') || '[]')
      return historico.some(evento => evento.nfId === nfId)
    } catch (error) {
      console.error('Erro ao verificar integração da NF:', error)
      return false
    }
  }

  // Estatísticas de integração
  getEstatisticasIntegracao() {
    try {
      const historico = JSON.parse(localStorage.getItem('animalHistory') || '[]')
      const nfs = JSON.parse(localStorage.getItem('notasFiscais') || '[]')
      
      const ocorrenciasNF = historico.filter(evento => evento.nfId)
      const nfsIntegradas = [...new Set(ocorrenciasNF.map(evento => evento.nfId))]
      
      return {
        totalNFs: nfs.length,
        nfsIntegradas: nfsIntegradas.length,
        ocorrenciasGeradas: ocorrenciasNF.length,
        pendentesIntegracao: nfs.length - nfsIntegradas.length
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return {
        totalNFs: 0,
        nfsIntegradas: 0,
        ocorrenciasGeradas: 0,
        pendentesIntegracao: 0
      }
    }
  }
}

// Instância global
export const notasFiscaisIntegration = new NotasFiscaisIntegration()

// Funções utilitárias
export const integrarNFEntrada = (nfData) => notasFiscaisIntegration.registrarNFEntrada(nfData)
export const integrarNFSaida = (nfData) => notasFiscaisIntegration.registrarNFSaida(nfData)
export const buscarOcorrenciasNF = (nfId) => notasFiscaisIntegration.buscarOcorrenciasPorNF(nfId)
export const removerOcorrenciasNF = (nfId) => notasFiscaisIntegration.removerOcorrenciasPorNF(nfId)
export const verificarNFIntegrada = (nfId) => notasFiscaisIntegration.verificarNFIntegrada(nfId)
export const getEstatisticasIntegracao = () => notasFiscaisIntegration.getEstatisticasIntegracao()
