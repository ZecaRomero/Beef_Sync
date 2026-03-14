import React, { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  ScaleIcon, 
  MapPinIcon, 
  UserIcon, 
  HeartIcon, 
  XCircleIcon,
  BeakerIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { PillsIcon, FireIcon } from '../ui/Icons'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

const OCCURRENCE_TYPES = {
  Pesagem: { icon: ScaleIcon, color: 'blue', label: 'Pesagem' },
  Local: { icon: MapPinIcon, color: 'green', label: 'Mudança de Local' },
  CE: { icon: UserIcon, color: 'purple', label: 'C.E' },
  DG: { icon: HeartIcon, color: 'pink', label: 'DG (Diagnóstico de Gestação)' },
  Vacinação: { icon: ShieldCheckIcon, color: 'emerald', label: 'Vacinação' },
  Exame: { icon: BeakerIcon, color: 'indigo', label: 'Exame' },
  Tratamento: { icon: PillsIcon, color: 'orange', label: 'Tratamento' },
  Medicamento: { icon: PillsIcon, color: 'amber', label: 'Medicamento' },
  Cirurgia: { icon: FireIcon, color: 'rose', label: 'Cirurgia' },
  Observação: { icon: DocumentTextIcon, color: 'gray', label: 'Observação' },
  Morte: { icon: XCircleIcon, color: 'red', label: 'Morte' },
  Venda: { icon: CurrencyDollarIcon, color: 'green', label: 'Venda (NF)' }
}

export default function QuickOccurrenceForm({ isOpen, onClose, animal, onSuccess, onVenda }) {
  const [tipo, setTipo] = useState('Pesagem')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [peso, setPeso] = useState('')
  const [local, setLocal] = useState('')
  const [ce, setCe] = useState('')
  const [dg, setDg] = useState('')
  const [causaMorte, setCausaMorte] = useState('')
  const [medicamento, setMedicamento] = useState('')
  const [dosagem, setDosagem] = useState('')
  const [veterinario, setVeterinario] = useState('')
  const [proximaAplicacao, setProximaAplicacao] = useState('')
  const [resultadoExame, setResultadoExame] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [piquetes, setPiquetes] = useState([])
  const [loadingPiquetes, setLoadingPiquetes] = useState(false)
  const [novoPiquete, setNovoPiquete] = useState('')
  const [usarNovoPiquete, setUsarNovoPiquete] = useState(false)

  const resetForm = () => {
    setPeso('')
    setLocal('')
    setCe('')
    setDg('')
    setCausaMorte('')
    setMedicamento('')
    setDosagem('')
    setVeterinario('')
    setProximaAplicacao('')
    setResultadoExame('')
    setObservacoes('')
    setNovoPiquete('')
    setUsarNovoPiquete(false)
    setError('')
    setData(new Date().toISOString().split('T')[0])
  }

  const handleTipoChange = (newTipo) => {
    if (newTipo === 'Venda') {
      if (onVenda) {
        onVenda()
        // Não fechamos o modal aqui, deixamos o pai decidir ou o pai abre outro modal por cima
        // Mas como queremos sair deste modal para ir pro NF, vamos fechar este
        onClose()
      } else {
        alert('Funcionalidade de venda não configurada neste contexto')
      }
      return
    }
    setTipo(newTipo)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validações específicas por tipo
      if (tipo === 'Pesagem' && !peso) {
        setError('Peso é obrigatório')
        setLoading(false)
        return
      }

      if (tipo === 'Local' && !local) {
        setError('Local é obrigatório')
        setLoading(false)
        return
      }

      if (tipo === 'CE' && !ce) {
        setError('Circunferência Escrotal (CE) é obrigatória')
        setLoading(false)
        return
      }

      if (tipo === 'CE' && animal?.sexo !== 'Macho') {
        setError('CE só pode ser registrado para machos')
        setLoading(false)
        return
      }

      if (tipo === 'DG' && !dg) {
        setError('Diagnóstico de Gestação (DG) é obrigatório')
        setLoading(false)
        return
      }

      if (tipo === 'DG' && animal?.sexo !== 'Fêmea') {
        setError('DG só pode ser registrado para fêmeas')
        setLoading(false)
        return
      }

      if (tipo === 'Morte' && !causaMorte) {
        setError('Causa da morte é obrigatória')
        setLoading(false)
        return
      }

      if ((tipo === 'Vacinação' || tipo === 'Tratamento' || tipo === 'Medicamento') && !medicamento) {
        setError('Medicamento é obrigatório')
        setLoading(false)
        return
      }

      const payload = {
        animalId: animal.id,
        tipo,
        data,
        observacoes
      }

      if (tipo === 'Pesagem') payload.peso = parseFloat(peso)
      if (tipo === 'Local') payload.local = local
      if (tipo === 'CE') payload.ce = ce
      if (tipo === 'DG') {
        payload.dg = dg
        if (veterinario) payload.veterinario = veterinario
      }
      if (tipo === 'Morte') payload.causaMorte = causaMorte
      if (tipo === 'Vacinação' || tipo === 'Tratamento' || tipo === 'Medicamento') {
        payload.medicamento = medicamento
        if (dosagem) payload.dosagem = dosagem
        if (veterinario) payload.veterinario = veterinario
        if (proximaAplicacao) payload.proximaAplicacao = proximaAplicacao
      }
      if (tipo === 'Exame') {
        if (resultadoExame) payload.resultadoExame = resultadoExame
        if (veterinario) payload.veterinario = veterinario
      }
      if (tipo === 'Cirurgia') {
        if (veterinario) payload.veterinario = veterinario
      }
      if (veterinario && (tipo === 'Observação' || tipo === 'Cirurgia')) {
        payload.veterinario = veterinario
      }

      const response = await fetch('/api/ocorrencias/rapida', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.status === 'success' || response.ok) {
        alert(`✅ ${tipo} registrada com sucesso!`)
        if (onSuccess) {
          onSuccess(result.data)
        }
        handleClose()
      } else {
        setError(result.message || 'Erro ao registrar ocorrência')
      }
    } catch (err) {
      setError(`Erro ao registrar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && tipo === 'Local') {
      carregarPiquetes()
    }
  }, [isOpen, tipo])

  const carregarPiquetes = async () => {
    setLoadingPiquetes(true)
    try {
      const response = await fetch('/api/localizacoes/piquetes')
      const result = await response.json()
      
      if (result.status === 'success' && result.data) {
        setPiquetes(result.data.piquetes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar piquetes:', error)
      setPiquetes([])
    } finally {
      setLoadingPiquetes(false)
    }
  }

  const handleClose = () => {
    resetForm()
    setTipo('Pesagem')
    onClose()
  }

  const currentTypeInfo = OCCURRENCE_TYPES[tipo]
  const Icon = currentTypeInfo?.icon || ScaleIcon

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon className={`h-6 w-6 ${
              currentTypeInfo?.color === 'blue' ? 'text-blue-500' :
              currentTypeInfo?.color === 'green' ? 'text-green-500' :
              currentTypeInfo?.color === 'purple' ? 'text-purple-500' :
              currentTypeInfo?.color === 'pink' ? 'text-pink-500' :
              currentTypeInfo?.color === 'emerald' ? 'text-emerald-500' :
              currentTypeInfo?.color === 'indigo' ? 'text-indigo-500' :
              currentTypeInfo?.color === 'orange' ? 'text-orange-500' :
              currentTypeInfo?.color === 'amber' ? 'text-amber-500' :
              currentTypeInfo?.color === 'rose' ? 'text-rose-500' :
              currentTypeInfo?.color === 'gray' ? 'text-gray-500' :
              'text-red-500'
            }`} />
            Lançar Ocorrência Rápida
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {animal && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Animal: <span className="font-semibold text-gray-900 dark:text-white">{animal.serie}-{animal.rg}</span>
              {animal.nome && (
                <span className="ml-2 text-gray-500 dark:text-gray-400">({animal.nome})</span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sexo: {animal.sexo} • Raça: {animal.raca}
            </p>
          </div>
        )}

        {/* Seleção de Tipo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Tipo de Ocorrência
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(OCCURRENCE_TYPES).map(([key, info]) => {
              const TypeIcon = info?.icon || ScaleIcon
              if (!TypeIcon) {
                console.error(`Ícone não encontrado para tipo: ${key}`)
                return null
              }
              const isDisabled = 
                (key === 'CE' && animal?.sexo !== 'Macho') ||
                (key === 'DG' && animal?.sexo !== 'Fêmea')
              
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !isDisabled && handleTipoChange(key)}
                  disabled={isDisabled}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    tipo === key
                      ? (info.color === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                         info.color === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                         info.color === 'purple' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' :
                         info.color === 'pink' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' :
                         info.color === 'emerald' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
                         info.color === 'indigo' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' :
                         info.color === 'orange' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                         info.color === 'amber' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                         info.color === 'rose' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' :
                         info.color === 'gray' ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20' :
                         'border-red-500 bg-red-50 dark:bg-red-900/20')
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {TypeIcon && (
                    <TypeIcon className={`h-5 w-5 mx-auto mb-1 ${
                      info.color === 'blue' ? 'text-blue-500' :
                      info.color === 'green' ? 'text-green-500' :
                      info.color === 'purple' ? 'text-purple-500' :
                      info.color === 'pink' ? 'text-pink-500' :
                      info.color === 'emerald' ? 'text-emerald-500' :
                      info.color === 'indigo' ? 'text-indigo-500' :
                      info.color === 'orange' ? 'text-orange-500' :
                      info.color === 'amber' ? 'text-amber-500' :
                      info.color === 'rose' ? 'text-rose-500' :
                      info.color === 'gray' ? 'text-gray-500' :
                      'text-red-500'
                    }`} />
                  )}
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{info?.label || key}</p>
                  {isDisabled && (
                    <p className="text-xs text-gray-400 mt-1">Não disponível</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data */}
          <Input
            label="Data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />

          {/* Campos específicos por tipo */}
          {tipo === 'Pesagem' && (
            <Input
              label="Peso (kg)"
              type="number"
              step="0.01"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="Ex: 350.5"
              required
            />
          )}

          {tipo === 'Local' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Local/Piquete *
              </label>
              {loadingPiquetes ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Carregando piquetes...</div>
              ) : (
                <>
                  {!usarNovoPiquete ? (
                    <>
                      <select
                        value={local}
                        onChange={(e) => {
                          if (e.target.value === '__novo__') {
                            setUsarNovoPiquete(true)
                            setLocal('')
                          } else {
                            setLocal(e.target.value)
                          }
                        }}
                        className="input-field w-full"
                        required={!usarNovoPiquete}
                      >
                        <option value="">Selecione um piquete...</option>
                        {piquetes.map((piquete) => (
                          <option key={piquete} value={piquete}>
                            {piquete}
                          </option>
                        ))}
                        <option value="__novo__">+ Adicionar novo piquete</option>
                      </select>
                      {piquetes.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Nenhum piquete cadastrado. Selecione "+ Adicionar novo piquete" para criar um.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Input
                        label="Nome do Novo Piquete"
                        type="text"
                        value={novoPiquete}
                        onChange={(e) => {
                          setNovoPiquete(e.target.value)
                          setLocal(e.target.value)
                        }}
                        placeholder="Digite o nome do piquete"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUsarNovoPiquete(false)
                          setNovoPiquete('')
                          setLocal('')
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                      >
                        ← Voltar para seleção
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {tipo === 'CE' && (
            <Input
              label="Circunferência Escrotal (cm)"
              type="number"
              step="0.1"
              value={ce}
              onChange={(e) => setCe(e.target.value)}
              placeholder="Ex: 32.5"
              required
            />
          )}

          {tipo === 'DG' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Diagnóstico de Gestação
                </label>
                <select
                  value={dg}
                  onChange={(e) => setDg(e.target.value)}
                  className="input-field w-full"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Positivo">Positivo</option>
                  <option value="Negativo">Negativo</option>
                  <option value="Não Realizado">Não Realizado</option>
                  <option value="Inconclusivo">Inconclusivo</option>
                </select>
              </div>
              <Input
                label="Veterinário (opcional)"
                type="text"
                value={veterinario}
                onChange={(e) => setVeterinario(e.target.value)}
                placeholder="Nome do veterinário responsável"
              />
            </>
          )}

          {tipo === 'Morte' && (
            <Input
              label="Causa da Morte"
              type="text"
              value={causaMorte}
              onChange={(e) => setCausaMorte(e.target.value)}
              placeholder="Ex: Doença, Acidente, etc."
              required
            />
          )}

          {(tipo === 'Vacinação' || tipo === 'Tratamento' || tipo === 'Medicamento') && (
            <>
              <Input
                label="Medicamento/Vacina"
                type="text"
                value={medicamento}
                onChange={(e) => setMedicamento(e.target.value)}
                placeholder="Ex: Vacina contra febre aftosa"
                required
              />
              <Input
                label="Dosagem"
                type="text"
                value={dosagem}
                onChange={(e) => setDosagem(e.target.value)}
                placeholder="Ex: 5ml, 1 dose, etc."
              />
              <Input
                label="Veterinário"
                type="text"
                value={veterinario}
                onChange={(e) => setVeterinario(e.target.value)}
                placeholder="Nome do veterinário"
              />
              {tipo === 'Vacinação' && (
                <Input
                  label="Próxima Aplicação"
                  type="date"
                  value={proximaAplicacao}
                  onChange={(e) => setProximaAplicacao(e.target.value)}
                />
              )}
            </>
          )}

          {tipo === 'Exame' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resultado do Exame
                </label>
                <select
                  value={resultadoExame}
                  onChange={(e) => setResultadoExame(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Selecione...</option>
                  <option value="Positivo">Positivo</option>
                  <option value="Negativo">Negativo</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Inconclusivo">Inconclusivo</option>
                </select>
              </div>
              <Input
                label="Veterinário"
                type="text"
                value={veterinario}
                onChange={(e) => setVeterinario(e.target.value)}
                placeholder="Nome do veterinário"
              />
            </>
          )}

          {tipo === 'Cirurgia' && (
            <Input
              label="Veterinário"
              type="text"
              value={veterinario}
              onChange={(e) => setVeterinario(e.target.value)}
              placeholder="Nome do veterinário responsável"
            />
          )}

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="input-field w-full"
              placeholder="Informações adicionais..."
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Registrando...' : `Registrar ${currentTypeInfo?.label || tipo}`}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

