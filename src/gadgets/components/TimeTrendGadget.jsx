import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
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

export function TimeTrendGadget({ data, config = {} }) {
  const {
    variant = 'line', // 'line' | 'area' | 'bar' | 'stacked-bar'
    format: formatType = 'compact',
    showLegend = true,
    yAxisWidth = 48,
  } = config;

  const { chartData, seriesList, timeSpan } = useMemo(() => {
    const s = data?.series || [];
    if (!s.length) return { chartData: [], seriesList: [], timeSpan: 0 };

    const timeMap = new Map();
    let minTime = Infinity;
    let maxTime = -Infinity;

    const list = s.map((item, idx) => {
      const key = `s_${idx}`;
      const name = seriesName(item.labels);
      const color = PALETTE[idx % PALETTE.length];
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

      return { key, name, color };
    });

    const sortedData = Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    const span = maxTime > minTime ? maxTime - minTime : 0;

    return {
      chartData: sortedData,
      seriesList: list,
      timeSpan: span,
    };
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 p-6">
        No series data in this range
      </div>
    );
  }

  const formatTick = ts => {
    try {
      const d = new Date(ts);
      // > 2 days: MMM d; > 90 days: yyyy-MM; else HH:mm
      if (timeSpan > 90 * 86400000) return format(d, 'yyyy-MM');
      if (timeSpan > 2 * 86400000) return format(d, 'MMM d');
      return format(d, 'HH:mm');
    } catch {
      return String(ts);
    }
  };

  const isBar = variant === 'bar' || variant === 'stacked-bar';
  const isArea = variant === 'area';
  const isStacked = variant === 'stacked-bar';

  const renderChart = () => {
    if (isBar) {
      return (
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
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
          {showLegend && seriesList.length > 1 && (
            <Legend
              formatter={k => {
                const meta = seriesList.find(s => s.key === k);
                return <span className="text-xs text-gray-700">{meta?.name || k}</span>;
              }}
            />
          )}
          {seriesList.map(s => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              stackId={isStacked ? 'a' : undefined}
            />
          ))}
        </BarChart>
      );
    }

    if (isArea) {
      return (
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            {seriesList.map(s => (
              <linearGradient key={s.key} id={`gradient_${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>
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
          {showLegend && seriesList.length > 1 && (
            <Legend
              formatter={k => {
                const meta = seriesList.find(s => s.key === k);
                return <span className="text-xs text-gray-700">{meta?.name || k}</span>;
              }}
            />
          )}
          {seriesList.map(s => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#gradient_${s.key})`}
            />
          ))}
        </AreaChart>
      );
    }

    // Default: LineChart
    return (
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
        {showLegend && seriesList.length > 1 && (
          <Legend
            formatter={k => {
              const meta = seriesList.find(s => s.key === k);
              return <span className="text-xs text-gray-700">{meta?.name || k}</span>;
            }}
          />
        )}
        {seriesList.map(s => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <div className="w-full h-full min-h-[14rem] pt-2">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

