
import React, { useEffect, useState } from 'react'

import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDate } from '../../utils/formatters'

const AnimalNFIntegration = ({ animals, onUpdateAnimal }) => {
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [nfData, setNfData] = useState({
    tipo: 'entrada', // entrada ou saida
    numero: '',
    serie: '1',
    fornecedor_cliente: '',
    cnpj_cpf: '',
    valor: '',
    data_emissao: new Date().toISOString().split('T')[0],
    descricao: '',
    observacoes: ''
  })
  const toast = useToast()

  // Animais que podem ter NF associada
  const animaisDisponiveis = animals.filter(animal => 
    animal.situacao === 'Ativo' || animal.situacao === 'Vendido'
  )

  const handleAnimalSelect = (animal) => {
    setSelectedAnimal(animal)
    
    // PrÃ©-preencher dados baseado no animal
    if (animal.situacao === 'Vendido') {
      setNfData(prev => ({
        ...prev,
        tipo: 'saida',
        valor: animal.valorVenda || '',
        fornecedor_cliente: animal.comprador || '',
        descricao: `Venda de bovino ${animal.raca} - ${animal.sexo} - ${animal.peso}kg`,
        observacoes: `Animal: ${animal.nome || animal.numero} - ERA: ${animal.era}`
      }))
    } else {
      // Para animais ativos, assumir NF de entrada (compra)
      setNfData(prev => ({
        ...prev,
        tipo: 'entrada',
        valor: animal.custoTotal || '',
        descricao: `AquisiÃ§Ã£o de bovino ${animal.raca} - ${animal.sexo} - ${animal.peso}kg`,
        observacoes: `Animal: ${animal.nome || animal.numero} - ERA: ${animal.era}`
      }))
    }
  }

  const gerarNF = async () => {
    if (!selectedAnimal) {
      toast.error('Selecione um animal primeiro')
      return
    }

    if (!nfData.numero || !nfData.fornecedor_cliente || !nfData.valor) {
      toast.error('Preencha todos os campos obrigatÃ³rios')
      return
    }

    try {
      // Simular geraÃ§Ã£o da NF
      const nfGerada = {
        id: Date.now(),
        numero: nfData.numero,
        serie: nfData.serie,
        tipo: nfData.tipo,
        animal_id: selectedAnimal.id,
        animal_nome: selectedAnimal.nome || selectedAnimal.numero,
        fornecedor_cliente: nfData.fornecedor_cliente,
        cnpj_cpf: nfData.cnpj_cpf,
        valor: parseFloat(nfData.valor),
        data_emissao: nfData.data_emissao,
        descricao: nfData.descricao,
        observacoes: nfData.observacoes,
        categoria_fiscal: nfData.tipo === 'entrada' ? 'AquisiÃ§Ã£o de Estoque' : 'Venda de Estoque',
        ncm: '0102.90.00', // Bovinos vivos
        cfop: nfData.tipo === 'entrada' ? '1102' : '5102',
        icms: parseFloat(nfData.valor) * 0.12, // 12% ICMS
        status: 'emitida',
        data_criacao: new Date().toISOString()
      }

      // Salvar NF (em produÃ§Ã£o seria uma chamada Ã  API)
      const nfsExistentes = JSON.parse(localStorage.getItem('notasFiscais') || '[]')
      nfsExistentes.push(nfGerada)
      localStorage.setItem('notasFiscais', JSON.stringify(nfsExistentes))

      // Atualizar animal com referÃªncia da NF
      const animalAtualizado = {
        ...selectedAnimal,
        nf_associada: nfGerada.id,
        nf_numero: nfData.numero,
        nf_valor: parseFloat(nfData.valor),
        nf_data: nfData.data_emissao
      }

      if (onUpdateAnimal) {
        onUpdateAnimal(animalAtualizado)
      }

      // Gerar arquivo da NF para download
      const nfContent = `
NOTA FISCAL ELETRÃâ€�NICA - NFe
NÃºmero: ${nfGerada.numero} | SÃ©rie: ${nfGerada.serie}
Tipo: ${nfGerada.tipo === 'entrada' ? 'ENTRADA' : 'SAÃ�DA'}

${nfGerada.tipo === 'entrada' ? 'FORNECEDOR' : 'CLIENTE'}:
Nome/RazÃ£o Social: ${nfGerada.fornecedor_cliente}
CNPJ/CPF: ${nfGerada.cnpj_cpf}

DADOS DO PRODUTO/SERVIÃâ€¡O:
DescriÃ§Ã£o: ${nfGerada.descricao}
NCM: ${nfGerada.ncm}
CFOP: ${nfGerada.cfop}
Valor: ${formatCurrency(nfGerada.valor)}
ICMS (12%): ${formatCurrency(nfGerada.icms)}

ANIMAL RELACIONADO:
ID: ${selectedAnimal.id}
Nome/NÃºmero: ${selectedAnimal.nome || selectedAnimal.numero}
RaÃ§a: ${selectedAnimal.raca}
Sexo: ${selectedAnimal.sexo}
Peso: ${selectedAnimal.peso}kg
ERA: ${selectedAnimal.era}

OBSERVAÃâ€¡Ãâ€¢ES:
${nfGerada.observacoes}

Data de EmissÃ£o: ${formatDate(nfGerada.data_emissao)}
Gerado pelo Sistema Beef Sync em ${formatDate(new Date())}
      `

      const blob = new Blob([nfContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `NF-${nfGerada.numero}-${selectedAnimal.nome || selectedAnimal.numero}.txt`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`NF ${nfData.numero} gerada com sucesso! Arquivo baixado.`)
      
      // Limpar formulÃ¡rio
      setSelectedAnimal(null)
      setNfData({
        tipo: 'entrada',
        numero: '',
        serie: '1',
        fornecedor_cliente: '',
        cnpj_cpf: '',
        valor: '',
        data_emissao: new Date().toISOString().split('T')[0],
        descricao: '',
        observacoes: ''
      })

    } catch (error) {
      console.error('Erro ao gerar NF:', error)
      toast.error('Erro ao gerar nota fiscal')
    }
  }

  const enviarParaContador = () => {
    if (!selectedAnimal) {
      toast.error('Selecione um animal primeiro')
      return
    }

    const emailSubject = `SolicitaÃ§Ã£o de NF - ${nfData.tipo === 'entrada' ? 'Compra' : 'Venda'} de Gado - ${selectedAnimal.nome || selectedAnimal.numero}`
    
    const emailBody = `Prezado(a) Contador(a),

Solicito a emissÃ£o de Nota Fiscal com os seguintes dados:

ðÅ¸â€œâ€¹ TIPO DE OPERAÃâ€¡ÃÆ’O: ${nfData.tipo === 'entrada' ? 'ENTRADA (Compra)' : 'SAÃ�DA (Venda)'}

ðÅ¸�â€ž DADOS DO ANIMAL:
ââ‚¬¢ IdentificaÃ§Ã£o: ${selectedAnimal.nome || selectedAnimal.numero}
ââ‚¬¢ RaÃ§a: ${selectedAnimal.raca}
ââ‚¬¢ Sexo: ${selectedAnimal.sexo}
ââ‚¬¢ Peso: ${selectedAnimal.peso}kg
ââ‚¬¢ ERA: ${selectedAnimal.era}
ââ‚¬¢ SituaÃ§Ã£o: ${selectedAnimal.situacao}

ðÅ¸â€œâ€ž DADOS DA NOTA FISCAL:
ââ‚¬¢ NÃºmero sugerido: ${nfData.numero}
ââ‚¬¢ SÃ©rie: ${nfData.serie}
ââ‚¬¢ ${nfData.tipo === 'entrada' ? 'Fornecedor' : 'Cliente'}: ${nfData.fornecedor_cliente}
ââ‚¬¢ CNPJ/CPF: ${nfData.cnpj_cpf}
ââ‚¬¢ Valor: ${formatCurrency(nfData.valor)}
ââ‚¬¢ Data de EmissÃ£o: ${formatDate(nfData.data_emissao)}

ðÅ¸â€œÅ  INFORMAÃâ€¡Ãâ€¢ES FISCAIS:
ââ‚¬¢ NCM: 0102.90.00 (Bovinos vivos)
ââ‚¬¢ CFOP: ${nfData.tipo === 'entrada' ? '1102 (Compra)' : '5102 (Venda)'}
ââ‚¬¢ Categoria Fiscal: ${nfData.tipo === 'entrada' ? 'AquisiÃ§Ã£o de Estoque' : 'Venda de Estoque'}
ââ‚¬¢ ICMS estimado (12%): ${formatCurrency(parseFloat(nfData.valor || 0) * 0.12)}

ðÅ¸â€œ� DESCRIÃâ€¡ÃÆ’O:
${nfData.descricao}

ðÅ¸â€™¬ OBSERVAÃâ€¡Ãâ€¢ES:
${nfData.observacoes}

Por favor, proceder com a emissÃ£o da NF e me informar quando estiver disponÃ­vel.

Atenciosamente,
Sistema Beef Sync - GestÃ£o Integrada`

    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailtoLink, '_blank')

    toast.success('SolicitaÃ§Ã£o enviada! Outlook aberto.')
  }

  return (
    <div className="space-y-6">
      {/* SeleÃ§Ã£o de Animal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ðÅ¸�â€ž Associar NF a Animal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animaisDisponiveis.map((animal) => (
            <div
              key={animal.id}
              onClick={() => handleAnimalSelect(animal)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedAnimal?.id === animal.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {animal.nome || animal.numero}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  animal.situacao === 'Ativo' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                  {animal.situacao}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{animal.raca} ââ‚¬¢ {animal.sexo} ââ‚¬¢ {animal.peso}kg</p>
                <p>ERA: {animal.era}</p>
                {animal.situacao === 'Vendido' && animal.valorVenda && (
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    Vendido: {formatCurrency(animal.valorVenda)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FormulÃ¡rio da NF */}
      {selectedAnimal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            ðÅ¸â€œâ€ž Dados da Nota Fiscal - {selectedAnimal.nome || selectedAnimal.numero}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de NF *
                </label>
                <select
                  value={nfData.tipo}
                  onChange={(e) => setNfData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="input-field"
                >
                  <option value="entrada">Entrada (Compra)</option>
                  <option value="saida">SaÃ­da (Venda)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NÃºmero *
                  </label>
                  <input
                    type="text"
                    value={nfData.numero}
                    onChange={(e) => setNfData(prev => ({ ...prev, numero: e.target.value }))}
                    className="input-field"
                    placeholder="000001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SÃ©rie
                  </label>
                  <input
                    type="text"
                    value={nfData.serie}
                    onChange={(e) => setNfData(prev => ({ ...prev, serie: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {nfData.tipo === 'entrada' ? 'Fornecedor' : 'Cliente'} *
                </label>
                <input
                  type="text"
                  value={nfData.fornecedor_cliente}
                  onChange={(e) => setNfData(prev => ({ ...prev, fornecedor_cliente: e.target.value }))}
                  className="input-field"
                  placeholder="Nome/RazÃ£o Social"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CNPJ/CPF
                </label>
                <input
                  type="text"
                  value={nfData.cnpj_cpf}
                  onChange={(e) => setNfData(prev => ({ ...prev, cnpj_cpf: e.target.value }))}
                  className="input-field"
                  placeholder="00.000.000/0001-00"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nfData.valor}
                    onChange={(e) => setNfData(prev => ({ ...prev, valor: e.target.value }))}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de EmissÃ£o
                  </label>
                  <input
                    type="date"
                    value={nfData.data_emissao}
                    onChange={(e) => setNfData(prev => ({ ...prev, data_emissao: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  DescriÃ§Ã£o
                </label>
                <textarea
                  value={nfData.descricao}
                  onChange={(e) => setNfData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                  className="input-field"
                  placeholder="DescriÃ§Ã£o do produto/serviÃ§o"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ObservaÃ§Ãµes
                </label>
                <textarea
                  value={nfData.observacoes}
                  onChange={(e) => setNfData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={2}
                  className="input-field"
                  placeholder="ObservaÃ§Ãµes adicionais"
                />
              </div>
            </div>
          </div>

          {/* Resumo Fiscal */}
          {nfData.valor && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Resumo Fiscal</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">NCM:</span>
                  <p className="font-medium">0102.90.00</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">CFOP:</span>
                  <p className="font-medium">{nfData.tipo === 'entrada' ? '1102' : '5102'}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ICMS (12%):</span>
                  <p className="font-medium">{formatCurrency(parseFloat(nfData.valor) * 0.12)}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Valor Total:</span>
                  <p className="font-medium">{formatCurrency(nfData.valor)}</p>
                </div>
              </div>
            </div>
          )}

          {/* AÃ§Ãµes */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={gerarNF}
              className="btn-primary flex items-center"
            >
              ðÅ¸â€œâ€ž Gerar NF
            </button>
            <button
              onClick={enviarParaContador}
              className="btn-secondary flex items-center"
            >
              ðÅ¸â€œ§ Enviar p/ Contador
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimalNFIntegration