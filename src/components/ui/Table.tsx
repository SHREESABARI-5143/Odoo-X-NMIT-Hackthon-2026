import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SkeletonTable } from './Skeleton';

export interface TableHeader {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
}

interface TableProps<T> {
  headers: TableHeader[];
  data: T[];
  isLoading?: boolean;
  renderRow: (item: T, index: number) => React.ReactNode;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
}

export const Table = <T extends { id: string | number } | any>({
  headers,
  data,
  isLoading = false,
  renderRow,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'No records found.'
}: TableProps<T>) => {
  if (isLoading) {
    return <SkeletonTable rows={5} cols={headers.length} />;
  }

  return (
    <div className="w-full bg-white border border-border rounded overflow-hidden shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-border border-collapse text-sm">
          <thead className="bg-card">
            <tr>
              {headers.map(header => {
                const alignClass = 
                  header.align === 'right' ? 'text-right' :
                  header.align === 'center' ? 'text-center' :
                  'text-left';
                
                const isCurrentSort = sortKey === header.key;

                return (
                  <th
                    key={header.key}
                    onClick={() => header.sortable && onSort && onSort(header.key)}
                    className={`px-6 py-4 font-semibold text-text-primary ${alignClass} ${
                      header.sortable ? 'cursor-pointer select-none hover:bg-gray-200' : ''
                    } transition-colors`}
                  >
                    <div className={`flex items-center gap-1 ${
                      header.align === 'right' ? 'justify-end' :
                      header.align === 'center' ? 'justify-center' :
                      'justify-start'
                    }`}>
                      <span>{header.label}</span>
                      {header.sortable && onSort && (
                        <div className="flex flex-col text-text-secondary w-3 h-3 justify-center">
                          {isCurrentSort && sortDirection === 'asc' && (
                            <ChevronUp className="w-3 h-3" />
                          )}
                          {isCurrentSort && sortDirection === 'desc' && (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          {!isCurrentSort && (
                            <ChevronDown className="w-3 h-3 opacity-30 hover:opacity-100" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white text-text-primary">
            {data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-text-secondary bg-white">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => renderRow(item, idx))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
