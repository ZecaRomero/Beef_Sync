
import React, { Fragment } from 'react'

import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CommandLineIcon } from '../ui/Icons'

const shortcuts = [
  {
    category: 'Navegação',
    items: [
      { keys: ['Ctrl', 'H'], description: 'Ir para Home' },
      { keys: ['Ctrl', 'D'], description: 'Ir para Dashboard' },
      { keys: ['Ctrl', 'A'], description: 'Ir para Animais' },
      { keys: ['Ctrl', 'S'], description: 'Ir para Estoque de Sêmen' },
      { keys: ['Ctrl', 'N'], description: 'Ir para Nascimentos' },
      { keys: ['Ctrl', 'R'], description: 'Ir para Relatórios' },
    ]
  },
  {
    category: 'Ações',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Buscar' },
      { keys: ['Ctrl', 'P'], description: 'Adicionar Novo' },
      { keys: ['Ctrl', 'B'], description: 'Fazer Backup' },
      { keys: ['Ctrl', 'Shift', 'T'], description: 'Alternar Tema' },
    ]
  },
  {
    category: 'Geral',
    items: [
      { keys: ['Ctrl', '/'], description: 'Mostrar este menu' },
      { keys: ['Esc'], description: 'Fechar Modal/Cancelar' },
    ]
  }
]

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <CommandLineIcon className="h-6 w-6 text-white" />
                    </div>
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      Atalhos de Teclado
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Descrição */}
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Use estes atalhos para navegar mais rapidamente pelo sistema.
                </p>

                {/* Lista de Atalhos */}
                <div className="space-y-6">
                  {shortcuts.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {section.category}
                      </h4>
                      <div className="space-y-2">
                        {section.items.map((shortcut, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIdx) => (
                                <Fragment key={keyIdx}>
                                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                                    {key}
                                  </kbd>
                                  {keyIdx < shortcut.keys.length - 1 && (
                                    <span className="text-gray-400 mx-1">+</span>
                                  )}
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    💡 Pressione <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 rounded">/</kbd> a qualquer momento para ver este menu
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

