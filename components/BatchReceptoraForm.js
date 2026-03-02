import React, { useEffect, useRef, useState } from 'react'
import { fetchAvailableLocations } from '../utils/piqueteUtils'
import { XMarkIcon, PlusIcon, TrashIcon, CheckIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function BatchReceptoraForm({ isOpen, onClose, onSave }) {
  // Dados fixos que serão aplicados a todas as receptoras
  const [dadosFixos, setDadosFixos] = useState({
    fornecedor: "",
    notaFiscal: "",
    boletim: "",
    dataCompra: new Date().toISOString().split("T")[0],
    valorCompra: "",
    pesoCompra: "",
    idadeCompra: "30",
    condicaoCorporal: "",
    aplicarProtocolo: true,
    localNascimento: "",
    pastoAtual: ""
  });

  // Lista de receptoras adicionadas
  const [receptoras, setReceptoras] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  // Fetch locations (usa utilitário que filtra nomes de touros cadastrados por engano como piquete)
  useEffect(() => {
    fetchAvailableLocations()
      .then(setAvailableLocations)
      .catch((err) => console.error('Erro ao carregar locais:', err))
  }, [])
  
  // RG atual sendo digitado
  const [rgAtual, setRgAtual] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [showResumo, setShowResumo] = useState(false);
  
  // Ref para o input de RG
  const rgInputRef = useRef(null);

  // Resetar quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setDadosFixos({
        fornecedor: "",
        notaFiscal: "",
        dataCompra: new Date().toISOString().split("T")[0],
        valorCompra: "",
        pesoCompra: "",
        idadeCompra: "30",
        condicaoCorporal: "",
        aplicarProtocolo: true,
        localNascimento: "",
        pastoAtual: ""
      });
      setReceptoras([]);
      setRgAtual("");
      setShowResumo(false);
      
      // Focar no input de RG após um pequeno delay
      setTimeout(() => {
        if (rgInputRef.current) {
          rgInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Adicionar receptora
  const adicionarReceptora = () => {
    if (!rgAtual.trim()) {
      alert("⚠️ Digite o RG da receptora");
      return;
    }

    // Parse Série/RG (flexível para suportar CJCJ 1234, etc)
    let serie = "RPT";
    let rg = rgAtual.toUpperCase();
    
    // Tenta identificar padrão "SERIE RG" ou "SERIE-RG"
    const match = rgAtual.trim().match(/^([A-Za-z]+)[\s-]+(.+)$/);
    if (match) {
        serie = match[1].toUpperCase();
        rg = match[2].toUpperCase();
    }

    // Verificar duplicatas
    const rgExists = receptoras.some(r => r.serie === serie && r.rg === rg);
    if (rgExists) {
      alert(`⚠️ Animal ${serie} ${rg} já foi adicionado!`);
      return;
    }

    // Criar nova receptora com dados fixos
    const novaReceptora = {
      serie: serie,
      rg: rg,
      raca: "Receptora",
      sexo: "Fêmea",
      meses: parseInt(dadosFixos.idadeCompra) || 30,
      situacao: "Ativo",
      isFiv: false,
      observacoes: "",
      ...dadosFixos,
    };

    setReceptoras([...receptoras, novaReceptora]);
    setRgAtual(""); // Limpar campo para próxima entrada
    
    // Focar novamente no input
    if (rgInputRef.current) {
      rgInputRef.current.focus();
    }
  };

  // Remover receptora
  const removerReceptora = (index) => {
    setReceptoras(receptoras.filter((_, i) => i !== index));
  };

  // Lidar com Enter no campo RG
  const handleRgKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarReceptora();
    }
  };

  // Validar antes de salvar
  const validarDados = () => {
    if (receptoras.length === 0) {
      alert("⚠️ Adicione pelo menos uma receptora!");
      return false;
    }

    if (!dadosFixos.fornecedor.trim()) {
      alert("⚠️ Fornecedor é obrigatório!");
      return false;
    }

    if (!dadosFixos.boletim) {
      alert("⚠️ Boletim (Local de Entrada) é obrigatório!");
      return false;
    }

    if (!dadosFixos.pastoAtual) {
      alert("⚠️ Localização Atual (Piquete) é obrigatória!");
      return false;
    }

    if (!dadosFixos.valorCompra || parseFloat(dadosFixos.valorCompra) <= 0) {
      alert("⚠️ Valor da Compra é obrigatório e deve ser maior que zero!");
      return false;
    }

    return true;
  };

  // Salvar todas as receptoras
  const handleSubmit = async () => {
    if (!validarDados()) return;

    setLoading(true);
    try {
      // Preparar dados para salvamento
      const receptorasParaSalvar = receptoras.map(receptora => ({
        ...receptora,
        valorCompra: parseFloat(dadosFixos.valorCompra),
        pesoCompra: dadosFixos.pesoCompra ? parseFloat(dadosFixos.pesoCompra) : null,
        idadeCompra: parseInt(dadosFixos.idadeCompra) || 30,
      }));

      // Usar endpoint de cadastro em lote
      const response = await fetch('/api/animals/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receptoras: receptorasParaSalvar })
      });

      const result = await response.json();

      if (response.ok || response.status === 207) {
        // Sucesso total ou parcial
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map(err => 
            `Receptora ${err.index + 1} (RG: ${err.rg}): ${err.error}`
          ).join('\n');
          
          alert(`⚠️ Cadastro parcialmente concluído!\n\n✅ ${result.success} receptoras salvas\n❌ ${result.failed} falharam:\n\n${errorMessages}`);
        } else {
          alert(`✅ ${result.success} receptoras cadastradas com sucesso!`);
        }
        
        await onSave(result.saved || []);
        onClose();
      } else {
        throw new Error(result.message || 'Erro ao salvar receptoras');
      }
    } catch (error) {
      console.error("Erro ao salvar receptoras:", error);
      alert(`❌ Erro ao salvar receptoras: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calcular custo total estimado
  const calcularCustoTotal = () => {
    const valorCompra = parseFloat(dadosFixos.valorCompra) || 0;
    const quantidade = receptoras.length;
    return (valorCompra * quantidade).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🐄 Cadastro em Lote - Receptoras
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure os dados fixos e adicione as receptoras rapidamente
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Seção: Dados Fixos */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Dados Fixos (aplicados a todas as receptoras)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fornecedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fornecedor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dadosFixos.fornecedor}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, fornecedor: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do fornecedor"
                />
              </div>

              {/* Boletim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Boletim (Local de Entrada) <span className="text-red-500">*</span>
                </label>
                <select
                  value={dadosFixos.boletim}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, boletim: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o Boletim...</option>
                  <option value="AGROPECUARIA PARDINHO">AGROPECUARIA PARDINHO</option>
                  <option value="FAZENDA SANT ANNA RANCHARIA">FAZENDA SANT ANNA RANCHARIA</option>
                </select>
              </div>

              {/* Nota Fiscal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nota Fiscal
                </label>
                <input
                  type="text"
                  value={dadosFixos.notaFiscal}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, notaFiscal: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Número da NF"
                />
              </div>

              {/* Data da Compra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={dadosFixos.dataCompra}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, dataCompra: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Valor da Compra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor da Compra (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={dadosFixos.valorCompra}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, valorCompra: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Peso na Compra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso na Compra (kg)
                </label>
                <input
                  type="number"
                  value={dadosFixos.pesoCompra}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, pesoCompra: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                />
              </div>

              {/* Idade na Compra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Idade na Compra (meses)
                </label>
                <input
                  type="number"
                  value={dadosFixos.idadeCompra}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, idadeCompra: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                  min="0"
                />
              </div>

              {/* Condição Corporal */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condição Corporal
                </label>
                <select
                  value={dadosFixos.condicaoCorporal}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, condicaoCorporal: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="1">1 - Muito Magra</option>
                  <option value="2">2 - Magra</option>
                  <option value="3">3 - Média</option>
                  <option value="4">4 - Boa</option>
                  <option value="5">5 - Excelente</option>
                </select>
              </div>

              {/* Local de Nascimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Local de Nascimento
                </label>
                <select
                  value={dadosFixos.localNascimento}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, localNascimento: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {availableLocations.map(loc => (
                    <option key={`nasc-${loc}`} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Localização Atual (Piquete) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localização Atual (Piquete) <span className="text-red-500">*</span>
                </label>
                <select
                  value={dadosFixos.pastoAtual}
                  onChange={(e) => setDadosFixos({ ...dadosFixos, pastoAtual: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {availableLocations.map(loc => (
                    <option key={`atual-${loc}`} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Aplicar Protocolo */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dadosFixos.aplicarProtocolo}
                    onChange={(e) => setDadosFixos({ ...dadosFixos, aplicarProtocolo: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    🔬 Aplicar Protocolo Sanitário Automático
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Seção: Cadastro Rápido de RG */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
              ⚡ Cadastro Rápido
            </h3>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RG da Receptora (pressione Enter para adicionar)
                </label>
                <input
                  ref={rgInputRef}
                  type="text"
                  value={rgAtual}
                  onChange={(e) => setRgAtual(e.target.value.toUpperCase())}
                  onKeyPress={handleRgKeyPress}
                  className="w-full px-6 py-4 text-2xl font-bold rounded-lg border-2 border-green-500 dark:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500 uppercase"
                  placeholder="Digite o RG e pressione Enter..."
                  maxLength="6"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={adicionarReceptora}
                  className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="h-6 w-6" />
                  Adicionar
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              💡 Dica: Digite o RG e pressione <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Enter</kbd> para adicionar rapidamente
            </p>
          </div>

          {/* Lista de Receptoras Adicionadas */}
          {receptoras.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  📋 Receptoras Adicionadas ({receptoras.length})
                </h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Custo Total Estimado</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {calcularCustoTotal()}
                  </p>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {receptoras.map((receptora, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          RPT {receptora.rg}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {dadosFixos.fornecedor} • R$ {dadosFixos.valorCompra}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removerReceptora(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remover receptora"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 sticky bottom-0">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {receptoras.length === 0 ? (
                <span>👆 Preencha os dados fixos e adicione receptoras</span>
              ) : (
                <span>✅ {receptoras.length} receptora(s) pronta(s) para cadastrar</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || receptoras.length === 0}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    Salvar {receptoras.length} Receptora(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
