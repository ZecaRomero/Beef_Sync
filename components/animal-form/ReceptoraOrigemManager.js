import React, { useState, useEffect } from 'react';

// Componente para gerenciar origem das receptoras
export default function ReceptoraOrigemManager({ value, onChange }) {
  const [origens, setOrigens] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrigem, setEditingOrigem] = useState(null);

  // Carregar origens do localStorage
  useEffect(() => {
    const savedOrigens = localStorage.getItem('receptoraOrigens');
    if (savedOrigens) {
      setOrigens(JSON.parse(savedOrigens));
    } else {
      // Origens padrão
      const origensDefault = [
        'Fazenda São João',
        'Fazenda Santa Maria',
        'Leilão Nelore Elite',
        'Compra Particular'
      ];
      setOrigens(origensDefault);
      localStorage.setItem('receptoraOrigens', JSON.stringify(origensDefault));
    }
  }, []);

  const salvarOrigens = (novasOrigens) => {
    setOrigens(novasOrigens);
    localStorage.setItem('receptoraOrigens', JSON.stringify(novasOrigens));
  };

  const adicionarOrigem = (novaOrigem) => {
    if (novaOrigem && !origens.includes(novaOrigem)) {
      const novasOrigens = [...origens, novaOrigem];
      salvarOrigens(novasOrigens);
    }
  };

  const editarOrigem = (origemAntiga, origemNova) => {
    if (origemNova && origemNova !== origemAntiga) {
      const novasOrigens = origens.map(o => o === origemAntiga ? origemNova : o);
      salvarOrigens(novasOrigens);
      if (value === origemAntiga) {
        onChange(origemNova);
      }
    }
  };

  const excluirOrigem = (origem) => {
    const novasOrigens = origens.filter(o => o !== origem);
    salvarOrigens(novasOrigens);
    if (value === origem) {
      onChange('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Select com origens existentes */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      >
        <option value="">Selecione a origem...</option>
        {origens.map((origem, idx) => (
          <option key={idx} value={origem}>{origem}</option>
        ))}
      </select>

      {/* Botões de ação */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-secondary text-sm px-3 py-1"
        >
          ➕ Incluir
        </button>
        {value && (
          <>
            <button
              type="button"
              onClick={() => setEditingOrigem(value)}
              className="btn-secondary text-sm px-3 py-1"
            >
              ✏️ Editar
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Deseja excluir a origem "${value}"?`)) {
                  excluirOrigem(value);
                }
              }}
              className="btn-secondary text-sm px-3 py-1 text-red-600 hover:text-red-700"
            >
              🗑️ Excluir
            </button>
          </>
        )}
      </div>

      {/* Modal para adicionar nova origem */}
      {showAddModal && (
        <OrigemModal
          title="Adicionar Nova Origem"
          initialValue=""
          onSave={(novaOrigem) => {
            adicionarOrigem(novaOrigem);
            onChange(novaOrigem);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Modal para editar origem */}
      {editingOrigem && (
        <OrigemModal
          title="Editar Origem"
          initialValue={editingOrigem}
          onSave={(origemEditada) => {
            editarOrigem(editingOrigem, origemEditada);
            setEditingOrigem(null);
          }}
          onClose={() => setEditingOrigem(null)}
        />
      )}
    </div>
  );
}

// Modal para adicionar/editar origem
function OrigemModal({ title, initialValue, onSave, onClose }) {
  const [valor, setValor] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (valor.trim()) {
      onSave(valor.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Origem
            </label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="input-field w-full"
              placeholder="Ex: Fazenda Nova Esperança"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!valor.trim()}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
