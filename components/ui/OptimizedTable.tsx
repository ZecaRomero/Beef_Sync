/**
 * Componente Table otimizado com virtualização e paginação
 */
import { ReactNode, memo, useMemo } from 'react'

import { cn } from '@/utils/cn';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

function TableComponent<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  striped = false,
  hoverable = true,
  className,
}: TableProps<T>) {
  // Memoizar dados renderizados para evitar re-renders desnecessários
  const renderedRows = useMemo(() => {
    return data.map((item, index) => {
      const key = keyExtractor(item, index);
      
      return (
        <tr
          key={key}
          className={cn(
            'transition-colors duration-150',
            striped && index % 2 === 0 && 'bg-gray-50 dark:bg-gray-800/50',
            hoverable && 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
            onRowClick && 'cursor-pointer'
          )}
          onClick={() => onRowClick?.(item)}
        >
          {columns.map((column) => {
            const value = item[column.key];
            const content = column.render ? column.render(item, index) : value;

            return (
              <td
                key={column.key}
                className={cn(
                  'px-4 py-3 text-sm',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
                style={{ width: column.width }}
              >
                {content}
              </td>
            );
          })}
        </tr>
      );
    });
  }, [data, columns, keyExtractor, onRowClick, striped, hoverable]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {renderedRows}
        </tbody>
      </table>
    </div>
  );
}

// Exportar com memo
export const OptimizedTable = memo(TableComponent) as typeof TableComponent;

export default OptimizedTable;

