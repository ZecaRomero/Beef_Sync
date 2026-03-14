import React, { useEffect, useState } from 'react'
import { XMarkIcon, ClockIcon, CurrencyDollarIcon, BeakerIcon, HeartIcon, TruckIcon, ScaleIcon, CalendarIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from './ui/Icons';

export default function AnimalTimeline({ isOpen, onClose, animal }) {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullAnimalData, setFullAnimalData] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState([]);

  const toggleEvent = (index) => {
    setExpandedEvents(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  useEffect(() => {
    if (isOpen && animal) {
      fetchAnimalHistory();
    }
  }, [isOpen, animal]);

  const fetchAnimalHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/animals/${animal.id}?history=true`);
      if (response.ok) {
        const result = await response.json();
        console.log('DEBUG: API response', result);
        
        // Handle API response wrapper (success: true, data: {...})
        const animalData = result.success && result.data ? result.data : result;
        
        setFullAnimalData(animalData);
        carregarTimeline(animalData);
      } else {
        console.error('Erro ao buscar histórico do animal');
        // Fallback to basic animal data if API fails
        carregarTimeline(animal);
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      carregarTimeline(animal);
    } finally {
      setLoading(false);
    }
  };

  const carregarTimeline = (dadosAnimal) => {
    console.log('DEBUG: CarregarTimeline chamado', dadosAnimal);
    const eventos = [];

    // 1. Evento de Nascimento
    if (dadosAnimal.data_nascimento) {
      eventos.push({
        tipo: 'nascimento',
        data: dadosAnimal.data_nascimento,
        titulo: '🐣 Nascimento',
        descricao: `Animal nasceu`,
        detalhes: [
          `Raça: ${dadosAnimal.raca || 'N/A'}`,
          `Sexo: ${dadosAnimal.sexo === 'M' ? 'Macho ♂' : dadosAnimal.sexo === 'F' ? 'Fêmea ♀' : dadosAnimal.sexo}`,
        ],
        cor: 'blue',
        icon: CalendarIcon,
      });
    }

    // 2. Evento de Compra
    if (dadosAnimal.dataCompra || dadosAnimal.data_compra) {
      eventos.push({
        tipo: 'compra',
        data: dadosAnimal.dataCompra || dadosAnimal.data_compra,
        titulo: '🛒 Compra',
        descricao: `Adquirido de ${dadosAnimal.fornecedor || 'fornecedor'}`,
        detalhes: [
          `Valor: R$ ${(dadosAnimal.valorCompra || dadosAnimal.valor_compra || 0).toFixed(2)}`,
          dadosAnimal.notaFiscal || dadosAnimal.nota_fiscal ? `NF: ${dadosAnimal.notaFiscal || dadosAnimal.nota_fiscal}` : null,
          dadosAnimal.pesoCompra || dadosAnimal.peso_compra ? `Peso: ${dadosAnimal.pesoCompra || dadosAnimal.peso_compra} kg` : null,
        ].filter(Boolean),
        cor: 'green',
        icon: TruckIcon,
      });
    }

    // 3. Protocolos Aplicados
    if (dadosAnimal.protocolos && dadosAnimal.protocolos.length > 0) {
      dadosAnimal.protocolos.forEach((protocolo) => {
        eventos.push({
          tipo: 'protocolo',
          data: protocolo.data || protocolo.dataAplicacao || protocolo.data_inicio,
          titulo: '💉 Protocolo Aplicado',
          descricao: protocolo.nome || protocolo.tipo || 'Protocolo Sanitário',
          detalhes: [
            protocolo.descricao,
            protocolo.custo ? `Custo: R$ ${parseFloat(protocolo.custo).toFixed(2)}` : null,
            protocolo.veterinario ? `Veterinário: ${protocolo.veterinario}` : null,
          ].filter(Boolean),
          cor: 'purple',
          icon: BeakerIcon,
        });
      });
    }

    // 4. Custos Adicionais
    if (dadosAnimal.custos && dadosAnimal.custos.length > 0) {
      dadosAnimal.custos.forEach((custo) => {
        // Extrair detalhes extras do objeto JSON se existir
        const detalhesExtras = [];
        if (custo.detalhes && typeof custo.detalhes === 'object') {
          if (custo.detalhes.resultado) detalhesExtras.push(`Resultado: ${custo.detalhes.resultado}`);
          if (custo.detalhes.ce) detalhesExtras.push(`CE: ${custo.detalhes.ce} cm`);
          if (custo.detalhes.protocolo) detalhesExtras.push(`Protocolo: ${custo.detalhes.protocolo}`);
        }

        eventos.push({
          tipo: 'custo',
          data: custo.data,
          titulo: '💰 Custo Adicional',
          descricao: custo.subtipo ? `${custo.tipo} - ${custo.subtipo}` : (custo.tipo || custo.descricao || 'Custo'),
          detalhes: [
            `Valor: R$ ${parseFloat(custo.valor || 0).toFixed(2)}`,
            custo.observacoes || custo.observacao,
            ...detalhesExtras
          ].filter(Boolean),
          cor: 'yellow',
          icon: CurrencyDollarIcon,
          expandable: true
        });
      });
    }

    // 5. Gestações (se for fêmea/receptora)
    if (dadosAnimal.gestacoes && dadosAnimal.gestacoes.length > 0) {
      dadosAnimal.gestacoes.forEach((gestacao) => {
        eventos.push({
          tipo: 'gestacao',
          data: gestacao.dataInicio || gestacao.data_inicio || gestacao.created_at,
          titulo: '🤰 Gestação Iniciada',
          descricao: `Gestação #${gestacao.id}`,
          detalhes: [
            gestacao.embriao ? `Embrião: ${gestacao.embriao}` : null,
            gestacao.dataPrevisao || gestacao.data_previsao ? `Previsão: ${new Date(gestacao.dataPrevisao || gestacao.data_previsao).toLocaleDateString('pt-BR')}` : null,
            gestacao.status ? `Status: ${gestacao.status}` : null,
          ].filter(Boolean),
          cor: 'pink',
          icon: HeartIcon,
        });

        // Adicionar evento de nascimento do bezerro se houver
        if (gestacao.dataNascimento || gestacao.data_nascimento) {
          eventos.push({
            tipo: 'parto',
            data: gestacao.dataNascimento || gestacao.data_nascimento,
            titulo: '👶 Parto',
            descricao: `Nascimento do bezerro`,
            detalhes: [
              gestacao.sexoBezerro ? `Sexo: ${gestacao.sexoBezerro === 'M' ? 'Macho ♂' : 'Fêmea ♀'}` : null,
              gestacao.pesoBezerro ? `Peso: ${gestacao.pesoBezerro} kg` : null,
            ].filter(Boolean),
            cor: 'green',
            icon: HeartIcon,
          });
        }
      });
    }

    // 6. Pesagens
    if (dadosAnimal.pesagens && dadosAnimal.pesagens.length > 0) {
      dadosAnimal.pesagens.forEach((pesagem) => {
        eventos.push({
          tipo: 'pesagem',
          data: pesagem.data,
          titulo: '⚖️ Pesagem',
          descricao: `${pesagem.peso} Kg`,
          detalhes: [
             pesagem.ce ? `CE: ${pesagem.ce} cm` : null,
             pesagem.observacoes
          ].filter(Boolean),
          cor: 'cyan',
          icon: ScaleIcon
        });
      });
    }

    // 7. Inseminações (preferir válidas; data_ia é o nome da coluna no banco)
    const inseminacoesValidas = (dadosAnimal.inseminacoes || []).filter(ins => ins.valida !== false)
    const inseminacoesParaTimeline = inseminacoesValidas.length > 0 ? inseminacoesValidas : (dadosAnimal.inseminacoes || [])
    if (inseminacoesParaTimeline.length > 0) {
      inseminacoesParaTimeline.forEach((ins) => {
        const dataIA = ins.data_ia || ins.data_inseminacao || ins.data
        if (!dataIA) return
        eventos.push({
          tipo: 'inseminacao',
          data: dataIA,
          titulo: '🧬 Inseminação (IA)',
          descricao: `Touro: ${ins.touro_nome || ins.touro || 'N/A'}`,
          detalhes: [
            ins.inseminador ? `Inseminador: ${ins.inseminador}` : null,
            ins.observacoes
          ].filter(Boolean),
          cor: 'fuchsia',
          icon: HeartIcon
        });
      });
    }
    
    // 8. Filhos (Partos)
    if (dadosAnimal.filhos && dadosAnimal.filhos.length > 0) {
      dadosAnimal.filhos.forEach((filho) => {
        eventos.push({
          tipo: 'parto',
          data: filho.data_nascimento || filho.dataNascimento,
          titulo: '👶 Parto',
          descricao: `Nasceu ${filho.serie || ''} ${filho.rg || ''}`,
          detalhes: [
            `Sexo: ${filho.sexo}`,
            `Peso: ${filho.peso || filho.pesoNascimento || 'N/A'} Kg`
          ].filter(Boolean),
          cor: 'rose',
          icon: HeartIcon
        });
      });
    }

    // 9. Movimentações
    if (dadosAnimal.localizacoes && dadosAnimal.localizacoes.length > 0) {
      console.log('DEBUG: Processando localizacoes', dadosAnimal.localizacoes);
      dadosAnimal.localizacoes.forEach((loc) => {
        eventos.push({
          tipo: 'localizacao',
          data: loc.data_entrada,
          titulo: '📍 Movimentação',
          descricao: `Entrada em ${loc.piquete}`,
          detalhes: [
            loc.motivo_movimentacao ? `Motivo: ${loc.motivo_movimentacao}` : null,
            loc.observacoes
          ].filter(Boolean),
          cor: 'orange',
          icon: TruckIcon
        });
      });
    }

    // 10. Mudanças de Situação
    if (dadosAnimal.historicoSituacao && dadosAnimal.historicoSituacao.length > 0) {
      dadosAnimal.historicoSituacao.forEach((mudanca) => {
        eventos.push({
          tipo: 'situacao',
          data: mudanca.data,
          titulo: '📋 Mudança de Situação',
          descricao: `${mudanca.situacaoAnterior || 'Ativo'} → ${mudanca.situacaoNova}`,
          detalhes: [mudanca.motivo].filter(Boolean),
          cor: 'gray',
          icon: DocumentTextIcon,
        });
      });
    }

    // 11. Venda (se vendido)
    if (dadosAnimal.situacao === 'Vendido' && dadosAnimal.dataVenda) {
      eventos.push({
        tipo: 'venda',
        data: dadosAnimal.dataVenda || dadosAnimal.data_venda,
        titulo: '💵 Venda',
        descricao: `Vendido para ${dadosAnimal.comprador || 'comprador'}`,
        detalhes: [
          dadosAnimal.valorVenda || dadosAnimal.valor_venda ? `Valor: R$ ${(dadosAnimal.valorVenda || dadosAnimal.valor_venda).toFixed(2)}` : null,
          dadosAnimal.pesoVenda || dadosAnimal.peso_venda ? `Peso: ${dadosAnimal.pesoVenda || dadosAnimal.peso_venda} kg` : null,
        ].filter(Boolean),
        cor: 'green',
        icon: CurrencyDollarIcon,
      });
    }

    // 12. Morte (se morto)
    if (dadosAnimal.situacao === 'Morto' && dadosAnimal.dataMorte) {
      eventos.push({
        tipo: 'morte',
        data: dadosAnimal.dataMorte || dadosAnimal.data_morte,
        titulo: '💀 Óbito',
        descricao: dadosAnimal.causaMorte || dadosAnimal.causa_morte || 'Causa não informada',
        detalhes: [
          dadosAnimal.valorPerda || dadosAnimal.valor_perda ? `Valor de Perda: R$ ${(dadosAnimal.valorPerda || dadosAnimal.valor_perda).toFixed(2)}` : null,
          dadosAnimal.observacoesMorte,
        ].filter(Boolean),
        cor: 'red',
        icon: DocumentTextIcon,
      });
    }

    // Ordenar eventos por data (mais recentes primeiro)
    eventos.sort((a, b) => new Date(b.data) - new Date(a.data));

    console.log('DEBUG: Eventos finais', eventos);
    setTimelineEvents(eventos);
  };

  const getCorClasse = (cor) => {
    const cores = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      gray: 'bg-gray-500',
      red: 'bg-red-500',
      cyan: 'bg-cyan-500',
      fuchsia: 'bg-fuchsia-500',
      rose: 'bg-rose-500',
      orange: 'bg-orange-500'
    };
    return cores[cor] || 'bg-gray-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Timeline do Animal
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {animal?.serie} {animal?.rg} - Histórico completo de eventos
                </p>
              </div>
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
          ) : timelineEvents.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum evento registrado para este animal ainda.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

              {/* Eventos */}
              <div className="space-y-6">
                {timelineEvents.map((evento, index) => {
                  const Icon = evento.icon;
                  return (
                    <div key={index} className="relative flex gap-6">
                      {/* Ícone do evento */}
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getCorClasse(evento.cor)} text-white flex-shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      {/* Conteúdo do evento */}
                      <div 
                        className={`flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${evento.expandable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors' : ''}`}
                        onClick={() => evento.expandable && toggleEvent(index)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {evento.titulo}
                            {evento.expandable && (
                              expandedEvents.includes(index) 
                                ? <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                : <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                            )}
                          </h3>
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(evento.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          {evento.descricao}
                        </p>

                        {evento.detalhes.length > 0 && (
                          <div className={`space-y-1 ${evento.expandable && !expandedEvents.includes(index) ? 'hidden' : ''}`}>
                            {evento.detalhes.map((detalhe, idx) => (
                              <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                {detalhe}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {evento.expandable && !expandedEvents.includes(index) && evento.detalhes.length > 0 && (
                           <div className="mt-2 text-xs text-purple-600 font-medium">
                             Clique para ver {evento.detalhes.length} detalhe(s)
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {timelineEvents.length} evento(s) registrado(s)
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
