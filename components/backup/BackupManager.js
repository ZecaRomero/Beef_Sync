import React, { useState, useEffect } from 'react'
import {
    CloudArrowDownIcon,
    CloudArrowUpIcon,
    DocumentArrowDownIcon,
    TrashIcon,
    EyeIcon,
    ClockIcon,
    ServerIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '../ui/Icons'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function BackupManager() {
    const [backups, setBackups] = useState([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [restoring, setRestoring] = useState(false)
    const [selectedBackup, setSelectedBackup] = useState(null)
    const [backupType, setBackupType] = useState('completo')
    const [showRestoreModal, setShowRestoreModal] = useState(false)

    useEffect(() => {
        loadBackups()
    }, [])

    const loadBackups = async () => {
        try {
            setLoading(true)
            // Simular carregamento de backups
            // Em produção, isso viria de uma API
            const mockBackups = [
                {
                    id: 1,
                    nome: 'backup_completo_2025-10-30_14-30.json',
                    tipo: 'completo',
                    tamanho: '2.3 MB',
                    dataCriacao: '2025-10-30T14:30:00Z',
                    totalRegistros: 1250,
                    tabelas: ['animais', 'custos', 'nascimentos', 'semen', 'localizacoes'],
                    status: 'sucesso'
                },
                {
                    id: 2,
                    nome: 'backup_animais_2025-10-29_10-15.json',
                    tipo: 'animais',
                    tamanho: '850 KB',
                    dataCriacao: '2025-10-29T10:15:00Z',
                    totalRegistros: 45,
                    tabelas: ['animais', 'custos'],
                    status: 'sucesso'
                },
                {
                    id: 3,
                    nome: 'backup_reprodutivo_2025-10-28_16-45.json',
                    tipo: 'reprodutivo',
                    tamanho: '1.1 MB',
                    dataCriacao: '2025-10-28T16:45:00Z',
                    totalRegistros: 320,
                    tabelas: ['nascimentos', 'gestacoes', 'semen'],
                    status: 'sucesso'
                }
            ]

            setBackups(mockBackups)
        } catch (error) {
            console.error('Erro ao carregar backups:', error)
        } finally {
            setLoading(false)
        }
    }

    const createBackup = async () => {
        try {
            setCreating(true)

            // Simular criação de backup
            const response = await fetch('/api/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: backupType })
            })

            if (response.ok) {
                alert('✅ Backup criado com sucesso!')
                loadBackups()
            } else {
                throw new Error('Erro ao criar backup')
            }
        } catch (error) {
            alert('❌ Erro ao criar backup: ' + error.message)
        } finally {
            setCreating(false)
        }
    }

    const downloadBackup = async (backup) => {
        try {
            // Simular download
            const link = document.createElement('a')
            link.href = `/api/backup/download/${backup.id}`
            link.download = backup.nome
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            alert('✅ Download iniciado!')
        } catch (error) {
            alert('❌ Erro ao baixar backup: ' + error.message)
        }
    }

    const deleteBackup = async (backupId) => {
        if (!confirm('Tem certeza que deseja excluir este backup?')) {
            return
        }

        try {
            const response = await fetch(`/api/backup/${backupId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                alert('✅ Backup excluído com sucesso!')
                loadBackups()
            } else {
                throw new Error('Erro ao excluir backup')
            }
        } catch (error) {
            alert('❌ Erro ao excluir backup: ' + error.message)
        }
    }

    const restoreBackup = async (backup) => {
        if (!confirm(`Tem certeza que deseja restaurar o backup "${backup.nome}"?\n\nEsta ação irá substituir os dados atuais!`)) {
            return
        }

        try {
            setRestoring(true)

            const response = await fetch('/api/backup/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ backupId: backup.id })
            })

            if (response.ok) {
                alert('✅ Backup restaurado com sucesso!')
            } else {
                throw new Error('Erro ao restaurar backup')
            }
        } catch (error) {
            alert('❌ Erro ao restaurar backup: ' + error.message)
        } finally {
            setRestoring(false)
            setShowRestoreModal(false)
        }
    }

    const getBackupTypeColor = (tipo) => {
        switch (tipo) {
            case 'completo':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            case 'animais':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            case 'reprodutivo':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            case 'financeiro':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando backups...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ServerIcon className="h-8 w-8 text-blue-600" />
                        Gerenciador de Backup
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Crie, gerencie e restaure backups do sistema
                    </p>
                </div>
            </div>

            {/* Criar Backup */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        🔄 Criar Novo Backup
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo de Backup
                            </label>
                            <select
                                value={backupType}
                                onChange={(e) => setBackupType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="completo">Backup Completo</option>
                                <option value="animais">Apenas Animais</option>
                                <option value="reprodutivo">Dados Reprodutivos</option>
                                <option value="financeiro">Dados Financeiros</option>
                            </select>
                        </div>
                        <div className="flex-shrink-0 pt-6">
                            <Button
                                onClick={createBackup}
                                loading={creating}
                                leftIcon={<CloudArrowUpIcon className="h-4 w-4" />}
                                variant="primary"
                            >
                                {creating ? 'Criando...' : 'Criar Backup'}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Lista de Backups */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        📋 Backups Disponíveis
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {backups.length} backup(s) encontrado(s)
                    </p>
                </CardHeader>
                <CardBody>
                    {backups.length === 0 ? (
                        <div className="text-center py-12">
                            <ServerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Nenhum backup encontrado
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Crie seu primeiro backup para proteger seus dados
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {backups.map((backup) => (
                                <div
                                    key={backup.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {backup.nome}
                                            </h4>
                                            <Badge
                                                variant="secondary"
                                                className={getBackupTypeColor(backup.tipo)}
                                            >
                                                {backup.tipo}
                                            </Badge>
                                            {backup.status === 'sucesso' ? (
                                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <ClockIcon className="h-4 w-4" />
                                                {formatDate(backup.dataCriacao)}
                                            </div>
                                            <div>
                                                📊 {backup.totalRegistros} registros
                                            </div>
                                            <div>
                                                💾 {backup.tamanho}
                                            </div>
                                            <div>
                                                🗂️ {backup.tabelas.length} tabelas
                                            </div>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            Tabelas: {backup.tabelas.join(', ')}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedBackup(backup)}
                                            title="Ver detalhes"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => downloadBackup(backup)}
                                            title="Baixar backup"
                                        >
                                            <DocumentArrowDownIcon className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedBackup(backup)
                                                setShowRestoreModal(true)
                                            }}
                                            title="Restaurar backup"
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <CloudArrowDownIcon className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteBackup(backup.id)}
                                            title="Excluir backup"
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Modal de Restauração */}
            {showRestoreModal && selectedBackup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Restaurar Backup
                            </h2>
                            <button
                                onClick={() => setShowRestoreModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                                    <h3 className="font-semibold text-red-900 dark:text-red-200">
                                        Atenção!
                                    </h3>
                                </div>
                                <p className="text-sm text-red-800 dark:text-red-300">
                                    Esta ação irá substituir todos os dados atuais pelos dados do backup.
                                    Esta operação não pode ser desfeita.
                                </p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div><strong>Backup:</strong> {selectedBackup.nome}</div>
                                <div><strong>Tipo:</strong> {selectedBackup.tipo}</div>
                                <div><strong>Data:</strong> {formatDate(selectedBackup.dataCriacao)}</div>
                                <div><strong>Registros:</strong> {selectedBackup.totalRegistros}</div>
                                <div><strong>Tabelas:</strong> {selectedBackup.tabelas.join(', ')}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => restoreBackup(selectedBackup)}
                                loading={restoring}
                                variant="danger"
                                className="flex-1"
                            >
                                {restoring ? 'Restaurando...' : 'Confirmar Restauração'}
                            </Button>
                            <Button
                                onClick={() => setShowRestoreModal(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalhes */}
            {selectedBackup && !showRestoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Detalhes do Backup
                            </h2>
                            <button
                                onClick={() => setSelectedBackup(null)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nome do Arquivo
                                    </label>
                                    <p className="text-sm text-gray-900 dark:text-white font-mono">
                                        {selectedBackup.nome}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tipo
                                    </label>
                                    <Badge className={getBackupTypeColor(selectedBackup.tipo)}>
                                        {selectedBackup.tipo}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Data de Criação
                                    </label>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {formatDate(selectedBackup.dataCriacao)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tamanho
                                    </label>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {selectedBackup.tamanho}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tabelas Incluídas ({selectedBackup.tabelas.length})
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedBackup.tabelas.map((tabela) => (
                                        <Badge key={tabela} variant="secondary">
                                            {tabela}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Total de Registros
                                </label>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {selectedBackup.totalRegistros.toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={() => downloadBackup(selectedBackup)}
                                leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                                variant="primary"
                            >
                                Baixar Backup
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowRestoreModal(true)
                                }}
                                leftIcon={<CloudArrowDownIcon className="h-4 w-4" />}
                                variant="secondary"
                            >
                                Restaurar
                            </Button>
                            <Button
                                onClick={() => setSelectedBackup(null)}
                                variant="ghost"
                            >
                                Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}