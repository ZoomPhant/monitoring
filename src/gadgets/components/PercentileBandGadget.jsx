import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { formatValue, seriesName } from '../formatters';

const PERCENTILE_COLORS = {
  p50: '#3b82f6', // blue
  p90: '#f59e0b', // amber
  p95: '#f97316', // orange
  p99: '#ef4444', // red
  default: '#8b5cf6',
};

export function PercentileBandGadget({ data, config = {} }) {
  const { format: formatType = 'duration_ms', yAxisWidth = 52 } = config;

  const { chartData, seriesList, timeSpan } = useMemo(() => {
    const s = data?.series || [];
    if (!s.length) return { chartData: [], seriesList: [], timeSpan: 0 };

    const timeMap = new Map();
    let minTime = Infinity;
    let maxTime = -Infinity;

    const list = s.map((item, idx) => {
      const key = `p_${idx}`;
      const rawName = seriesName(item.labels);
      
      // Attempt to identify percentile tag or quantile value
      let pTag = 'default';
      const qVal = item.labels?.quantile || item.labels?.q;
      if (qVal) {
        if (qVal === '0.5' || qVal === '50') pTag = 'p50';
        else if (qVal === '0.9' || qVal === '90') pTag = 'p90';
        else if (qVal === '0.95' || qVal === '95') pTag = 'p95';
        else if (qVal === '0.99' || qVal === '99') pTag = 'p99';
      } else if (rawName.includes('50')) pTag = 'p50';
      else if (rawName.includes('90')) pTag = 'p90';
      else if (rawName.includes('95')) pTag = 'p95';
      else if (rawName.includes('99')) pTag = 'p99';

      const color = PERCENTILE_COLORS[pTag] || PERCENTILE_COLORS.default;
      const pts = item.points || [];

      for (let i = 0; i < pts.length; i++) {
        const [ts, val] = pts[i];
        if (typeof ts !== 'number' || val == null) continue;
        if (ts < minTime) minTime = ts;
        if (ts > maxTime) maxTime = ts;

        let row = timeMap.get(ts);
        if (!row) {
          row = { timestamp: ts };
          timeMap.set(ts, row);
        }
        row[key] = val;
      }

      return { key, name: rawName, color, pTag };
    });

    const sortedData = Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    const span = maxTime > minTime ? maxTime - minTime : 0;

    return { chartData: sortedData, seriesList: list, timeSpan: span };
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 p-6">
        No percentile data in this range
      </div>
    );
  }

  const formatTick = ts => {
    try {
      const d = new Date(ts);
      if (timeSpan > 2 * 86400000) return format(d, 'MMM d');
      return format(d, 'HH:mm');
    } catch {
      return String(ts);
    }
  };

  return (
    <div className="w-full h-full min-h-[14rem] pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="timestamp" tickFormatter={formatTick} fontSize={11} stroke="#9ca3af" />
          <YAxis tickFormatter={v => formatValue(v, formatType)} fontSize={11} width={yAxisWidth} stroke="#9ca3af" />
          <Tooltip
            labelFormatter={ts => format(new Date(ts), 'yyyy-MM-dd HH:mm')}
            formatter={(v, k) => {
              const meta = seriesList.find(s => s.key === k);
              return [formatValue(v, formatType), meta?.name || k];
            }}
          />
          <Legend
            formatter={k => {
              const meta = seriesList.find(s => s.key === k);
              return <span className="text-xs font-medium text-gray-700">{meta?.name || k}</span>;
            }}
          />
          {seriesList.map(s => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.pTag === 'p99' ? 2.5 : s.pTag === 'p90' ? 2 : 1.5}
              strokeDasharray={s.pTag === 'p90' ? '4 2' : s.pTag === 'p95' ? '6 3' : undefined}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

