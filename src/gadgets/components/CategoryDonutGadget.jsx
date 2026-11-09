import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatValue, seriesName } from '../formatters';

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
];

export function CategoryDonutGadget({ data, config = {} }) {
  const { format: formatType = 'compact', maxItems = 8 } = config;

  const { items, total } = useMemo(() => {
    if (!data) return { items: [], total: 0 };

    let rawList = [];

    // Process from series (common for `... by (country)` or `... by (status)`)
    if (data.series && data.series.length) {
      rawList = data.series.map(s => {
        const name = seriesName(s.labels);
        const pts = s.points || [];
        // Sum points across the selected range
        const sum = pts.reduce((acc, p) => acc + (p[1] != null && !Number.isNaN(p[1]) ? Number(p[1]) : 0), 0);
        return { name, value: sum };
      });
    } else if (data.resultType === 'table' && data.rows && data.rows.length) {
      // Process from table rows: assumes last numeric column is value, first string column is category
      rawList = data.rows.map(r => {
        const rawName = r[0];
        const name =
          typeof rawName === 'object' && rawName !== null
            ? rawName.name || JSON.stringify(rawName)
            : String(rawName || 'unknown');
        const val = typeof r[r.length - 1] === 'number' ? r[r.length - 1] : 0;
        return { name, value: val };
      });
    }

    // Filter non-positive or null values, sort descending
    const valid = rawList.filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    const sumTotal = valid.reduce((acc, item) => acc + item.value, 0);

    // Group items beyond maxItems into 'Other'
    if (valid.length > maxItems) {
      const top = valid.slice(0, maxItems - 1);
      const otherSum = valid.slice(maxItems - 1).reduce((acc, x) => acc + x.value, 0);
      top.push({ name: 'Other', value: otherSum });
      return { items: top, total: sumTotal };
    }

    return { items: valid, total: sumTotal };
  }, [data, maxItems]);

  if (!items.length || total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 p-6">
        No breakdown data in this range
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between h-full p-2 gap-4">
      {/* Donut Chart */}
      <div className="w-full sm:w-1/2 h-44 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(v, name) => [
                `${formatValue(v, formatType)} (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`,
                name,
              ]}
            />
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
            >
              {items.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-400 font-medium">Total</span>
          <span className="text-sm font-bold text-gray-800">{formatValue(total, formatType)}</span>
        </div>
      </div>

      {/* Legend Table */}
      <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-1.5 overflow-y-auto max-h-48 pr-2">
        {items.map((item, idx) => {
          const share = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2" title={item.name}>
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                />
                <span className="truncate text-gray-700 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-gray-900">{formatValue(item.value, formatType)}</span>
                <span className="text-gray-400 font-mono text-[11px] w-10 text-right">{share}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

