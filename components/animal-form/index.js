import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import useAnimalForm from './useAnimalForm';
import { useAutocomplete } from '../../hooks/useAutocomplete';

// Sections
import IdentificationSection from './IdentificationSection';
import CharacteristicsSection from './CharacteristicsSection';
import GenealogySection from './GenealogySection';
import ProtocolSection from './ProtocolSection';
import NFSelectionSection from './NFSelectionSection';

// Modals
import ImportModal from './ImportModal';
import NFModal from './NFModal';
import NascimentoModal from './NascimentoModal';

export default function AnimalForm({ isOpen, onClose, animal, onSave }) {
  const {
    formData,
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
  } = useAnimalForm(animal, isOpen, onClose, onSave);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showNFModal, setShowNFModal] = useState(false);
  const [showNascimentoModal, setShowNascimentoModal] = useState(false);
  const { data: autocompleteAnimais } = useAutocomplete('animais', isOpen);
  const { data: autocompletePiquetes } = useAutocomplete('piquetes', isOpen);

  // Helper to handle NF save (refresh list)
  const handleSaveNF = async (novaNF) => {
    try {
      console.log('Saving NF:', novaNF);
      
      // Preparar dados para a API
      const nfData = {
        numeroNF: novaNF.numeroNF,
        data: novaNF.dataCompra, // A API espera 'data'
        fornecedor: novaNF.fornecedor,
        origem: novaNF.origem,
        valorTotal: novaNF.valorTotal,
        naturezaOperacao: 'Compra de Animais', // PadrÃ£o para este modal
        tipo: 'entrada',
        tipoProduto: 'bovino',
        observacoes: novaNF.observacoes,
        ehReceptoras: true,
        // Adicionar um item para que o valor total seja registrado corretamente se a API exigir itens
        itens: [
          {
            tipoProduto: 'bovino',
            quantidade: novaNF.quantidadeReceptoras,
            valorUnitario: novaNF.valorPorReceptora,
            descricao: `Lote de ${novaNF.quantidadeReceptoras} receptoras`
          }
        ]
      };

      const response = await fetch('/api/notas-fiscais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nfData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar nota fiscal');
      }

      console.log('NF salva com sucesso no banco de dados');
      await loadNotasFiscais(); // Recarregar lista da API
    } catch (error) {
      console.error('Erro ao salvar NF:', error);
      alert('Erro ao salvar nota fiscal no banco de dados: ' + error.message);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={animal ? 'Editar Animal' : 'Novo Animal'}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Top Actions for Special Cases */}
          {!animal && formData.serie === 'CJCJ' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center border border-blue-200 dark:border-blue-700">
              <div>
                <span className="font-semibold text-blue-800 dark:text-blue-200 block">
                  âÅ“¨ Nascimento CJCJ
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-300">
                  Preenchimento assistido para nascimentos
                </span>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowNascimentoModal(true)}
                className="text-sm py-1"
              >
                Abrir Assistente
              </Button>
            </div>
          )}

          <IdentificationSection
            formData={formData}
            autocompleteData={{ ...(autocompleteAnimais || {}), piquete: autocompletePiquetes?.nome || [] }}
            updateField={updateField}
            handleSerieChange={handleSerieChange}
            errors={errors}
            availableLocations={availableLocations}
          />

          <CharacteristicsSection
            formData={formData}
            updateField={updateField}
            handleDateChange={handleDateChange}
            errors={errors}
          />

          <GenealogySection
            formData={formData}
            updateField={updateField}
            autocompleteData={autocompleteAnimais || {}}
          />

          {/* Only show NF Selection for Receptora or specific cases if needed */}
          {formData.serie === 'RPT' && (
            <NFSelectionSection
              formData={formData}
              updateField={updateField}
              nfsCadastradas={nfsCadastradas}
              setShowImportModal={setShowImportModal}
              setShowNFModal={setShowNFModal}
            />
          )}

          <ProtocolSection
            formData={formData}
            updateField={updateField}
          />

          {/* ObservaÃ§Ãµes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ObservaÃ§Ãµes
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => updateField('observacoes', e.target.value)}
              className="input-field"
              rows={2}
              placeholder="ObservaÃ§Ãµes adicionais..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
             <Button
              type="button"
              variant="danger" // Assuming 'danger' or 'secondary' variant exists for clear
              onClick={() => {
                 if(confirm('Limpar formulÃ¡rio?')) {
                    // Logic to reset form (can be added to hook)
                    onClose(); // Simple hack: close and reopen or just close
                 }
              }}
              className="text-red-600"
            >
              ðÅ¸â€”â€˜ï¸� Limpar
            </Button>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                {animal ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modals */}
      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSave={handleSaveNF}
          naturezasOperacao={naturezasOperacao}
          setNaturezasOperacao={setNaturezasOperacao}
        />
      )}

      {showNFModal && (
        <NFModal
          isOpen={showNFModal}
          onClose={() => setShowNFModal(false)}
          onSave={handleSaveNF}
        />
      )}

      {showNascimentoModal && (
        <NascimentoModal
          isOpen={showNascimentoModal}
          onClose={() => setShowNascimentoModal(false)}
          onSave={(dados) => {
            // Merge dados from modal to main form
            Object.keys(dados).forEach(key => {
              updateField(key, dados[key]);
            });
            setShowNascimentoModal(false);
          }}
        />
      )}
    </>
  );
}
