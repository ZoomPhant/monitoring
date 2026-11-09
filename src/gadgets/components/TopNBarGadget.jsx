import { useMemo } from 'react';
import { formatValue, seriesName } from '../formatters';

const BAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
];

export function TopNBarGadget({ data, config = {} }) {
  const { format: formatType = 'compact', maxItems = 10 } = config;

  const { items, maxVal, total } = useMemo(() => {
    if (!data) return { items: [], maxVal: 0, total: 0 };

    let rawList = [];

    if (data.series && data.series.length) {
      rawList = data.series.map(s => {
        const name = seriesName(s.labels);
        const pts = s.points || [];
        const sum = pts.reduce((acc, p) => acc + (p[1] != null && !Number.isNaN(p[1]) ? Number(p[1]) : 0), 0);
        return { name, value: sum };
      });
    } else if (data.resultType === 'table' && data.rows && data.rows.length) {
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

    const sorted = rawList
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, maxItems);

    const max = sorted.length ? Math.max(...sorted.map(x => x.value)) : 0;
    const sum = sorted.reduce((acc, x) => acc + x.value, 0);

    return { items: sorted, maxVal: max, total: sum };
  }, [data, maxItems]);

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 p-6">
        No ranking data in this range
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 overflow-y-auto">
      {items.map((item, idx) => {
        const pctOfMax = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
        const shareOfTotal = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
        const color = BAR_COLORS[idx % BAR_COLORS.length];

        return (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate pr-2 font-medium text-gray-800">
                <span className="text-gray-400 font-mono text-[11px] w-4 text-right">{idx + 1}.</span>
                <span className="truncate" title={item.name}>{item.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-semibold text-gray-900">{formatValue(item.value, formatType)}</span>
                <span className="text-gray-400 font-mono text-[11px] w-10 text-right">{shareOfTotal}%</span>
              </div>
            </div>
            {/* Bar Track */}
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${Math.max(pctOfMax, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

