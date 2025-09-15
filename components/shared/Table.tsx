
import React from 'react';

export interface Column<T> {
  Header: string;
  accessor: keyof T | ((row: T) => any);
  Cell?: (props: { value: any; row: T }) => JSX.Element;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

const Table = <T extends { id: string },>(
  { columns, data }: TableProps<T>
) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                {column.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-slate-500">
                Aucun résultat trouvé.
              </td>
            </tr>
          ) : (
            data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                {columns.map((column, index) => {
                    const value = typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : row[column.accessor as keyof T];
                    
                    return (
                    <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {column.Cell ? column.Cell({ value, row }) : (value as any)}
                    </td>
                    );
                })}
                </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
