import { TrashIcon, UserGroupIcon, PlusIcon } from '../ui/Icons'
import Button from '../ui/Button'
import ModernCard, { ModernCardHeader, ModernCardBody } from '../ui/ModernCard'

/**
 * Componente para lista de destinatários
 */
const RecipientsList = ({
  recipients,
  selectedRecipients,
  onToggleRecipient,
  onRemoveRecipient,
  onAddRecipient
}) => {
  return (
    <ModernCard modern={true} hover={true}>
      <ModernCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
              <UserGroupIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Destinatários
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gerencie contatos para envio
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onAddRecipient}
            leftIcon={<PlusIcon className="h-4 w-4" />}
            modern={true}
            glow={true}
          >
            Adicionar
          </Button>
        </div>
      </ModernCardHeader>
      
      <ModernCardBody>
        {recipients.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Nenhum destinatário cadastrado
            </p>
            <Button
              variant="primary"
              onClick={onAddRecipient}
              leftIcon={<PlusIcon className="h-4 w-4" />}
              modern={true}
            >
              Adicionar Destinatário
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                className={`
                  p-3 rounded-lg border transition-colors 
                  ${selectedRecipients.includes(recipient.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {recipient.name}
                    </h4>
                    {recipient.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📧 {recipient.email}
                      </p>
                    )}
                    {recipient.whatsapp && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📱 {recipient.whatsapp}
                      </p>
                    )}
                    <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {recipient.role}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(recipient.id)}
                      onChange={() => onToggleRecipient(recipient.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => onRemoveRecipient(recipient.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remover destinatário"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModernCardBody>
    </ModernCard>
  )
}

export default RecipientsList