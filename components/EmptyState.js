

import React, { useState } from 'react'

export default function EmptyState({
    title = "Sistema Limpo e Pronto",
    description = "Comece cadastrando seus dados reais no sistema",
    icon = "ðÅ¸Å¡â‚¬",
    actionLabel = "ComeÃ§ar Agora",
    onAction = null,
    showQuickStart = true
}) {
    const [showGuide, setShowGuide] = useState(false)

    const quickStartSteps = [
        {
            step: 1,
            title: "Cadastre seu primeiro animal",
            description: "VÃ¡ para a pÃ¡gina 'Animais' e clique em 'Adicionar Animal'",
            icon: "âÅ¾â€¢"
        },
        {
            step: 2,
            title: "Preencha os dados bÃ¡sicos",
            description: "SÃ©rie, RG, sexo, raÃ§a e data de nascimento",
            icon: "ðÅ¸â€œ�"
        },
        {
            step: 3,
            title: "Adicione custos",
            description: "Registre os custos de nascimento, manejos e cuidados",
            icon: "ðÅ¸â€™°"
        },
        {
            step: 4,
            title: "Acompanhe o desenvolvimento",
            description: "Use o dashboard para monitorar crescimento e ROI",
            icon: "ðÅ¸â€œÅ "
        }
    ]

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            {/* Ã�cone principal */}
            <div className="text-8xl mb-6 opacity-50">
                {icon}
            </div>

            {/* TÃ­tulo e descriÃ§Ã£o */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
                {description}
            </p>

            {/* BotÃ£o de aÃ§Ã£o */}
            {onAction && (
                <button
                    onClick={onAction}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 mb-6"
                >
                    {actionLabel}
                </button>
            )}

            {/* Guia de inÃ­cio rÃ¡pido */}
            {showQuickStart && (
                <div className="w-full max-w-2xl">
                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className="flex items-center justify-center w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 mb-4"
                    >
                        <span className="mr-2">ðÅ¸â€œÅ¡</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {showGuide ? 'Ocultar' : 'Ver'} Guia de InÃ­cio RÃ¡pido
                        </span>
                        <span className={`ml-2 transform transition-transform duration-300 ${showGuide ? 'rotate-180' : ''}`}>
                            â¬â€¡ï¸�
                        </span>
                    </button>

                    {showGuide && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                                <span className="mr-2">ðÅ¸Å¡â‚¬</span>
                                Como comeÃ§ar
                            </h3>

                            <div className="space-y-4">
                                {quickStartSteps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {step.step}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <span className="text-xl mr-2">{step.icon}</span>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {step.title}
                                                </h4>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center mb-2">
                                    <span className="text-xl mr-2">ðÅ¸â€™¡</span>
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                        Dica
                                    </h4>
                                </div>
                                <p className="text-blue-800 dark:text-blue-200 text-sm">
                                    Todos os dados sÃ£o salvos automaticamente no seu navegador.
                                    Para nÃ£o perder informaÃ§Ãµes, considere fazer backup regular dos dados.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* EstatÃ­sticas vazias */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mt-8">
                {[
                    { label: 'Animais', value: '0', icon: 'ðÅ¸�â€ž' },
                    { label: 'Investido', value: 'R$ 0,00', icon: 'ðÅ¸â€™°' },
                    { label: 'Vendas', value: 'R$ 0,00', icon: 'ðÅ¸â€œË†' },
                    { label: 'ROI', value: '0%', icon: 'ðÅ¸â€œÅ ' }
                ].map((stat, index) => (
                    <div key={index} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {stat.value}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}