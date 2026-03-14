import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  CpuChipIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const SUGGESTIONS = [
  "Quantos animais ativos?",
  "Resumo financeiro",
  "Previsão de nascimentos",
  "Estoque de sêmen"
]

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'assistant', 
      text: 'Olá! Sou a IA do Beef Sync. Como posso ajudar você hoje com a gestão do seu rebanho?',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const processQuery = async (query) => {
    const lowerQuery = query.toLowerCase()
    let response = "Desculpe, não entendi. Tente perguntar sobre 'animais', 'financeiro' ou 'estoque'."
    
    setIsTyping(true)

    // Simulação de processamento de IA e chamadas de API
    try {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)) // Fake delay

      if (lowerQuery.includes('animal') || lowerQuery.includes('rebanho') || lowerQuery.includes('quantos')) {
        // Fetch real stats if possible, or mock for now based on what we know
        const res = await fetch('/api/statistics')
        const data = await res.json()
        response = `Atualmente temos **${data.totalAnimals || 0} animais** cadastrados, sendo **${data.activeAnimals || 0} ativos**. O rebanho está distribuído em várias localizações.`
      } 
      else if (lowerQuery.includes('financeiro') || lowerQuery.includes('custo') || lowerQuery.includes('dinheiro')) {
        response = "Análise Financeira Rápida:\n\n• **Custo Médio:** R$ 1.250,00/cabeça\n• **Projeção de Venda:** Alta para o próximo trimestre.\n• **Dica:** Mantenha o foco na eficiência operacional."
      }
      else if (lowerQuery.includes('nascimento') || lowerQuery.includes('parto')) {
        response = "Temos **3 partos previstos** para esta semana. Recomendo verificar a maternidade e os kits de primeiros socorros."
      }
      else if (lowerQuery.includes('semen') || lowerQuery.includes('sêmen') || lowerQuery.includes('estoque')) {
        response = "O estoque de sêmen está estável. O botijão 2 precisa de reposição de nitrogênio em 5 dias."
      }
      else if (lowerQuery.includes('olá') || lowerQuery.includes('oi')) {
        response = "Olá! Em que posso ajudar na gestão da fazenda hoje?"
      }
    } catch (error) {
      console.error(error)
      response = "Tive um problema ao consultar os dados. Tente novamente."
    }

    setIsTyping(false)
    return response
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!inputText.trim()) return

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')

    const responseText = await processQuery(inputText)
    
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      type: 'assistant',
      text: responseText,
      timestamp: new Date()
    }])
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed top-20 right-6 z-20 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 group"
          >
            <SparklesIcon className="h-8 w-8 animate-pulse" />
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
              Falar com Beef IA
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed top-20 right-6 z-40 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[600px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CpuChipIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Beef IA</h3>
                  <p className="text-blue-100 text-xs flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                    Online • Assistente Inteligente
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50 min-h-[300px]">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <span className={`text-[10px] block mt-1 ${
                      msg.type === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-700 shadow-sm flex space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length < 3 && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto whitespace-nowrap">
                <div className="flex space-x-2">
                  {SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => { setInputText(sug); handleSendMessage({ preventDefault: () => {} }); }}
                      className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Pergunte sobre seu rebanho..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="absolute right-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
