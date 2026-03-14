/**
 * Card de Animal otimizado com React.memo e composition
 */
import { memo, useCallback } from 'react'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/OptimizedCard';
import { Button } from '../ui/OptimizedButton';
import { Animal } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface OptimizedAnimalCardProps {
  animal: Animal;
  onView?: (animal: Animal) => void;
  onEdit?: (animal: Animal) => void;
  onDelete?: (animal: Animal) => void;
}

// Badge otimizado para situação
const SituacaoBadge = memo<{ situacao: string }>(({ situacao }) => {
  const colorMap: Record<string, string> = {
    'Ativo': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Vendido': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Morto': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Transferido': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorMap[situacao] || 'bg-gray-100 text-gray-800'}`}>
      {situacao}
    </span>
  );
});

SituacaoBadge.displayName = 'SituacaoBadge';

// Info Row otimizado
const InfoRow = memo<{ label: string; value: string | number | null | undefined }>(({ label, value }) => {
  if (!value && value !== 0) return null;

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
});

InfoRow.displayName = 'InfoRow';

export const OptimizedAnimalCard = memo<OptimizedAnimalCardProps>(({
  animal,
  onView,
  onEdit,
  onDelete,
}) => {
  // Memoizar callbacks
  const handleView = useCallback(() => onView?.(animal), [animal, onView]);
  const handleEdit = useCallback(() => onEdit?.(animal), [animal, onEdit]);
  const handleDelete = useCallback(() => onDelete?.(animal), [animal, onDelete]);

  return (
    <Card hover={!!onView} onClick={onView ? handleView : undefined}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle size="md">
            {animal.serie} - {animal.rg}
          </CardTitle>
          <SituacaoBadge situacao={animal.situacao || 'Ativo'} />
        </div>
        {animal.tatuagem && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tatuagem: {animal.tatuagem}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <InfoRow label="Sexo" value={animal.sexo} />
        <InfoRow label="Raça" value={animal.raca} />
        {animal.data_nascimento && (
          <InfoRow label="Nascimento" value={formatDate(animal.data_nascimento)} />
        )}
        {animal.peso && <InfoRow label="Peso" value={`${animal.peso} kg`} />}
        {(animal.custo_total || animal.custo_total === 0) && (
          <InfoRow label="Custo Total" value={formatCurrency(animal.custo_total)} />
        )}
        {animal.valor_venda && (
          <InfoRow label="Valor Venda" value={formatCurrency(animal.valor_venda)} />
        )}
        {animal.is_fiv && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              🧬 FIV
            </span>
          </div>
        )}
      </CardContent>

      {(onEdit || onDelete) && (
        <CardFooter>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="flex-1"
              >
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex-1"
              >
                Deletar
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
});

OptimizedAnimalCard.displayName = 'OptimizedAnimalCard';

export default OptimizedAnimalCard;

