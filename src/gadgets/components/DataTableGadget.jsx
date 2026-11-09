import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatValue, seriesName } from '../formatters';

export function DataTableGadget({ data, config = {} }) {
  const { format: formatType = 'compact', maxRows = 200 } = config;
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  const { columns, rows } = useMemo(() => {
    if (!data) return { columns: [], rows: [] };

    if (data.resultType === 'table' && data.columns && data.rows) {
      return { columns: data.columns, rows: data.rows };
    }

    if (data.series && data.series.length) {
      const generatedRows = data.series.flatMap(s =>
        (s.points || []).map(([t, v]) => [
          format(new Date(t), 'yyyy-MM-dd HH:mm'),
          seriesName(s.labels),
          v,
        ])
      );
      return {
        columns: ['Time', 'Series', 'Value'],
        rows: generatedRows,
      };
    }

    return { columns: [], rows: [] };
  }, [data]);

  const sortedRows = useMemo(() => {
    if (sortCol == null || !rows.length) return rows.slice(0, maxRows);

    return [...rows].sort((a, b) => {
      const vA = a[sortCol];
      const vB = b[sortCol];

      if (vA == null) return sortDir === 'asc' ? -1 : 1;
      if (vB == null) return sortDir === 'asc' ? 1 : -1;

      if (typeof vA === 'number' && typeof vB === 'number') {
        return sortDir === 'asc' ? vA - vB : vB - vA;
      }

      const strA = String(vA);
      const strB = String(vB);
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    }).slice(0, maxRows);
  }, [rows, sortCol, sortDir, maxRows]);

  if (!columns.length || !rows.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 p-6">
        No table rows in this range
      </div>
    );
  }

  const toggleSort = idx => {
    if (sortCol === idx) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(idx);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-xs text-left divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col}
                  onClick={() => toggleSort(idx)}
                  className="px-3 py-2 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    {sortCol === idx ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-brand-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-brand-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-60" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white font-mono">
            {sortedRows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                {r.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 text-gray-800 whitespace-nowrap text-ellipsis overflow-hidden max-w-xs">
                    {typeof cell === 'number'
                      ? formatValue(cell, formatType)
                      : typeof cell === 'object' && cell !== null
                      ? JSON.stringify(cell)
                      : String(cell ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
        <span>Showing {sortedRows.length} of {rows.length} rows</span>
        {rows.length > maxRows && <span className="text-amber-600 font-medium">Limited to {maxRows} rows</span>}
      </div>
    </div>
  );
}

