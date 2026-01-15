'use client';

import { Row } from '@/lib/types';

interface TableProps {
  data: Row[];
  className?: string;
}

export function Table({ data, className = '' }: TableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No data to display</div>
    );
  }

  const columns = Object.keys(data[0] ?? {});

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {row[col] === null ? (
                    <span className="text-gray-400 italic">NULL</span>
                  ) : row[col] instanceof Date ? (
                    (row[col] as Date).toISOString()
                  ) : (
                    String(row[col])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
