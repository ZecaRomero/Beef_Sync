// Modais para o sistema de estoque de sêmen

import React, { useState } from 'react'

import { XMarkIcon } from './ui/Icons'

// Modal de Visualização
export const ViewSemenModal = ({ 
  showModal, 
  setShowModal, 
  selectedSemen 
}) => {
  if (!showModal || !selectedSemen) return null

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponivel': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'esgotado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'vencido': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'disponivel': return 'Disponível'
      case 'esgotado': return 'Esgotado'
      case 'vencido': return 'Vencido'
      default: return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🧬 Visualizar Sêmen
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedSemen.nomeTouro || selectedSemen.nome_touro || selectedSemen.serie || 'Sem nome'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Informações do Touro */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🐂 Informações do Touro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Touro
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {selectedSemen.nomeTouro || selectedSemen.nome_touro || selectedSemen.serie || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RG do Touro
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.rgTouro || selectedSemen.rg_touro || selectedSemen.rg || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raça
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.raca || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📍 Localização no Estoque
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localização
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.localizacao || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rack do Touro
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.rackTouro || selectedSemen.rack_touro || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Botijão
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.botijao || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caneca
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.caneca || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          {/* Informações de Compra/Venda */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💰 Informações Financeiras
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {(selectedSemen.tipoOperacao || selectedSemen.tipo_operacao) === 'entrada' ? 'Fornecedor' : 'Destino'}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {(selectedSemen.tipoOperacao || selectedSemen.tipo_operacao) === 'entrada' 
                    ? (selectedSemen.fornecedor || 'Não informado')
                    : (selectedSemen.destino || 'Não informado')
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número da NF
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.numeroNF || selectedSemen.numero_nf || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor
                </label>
                <p className="text-gray-900 dark:text-white font-bold text-lg">
                  R$ {parseFloat(selectedSemen.valorCompra || selectedSemen.valor_compra || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data da Operação
                </label>
                <p className="text-gray-900 dark:text-white">
                  {(selectedSemen.dataCompra || selectedSemen.data_compra)
                    ? new Date(selectedSemen.dataCompra || selectedSemen.data_compra).toLocaleDateString('pt-BR')
                    : 'Não informado'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Controle de Doses */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Controle de Doses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total de Doses
                </label>
                <p className="text-gray-900 dark:text-white font-bold text-lg">
                  {selectedSemen.quantidadeDoses || selectedSemen.quantidade_doses || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Doses Disponíveis
                </label>
                <p className="text-gray-900 dark:text-white font-bold text-lg text-green-600">
                  {selectedSemen.dosesDisponiveis || selectedSemen.doses_disponiveis || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Doses Usadas
                </label>
                <p className="text-gray-900 dark:text-white font-bold text-lg text-red-600">
                  {selectedSemen.dosesUsadas || selectedSemen.doses_usadas || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedSemen.status)}`}>
                  {getStatusLabel(selectedSemen.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Certificado
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.certificado || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Validade
                </label>
                <p className="text-gray-900 dark:text-white">
                  {(selectedSemen.dataValidade || selectedSemen.data_validade)
                    ? new Date(selectedSemen.dataValidade || selectedSemen.data_validade).toLocaleDateString('pt-BR')
                    : 'Não informado'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Origem
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.origem || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Linhagem
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedSemen.linhagem || 'Não informado'}
                </p>
              </div>
            </div>
            {selectedSemen.observacoes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <p className="text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-3 rounded-lg border">
                  {selectedSemen.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={() => setShowModal(false)}
            className="btn-secondary"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal de Edição
export const EditSemenModal = ({ 
  showModal, 
  setShowModal, 
  selectedSemen, 
  handleEditSemen 
}) => {
  if (!showModal || !selectedSemen) return null

  const [editData, setEditData] = useState({
    nomeTouro: selectedSemen.nomeTouro || selectedSemen.nome_touro || selectedSemen.touro || selectedSemen.serie || '',
    rgTouro: selectedSemen.rgTouro || selectedSemen.rg_touro || selectedSemen.rg || '',
    raca: selectedSemen.raca || '',
    localizacao: selectedSemen.localizacao || '',
    rackTouro: selectedSemen.rackTouro || selectedSemen.rack_touro || '',
    botijao: selectedSemen.botijao || '',
    caneca: selectedSemen.caneca || '',
    tipoOperacao: selectedSemen.tipoOperacao || selectedSemen.tipo_operacao || 'entrada',
    fornecedor: selectedSemen.fornecedor || '',
    destino: selectedSemen.destino || '',
    numeroNF: selectedSemen.numeroNF || selectedSemen.numero_nf || '',
    valorCompra: selectedSemen.valorCompra || selectedSemen.valor_compra || '',
    dataCompra: selectedSemen.dataCompra || selectedSemen.data_compra || new Date().toISOString().split('T')[0],
    quantidadeDoses: selectedSemen.quantidadeDoses || selectedSemen.quantidade_doses || selectedSemen.doses || '',
    dosesDisponiveis: selectedSemen.dosesDisponiveis || selectedSemen.doses_disponiveis || '',
    observacoes: selectedSemen.observacoes || '',
    certificado: selectedSemen.certificado || '',
    dataValidade: selectedSemen.dataValidade || selectedSemen.data_validade || '',
    origem: selectedSemen.origem || '',
    linhagem: selectedSemen.linhagem || ''
  })

  const handleSave = async () => {
    const camposObrigatorios = []
    
    if (!editData.nomeTouro) camposObrigatorios.push('Nome do Touro')
    if (!editData.localizacao) camposObrigatorios.push('Localização')
    if (!editData.quantidadeDoses) camposObrigatorios.push('Quantidade de Doses')
    if (editData.tipoOperacao === 'entrada') {
      if (!editData.fornecedor) camposObrigatorios.push('Fornecedor')
      if (!editData.valorCompra) camposObrigatorios.push('Valor da Compra')
    } else {
      if (!editData.destino) camposObrigatorios.push('Destino')
    }
    
    if (camposObrigatorios.length > 0) {
      alert(`Preencha os campos obrigatórios: ${camposObrigatorios.join(', ')}`)
      return
    }

    await handleEditSemen(editData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              ✏️ Editar Sêmen
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {editData.nomeTouro || 'Sem nome'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Tipo de Operação */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Tipo de Operação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="tipoOperacao"
                  value="entrada"
                  checked={editData.tipoOperacao === 'entrada'}
                  onChange={(e) => setEditData(prev => ({ ...prev, tipoOperacao: e.target.value }))}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Entrada</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Compra ou recebimento de sêmen</div>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="tipoOperacao"
                  value="saida"
                  checked={editData.tipoOperacao === 'saida'}
                  onChange={(e) => setEditData(prev => ({ ...prev, tipoOperacao: e.target.value }))}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Saída</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Venda ou transferência de sêmen</div>
                </div>
              </label>
            </div>
          </div>

          {/* Informações do Touro */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🐂 Informações do Touro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Touro *
                </label>
                <input
                  type="text"
                  placeholder="Digite aqui... "
                  value={editData.nomeTouro}
                  onChange={(e) => setEditData(prev => ({ ...prev, nomeTouro: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RG do Touro
                </label>
                <input
                  type="text"
                  placeholder="Digite aqui... "
                  value={editData.rgTouro}
                  onChange={(e) => setEditData(prev => ({ ...prev, rgTouro: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raça
                </label>
                <select
                  value={editData.raca}
                  onChange={(e) => setEditData(prev => ({ ...prev, raca: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Selecione a raça</option>
                  <option value="Nelore">Nelore</option>
                  <option value="Angus">Angus</option>
                  <option value="Brahman">Brahman</option>
                  <option value="Gir">Gir</option>
                  <option value="Simental">Simental</option>
                  <option value="Charolês">Charolês</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>
          </div>

          {/* Localização Física */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📍 Localização Física
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localização *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tanque 1, Sala A"
                  value={editData.localizacao}
                  onChange={(e) => setEditData(prev => ({ ...prev, localizacao: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rack do Touro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rack 5"
                  value={editData.rackTouro}
                  onChange={(e) => setEditData(prev => ({ ...prev, rackTouro: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Botijão
                </label>
                <input
                  type="text"
                  placeholder="Ex: Botijão 3"
                  value={editData.botijao}
                  onChange={(e) => setEditData(prev => ({ ...prev, botijao: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caneca
                </label>
                <input
                  type="text"
                  placeholder="Ex: Caneca 12"
                  value={editData.caneca}
                  onChange={(e) => setEditData(prev => ({ ...prev, caneca: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Operação (Entrada/Saída) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editData.tipoOperacao === 'entrada' ? '📥 Dados da Entrada' : '📤 Dados da Saída'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {editData.tipoOperacao === 'entrada' ? 'Fornecedor *' : 'Destino *'}
                </label>
                <input
                  type="text"
                  placeholder={editData.tipoOperacao === 'entrada' ? 'Ex: Genética Premium' : 'Ex: Fazenda XYZ'}
                  value={editData.tipoOperacao === 'entrada' ? editData.fornecedor : editData.destino}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    [editData.tipoOperacao === 'entrada' ? 'fornecedor' : 'destino']: e.target.value 
                  }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número da NF
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12345"
                  value={editData.numeroNF}
                  onChange={(e) => setEditData(prev => ({ ...prev, numeroNF: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data da Operação *
                </label>
                <input
                  type="date"
                  value={editData.dataCompra}
                  onChange={(e) => setEditData(prev => ({ ...prev, dataCompra: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Quantidade e Valor */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💰 Quantidade e Valor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade de Doses *
                </label>
                <input
                  type="number"
                  placeholder="Ex: 50"
                  value={editData.quantidadeDoses}
                  onChange={(e) => setEditData(prev => ({ ...prev, quantidadeDoses: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {editData.tipoOperacao === 'entrada' ? 'Valor da Compra *' : 'Valor da Venda'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  value={editData.valorCompra}
                  onChange={(e) => setEditData(prev => ({ ...prev, valorCompra: e.target.value }))}
                  className="input-field"
                  required={editData.tipoOperacao === 'entrada'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Doses Disponíveis
                </label>
                <input
                  type="number"
                  placeholder="Deixe vazio para usar a quantidade total"
                  value={editData.dosesDisponiveis}
                  onChange={(e) => setEditData(prev => ({ ...prev, dosesDisponiveis: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Certificado
                </label>
                <input
                  type="text"
                  placeholder="Ex: CERT-2024-001"
                  value={editData.certificado}
                  onChange={(e) => setEditData(prev => ({ ...prev, certificado: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={editData.dataValidade}
                  onChange={(e) => setEditData(prev => ({ ...prev, dataValidade: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Origem
                </label>
                <input
                  type="text"
                  placeholder="Ex: Brasil, EUA, Argentina"
                  value={editData.origem}
                  onChange={(e) => setEditData(prev => ({ ...prev, origem: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                placeholder="Informações adicionais sobre o sêmen..."
                value={editData.observacoes}
                onChange={(e) => setEditData(prev => ({ ...prev, observacoes: e.target.value }))}
                className="input-field h-24 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            * Campos obrigatórios
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const AddSemenModal = ({ 
  showModal, 
  setShowModal, 
  newSemen, 
  setNewSemen, 
  handleAddSemen 
}) => {
  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            🧬 Adicionar Sêmen ao Estoque
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Informações do Touro */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações do Touro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Touro *
                </label>
                <input
                  type="text"
                  placeholder="Digite aqui... "
                  value={newSemen.nomeTouro}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, nomeTouro: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RG do Touro
                </label>
                <input
                  type="text"
                  placeholder="Digite aqui... "
                  value={newSemen.rgTouro}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, rgTouro: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raça
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nelore, Angus..."
                  value={newSemen.raca}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, raca: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Localização no Estoque
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localização Geral
                </label>
                <input
                  type="text"
                  placeholder="Ex: Galpão A, Sala 1..."
                  value={newSemen.localizacao}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, localizacao: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Botijão
                </label>
                <input
                  type="text"
                  placeholder="Ex: B001, Botijão 1..."
                  value={newSemen.botijao}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, botijao: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caneca
                </label>
                <input
                  type="text"
                  placeholder="Ex: C001, Caneca A..."
                  value={newSemen.caneca}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, caneca: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Informações de Compra */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações de Compra
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  placeholder="Nome do fornecedor"
                  value={newSemen.fornecedor}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, fornecedor: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número da NF
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12345"
                  value={newSemen.numeroNF}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, numeroNF: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor da Compra *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  value={newSemen.valorCompra}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, valorCompra: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={newSemen.dataCompra}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, dataCompra: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Informações das Doses */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Controle de Doses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade de Doses *
                </label>
                <input
                  type="number"
                  placeholder="Ex: 50"
                  value={newSemen.quantidadeDoses}
                  onChange={(e) => {
                    const value = e.target.value
                    setNewSemen(prev => ({ 
                      ...prev, 
                      quantidadeDoses: value,
                      dosesDisponiveis: prev.dosesDisponiveis || value
                    }))
                  }}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Doses Disponíveis
                </label>
                <input
                  type="number"
                  placeholder="Preenchido automaticamente"
                  value={newSemen.dosesDisponiveis}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, dosesDisponiveis: e.target.value }))}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se não preenchido, será igual à quantidade total
                </p>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Certificado
                </label>
                <input
                  type="text"
                  placeholder="Número do certificado"
                  value={newSemen.certificado}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, certificado: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={newSemen.dataValidade}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, dataValidade: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Origem
                </label>
                <input
                  type="text"
                  placeholder="Ex: Central de Sêmen XYZ"
                  value={newSemen.origem}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, origem: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Linhagem
                </label>
                <input
                  type="text"
                  placeholder="Ex: Linhagem Elite"
                  value={newSemen.linhagem}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, linhagem: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                rows={3}
                placeholder="Observações adicionais sobre o sêmen..."
                value={newSemen.observacoes}
                onChange={(e) => setNewSemen(prev => ({ ...prev, observacoes: e.target.value }))}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={() => setShowModal(false)}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddSemen}
            className="btn-primary"
          >
            Adicionar ao Estoque
          </button>
        </div>
      </div>
    </div>
  )
}