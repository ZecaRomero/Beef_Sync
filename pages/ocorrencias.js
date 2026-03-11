import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import ImportProgressOverlay from '../components/ImportProgressOverlay'

// Função auxiliar para formatar data
const formatDate = (date, formatStr) => {
  if (!date) return '';
  const d = new Date(date);
  if (formatStr === 'yyyy-MM-dd') {
    return d.toISOString().split('T')[0];
  }
  return d.toLocaleDateString('pt-BR');
};

export default function Ocorrencias() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [importandoExcel, setImportandoExcel] = useState(false);
  const [formData, setFormData] = useState({
    animalId: '',
    nome: '',
    serie: '',
    rg: '',
    sexo: '',
    nascimento: '',
    meses: '',
    dataUltimoPeso: '',
    peso: '',
    paiNomeRg: '',
    avoMaterno: '',
    maeBiologiaRg: '',
    receptora: '',
    // Programa de melhoramento genético
    iabcz: '',
    deca: '',
    mgq: '',
    top: '',
    mgta: '',
    topPrograma: '',
    // Inclusão de serviço
    dataServico: '',
    numeroServicos: 1, // Começar com apenas 1 serviço
    servicos: {
      servico1: { ativo: false, tipo: '', valor: '' },
      servico2: { ativo: false, tipo: '', valor: '' },
      servico3: { ativo: false, tipo: '', valor: '' },
      servico4: { ativo: false, tipo: '', valor: '' },
      servico5: { ativo: false, tipo: '', valor: '' }
    },
    // Campo CE para machos de 9-18 meses
    ce: '',
    mostrarCE: false,
    // Aplicar local no lote
    aplicarLocalLote: false,
    // Campos específicos para fêmeas
    mostrarCamposFemea: false,
    quantidadeFilhos: '',
    quantidadeOocitos: '',
    quantidadeFilhosVendidos: '',
    valorFilhosVendidos: '',
    // Status
    ativos: false,
    vendidos: false,
    baixados: false,
    // Observações
    observacoes: ''
  });

  useEffect(() => {
    console.log('Componente montado, carregando animais...');
    fetchAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnimals = async () => {
    try {
      console.log('Fazendo requisição para /api/animals...');
      const response = await fetch('/api/animals');
      console.log('Resposta recebida:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Dados recebidos:', result);
        
        // A API retorna { status: 'success', data: animais }
        const animalsData = result.data || result;
        console.log('Dados dos animais:', animalsData);
        
        setAnimals(Array.isArray(animalsData) ? animalsData : []);
        console.log('Animais definidos no estado');
      } else {
        console.error('Erro na resposta da API:', response.status);
        setAnimals([]);
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error);
      setAnimals([]);
    }
  };

  const handleAnimalSelect = (animalId) => {
    const animal = animals.find(a => a.id === parseInt(animalId));
    if (animal) {
      setFormData(prev => ({
        ...prev,
        animalId: animal.id,
        nome: animal.serie || '',
        serie: animal.serie || '',
        rg: animal.rg || '',
        sexo: animal.sexo || '',
        nascimento: animal.data_nascimento ? formatDate(animal.data_nascimento, 'yyyy-MM-dd') : '',
        peso: animal.peso || '',
        paiNomeRg: animal.pai || '',
        avoMaterno: '',
        maeBiologiaRg: animal.mae || '',
        receptora: animal.receptora || ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('servico') && name.includes('_')) {
      // Lidar com campos de serviço (tipo e valor)
      const [servicoName, field] = name.split('_');
      setFormData(prev => ({
        ...prev,
        servicos: {
          ...prev.servicos,
          [servicoName]: {
            ...prev.servicos[servicoName],
            [field]: value
          }
        }
      }));
    } else if (name.startsWith('servico')) {
      // Lidar com checkbox de serviço
      setFormData(prev => ({
        ...prev,
        servicos: {
          ...prev.servicos,
          [name]: {
            ...prev.servicos[name],
            ativo: checked
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
      
      // Validação para RG (apenas números)
      if (name === 'rg') {
        const numericValue = value.replace(/\D/g, ''); // Remove tudo que não é número
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
        autoFillAnimalData(formData.serie, numericValue);
        return;
      }

      // Auto-preenchimento quando Série ou RG são alterados
      if (name === 'serie') {
        autoFillAnimalData(value, formData.rg);
      }
    }
  };

  const autoFillAnimalData = (serie, rg) => {
    // Só busca se ambos série e RG estão preenchidos
    if (!serie || !rg) {
      // Se um dos campos foi limpo, limpar os dados preenchidos automaticamente
      if (formData.animalId) {
        setFormData(prev => ({
          ...prev,
          animalId: '',
          nome: '',
          sexo: '',
          nascimento: '',
          meses: '',
          peso: '',
          paiNomeRg: '',
          maeBiologiaRg: '',
          receptora: ''
        }));
      }
      return;
    }
    
    // Busca o animal pelos dados cadastrados no localStorage
    const savedAnimals = JSON.parse(localStorage.getItem('animalData') || '[]');
    const foundAnimal = savedAnimals.find(animal => 
      animal.serie?.toLowerCase().trim() === serie.toLowerCase().trim() && 
      animal.rg?.toLowerCase().trim() === rg.toLowerCase().trim()
    );
    
    if (foundAnimal) {
      // Calcular meses baseado na data de nascimento
      let calculatedMonths = '';
      if (foundAnimal.data_nascimento) {
        calculatedMonths = calculateAge(foundAnimal.data_nascimento).toString();
      } else if (foundAnimal.meses) {
        calculatedMonths = foundAnimal.meses.toString();
      }
      
      // Verificar se deve mostrar campo CE (macho de 9-18 meses)
      const shouldShowCE = foundAnimal.sexo === 'Macho' && 
                          calculatedMonths >= 9 && 
                          calculatedMonths <= 18;

      // Verificar se deve mostrar campos para fêmeas
      const shouldShowCamposFemea = foundAnimal.sexo === 'Fêmea';

      setFormData(prev => ({
        ...prev,
        animalId: foundAnimal.id,
        nome: foundAnimal.serie || '',
        sexo: foundAnimal.sexo || '',
        nascimento: foundAnimal.data_nascimento ? formatDate(foundAnimal.data_nascimento, 'yyyy-MM-dd') : '',
        meses: calculatedMonths,
        peso: foundAnimal.peso?.toString() || '',
        paiNomeRg: foundAnimal.pai || '',
        maeBiologiaRg: foundAnimal.mae || '',
        receptora: foundAnimal.receptora || '',
        mostrarCE: shouldShowCE,
        ce: shouldShowCE ? prev.ce : '', // Manter valor se já preenchido
        mostrarCamposFemea: shouldShowCamposFemea,
        // Manter valores dos campos de fêmea se já preenchidos
        quantidadeFilhos: shouldShowCamposFemea ? prev.quantidadeFilhos : '',
        quantidadeOocitos: shouldShowCamposFemea ? prev.quantidadeOocitos : '',
        quantidadeFilhosVendidos: shouldShowCamposFemea ? prev.quantidadeFilhosVendidos : '',
        valorFilhosVendidos: shouldShowCamposFemea ? prev.valorFilhosVendidos : ''
      }));
      
      // Mostrar mensagem de sucesso
      setMessage(`✅ Animal encontrado: ${foundAnimal.serie} (${foundAnimal.sexo}) - Dados preenchidos automaticamente!`);
      setTimeout(() => setMessage(''), 4000);
    } else {
      // Limpar campos se não encontrar e mostrar mensagem
      setFormData(prev => ({
        ...prev,
        animalId: '',
        nome: '',
        sexo: '',
        nascimento: '',
        meses: '',
        peso: '',
        paiNomeRg: '',
        maeBiologiaRg: '',
        receptora: ''
      }));
      
      // Mostrar mensagem informativa
      setMessage(`⚠️ Animal com Série "${serie}" e RG "${rg}" não encontrado no cadastro.`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return months;
  };

  useEffect(() => {
    if (formData.nascimento) {
      const meses = calculateAge(formData.nascimento);
      setFormData(prev => ({ ...prev, meses: meses.toString() }));
    }
  }, [formData.nascimento]);

  // Função para importar dados do Excel
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportandoExcel(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const firstRow = jsonData[0];
          
          // Mapear os dados do Excel para os campos do formulário
          setFormData(prev => ({
            ...prev,
            iabcz: firstRow['IABCZ'] || firstRow['iabcz'] || '',
            deca: firstRow['DECA'] || firstRow['deca'] || '',
            mgq: firstRow['MGQ'] || firstRow['mgq'] || '',
            top: firstRow['TOP'] || firstRow['top'] || '',
            mgta: firstRow['MGTA'] || firstRow['mgta'] || '',
            topPrograma: firstRow['TOP_PROGRAMA'] || firstRow['TOP PROG'] || firstRow['topPrograma'] || ''
          }));

          setMessage(`✅ Dados do melhoramento genético importados com sucesso! ${jsonData.length} registro(s) processado(s).`);
          setTimeout(() => setMessage(''), 4000);
        } else {
          setMessage('⚠️ Arquivo Excel está vazio ou não contém dados válidos.');
          setTimeout(() => setMessage(''), 4000);
        }
      } catch (error) {
        setMessage(`❌ Erro ao processar arquivo Excel: ${error.message}`);
        setTimeout(() => setMessage(''), 4000);
      } finally {
        setImportandoExcel(false);
      }
    };
    reader.onerror = () => {
      setImportandoExcel(false);
    };
    
    reader.readAsArrayBuffer(file);
    
    // Limpar o input file
    e.target.value = '';
  };

  // Função para baixar template do Excel
  const downloadExcelTemplate = () => {
    try {
      // Criar dados do template com instruções
      const templateData = [
        {
          'SERIE': 'CJCJ001',
          'RG': '12345',
          'IABCZ': '123',
          'DECA': '4.5',
          'MGQ': '85',
          'TOP': 'A',
          'MGTA': '92',
          'TOP_PROGRAMA': 'Elite'
        },
        {
          'SERIE': 'BENT002',
          'RG': '67890',
          'IABCZ': '156',
          'DECA': '3.8',
          'MGQ': '78',
          'TOP': 'B',
          'MGTA': '88',
          'TOP_PROGRAMA': 'Superior'
        },
        {
          'SERIE': '',
          'RG': '',
          'IABCZ': '',
          'DECA': '',
          'MGQ': '',
          'TOP': '',
          'MGTA': '',
          'TOP_PROGRAMA': ''
        }
      ];

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Adicionar larguras das colunas
      ws['!cols'] = [
        { width: 15 }, // SERIE
        { width: 15 }, // RG
        { width: 12 }, // IABCZ
        { width: 12 }, // DECA
        { width: 12 }, // MGQ
        { width: 12 }, // TOP
        { width: 12 }, // MGTA
        { width: 18 }  // TOP_PROGRAMA
      ];

      // Adicionar comentários nas células de cabeçalho
      const headerComments = {
        'A1': 'Série do animal (ex: CJCJ001, BENT002)',
        'B1': 'Registro Genealógico do animal',
        'C1': 'Código IABCZ - Associação Brasileira dos Criadores de Zebu',
        'D1': 'DECA - Diferença Esperada na Capacidade de Aleitamento',
        'E1': 'MGQ - Mérito Genético Qualitativo',
        'F1': 'TOP - Teste de Progênie (A, B, C, etc.)',
        'G1': 'MGTA - Mérito Genético Total Agregado',
        'H1': 'TOP Programa - Classificação no programa (Elite, Superior, etc.)'
      };

      XLSX.utils.book_append_sheet(wb, ws, 'Melhoramento Genético');
      
      // Baixar arquivo
      XLSX.writeFile(wb, `template_melhoramento_genetico_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setMessage('✅ Template Excel baixado com sucesso! Preencha os dados e importe de volta.');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage(`❌ Erro ao gerar template: ${error.message}`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // Função para limpar campos do melhoramento genético
  const clearMelhoramentoFields = () => {
    setFormData(prev => ({
      ...prev,
      iabcz: '',
      deca: '',
      mgq: '',
      top: '',
      mgta: '',
      topPrograma: ''
    }));
    
    setMessage('🗑️ Campos do melhoramento genético limpos.');
    setTimeout(() => setMessage(''), 2000);
  };

  // Função para limpar campos reprodutivos de fêmea
  const clearCamposFemea = () => {
    setFormData(prev => ({
      ...prev,
      quantidadeFilhos: '',
      quantidadeOocitos: '',
      quantidadeFilhosVendidos: '',
      valorFilhosVendidos: ''
    }));
    
    setMessage('🗑️ Campos reprodutivos da fêmea limpos.');
    setTimeout(() => setMessage(''), 2000);
  };

  // Função para adicionar mais serviços
  const adicionarServico = () => {
    if (formData.numeroServicos < 5) {
      setFormData(prev => ({
        ...prev,
        numeroServicos: prev.numeroServicos + 1
      }));
    }
  };

  // Função para remover serviços
  const removerServico = () => {
    if (formData.numeroServicos > 1) {
      setFormData(prev => ({
        ...prev,
        numeroServicos: prev.numeroServicos - 1,
        // Limpar o serviço removido
        servicos: {
          ...prev.servicos,
          [`servico${prev.numeroServicos}`]: { ativo: false, tipo: '', valor: '' }
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/animals/ocorrencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Ocorrência registrada com sucesso!');
        // Reset form but keep animal data
        setFormData(prev => ({
          ...prev,
          dataServico: '',
          numeroServicos: 1, // Resetar para 1 serviço
          servicos: {
            servico1: { ativo: false, tipo: '', valor: '' },
            servico2: { ativo: false, tipo: '', valor: '' },
            servico3: { ativo: false, tipo: '', valor: '' },
            servico4: { ativo: false, tipo: '', valor: '' },
            servico5: { ativo: false, tipo: '', valor: '' }
          },
          ce: '',
          aplicarLocalLote: false,
          // Manter campos de fêmea se animal for fêmea
          quantidadeFilhos: prev.mostrarCamposFemea ? prev.quantidadeFilhos : '',
          quantidadeOocitos: prev.mostrarCamposFemea ? prev.quantidadeOocitos : '',
          quantidadeFilhosVendidos: prev.mostrarCamposFemea ? prev.quantidadeFilhosVendidos : '',
          valorFilhosVendidos: prev.mostrarCamposFemea ? prev.valorFilhosVendidos : '',
          observacoes: '',
          iabcz: '',
          deca: '',
          mgq: '',
          top: '',
          mgta: '',
          topPrograma: ''
        }));
      } else {
        const error = await response.json();
        setMessage(`Erro: ${error.message}`);
      }
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4">
      <ImportProgressOverlay
        importando={importandoExcel}
        progress={{ atual: 0, total: 0, etapa: 'Importando dados do Excel...' }}
      />
      <div className="w-full max-w-none mx-auto px-2 sm:px-4 lg:px-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lançamento de Ocorrências</h1>
            <p className="text-gray-600 dark:text-gray-400">Registre ocorrências e eventos dos animais</p>
            
            {/* Instruções de uso */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 text-lg">💡</span>
                <div>
                  <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Como usar:</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Digite apenas a <strong>Série</strong> e <strong>RG</strong> do animal. 
                    Todas as outras informações serão preenchidas automaticamente. 
                    <br />
                    <strong>Funcionalidades inteligentes:</strong>
                    • Machos de 9-18 meses: Campo CE aparece automaticamente
                    • Fêmeas: Campos reprodutivos (filhos, oócitos, vendas) aparecem automaticamente
                    • Serviços personalizáveis: Peso, Aparte, Piquete, Medicamentos, etc.
                    • Opção de aplicar local para todo o lote
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            
            {/* Busca Rápida - Série e RG */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 mb-4">
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">🔍</span>
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase">
                  Busca Rápida - Digite Série e RG para auto-preenchimento
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="sm:col-span-1 md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 uppercase">
                    SÉRIE * (máx. 5 caracteres)
                  </label>
                  <input
                    type="text"
                    name="serie"
                    value={formData.serie}
                    onChange={handleInputChange}
                    placeholder="Ex: CJCJ1"
                    maxLength="5"
                    className="w-full px-3 py-3 border-2 border-blue-500 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm uppercase"
                  />
                </div>

                <div className="sm:col-span-1 md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 uppercase">
                    RG * (máx. 6 números)
                  </label>
                  <input
                    type="text"
                    name="rg"
                    value={formData.rg}
                    onChange={handleInputChange}
                    placeholder="Ex: 123456"
                    maxLength="6"
                    pattern="[0-9]*"
                    className="w-full px-3 py-3 border-2 border-blue-500 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-4 lg:col-span-2 flex items-end">
                  <div className="w-full p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-400 text-center">
                      <strong>💡 Dica:</strong> Digite apenas estes 2 campos para auto-preenchimento completo!
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Indicador de animal encontrado */}
              {formData.animalId && (
                <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2 text-lg">✅</span>
                    <div>
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                        Animal Encontrado: {formData.nome} ({formData.sexo})
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        {formData.meses} meses • Nascimento: {formData.nascimento ? new Date(formData.nascimento).toLocaleDateString('pt-BR') : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Linha Superior - Nome e Sexo (preenchidos automaticamente) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
              <div className="xl:col-span-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase">
                  NOME (Preenchido automaticamente)
                </label>
                <div className="relative">
                  <select
                    value={formData.animalId}
                    onChange={(e) => handleAnimalSelect(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="">Ou selecione da lista</option>
                    {Array.isArray(animals) && animals.map(animal => (
                      <option key={animal.id} value={animal.id}>
                        {animal.serie} - RG: {animal.rg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="xl:col-span-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase">
                  SEXO (Preenchido automaticamente)
                </label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="Macho">Macho</option>
                  <option value="Fêmea">Fêmea</option>
                </select>
              </div>
            </div>

            {/* Dados do Animal (preenchidos automaticamente) */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase flex items-center">
                <span className="mr-2">📋</span>
                Dados do Animal (Preenchidos automaticamente)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <div className="xl:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
                    NASCIMENTO
                  </label>
                  <input
                    type="date"
                    name="nascimento"
                    value={formData.nascimento}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    readOnly={formData.animalId ? true : false}
                  />
                </div>

                <div className="xl:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
                    MESES
                  </label>
                  <input
                    type="number"
                    name="meses"
                    value={formData.meses}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
                    DATA ÚLTIMO PESO
                  </label>
                  <input
                    type="date"
                    name="dataUltimoPeso"
                    value={formData.dataUltimoPeso}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-blue-500 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="xl:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
                    PESO (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="peso"
                    value={formData.peso}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-blue-500 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Campo CE para Machos de 9-18 meses */}
            {formData.mostrarCE && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-600 rounded-xl p-4 mb-4">
                <div className="flex items-center mb-3">
                  <span className="text-orange-600 mr-2 text-lg">📏</span>
                  <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300 uppercase">
                    Medição CE - Macho de {formData.meses} meses
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-orange-700 dark:text-orange-300 mb-1 uppercase">
                      Circunferência Escrotal (CE) em cm
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="ce"
                      value={formData.ce}
                      onChange={handleInputChange}
                      placeholder="Ex: 25.5"
                      className="w-full px-4 py-3 border-2 border-orange-400 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-xs text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                      <strong>Importante:</strong> A medição da CE é fundamental para avaliação reprodutiva de machos jovens.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Campos específicos para Fêmeas */}
            {formData.mostrarCamposFemea && (
              <div className="bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-300 dark:border-pink-600 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-pink-600 mr-2 text-lg">👩‍🍼</span>
                    <h3 className="text-lg font-bold text-pink-800 dark:text-pink-300 uppercase">
                      Dados Reprodutivos - Fêmea
                    </h3>
                  </div>
                  
                  <button
                    type="button"
                    onClick={clearCamposFemea}
                    className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <span className="mr-1">🗑️</span>
                    Limpar Campos
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 border-2 border-pink-300 dark:border-pink-600 rounded-xl p-4">
                    <div className="flex items-center justify-center mb-3">
                      <span className="text-2xl mr-2">👶</span>
                      <label className="text-sm font-bold text-pink-700 dark:text-pink-300 uppercase text-center">
                        Quantidade de Filhos
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      name="quantidadeFilhos"
                      value={formData.quantidadeFilhos}
                      onChange={handleInputChange}
                      placeholder="Ex: 5"
                      className="w-full px-4 py-3 border-2 border-pink-400 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-gray-900 dark:text-white text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <p className="text-xs text-pink-600 dark:text-pink-400 text-center mt-2">
                      Total de filhos que a fêmea já teve
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border-2 border-pink-300 dark:border-pink-600 rounded-xl p-4">
                    <div className="flex items-center justify-center mb-3">
                      <span className="text-2xl mr-2">🧬</span>
                      <label className="text-sm font-bold text-pink-700 dark:text-pink-300 uppercase text-center">
                        Oócitos Coletados
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      name="quantidadeOocitos"
                      value={formData.quantidadeOocitos}
                      onChange={handleInputChange}
                      placeholder="Ex: 15"
                      className="w-full px-4 py-3 border-2 border-pink-400 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-gray-900 dark:text-white text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <p className="text-xs text-pink-600 dark:text-pink-400 text-center mt-2">
                      Quantidade total de oócitos coletados
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border-2 border-pink-300 dark:border-pink-600 rounded-xl p-4">
                    <div className="flex items-center justify-center mb-3">
                      <span className="text-2xl mr-2">💰</span>
                      <label className="text-sm font-bold text-pink-700 dark:text-pink-300 uppercase text-center">
                        Filhos Vendidos
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      name="quantidadeFilhosVendidos"
                      value={formData.quantidadeFilhosVendidos}
                      onChange={handleInputChange}
                      placeholder="Ex: 3"
                      className="w-full px-4 py-3 border-2 border-pink-400 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-gray-900 dark:text-white text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <p className="text-xs text-pink-600 dark:text-pink-400 text-center mt-2">
                      Quantidade de filhos já vendidos
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border-2 border-pink-300 dark:border-pink-600 rounded-xl p-4">
                    <div className="flex items-center justify-center mb-3">
                      <span className="text-2xl mr-2">💵</span>
                      <label className="text-sm font-bold text-pink-700 dark:text-pink-300 uppercase text-center">
                        Valor Total Vendas
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="valorFilhosVendidos"
                      value={formData.valorFilhosVendidos}
                      onChange={handleInputChange}
                      placeholder="Ex: 25000.00"
                      className="w-full px-4 py-3 border-2 border-pink-400 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-gray-900 dark:text-white text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <p className="text-xs text-pink-600 dark:text-pink-400 text-center mt-2">
                      Valor total arrecadado com vendas (R$)
                    </p>
                  </div>
                </div>

                {/* Resumo dos dados reprodutivos */}
                {(formData.quantidadeFilhos || formData.quantidadeOocitos || formData.quantidadeFilhosVendidos || formData.valorFilhosVendidos) && (
                  <div className="mt-6 p-4 bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-600 rounded-lg">
                    <h4 className="text-sm font-bold text-pink-800 dark:text-pink-300 mb-3 flex items-center">
                      <span className="mr-2">📊</span>
                      Resumo Reprodutivo:
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {formData.quantidadeFilhos && (
                        <div className="text-center">
                          <p className="font-semibold text-pink-700 dark:text-pink-300">Total de Filhos</p>
                          <p className="text-lg font-bold text-pink-800 dark:text-pink-200">{formData.quantidadeFilhos}</p>
                        </div>
                      )}
                      {formData.quantidadeOocitos && (
                        <div className="text-center">
                          <p className="font-semibold text-pink-700 dark:text-pink-300">Oócitos Coletados</p>
                          <p className="text-lg font-bold text-pink-800 dark:text-pink-200">{formData.quantidadeOocitos}</p>
                        </div>
                      )}
                      {formData.quantidadeFilhosVendidos && (
                        <div className="text-center">
                          <p className="font-semibold text-pink-700 dark:text-pink-300">Filhos Vendidos</p>
                          <p className="text-lg font-bold text-pink-800 dark:text-pink-200">{formData.quantidadeFilhosVendidos}</p>
                        </div>
                      )}
                      {formData.valorFilhosVendidos && (
                        <div className="text-center">
                          <p className="font-semibold text-pink-700 dark:text-pink-300">Valor Total</p>
                          <p className="text-lg font-bold text-pink-800 dark:text-pink-200">
                            R$ {parseFloat(formData.valorFilhosVendidos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Cálculo de valor médio por filho vendido */}
                    {formData.quantidadeFilhosVendidos && formData.valorFilhosVendidos && parseFloat(formData.quantidadeFilhosVendidos) > 0 && (
                      <div className="mt-3 pt-3 border-t border-pink-300 dark:border-pink-600">
                        <p className="text-sm text-pink-700 dark:text-pink-300 text-center">
                          <strong>Valor médio por filho vendido:</strong> R$ {
                            (parseFloat(formData.valorFilhosVendidos) / parseFloat(formData.quantidadeFilhosVendidos))
                              .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Inclusão de Serviço Inteligente */}
            <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-3xl p-4 mb-4 relative">
              <div className="absolute -top-3 left-5 bg-white dark:bg-gray-800 px-3 text-xs font-semibold text-red-600 dark:text-red-400 uppercase">
                INCLUSÃO DE SERVIÇO
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">DATA:</label>
                  <input
                    type="date"
                    name="dataServico"
                    value={formData.dataServico}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-blue-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Serviços: {formData.numeroServicos}/5
                  </span>
                  <button
                    type="button"
                    onClick={removerServico}
                    disabled={formData.numeroServicos <= 1}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
                  >
                    ➖
                  </button>
                  <button
                    type="button"
                    onClick={adicionarServico}
                    disabled={formData.numeroServicos >= 5}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
                  >
                    ➕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array.from({ length: formData.numeroServicos }, (_, index) => index + 1).map(num => {
                  const servicoKey = `servico${num}`;
                  const servico = formData.servicos[servicoKey];
                  
                  return (
                    <div key={num} className="border-2 border-blue-500 rounded-xl overflow-hidden">
                      {/* Header do Serviço */}
                      <div className="bg-red-600 text-white py-2 px-4 text-xs font-semibold text-center">
                        SERVIÇO {num}
                      </div>
                      
                      {/* Checkbox para ativar serviço */}
                      <div className="p-3 bg-white dark:bg-gray-800 border-b border-blue-300">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            id={servicoKey}
                            name={servicoKey}
                            checked={servico.ativo}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <label htmlFor={servicoKey} className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                            Ativar
                          </label>
                        </div>
                      </div>
                      
                      {/* Campos dinâmicos quando serviço está ativo */}
                      {servico.ativo && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                          {/* Seletor de tipo de serviço */}
                          <div>
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                              Tipo de Serviço:
                            </label>
                            <select
                              name={`${servicoKey}_tipo`}
                              value={servico.tipo}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 border border-blue-400 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Selecione...</option>
                              <option value="peso">Peso</option>
                              <option value="aparte">Aparte</option>
                              <option value="piquete">Piquete/Local</option>
                              <option value="medicamento">Medicamento</option>
                              <option value="vacina">Vacina</option>
                              <option value="inseminacao">Inseminação</option>
                              <option value="outro">Outro</option>
                            </select>
                          </div>
                          
                          {/* Campo de valor dinâmico baseado no tipo */}
                          {servico.tipo && (
                            <div>
                              <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                                {servico.tipo === 'peso' && 'Peso (kg):'}
                                {servico.tipo === 'aparte' && 'Descrição do Aparte:'}
                                {servico.tipo === 'piquete' && 'Nome do Piquete/Local:'}
                                {servico.tipo === 'medicamento' && 'Nome do Medicamento:'}
                                {servico.tipo === 'vacina' && 'Nome da Vacina:'}
                                {servico.tipo === 'inseminacao' && 'Touro/Sêmen:'}
                                {servico.tipo === 'outro' && 'Descrição:'}
                              </label>
                              <input
                                type={servico.tipo === 'peso' ? 'number' : 'text'}
                                step={servico.tipo === 'peso' ? '0.1' : undefined}
                                name={`${servicoKey}_valor`}
                                value={servico.valor}
                                onChange={handleInputChange}
                                placeholder={
                                  servico.tipo === 'peso' ? 'Ex: 350.5' :
                                  servico.tipo === 'aparte' ? 'Ex: Separar para venda' :
                                  servico.tipo === 'piquete' ? 'Ex: Piquete 5' :
                                  servico.tipo === 'medicamento' ? 'Ex: Ivermectina' :
                                  servico.tipo === 'vacina' ? 'Ex: Aftosa' :
                                  servico.tipo === 'inseminacao' ? 'Ex: Touro ABC' :
                                  'Digite aqui...'
                                }
                                className="w-full px-2 py-1 border border-blue-400 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          
                          {/* Opção para aplicar local no lote (apenas para piquete) */}
                          {servico.tipo === 'piquete' && servico.valor && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="aplicarLocalLote"
                                  name="aplicarLocalLote"
                                  checked={formData.aplicarLocalLote}
                                  onChange={handleInputChange}
                                  className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
                                />
                                <label htmlFor="aplicarLocalLote" className="ml-2 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                                  Aplicar "{servico.valor}" para todo o lote?
                                </label>
                              </div>
                              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                Todos os animais do lote atual serão movidos para este local.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumo dos Serviços Selecionados */}
            {Object.values(formData.servicos).some(s => s.ativo) && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-600 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-3 uppercase flex items-center">
                  <span className="mr-2">📋</span>
                  Resumo dos Serviços Selecionados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(formData.servicos).map(([key, servico]) => {
                    if (!servico.ativo) return null;
                    
                    const servicoNum = key.replace('servico', '');
                    return (
                      <div key={key} className="bg-white dark:bg-gray-800 border border-indigo-300 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            Serviço {servicoNum}
                          </span>
                          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded">
                            {servico.tipo || 'Não definido'}
                          </span>
                        </div>
                        {servico.valor && (
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            <strong>Valor:</strong> {servico.valor}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {formData.aplicarLocalLote && (
                  <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Local será aplicado para todo o lote atual
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Genealogia (preenchida automaticamente) */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-green-700 dark:text-green-300 mb-4 uppercase flex items-center">
                <span className="mr-2">🧬</span>
                Genealogia (Preenchida automaticamente)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <div className="xl:col-span-2">
                  <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1 uppercase">
                    PAI NOME E RG
                  </label>
                  <input
                    type="text"
                    name="paiNomeRg"
                    value={formData.paiNomeRg}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-2xl bg-green-50 dark:bg-green-900/30 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    readOnly={formData.animalId ? true : false}
                  />
                </div>

                <div className="xl:col-span-1">
                  <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1 uppercase">
                    AVÔ MATERNO
                  </label>
                  <input
                    type="text"
                    name="avoMaterno"
                    value={formData.avoMaterno}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1 uppercase">
                    MÃE BIOLOGIA E RG
                  </label>
                  <input
                    type="text"
                    name="maeBiologiaRg"
                    value={formData.maeBiologiaRg}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-2xl bg-green-50 dark:bg-green-900/30 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    readOnly={formData.animalId ? true : false}
                  />
                </div>

                <div className="xl:col-span-1">
                  <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1 uppercase">
                    RECEPTORA
                  </label>
                  <input
                    type="text"
                    name="receptora"
                    value={formData.receptora}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-2xl bg-green-50 dark:bg-green-900/30 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    readOnly={formData.animalId ? true : false}
                  />
                </div>
              </div>
            </div>

            {/* Programa de Melhoramento Genético - Apenas Visualização */}
            {(formData.iabcz || formData.deca || formData.mgq || formData.top || formData.mgta || formData.topPrograma) && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-600 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-purple-800 dark:text-purple-300 uppercase flex items-center">
                    <span className="mr-2">🧬</span>
                    Dados de Melhoramento Genético
                  </h3>
                  
                  {/* Botões de Importar Excel */}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="excelImport"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleExcelImport}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('excelImport').click()}
                      className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <span className="mr-1">📊</span>
                      Importar Excel
                    </button>
                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <span className="mr-1">📥</span>
                      Modelo Excel
                    </button>
                    <button
                      type="button"
                      onClick={clearMelhoramentoFields}
                      className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <span className="mr-1">🗑️</span>
                      Limpar
                    </button>
                  </div>
                </div>
                
                {/* Resultados em formato compacto */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { name: 'iabcz', label: 'IABCZ', desc: 'Associação Brasileira dos Criadores de Zebu', icon: '🏛️' },
                    { name: 'deca', label: 'DECA', desc: 'Diferença Esperada na Capacidade de Aleitamento', icon: '🍼' },
                    { name: 'mgq', label: 'MGQ', desc: 'Mérito Genético Qualitativo', icon: '⭐' },
                    { name: 'top', label: 'TOP', desc: 'Teste de Progênie', icon: '🧪' },
                    { name: 'mgta', label: 'MGTA', desc: 'Mérito Genético Total Agregado', icon: '📊' },
                    { name: 'topPrograma', label: 'TOP PROG', desc: 'TOP Programa', icon: '🏆' }
                  ].filter(field => formData[field.name]).map(field => (
                    <div key={field.name} className="bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-600 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <span className="text-lg mr-1">{field.icon}</span>
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">
                          {field.label}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-900/30 rounded px-2 py-1">
                        {formData[field.name]}
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 leading-tight">
                        {field.desc.split(' ').slice(0, 3).join(' ')}...
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Resumo compacto */}
                <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-purple-800 dark:text-purple-300">
                      📈 Dados Importados: {[formData.iabcz, formData.deca, formData.mgq, formData.top, formData.mgta, formData.topPrograma].filter(Boolean).length}/6 campos
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      Use "Importar Excel" para atualizar os dados
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Botão para mostrar seção de melhoramento genético quando vazia */}
            {!(formData.iabcz || formData.deca || formData.mgq || formData.top || formData.mgta || formData.topPrograma) && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl p-4 mb-4 text-center">
                <div className="flex items-center justify-center mb-3">
                  <span className="text-purple-600 mr-2 text-2xl">🧬</span>
                  <h3 className="text-lg font-bold text-purple-800 dark:text-purple-300">
                    Melhoramento Genético
                  </h3>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
                  Nenhum dado de melhoramento genético importado. Use o Excel para carregar os dados.
                </p>
                <div className="flex justify-center gap-2">
                  <input
                    type="file"
                    id="excelImportEmpty"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelImport}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('excelImportEmpty').click()}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <span className="mr-2">📊</span>
                    Importar Dados do Excel
                  </button>
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <span className="mr-2">📥</span>
                    Baixar Modelo Excel
                  </button>
                </div>
              </div>
            )}

            {/* Status e Observações */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Status */}
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ativos"
                      name="ativos"
                      checked={formData.ativos}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
                    />
                    <label htmlFor="ativos" className="text-sm font-medium text-gray-700 dark:text-gray-300">ATIVOS (GT)</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="vendidos"
                      name="vendidos"
                      checked={formData.vendidos}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
                    />
                    <label htmlFor="vendidos" className="text-sm font-medium text-gray-700 dark:text-gray-300">VENDIDOS (GT)</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="baixados"
                      name="baixados"
                      checked={formData.baixados}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
                    />
                    <label htmlFor="baixados" className="text-sm font-medium text-gray-700 dark:text-gray-300">BAIXADOS (GT)</label>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 h-full">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">
                    OBSERVAÇÕES
                  </label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    placeholder="Digite observações sobre o animal ou ocorrência..."
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => window.location.href = '/relatorios-ocorrencias'}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Ver Relatórios
              </button>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Limpar
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Registrar Ocorrência'}
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg mt-4 border-2 ${
                message.includes('Erro') 
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' 
                  : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}