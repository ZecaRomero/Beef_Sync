import React, { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { 
  ArrowLeftIcon,
  MicrophoneIcon,
  StopIcon,
  PaperAirplaneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function MobileFeedback() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [sugestao, setSugestao] = useState('')
  const [gravando, setGravando] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setGravando(true)
      setErro('')
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      setErro('Erro ao acessar o microfone. Verifique as permissões.')
    }
  }

  const pararGravacao = () => {
    if (mediaRecorderRef.current && gravando) {
      mediaRecorderRef.current.stop()
      setGravando(false)
    }
  }

  const removerAudio = () => {
    setAudioBlob(null)
    audioChunksRef.current = []
  }

  const enviarFeedback = async () => {
    if (!nome.trim()) {
      setErro('Por favor, digite seu nome')
      return
    }

    if (!sugestao.trim() && !audioBlob) {
      setErro('Por favor, escreva uma sugestão ou grave um áudio')
      return
    }

    setEnviando(true)
    setErro('')

    try {
      let audioBase64 = null
      
      // Converter áudio para base64 se existir
      if (audioBlob) {
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(audioBlob)
        })
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome,
          sugestao,
          audioBase64
        })
      })

      const data = await response.json()

      if (data.success) {
        setSucesso(true)
        setTimeout(() => {
          router.push('/a')
        }, 2000)
      } else {
        setErro(data.error || 'Erro ao enviar feedback')
      }
    } catch (error) {
      console.error('Erro ao enviar feedback:', error)
      setErro('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <>
        <Head>
          <title>Feedback Enviado | Beef-Sync</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 flex items-center justify-center p-4">
          <div className="text-center">
            <CheckCircleIcon className="h-24 w-24 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Feedback Enviado!</h1>
            <p className="text-white/80">Obrigado pela sua sugestão</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Enviar Feedback | Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/a')}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Enviar Feedback</h1>
          <div className="w-9"></div>
        </div>

        {/* Formulário */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              💡 Sua opinião é importante!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ajude-nos a melhorar o sistema com suas sugestões
            </p>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seu Nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Sugestão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sua Sugestão
            </label>
            <textarea
              value={sugestao}
              onChange={(e) => setSugestao(e.target.value)}
              placeholder="Descreva sua sugestão ou melhoria..."
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Gravação de Áudio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ou grave um áudio (opcional)
            </label>
            
            {!audioBlob ? (
              <button
                type="button"
                onClick={gravando ? pararGravacao : iniciarGravacao}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${
                  gravando 
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {gravando ? (
                  <>
                    <StopIcon className="h-6 w-6" />
                    Parar Gravação
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="h-6 w-6" />
                    Gravar Áudio
                  </>
                )}
              </button>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Áudio gravado com sucesso
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removerAudio}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erro}</p>
            </div>
          )}

          {/* Botão Enviar */}
          <button
            type="button"
            onClick={enviarFeedback}
            disabled={enviando || (!nome.trim() || (!sugestao.trim() && !audioBlob))}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {enviando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5" />
                Enviar Feedback
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
