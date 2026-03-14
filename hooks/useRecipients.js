import { useState, useEffect, useCallback } from 'react'

/**
 * Hook customizado para gerenciar destinatários
 */
export const useRecipients = () => {
  const [recipients, setRecipients] = useState([])
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: 'Contador'
  })

  // Carregar destinatários do localStorage
  const loadRecipients = useCallback(() => {
    const saved = localStorage.getItem('contabilidadeRecipients')
    if (saved) {
      setRecipients(JSON.parse(saved))
    }
  }, [])

  // Salvar destinatários no localStorage
  const saveRecipients = useCallback((newRecipients) => {
    localStorage.setItem('contabilidadeRecipients', JSON.stringify(newRecipients))
    setRecipients(newRecipients)
  }, [])

  // Adicionar novo destinatário
  const addRecipient = useCallback(() => {
    if (!newRecipient.name || (!newRecipient.email && !newRecipient.whatsapp)) {
      alert('⚠️ Atenção: Nome e Email ou WhatsApp são obrigatórios')
      return false
    }

    const recipient = {
      id: Date.now().toString(),
      ...newRecipient
    }

    const updatedRecipients = [...recipients, recipient]
    saveRecipients(updatedRecipients)
    
    setNewRecipient({ name: '', email: '', whatsapp: '', role: 'Contador' })
    setShowAddRecipient(false)
    alert('✅ Sucesso! Destinatário adicionado com sucesso!')
    return true
  }, [newRecipient, recipients, saveRecipients])

  // Remover destinatário
  const removeRecipient = useCallback((recipientId) => {
    const updatedRecipients = recipients.filter(r => r.id !== recipientId)
    saveRecipients(updatedRecipients)
    setSelectedRecipients(prev => prev.filter(id => id !== recipientId))
    alert('✅ Sucesso! Destinatário removido com sucesso!')
  }, [recipients, saveRecipients])

  // Toggle seleção de destinatário
  const handleRecipientToggle = useCallback((recipientId) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId) 
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    )
  }, [])

  // Resetar formulário
  const resetForm = useCallback(() => {
    setNewRecipient({ name: '', email: '', whatsapp: '', role: 'Contador' })
    setShowAddRecipient(false)
  }, [])

  // Carregar dados na inicialização
  useEffect(() => {
    loadRecipients()
  }, [loadRecipients])

  return {
    recipients,
    selectedRecipients,
    showAddRecipient,
    newRecipient,
    setNewRecipient,
    setShowAddRecipient,
    addRecipient,
    removeRecipient,
    handleRecipientToggle,
    resetForm,
    loadRecipients
  }
}

export default useRecipients