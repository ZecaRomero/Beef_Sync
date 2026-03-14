import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '../ui/Icons';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { formatCurrencyInput, parseCurrencyValue, normalizarDataParaInput } from './utils';
import FormularioBovino from './FormularioBovino';
import FormularioSemen from './FormularioSemen';
import FormularioEmbriao from './FormularioEmbriao';
import ListaItens from './ListaItens';
import BatchImportModal from './BatchImportModal';
import boletimContabilService from '../../services/boletimContabilService';

export default function NotaFiscalModal({ isOpen, onClose, onSave, animals = [], initialAnimal = null, nfEditando = null, tipo = 'entrada' }) {
  const [activeTab, setActiveTab] = useState('bovinos');
  const [itens, setItens] = useState([]);
  const [boletins, setBoletins] = useState([]);
  const [localidadeBoletim, setLocalidadeBoletim] = useState(null); // Localidade do boletim selecionado
  const [dadosNF, setDadosNF] = useState({
    numeroNF: '',
    serieNF: '',
    dataCompra: '',
    dataChegadaAnimais: '', // Data de chegada dos animais (DG = 15 dias apÃ³s)
    dataSaida: '', // Data de saÃ­da dos animais (para NF de saÃ­da)
    motorista: '', // Nome do motorista (opcional, para NF de saÃ­da)
    origem: '', // Fornecedor
    cnpjOrigemDestino: '', // CNPJ/CPF do Fornecedor ou DestinatÃ¡rio
    endereco: '',
    bairro: '',
    cep: '',
    municipio: '',
    uf: '',
    telefone: '',
    incricao: '',
    tipo: tipo || 'entrada', // entrada ou saida - inicializa com a prop
    naturezaOperacao: tipo === 'saida' ? 'Venda' : 'Compra', // Valor padrÃ£o baseado no tipo
    chaveAcesso: '',
    valorTotalNF: '',
    observacoes: '',
    periodoBoletim: '', // Novo campo para seleÃ§Ã£o do boletim
    // Campos para Receptoras
    ehReceptoras: false,
    receptoraLetra: '',
    receptoraNumero: '',
    dataTE: ''
  });

  // Estado para novo item (genÃ©rico, adaptÃ¡vel por aba)
  const [novoItem, setNovoItem] = useState({});

  // Estados para busca de animais (Bovinos - SaÃ­da)
  const [buscaAnimais, setBuscaAnimais] = useState('');
  const [mostrarListaAnimais, setMostrarListaAnimais] = useState(false);
  const [animalSelecionado, setAnimalSelecionado] = useState(null);
  const [manterSerieAutomaticamente, setManterSerieAutomaticamente] = useState(false);

  // Estados para autocomplete de contatos
  const [contatos, setContatos] = useState([]);
  const [mostrarSugestoesContatos, setMostrarSugestoesContatos] = useState(false);
  const [mostrarSugestoesDocumento, setMostrarSugestoesDocumento] = useState(false);


  // Carregar contatos ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      fetch('/api/contatos')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setContatos(data.data || []);
          }
        })
        .catch(err => console.error('Erro ao carregar contatos:', err));
    }
  }, [isOpen]);

  // Atualizar tipo quando a prop mudar
  useEffect(() => {
    if (isOpen && tipo) {
      setDadosNF(prev => ({
        ...prev,
        tipo: tipo,
        naturezaOperacao: tipo === 'saida' ? 'Venda' : 'Compra'
      }));
    }
  }, [isOpen, tipo]);

  // Carregar boletins contÃ¡beis
  useEffect(() => {
    if (isOpen) {
      const fetchBoletins = async () => {
        try {
          // Tentar buscar da API primeiro
          const response = await fetch('/api/boletim-contabil');
          if (response.ok) {
            const data = await response.json();
            const lista = data.success && data.data ? data.data : (Array.isArray(data) ? data : []);
            console.log('ðÅ¸â€œâ€¹ Boletins carregados da API:', lista);
            setBoletins(lista);
          } else {
            // Fallback para localStorage
            const lista = await boletimContabilService.listarBoletins();
            console.log('ðÅ¸â€œâ€¹ Boletins carregados do localStorage:', lista);
            setBoletins(lista);
          }
        } catch (error) {
          console.error('Erro ao buscar boletins:', error);
          // Fallback para localStorage
          const lista = await boletimContabilService.listarBoletins();
          setBoletins(lista);
        }
      };
      fetchBoletins();
    }
  }, [isOpen]);

  // Quando o boletim for selecionado, buscar a localidade e aplicar aos itens
  useEffect(() => {
    if (dadosNF.periodoBoletim) {
      const boletimSelecionado = boletins.find(b => b.periodo === dadosNF.periodoBoletim);
      let localidadeDetectada = null;
      
      // Se o boletim tem localidade definida, usar ela
      if (boletimSelecionado && boletimSelecionado.localidade) {
        localidadeDetectada = boletimSelecionado.localidade;
      } else {
        // Tentar inferir baseado no fornecedor/CNPJ
        const fornecedor = dadosNF.origem || '';
        const cnpj = dadosNF.cnpjOrigemDestino || '';
        const incricao = dadosNF.incricao || '';
        
        const cnpjPardinho = '18978214000445';
        const cnpjNormalizado = cnpj.replace(/[.\-\/]/g, '').trim();
        const fornecedorUpper = fornecedor.toUpperCase();
        const incricaoUpper = incricao.toUpperCase();
        
        // Verificar se Ã© Pardinho
        const ehPardinho = cnpjNormalizado === cnpjPardinho || 
                          fornecedorUpper.includes('PARDINHO') ||
                          incricaoUpper === 'PARDINHO';
        
        // Verificar se Ã© Rancharia (SANT ANNA)
        const ehRancharia = incricaoUpper === 'SANT ANNA' || 
                           fornecedorUpper.includes('SANT ANNA') ||
                           fornecedorUpper.includes('RANCHARIA');
        
        if (ehPardinho) {
          localidadeDetectada = 'Pardinho';
        } else if (ehRancharia) {
          localidadeDetectada = 'Rancharia';
        }
      }
      
      setLocalidadeBoletim(localidadeDetectada);
      
      // Aplicar localidade automaticamente aos itens que nÃ£o tÃªm local definida
      if (localidadeDetectada) {
        setItens(prevItens => 
          prevItens.map(item => ({
            ...item,
            local: item.local || localidadeDetectada
          }))
        );
      }
    } else {
      setLocalidadeBoletim(null);
    }
  }, [dadosNF.periodoBoletim, boletins, dadosNF.origem, dadosNF.cnpjOrigemDestino, dadosNF.incricao]);

  // Filtrar contatos
  const filtrarContatos = () => {
    if (!dadosNF.origem) return [];
    const termo = dadosNF.origem.toLowerCase();
    return contatos.filter(c => 
      c.nome && c.nome.toLowerCase().includes(termo)
    ).slice(0, 5); // Limitar a 5 sugestÃµes
  };

  // Filtrar contatos por CPF/CNPJ
  const filtrarContatosPorDocumento = () => {
    if (!dadosNF.cnpjOrigemDestino) return [];
    const termo = dadosNF.cnpjOrigemDestino.replace(/\D/g, ''); // Remove formataÃ§Ã£o
    if (termo.length < 3) return []; // MÃ­nimo 3 dÃ­gitos para buscar
    
    return contatos.filter(c => {
      if (!c.documento) return false;
      const docLimpo = c.documento.replace(/\D/g, '');
      return docLimpo.includes(termo);
    }).slice(0, 5); // Limitar a 5 sugestÃµes
  };

  const buscarCNPJ = async (cnpj) => {
    const limpo = cnpj.replace(/\D/g, '');
    if (limpo.length !== 14) return;

    try {
      // Usar API proxy interna para evitar problemas de CORS
      const response = await fetch(`/api/cnpj?cnpj=${limpo}`);
      
      if (response.ok) {
        const result = await response.json();
        
        // Verificar se retornou dados vÃ¡lidos
        if (result.success && result.data) {
          const data = result.data;
          
          setDadosNF(prev => ({
            ...prev,
            origem: data.razao_social || data.nome_fantasia || prev.origem,
            endereco: data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'}${data.complemento ? ' - ' + data.complemento : ''}` : prev.endereco,
            bairro: data.bairro || prev.bairro,
            cep: data.cep || prev.cep,
            municipio: data.municipio || prev.municipio,
            uf: data.uf || prev.uf,
            telefone: data.ddd_telefone_1 || data.ddd_telefone_2 || prev.telefone
          }));
          
          console.log('âÅ“â€¦ CNPJ encontrado:', data.razao_social || data.nome_fantasia);
        } else {
          console.warn('âÅ¡ ï¸� CNPJ nÃ£o retornou dados vÃ¡lidos');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`âÅ¡ ï¸� Erro ao buscar CNPJ: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('â�Å’ Erro ao buscar CNPJ:', error.message);
      // NÃ£o mostrar alerta para nÃ£o interromper o fluxo do usuÃ¡rio
      // O usuÃ¡rio pode preencher manualmente se a busca falhar
    }
  };

  const selecionarContato = (contato) => {
    setDadosNF(prev => ({
      ...prev,
      origem: contato.nome,
      cnpjOrigemDestino: contato.documento || '',
      endereco: contato.endereco || '',
      bairro: contato.bairro || '',
      cep: contato.cep || '',
      municipio: contato.municipio || '',
      uf: contato.uf || '',
      telefone: contato.telefone || '',
      incricao: contato.incricao || ''
    }));
    setMostrarSugestoesContatos(false);
  };

  // Resetar novoItem quando mudar de aba
  useEffect(() => {
    resetNovoItem();
  }, [activeTab]);

  // Auto-preencher campos quando for Receptoras (formato: M 1815)
  useEffect(() => {
    if (dadosNF.ehReceptoras && activeTab === 'bovinos') {
      const letra = (dadosNF.receptoraLetra || '').trim();
      const numero = (dadosNF.receptoraNumero || '').trim();
      const tatuagemReceptora = letra ? `${letra} ${numero}`.trim() : numero;
      setNovoItem(prev => ({
        ...prev,
        sexo: 'femea',
        raca: 'MestiÃ§a',
        tatuagem: tatuagemReceptora
      }));
    }
  }, [dadosNF.ehReceptoras, dadosNF.receptoraLetra, dadosNF.receptoraNumero, activeTab]);

  const resetNovoItem = () => {
    if (activeTab === 'bovinos') {
      setNovoItem({
        tatuagem: '',
        sexo: '',
        era: '',
        raca: '',
        peso: '',
        valorUnitario: '0,00',
        quantidade: '', // Para modo categoria
        modoCadastro: 'individual', // individual ou categoria
        tipoAnimal: 'registrado' // registrado ou cria-recria
      });
    } else if (activeTab === 'semen') {
      setNovoItem({
        nomeTouro: '',
        rgTouro: '',
        raca: '',
        quantidadeDoses: '',
        valorUnitario: '0,00',
        botijao: '',
        caneca: '',
        certificado: '',
        dataValidade: ''
      });
    } else if (activeTab === 'embrioes') {
      setNovoItem({
        doadora: '',
        touro: '',
        raca: '',
        quantidadeEmbrioes: '',
        valorUnitario: '0,00',
        tipoEmbriao: '', // in_vitro, in_vivo, fresco, congelado
        qualidade: '', // A, B, C
        dataColeta: ''
      });
    }
    setBuscaAnimais('');
    setAnimalSelecionado(null);
  };

  // Estado para sugestÃ£o de lote TE
  const [loteSugerido, setLoteSugerido] = useState(null);

  // Estado para modal de importaÃ§Ã£o em lote
  const [showBatchModal, setShowBatchModal] = useState(false);
  const numeroReceptoraInputRef = useRef(null);

  const verificarLoteTE = useDebouncedCallback(async (tatuagem) => {
    if (!tatuagem || tatuagem.length < 3) return;

    try {
      const res = await fetch(`/api/transferencias-embrioes?receptora_nome=${encodeURIComponent(tatuagem)}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.data || data;
        const te = Array.isArray(items) && items.length > 0 ? items[0] : null;
        
        if (te) {
            if (loteSugerido && loteSugerido.central === te.central && loteSugerido.data_te === te.data_te) return;

            const fornecedorAtual = dadosNF.origem || '';
            const centralTe = te.central || '';
            
            const matchFornecedor = !fornecedorAtual || 
                                   centralTe.toLowerCase().includes(fornecedorAtual.toLowerCase()) || 
                                   fornecedorAtual.toLowerCase().includes(centralTe.toLowerCase()) ||
                                   (centralTe.toLowerCase().includes('gaeta') && fornecedorAtual.toLowerCase().includes('gaeta'));

            if (matchFornecedor) {
                const resBatch = await fetch(`/api/transferencias-embrioes?data_te=${te.data_te}&central=${encodeURIComponent(te.central)}`);
                if (resBatch.ok) {
                    const batchData = await resBatch.json();
                    const batchItems = batchData.data || batchData;
                    
                    if (Array.isArray(batchItems) && batchItems.length > 1) {
                        setLoteSugerido({
                            central: te.central,
                            data_te: te.data_te,
                            quantidade: batchItems.length,
                            itens: batchItems
                        });
                    }
                }
            }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar lote TE:', error);
    }
  }, 500);

  const importarLote = () => {
    if (!loteSugerido) return;
    setShowBatchModal(true);
  };

  const confirmarImportacaoLote = (itensSelecionados) => {
    const novosItens = itensSelecionados.map(te => {
        // Tenta encontrar se jÃ¡ existe esse animal
        const animalExistente = animals.find(a => 
            (a.serie + a.rg) === te.receptora_nome || 
            a.nome === te.receptora_nome
        );

        return {
            id: Date.now() + Math.random(),
            tatuagem: te.receptora_nome,
            sexo: te.sexo || 'femea',
            raca: te.raca || 'Receptora',
            era: te.era || 'Adulto', 
            peso: '',
            valorUnitario: te.valorUnitario || '0,00',
            quantidade: '',
            modoCadastro: 'individual',
            tipoAnimal: 'registrado',
            tipoItem: 'bovinos',
            tipoProduto: 'bovino',
            animalId: animalExistente ? animalExistente.id : null
        };
    });

    // Filtrar itens que jÃ¡ estÃ£o na lista para nÃ£o duplicar (pela tatuagem)
    const itensFiltrados = novosItens.filter(novo => !itens.some(existente => existente.tatuagem === novo.tatuagem));

    if (itensFiltrados.length === 0) {
        alert('Todos os animais selecionados jÃ¡ foram adicionados!');
    } else {
        setItens([...itens, ...itensFiltrados]);
        // NÃ£o mostrar alerta aqui, o modal jÃ¡ fecha
    }
    
    setShowBatchModal(false);
    setLoteSugerido(null);
  };

  const adicionarItem = () => {
    // ValidaÃ§Ã£o bÃ¡sica
    if (activeTab === 'bovinos') {
      // Se for receptoras, usar lÃ³gica diferente
      if (dadosNF.ehReceptoras) {
        if (!dadosNF.receptoraNumero || !dadosNF.receptoraNumero.trim()) {
          alert('Digite o nÃºmero da receptora');
          return;
        }
        // Se jÃ¡ existe pelo menos um item, copiar era e valor unitÃ¡rio do primeiro automaticamente (podem ser editados)
        if (itens.length > 0 && itens[0].tipoProduto === 'bovino') {
          const primeiroItem = itens[0];
          novoItem.era = novoItem.era || primeiroItem.era || '';
          if (!novoItem.valorUnitario || parseCurrencyValue(String(novoItem.valorUnitario)) === 0) {
            const valorNum = typeof primeiroItem.valorUnitario === 'number' 
              ? primeiroItem.valorUnitario 
              : parseCurrencyValue(String(primeiroItem.valorUnitario || '0'));
            novoItem.valorUnitario = valorNum.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }
        }
      } else if (novoItem.modoCadastro === 'categoria') {
        
        // Aplicar localidade do boletim se nÃ£o estiver definida
        if (!novoItem.local && localidadeBoletim) {
          novoItem.local = localidadeBoletim;
        }
      } else {
        // Aplicar localidade do boletim se nÃ£o estiver definida
        // Se for o primeiro item, usar localidade do boletim
        // Se jÃ¡ existem itens, usar o local do primeiro item
        if (!novoItem.local) {
          if (itens.length === 0 && localidadeBoletim) {
            novoItem.local = localidadeBoletim;
          } else if (itens.length > 0 && itens[0].local) {
            novoItem.local = itens[0].local;
          } else if (localidadeBoletim) {
            novoItem.local = localidadeBoletim;
          }
        }
      }
    }

    // Se for receptoras, usar letra + espaÃ§o + nÃºmero (ex: M 1815)
    let tatuagemFinal = novoItem.tatuagem;
    if (activeTab === 'bovinos' && dadosNF.ehReceptoras) {
      const letra = (dadosNF.receptoraLetra || '').trim();
      const numero = (dadosNF.receptoraNumero || '').trim();
      tatuagemFinal = letra ? `${letra} ${numero}`.trim() : numero;
    }

    // Determinar o local final: se jÃ¡ existem itens, usar o local do primeiro item
    let localFinal = novoItem.local || localidadeBoletim || null;
    if (itens.length > 0 && itens[0].local) {
      localFinal = itens[0].local;
    }

    const item = {
      ...novoItem,
      id: Date.now(),
      tipoItem: activeTab, // bovinos, semen, embrioes
      tipoProduto: activeTab === 'bovinos' ? 'bovino' : activeTab, // Adicionado explicitamente
      valorUnitario: parseCurrencyValue(novoItem.valorUnitario),
      // Garantir que a localidade seja aplicada e fixada
      local: localFinal,
      // Usar tatuagem da receptora se for receptoras
      tatuagem: tatuagemFinal || novoItem.tatuagem
    };

    setItens([...itens, item]);
    
    // Resetar formulÃ¡rio mas manter alguns dados
    if (activeTab === 'bovinos') {
      if (dadosNF.ehReceptoras) {
        // Para receptoras, copiar era e valor unitÃ¡rio do primeiro item automaticamente
        // Agora que o item foi adicionado, buscar o primeiro item da lista atualizada
        const itensAtualizados = [...itens, item];
        const primeiroItemBovino = itensAtualizados.find(i => i.tipoProduto === 'bovino');
        
        let eraParaCopiar = '';
        let valorParaCopiar = '';
        
        if (primeiroItemBovino) {
          // Sempre copiar era e valor unitÃ¡rio do primeiro item para os prÃ³ximos
          eraParaCopiar = primeiroItemBovino.era || '';
          
          // Converter valor unitÃ¡rio para formato de string no formato brasileiro
          if (primeiroItemBovino.valorUnitario) {
            const valorNum = typeof primeiroItemBovino.valorUnitario === 'number' 
              ? primeiroItemBovino.valorUnitario 
              : parseCurrencyValue(String(primeiroItemBovino.valorUnitario));
            // Formatar no formato brasileiro (ex: 7070.14 -> "7.070,14")
            valorParaCopiar = valorNum.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }
        }
        
        // Limpar nÃºmero para prÃ³xima receptora e focar no campo
        setDadosNF(prev => ({ ...prev, receptoraNumero: '' }));
        setNovoItem(prev => ({
          ...prev,
          sexo: 'femea',
          raca: 'MestiÃ§a',
          era: eraParaCopiar || prev.era,
          valorUnitario: valorParaCopiar || prev.valorUnitario,
          peso: '',
          modoCadastro: 'individual',
          tipoAnimal: 'registrado'
        }));
        setTimeout(() => numeroReceptoraInputRef.current?.focus(), 50);
      } else if (manterSerieAutomaticamente && novoItem.modoCadastro === 'individual') {
        // Tentar incrementar tatuagem
        let proximaTatuagem = '';
        const match = novoItem.tatuagem.match(/^(\D*)(\d+)(\D*)$/);
        if (match) {
          const prefix = match[1];
          const num = parseInt(match[2]);
          const suffix = match[3];
          proximaTatuagem = `${prefix}${String(num + 1).padStart(match[2].length, '0')}${suffix}`;
        }

        setNovoItem(prev => ({
          ...prev,
          tatuagem: proximaTatuagem,
          // Manter outros campos
          sexo: prev.sexo,
          era: prev.era,
          raca: prev.raca,
          peso: prev.peso,
          valorUnitario: prev.valorUnitario // Manter string formatada
        }));
      } else {
        resetNovoItem();
      }
    } else {
      resetNovoItem();
    }
  };

  const removerItem = (id) => {
    setItens(itens.filter(i => i.id !== id));
  };

  const editarItem = (index, campo, valor) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    setItens(novosItens);
  };

  const calcularValorTotal = () => {
    return itens.reduce((total, item) => {
      let qtd = 1;
      if (item.tipoItem === 'bovinos' && item.modoCadastro === 'categoria') {
        qtd = parseInt(item.quantidade) || 1;
      } else if (item.tipoItem === 'semen') {
        qtd = parseInt(item.quantidadeDoses) || 1;
      } else if (item.tipoItem === 'embrioes') {
        qtd = parseInt(item.quantidadeEmbrioes) || 1;
      }
      const valorUnit = typeof item.valorUnitario === 'number' ? item.valorUnitario : parseCurrencyValue(item.valorUnitario);
      return total + (qtd * (valorUnit || 0));
    }, 0);
  };

  // FunÃ§Ãµes para busca de animais (Bovinos - SaÃ­da)
  const filtrarAnimais = () => {
    if (!buscaAnimais) return [];
    
    const termo = buscaAnimais.toLowerCase().trim();
    
    // Normalizar o termo de busca (remover espaÃ§os e hÃ­fens)
    const termoNormalizado = termo.replace(/[-\s]/g, '');
    
    // Debug: verificar se o animal CJCJ 16174 estÃ¡ na lista
    if (termo.includes('16174') || termo.includes('cjcj')) {
      const animalEncontrado = animals.find(a => 
        String(a.serie || '').toLowerCase() === 'cjcj' && 
        String(a.rg || '').trim() === '16174'
      );
      if (animalEncontrado) {
        console.log('âÅ“â€¦ Animal CJCJ 16174 encontrado na lista:', animalEncontrado);
      } else {
        console.log('â�Å’ Animal CJCJ 16174 NÃÆ’O encontrado na lista. Total de animais:', animals.length);
        console.log('Primeiros 5 animais:', animals.slice(0, 5).map(a => `${a.serie} ${a.rg}`));
      }
    }
    
    return animals.filter(animal => {
      // Converter tudo para string e normalizar
      const serie = String(animal.serie || '').toLowerCase().trim();
      const rg = String(animal.rg || '').toLowerCase().trim();
      const nome = String(animal.nome || '').toLowerCase().trim();
      
      // Criar variaÃ§Ãµes de identificaÃ§Ã£o
      const identificacao = `${serie} ${rg}`.trim().toLowerCase();
      const identificacaoSemEspaco = `${serie}${rg}`.trim().toLowerCase();
      const identificacaoHifen = `${serie}-${rg}`.trim().toLowerCase();
      
      // Normalizar identificaÃ§Ãµes (remover espaÃ§os e hÃ­fens)
      const identificacaoNormalizada = identificacaoSemEspaco.replace(/[-\s]/g, '');
      
      // Busca flexÃ­vel
      const encontrado = serie.includes(termo) || 
             rg.includes(termo) || 
             nome.includes(termo) ||
             identificacao.includes(termo) ||
             identificacaoSemEspaco.includes(termo) ||
             identificacaoHifen.includes(termo) ||
             identificacaoNormalizada.includes(termoNormalizado) ||
             // Busca por parte do termo (ex: "CJCJ 16174" encontra "CJCJ16174")
             (termoNormalizado && identificacaoNormalizada.includes(termoNormalizado)) ||
             // Busca reversa (ex: "16174 CJCJ" encontra "CJCJ 16174")
             (termo.includes(serie) && termo.includes(rg));
      
      return encontrado;
    }).slice(0, 10); // Aumentar para 10 resultados
  };

  const selecionarAnimal = (animal) => {
    setAnimalSelecionado(animal);

    // Normalizar sexo
    const sexoNormalizado = animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M') ? 'macho' : 'femea';
    
    // Calcular era com base em meses ou data de nascimento
    let eraCalculada = '';
    let meses = animal.meses;

    if (!meses && animal.data_nascimento) {
      const birthDate = new Date(animal.data_nascimento);
      const today = new Date();
      meses = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    }

    if (meses !== undefined && meses !== null) {
      if (sexoNormalizado === 'femea') {
        // FÃÅ MEA: 0-7 / 7-12 / 12-18 / 18-24 / 24+
        if (meses <= 7) eraCalculada = '0/7';
        else if (meses <= 12) eraCalculada = '7/12';
        else if (meses <= 18) eraCalculada = '12/18';
        else if (meses <= 24) eraCalculada = '18/24';
        else eraCalculada = '24+';
      } else {
        // MACHO: 0-7 / 7-15 / 15-18 / 18-22 / 22+
        if (meses <= 7) eraCalculada = '0/7';
        else if (meses <= 15) eraCalculada = '7/15';
        else if (meses <= 18) eraCalculada = '15/18';
        else if (meses <= 22) eraCalculada = '18/22';
        else eraCalculada = '22+';
      }
    }

    // Se for o primeiro animal e houver localidade do boletim, fixar o local
    let localAnimal = animal.local || '';
    if (itens.length === 0 && localidadeBoletim) {
      localAnimal = localidadeBoletim;
    } else if (itens.length > 0 && itens[0].local) {
      // Se jÃ¡ existem itens, usar o local do primeiro item
      localAnimal = itens[0].local;
    }

    setNovoItem(prev => ({
      ...prev,
      animalId: animal.id, // Armazenar ID para integraÃ§Ã£o
      tatuagem: `${animal.serie || ''}${animal.rg || ''}`,
      sexo: sexoNormalizado,
      raca: animal.raca || '',
      peso: animal.peso || '',
      era: eraCalculada,
      local: localAnimal
    }));
    setBuscaAnimais(`${animal.serie || ''}${animal.rg || ''}`);
    setMostrarListaAnimais(false);
  };

  // Efeito para carregar animal inicial se fornecido
  useEffect(() => {
    if (isOpen && initialAnimal) {
      setDadosNF(prev => ({ ...prev, tipo: 'saida' }));
      setActiveTab('bovinos');
      // Pequeno delay para garantir que o estado inicial foi setado
      setTimeout(() => {
        selecionarAnimal(initialAnimal);
      }, 100);
    }
  }, [isOpen, initialAnimal]);

  // Efeito para carregar dados da NF para ediÃ§Ã£o
  useEffect(() => {
    if (isOpen && nfEditando) {
      console.log('ðÅ¸â€œ� Editando NF:', nfEditando);
      
      // Normalizar itens se necessÃ¡rio
      const itensNormalizados = (nfEditando.itens || []).map(item => ({
        ...item,
        valorUnitario: item.valor_unitario || item.valorUnitario || 0,
        tipoItem: item.tipo_item || item.tipoItem || nfEditando.tipoProduto || 'bovino',
        tipoProduto: item.tipo_produto || item.tipoProduto || nfEditando.tipoProduto || 'bovino'
      }));

      // Normalizar data (remover T e hora se houver)
      let dataFormatada = '';
      if (nfEditando.data || nfEditando.data_compra) {
        const dataStr = nfEditando.data || nfEditando.data_compra;
        if (dataStr.includes('T')) {
          dataFormatada = dataStr.split('T')[0];
        } else {
          dataFormatada = dataStr;
        }
      }

      setDadosNF({
        id: nfEditando.id,
        numeroNF: nfEditando.numeroNF || nfEditando.numero_nf || '',
        serieNF: nfEditando.serie || '',
        dataCompra: dataFormatada,
        dataSaida: nfEditando.dataSaida || nfEditando.data_saida || '',
        motorista: nfEditando.motorista || '',
        origem: nfEditando.fornecedor || nfEditando.destino || nfEditando.destinatario || '',
        cnpjOrigemDestino: nfEditando.cnpjOrigemDestino || nfEditando.cnpj_origem_destino || '',
        endereco: nfEditando.endereco || '',
        bairro: nfEditando.bairro || '',
        cep: nfEditando.cep || '',
        municipio: nfEditando.municipio || '',
        uf: nfEditando.uf || '',
        telefone: nfEditando.telefone || '',
        incricao: nfEditando.incricao || '',
        tipo: nfEditando.tipo || 'entrada',
        naturezaOperacao: nfEditando.naturezaOperacao || nfEditando.natureza_operacao || 'Compra',
        chaveAcesso: nfEditando.chaveAcesso || nfEditando.chave_acesso || '',
        valorTotalNF: formatCurrencyInput(nfEditando.valorTotal || nfEditando.valor_total || 0),
        observacoes: nfEditando.observacoes || '',
        periodoBoletim: nfEditando.periodoBoletim || '',
        ehReceptoras: nfEditando.ehReceptoras || nfEditando.eh_receptoras || false,
        receptoraLetra: nfEditando.receptoraLetra || nfEditando.receptora_letra || '',
        receptoraNumero: nfEditando.receptoraNumero || nfEditando.receptora_numero || '',
        dataTE: nfEditando.dataTE || nfEditando.data_te || '',
        dataChegadaAnimais: nfEditando.dataChegadaAnimais || nfEditando.data_chegada_animais || ''
      });

      setItens(itensNormalizados);
      
      // Definir aba ativa com base no tipo de produto
      const tipoProd = nfEditando.tipoProduto || nfEditando.tipo_produto || (itensNormalizados[0] ? itensNormalizados[0].tipoProduto : 'bovino');
      if (tipoProd === 'semen') setActiveTab('semen');
      else if (tipoProd === 'embriao') setActiveTab('embrioes');
      else setActiveTab('bovinos');
      
    } else if (isOpen && !nfEditando && !initialAnimal) {
      // Limpar formulÃ¡rio se for novo cadastro (apenas se nÃ£o estiver editando nem importando animal)
      setDadosNF({
        numeroNF: '',
        serieNF: '',
        dataCompra: new Date().toISOString().split('T')[0],
        dataChegadaAnimais: '',
        dataSaida: '',
        motorista: '',
        origem: '',
        cnpjOrigemDestino: '',
        endereco: '',
        bairro: '',
        cep: '',
        municipio: '',
        uf: '',
        telefone: '',
        incricao: '',
        tipo: tipo || 'entrada',
        naturezaOperacao: (tipo === 'saida') ? 'Venda' : 'Compra',
        chaveAcesso: '',
        valorTotalNF: '',
        observacoes: '',
        periodoBoletim: '',
        ehReceptoras: false,
        receptoraLetra: '',
        receptoraNumero: '',
        dataTE: '',
        dataChegadaAnimais: ''
      });
      setItens([]);
      // NÃ£o resetar activeTab aqui para manter a escolha do usuÃ¡rio se ele fechar e abrir
      // Mas resetar se quiser forÃ§ar bovinos
      // setActiveTab('bovinos'); 
    }
  }, [isOpen, nfEditando]);

  const handleSave = () => {
    if (!dadosNF.numeroNF || !dadosNF.origem || !dadosNF.dataCompra || !dadosNF.naturezaOperacao) {
      alert('Preencha os dados obrigatÃ³rios da Nota Fiscal (NÃºmero, Origem, Data e Natureza da OperaÃ§Ã£o)');
      return;
    }

    if (itens.length === 0) {
      alert('Adicione pelo menos um item Ã  Nota Fiscal');
      return;
    }

    // Determinar tipoProduto com base nos itens ou aba ativa
    const tipoProduto = itens.length > 0 ? (itens[0].tipoProduto || 'bovino') : 'bovino';

    // Mapear origem para fornecedor ou destino baseado no tipo de operaÃ§Ã£o
    const fornecedor = dadosNF.tipo === 'entrada' ? dadosNF.origem : null;
    const destino = dadosNF.tipo === 'saida' ? dadosNF.origem : null;

    const nfData = {
      ...dadosNF,
      data: dadosNF.dataCompra, // Mapear dataCompra para data (exigido pela API)
      dataChegadaAnimais: dadosNF.dataChegadaAnimais || null, // Data de chegada para DG + 15 dias
      itens,
      tipoProduto, // Campo obrigatÃ³rio para API
      fornecedor,  // Mapeado de origem
      destino,     // Mapeado de origem
      valorTotalCalculado: calcularValorTotal(),
      // Se valor total da NF nÃ£o for informado, usa o calculado
      valorTotal: dadosNF.valorTotalNF ? parseCurrencyValue(dadosNF.valorTotalNF) : calcularValorTotal()
    };

    onSave(nfData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ðÅ¸§¾ Cadastro de Nota Fiscal
            </h3>
            <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg border border-green-300 dark:border-green-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total:</span>
              <span className="ml-2 text-lg font-bold text-green-700 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularValorTotal())}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dados da NF */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
              Dados da Nota Fiscal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NÃºmero NF *
                </label>
                <input
                  type="text"
                  value={dadosNF.numeroNF}
                  onChange={(e) => setDadosNF({...dadosNF, numeroNF: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: 123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de EmissÃ£o *
                </label>
                <input
                  type="date"
                  value={normalizarDataParaInput(dadosNF.dataCompra)}
                  onChange={(e) => setDadosNF({...dadosNF, dataCompra: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {dadosNF.tipo === 'entrada' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Chegada dos Animais
                  </label>
                  <input
                    type="date"
                    value={normalizarDataParaInput(dadosNF.dataChegadaAnimais)}
                    onChange={(e) => setDadosNF({...dadosNF, dataChegadaAnimais: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dadosNF.ehReceptoras ? 'DG Ã© feito 15 dias apÃ³s esta data' : 'Opcional'}
                  </p>
                </div>
              )}
              {dadosNF.tipo === 'saida' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de SaÃ­da
                    </label>
                    <input
                      type="date"
                      value={normalizarDataParaInput(dadosNF.dataSaida)}
                      onChange={(e) => setDadosNF({...dadosNF, dataSaida: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Data em que os animais saÃ­ram da propriedade
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome do Motorista
                    </label>
                    <input
                      type="text"
                      value={dadosNF.motorista || ''}
                      onChange={(e) => setDadosNF({...dadosNF, motorista: e.target.value})}
                      placeholder="Nome do motorista (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Opcional - Nome do motorista responsÃ¡vel pelo transporte
                    </p>
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de OperaÃ§Ã£o
                </label>
                <select
                  value={dadosNF.tipo}
                  onChange={(e) => {
                    const novoTipo = e.target.value;
                    setDadosNF({
                      ...dadosNF, 
                      tipo: novoTipo,
                      naturezaOperacao: novoTipo === 'entrada' ? 'Compra' : 'Venda'
                    });
                  }}
                  disabled={tipo && tipo !== ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="entrada">Entrada (Compra)</option>
                  <option value="saida">SaÃ­da (Venda)</option>
                </select>
                {tipo && tipo !== '' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tipo fixo: {tipo === 'entrada' ? 'Entrada (Compra)' : 'SaÃ­da (Venda)'}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Natureza da OperaÃ§Ã£o *
                </label>
                <input
                  type="text"
                  value={dadosNF.naturezaOperacao}
                  onChange={(e) => setDadosNF({...dadosNF, naturezaOperacao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Venda, Compra, TransferÃªncia"
                />
              </div>
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {dadosNF.tipo === 'saida' ? 'DestinatÃ¡rio *' : 'Origem/Fornecedor *'}
                </label>
                <input
                  type="text"
                  value={dadosNF.origem}
                  onChange={(e) => {
                    setDadosNF({...dadosNF, origem: e.target.value});
                    setMostrarSugestoesContatos(true);
                  }}
                  onFocus={() => setMostrarSugestoesContatos(true)}
                  onBlur={() => setTimeout(() => setMostrarSugestoesContatos(false), 200)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={dadosNF.tipo === 'saida' ? 'Nome do destinatÃ¡rio' : 'Nome do fornecedor'}
                  autoComplete="off"
                />
                
                {/* SugestÃµes de Contatos */}
                {mostrarSugestoesContatos && dadosNF.origem && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
                    {filtrarContatos().map((contato, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-gray-100 text-sm flex justify-between items-center"
                        onClick={() => selecionarContato(contato)}
                      >
                        <span className="font-medium">{contato.nome}</span>
                        {contato.documento && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{contato.documento}</span>
                        )}
                      </div>
                    ))}
                    {filtrarContatos().length === 0 && dadosNF.origem.length > 2 && (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm italic">
                        Nenhum contato encontrado. SerÃ¡ cadastrado como novo.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CNPJ/CPF
                </label>
                <input
                  type="text"
                  value={dadosNF.cnpjOrigemDestino}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDadosNF({...dadosNF, cnpjOrigemDestino: val});
                    setMostrarSugestoesDocumento(val.length >= 3); // Mostrar sugestÃµes apÃ³s 3 caracteres
                    if (val.replace(/\D/g, '').length === 14) {
                      buscarCNPJ(val);
                    }
                  }}
                  onBlur={(e) => {
                    // Delay para permitir clique na sugestÃ£o
                    setTimeout(() => {
                      setMostrarSugestoesDocumento(false);
                      buscarCNPJ(e.target.value);
                    }, 200);
                  }}
                  onFocus={() => {
                    if (dadosNF.cnpjOrigemDestino.length >= 3) {
                      setMostrarSugestoesDocumento(true);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="00.000.000/0000-00"
                />
                
                {/* Dropdown de sugestÃµes de contatos por documento */}
                {mostrarSugestoesDocumento && filtrarContatosPorDocumento().length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filtrarContatosPorDocumento().map((contato, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          selecionarContato(contato);
                          setMostrarSugestoesDocumento(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {contato.nome}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {contato.documento}
                        </div>
                        {contato.municipio && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {contato.municipio}/{contato.uf}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Total NF (R$)
                </label>
                <div className="relative">
                   <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">R$</span>
                   <input
                    type="text"
                    value={dadosNF.valorTotalNF}
                    onChange={(e) => setDadosNF({...dadosNF, valorTotalNF: formatCurrencyInput(e.target.value)})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* EndereÃ§o Completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  EndereÃ§o
                </label>
                <input
                  type="text"
                  value={dadosNF.endereco}
                  onChange={(e) => setDadosNF({...dadosNF, endereco: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Rua, nÃºmero, complemento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={dadosNF.bairro}
                  onChange={(e) => setDadosNF({...dadosNF, bairro: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Bairro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={dadosNF.cep}
                  onChange={(e) => setDadosNF({...dadosNF, cep: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="00000-000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  MunicÃ­pio
                </label>
                <input
                  type="text"
                  value={dadosNF.municipio}
                  onChange={(e) => setDadosNF({...dadosNF, municipio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  value={dadosNF.uf}
                  onChange={(e) => setDadosNF({...dadosNF, uf: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="UF"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={dadosNF.telefone}
                  onChange={(e) => setDadosNF({...dadosNF, telefone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  InscriÃ§Ã£o Estadual
                </label>
                <input
                  type="text"
                  value={dadosNF.incricao}
                  onChange={(e) => setDadosNF({...dadosNF, incricao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="IE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Boletim ContÃ¡bil
                </label>
                <select
                  value={dadosNF.periodoBoletim}
                  onChange={(e) => setDadosNF({...dadosNF, periodoBoletim: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione um boletim...</option>
                  {boletins.map(boletim => {
                    const statusText = boletim.status === 'fechado' ? 'Fechado' : 'Aberto'
                    const localidadeText = boletim.localidade ? ` - ${boletim.localidade}` : ''
                    return (
                      <option key={boletim.periodo || boletim.id} value={boletim.periodo}>
                        {boletim.periodo} - {statusText}{localidadeText}
                      </option>
                    )
                  })}
                </select>
                {localidadeBoletim && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      ðÅ¸â€œ� <strong>Localidade:</strong> {localidadeBoletim}
                    </p>
                    {dadosNF.tipo === 'entrada' && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Gado entrarÃ¡ em <strong>{localidadeBoletim}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
              {/* SeÃ§Ã£o ObservaÃ§Ãµes e Receptoras - Vinculadas */}
              <div className="md:col-span-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ObservaÃ§Ãµes
                  </label>
                  <textarea
                    value={dadosNF.observacoes}
                    onChange={(e) => setDadosNF({...dadosNF, observacoes: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="InformaÃ§Ãµes adicionais da nota fiscal..."
                  />
                </div>

                {/* SeÃ§Ã£o Receptoras - Integrada ao formulÃ¡rio principal */}
                {dadosNF.tipo === 'entrada' && (
                  <div className={`transition-all duration-300 ease-in-out ${
                    dadosNF.ehReceptoras 
                      ? 'mt-4 pt-4 border-t-2 border-pink-200 dark:border-pink-700' 
                      : 'mt-0 pt-0 border-t-0'
                  }`}>
                    <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      dadosNF.ehReceptoras 
                        ? 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-indigo-900/30 border-pink-300 dark:border-pink-700 shadow-lg' 
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        id="ehReceptoras"
                        checked={dadosNF.ehReceptoras}
                        onChange={(e) => {
                          const ehReceptoras = e.target.checked;
                          setDadosNF({
                            ...dadosNF,
                            ehReceptoras,
                            dataTE: ehReceptoras && !dadosNF.dataTE ? dadosNF.dataCompra : dadosNF.dataTE,
                            // Se marcar como receptoras, sugerir data de chegada = data de emissÃ£o (DG = 15 dias apÃ³s)
                            dataChegadaAnimais: ehReceptoras && !dadosNF.dataChegadaAnimais ? dadosNF.dataCompra : dadosNF.dataChegadaAnimais
                          });
                        }}
                        className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 cursor-pointer transition-all"
                      />
                      <label htmlFor="ehReceptoras" className={`text-sm font-semibold cursor-pointer transition-colors ${
                        dadosNF.ehReceptoras 
                          ? 'text-pink-700 dark:text-pink-300' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        ðÅ¸¤° Ãâ€° Receptoras?
                      </label>
                    </div>

                    {dadosNF.ehReceptoras && (
                      <div className="mt-4 space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Letra da Receptora *
                            </label>
                            <input
                              type="text"
                              value={dadosNF.receptoraLetra}
                              onChange={(e) => setDadosNF({...dadosNF, receptoraLetra: e.target.value.toUpperCase()})}
                              className="w-full px-3 py-2 border-2 border-pink-300 dark:border-pink-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white transition-all"
                              placeholder="Ex: M"
                              maxLength={2}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Letra fixa para o lote</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              NÃºmero da Receptora * <span className="font-normal text-gray-500">(formato: M 1815)</span>
                            </label>
                            <div className="flex items-center gap-1 border-2 border-pink-300 dark:border-pink-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                              {dadosNF.receptoraLetra && (
                                <span className="px-3 py-2 bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200 font-semibold shrink-0">
                                  {dadosNF.receptoraLetra.trim()}{' '}
                                </span>
                              )}
                              <input
                                ref={numeroReceptoraInputRef}
                                type="text"
                                value={dadosNF.receptoraNumero}
                                onChange={(e) => setDadosNF({...dadosNF, receptoraNumero: e.target.value})}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    adicionarItem();
                                  }
                                }}
                                className="flex-1 min-w-0 px-3 py-2 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none"
                                placeholder={dadosNF.receptoraLetra ? "digite o nÃºmero" : "Digite letra primeiro"}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Digite o nÃºmero e pressione ENTER para adicionar a prÃ³xima</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Data de TE *
                            </label>
                            <input
                              type="date"
                              value={normalizarDataParaInput(dadosNF.dataTE)}
                              onChange={(e) => setDadosNF({...dadosNF, dataTE: e.target.value})}
                              className="w-full px-3 py-2 border-2 border-pink-300 dark:border-pink-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white transition-all"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Data fixa (pode alterar)</p>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-xl">ââ€ž¹ï¸�</span>
                            <div>
                              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                InformaÃ§Ãµes sobre Receptoras
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                Ao salvar esta NF de Receptoras, serÃ¡ gerado automaticamente um <strong>relatÃ³rio para DG</strong>. 
                                As receptoras precisarÃ£o passar pelo <strong>DG 15 dias apÃ³s a data de chegada dos animais</strong>. 
                                O app envia alerta e permite exportar em Excel as que ainda faltam dar DG. Se der prenha, serÃ£o movimentadas para <strong>ReproduÃ§Ã£o/Nascimentos</strong>.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Abas */}
          <div>
            {/* Banner Lote TE */}
            {loteSugerido && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
                    <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                            ðÅ¸â€œâ€¹ Lote de TE Detectado
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Identificamos que o animal pertence a um lote de <strong>{loteSugerido.quantidade} receptoras</strong> da <strong>{loteSugerido.central}</strong> ({new Date(loteSugerido.data_te).toLocaleDateString()}).
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Deseja importar todos os animais deste lote para a nota fiscal?
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={() => setLoteSugerido(null)}
                            className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                        >
                            Ignorar
                        </button>
                        <button 
                            onClick={importarLote}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded shadow-sm transition-colors font-medium"
                        >
                            Importar Lote ({loteSugerido.quantidade})
                        </button>
                    </div>
                </div>
            )}

            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
              <button
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'bovinos'
                    ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('bovinos')}
              >
                ðÅ¸�â€ž Bovinos
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'semen'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('semen')}
              >
                ðÅ¸§¬ SÃªmen
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'embrioes'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('embrioes')}
              >
                ðÅ¸§« EmbriÃµes
              </button>
            </div>

            {/* FormulÃ¡rios por Aba */}
            {activeTab === 'bovinos' && (
              <FormularioBovino
                novoItem={novoItem}
                setNovoItem={setNovoItem}
                adicionarItem={adicionarItem}
                tipo={dadosNF.tipo}
                buscaAnimais={buscaAnimais}
                setBuscaAnimais={setBuscaAnimais}
                mostrarListaAnimais={mostrarListaAnimais}
                setMostrarListaAnimais={setMostrarListaAnimais}
                animalSelecionado={animalSelecionado}
                filtrarAnimais={filtrarAnimais}
                selecionarAnimal={selecionarAnimal}
                manterSerieAutomaticamente={manterSerieAutomaticamente}
                setManterSerieAutomaticamente={setManterSerieAutomaticamente}
                verificarLoteTE={verificarLoteTE}
                ehReceptoras={dadosNF.ehReceptoras}
                itens={itens}
              />
            )}

            {activeTab === 'semen' && (
              <FormularioSemen
                novoItem={novoItem}
                setNovoItem={setNovoItem}
                adicionarItem={adicionarItem}
              />
            )}

            {activeTab === 'embrioes' && (
              <FormularioEmbriao
                novoItem={novoItem}
                setNovoItem={setNovoItem}
                adicionarItem={adicionarItem}
              />
            )}
          </div>

          {/* Lista de Itens */}
          <ListaItens
            itens={itens}
            removerItem={removerItem}
            valorTotal={calcularValorTotal()}
            editarItem={editarItem}
            valorTotalNF={dadosNF.valorTotalNF}
          />

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Salvar Nota Fiscal
          </button>
        </div>
      </div>

      {/* Modal de ImportaÃ§Ã£o em Lote */}
      <BatchImportModal 
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onImport={confirmarImportacaoLote}
        batchData={loteSugerido?.itens || []}
        batchInfo={loteSugerido}
        existingAnimals={animals}
      />
    </div>
  );
}
