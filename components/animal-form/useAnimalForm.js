import { useState, useEffect, useCallback } from 'react';
import costManager from '../../services/costManager';
import animalDataManager from '../../services/animalDataManager';
import { RACAS_POR_SERIE as racasPorSerie } from '../../utils/constants';
import { fetchAvailableLocations } from '../../utils/piqueteUtils';

export default function useAnimalForm(animal, isOpen, onClose, onSave) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [nfsCadastradas, setNfsCadastradas] = useState([]);
  const [naturezasOperacao, setNaturezasOperacao] = useState([]);
  
  // Initial state
  const initialFormState = {
    nome: '',
    serie: '',
    rg: '',
    sexo: '',
    raca: '',
    dataNascimento: '',
    dataChegada: '', // Data de chegada para cálculo de DG
    meses: 0,
    situacao: 'Ativo',
    pai: '',
    paiSerie: '',
    paiRg: '',
    mae: '',
    maeSerie: '',
    maeRg: '',
    receptoraRg: '',
    receptoraSerie: '', // Adicionado
    receptoraCota: '', // Adicionado
    isFiv: false,
    valorVenda: '',
    abczg: '',
    deca: '',
    situacaoAbcz: '',
    observacoes: '',
    pesoEntrada: '',
    dataEntrada: new Date().toISOString().split('T')[0],
    lote: '',
    origem: '',
    nfCompra: '', // ID da NF
    valorCompra: '',
    aplicarProtocolo: false,
    aplicarDNA: false,
    pastoAtual: '',
    localNascimento: '',
    boletim: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [availableLocations, setAvailableLocations] = useState([]);

  // Load locations (usa utilitário que filtra nomes de touros cadastrados por engano como piquete)
  useEffect(() => {
    fetchAvailableLocations()
      .then(setAvailableLocations)
      .catch((err) => console.error('Erro ao carregar locais:', err))
  }, [])

  // Load NFs
  const loadNotasFiscais = useCallback(async () => {
    try {
      const response = await fetch('/api/notas-fiscais');
      if (response.ok) {
        const data = await response.json();
        let nfsList = [];

        // Verificar se os dados vieram no formato { data: [...] } ou diretamente [...]
        if (data.data && Array.isArray(data.data)) {
          nfsList = data.data;
        } else if (Array.isArray(data)) {
          nfsList = data;
        } else {
          console.warn('Formato de dados de notas fiscais inválido:', data);
          nfsList = [];
        }

        // Mapear campos para o formato esperado pelo componente
        const nfsMapeadas = nfsList.map(nf => ({
          ...nf,
          id: nf.id,
          numeroNF: nf.numero_nf || nf.numeroNF,
          origem: nf.fornecedor || nf.origem || 'Desconhecido',
          dataCompra: nf.data_compra || nf.dataCompra || nf.data,
          valorPorReceptora: nf.valor_total // Aproximação, já que a API retorna o total
        }));

        setNfsCadastradas(nfsMapeadas);
      }
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
      setNfsCadastradas([]);
    }
  }, []);

  // Load naturezas de operação
  useEffect(() => {
    const fetchNaturezas = async () => {
      try {
        const response = await fetch('/api/nf/naturezas');
        if (response.ok) {
          const data = await response.json();
          setNaturezasOperacao(data);
        } else {
          // Fallback se a API falhar
          const savedNaturezas = localStorage.getItem('naturezasOperacao');
          if (savedNaturezas) {
            setNaturezasOperacao(JSON.parse(savedNaturezas));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar naturezas:', error);
      }
    };

    fetchNaturezas();
    loadNotasFiscais();
  }, [loadNotasFiscais]);

  // Normalizar data para input type="date" (YYYY-MM-DD)
  const toDateInputValue = (val) => {
    if (!val) return '';
    const str = typeof val === 'string' ? val : (val instanceof Date ? val.toISOString() : String(val));
    const match = str.match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : '';
  };

  // Reset/Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (animal) {
        const rawNascimento = animal.dataNascimento ?? animal.data_nascimento;
        const piquete = animal.pastoAtual ?? animal.pasto_atual ?? animal.piqueteAtual ?? animal.piquete_atual ?? '';
        setFormData({
          ...initialFormState,
          ...animal,
          nome: animal.nome || '',
          dataNascimento: toDateInputValue(rawNascimento),
          dataChegada: toDateInputValue(animal.dataChegada ?? animal.data_chegada),
          pastoAtual: piquete,
          observacoes: animal.observacoes || '',
          abczg: animal.abczg || '',
          deca: animal.deca || '',
          situacaoAbcz: animal.situacao_abcz || animal.situacaoAbcz || '',
          // Ensure arrays/objects don't crash if missing
        });
      } else {
        setFormData(initialFormState);
      }
      setErrors({});
    }
  }, [animal, isOpen]);

  // Handle changes safely
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSerieChange = (serie) => {
    const newFormData = { ...formData, serie };

    if (racasPorSerie[serie]) {
      newFormData.raca = racasPorSerie[serie];
    }

    // Regras específicas para RPT
    if (serie === 'RPT') {
      newFormData.sexo = 'Fêmea';
      newFormData.raca = 'Receptora';
      newFormData.meses = 30;
      newFormData.dataNascimento = ''; // Receptoras geralmente não têm data nasc exata
    }
    
    // Regras específicas para PA
    if (serie === 'PA') {
      newFormData.sexo = 'Fêmea';
      newFormData.raca = 'Nelore PA';
    }

    setFormData(newFormData);
    
    // Clear error
    if (errors.serie) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.serie;
        return newErrors;
      });
    }
  };

  const calculateMeses = (dataNascimento) => {
    if (!dataNascimento) return 0;
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - nascimento);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  };

  const handleDateChange = (date) => {
    const meses = calculateMeses(date);
    setFormData(prev => ({ ...prev, dataNascimento: date, meses }));
  };

  const validateForm = () => {
    const newErrors = {};
    const camposObrigatorios = [];

    if (!formData.serie) {
      newErrors.serie = "Série é obrigatória";
      camposObrigatorios.push("Série");
    }
    
    if (!formData.boletim) {
      newErrors.boletim = "Boletim é obrigatório";
      camposObrigatorios.push("Boletim");
    }

    if (!formData.rg) {
      newErrors.rg = "RG é obrigatório";
      camposObrigatorios.push("RG");
    }
    if (formData.rg && formData.rg.length > 20) {
      newErrors.rg = "RG deve ter no máximo 20 dígitos";
    }
    // Validação de formato para série PA (2 letras + 4 números)
    if (formData.serie === 'PA' && formData.rg) {
       // Remove espaços para validação
       const cleanRg = formData.rg.replace(/\s/g, '');
       const rgPattern = /^[A-Z]{2}[0-9]{4}$/;
       if (!rgPattern.test(cleanRg)) {
          newErrors.rg = "RG PA deve ter 2 letras e 4 números (ex: AA1234 ou AA 1234)";
       }
    }

    if (!formData.sexo) {
      newErrors.sexo = "Sexo é obrigatório";
      camposObrigatorios.push("Sexo");
    }
    if (!formData.raca) {
      newErrors.raca = "Raça é obrigatória";
      camposObrigatorios.push("Raça");
    }
    if (!formData.situacao) {
      newErrors.situacao = "Situação é obrigatória";
      camposObrigatorios.push("Situação");
    }

    if (!formData.pastoAtual) {
      newErrors.pastoAtual = "Localização Atual (Piquete) é obrigatória";
      camposObrigatorios.push("Localização Atual");
    }

    // Validação específica para RPT (precisa de peso ou valor)
    if (formData.serie === 'RPT' && !formData.pesoEntrada && !formData.valorCompra) {
      // newErrors.receptora = "Para receptoras, informe Peso de Entrada ou Valor de Compra";
      // Não bloquear, mas idealmente avisar
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("❌ Erro de validação: Verifique os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);

      // Prepare data for submission
      const dataToSave = {
        ...formData,
        // sexo: formData.sexo === 'Macho' ? 'M' : 'F', // REMOVED: Database expects 'Macho' or 'Fêmea'
        // Clean up empty strings to null if backend expects
      };

      // 1. Salvar animal principal
      let savedAnimal;
      if (animal && animal.id) {
        savedAnimal = await animalDataManager.updateAnimal(animal.id, dataToSave);
      } else {
        savedAnimal = await animalDataManager.addAnimal(dataToSave);
      }

      // 2. Aplicar custos/protocolos se selecionado
      if (savedAnimal && (formData.aplicarProtocolo || formData.aplicarDNA)) {
        // Recarregar animal salvo para garantir ID correto
        const animalId = savedAnimal.id || (animal ? animal.id : null); // Fallback logic
        
        if (animalId) {
           // Simulação de aplicação de custos (já que costManager pode não ser async)
           // Na prática, chamaria uma API ou método do costManager
           console.log('Aplicando custos para animal:', animalId);
           
           if (formData.aplicarProtocolo) {
             costManager.aplicarProtocolo(animalId, {
               ...formData,
               sexo: formData.sexo === 'Macho' ? 'M' : 'F'
             }, 'Protocolo aplicado automaticamente no cadastro');
           }
           
           if (formData.aplicarDNA) {
             // Lógica de DNA
             if (formData.isFiv || formData.receptoraRg) {
                costManager.adicionarCusto(animalId, {
                  tipo: 'Medicamentos',
                  subtipo: 'DNA',
                  descricao: 'DNA Virgem (Paternidade) - Obrigatório',
                  valor: costManager.medicamentos['DNA VIRGEM'].porAnimal,
                  data: new Date().toISOString().split('T')[0],
                  observacoes: 'Aplicado automaticamente no cadastro'
                });
             }
             if (formData.meses <= 7) {
                costManager.adicionarCusto(animalId, {
                  tipo: 'Medicamentos',
                  subtipo: 'DNA',
                  descricao: 'DNA Genômica - Bezerro',
                  valor: costManager.medicamentos['DNA GENOMICA'].porAnimal,
                  data: new Date().toISOString().split('T')[0],
                  observacoes: 'Aplicado automaticamente no cadastro'
                });
             }
           }
        }
      }

      alert(`✅ Sucesso! ${animal ? "Animal atualizado com sucesso!" : "Novo animal adicionado ao rebanho!"}`);
      if (onSave) {
        const dataToNotify = savedAnimal || (animal?.id ? { ...formData, id: animal.id } : formData);
        await Promise.resolve(onSave(dataToNotify));
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`❌ Erro: ${error.message || "Erro ao salvar animal"}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData, // Exposed for flexible updates if needed, but prefer updateField
    updateField,
    handleSerieChange,
    handleDateChange,
    loading,
    errors,
    handleSubmit,
    nfsCadastradas,
    loadNotasFiscais,
    naturezasOperacao,
    setNaturezasOperacao,
    availableLocations
  };
}
