import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { Terminal, X, RefreshCw } from 'lucide-react';
import { apiClient } from '@/api/client';
import { formatValue, seriesName } from '../formatters';

export function MetricLogPivotGadget({ data, config = {}, query = '' }) {
  const { format: formatType = 'compact' } = config;
  const [selectedTs, setSelectedTs] = useState(null);
  const [pivotLogs, setPivotLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logError, setLogError] = useState(null);

  const series = data?.series || [];

  // Flatten points for Recharts
  const chartData = [];
  const timeMap = new Map();
  series.forEach((s, idx) => {
    (s.points || []).forEach(([ts, val]) => {
      let row = timeMap.get(ts);
      if (!row) {
        row = { timestamp: ts };
        timeMap.set(ts, row);
      }
      row[`s_${idx}`] = val;
    });
  });
  chartData.push(...Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp));

  const handlePointClick = async (pointData) => {
    if (!pointData || !pointData.activePayload || !pointData.activePayload.length) return;
    const ts = pointData.activePayload[0].payload.timestamp;
    setSelectedTs(ts);
    setLoadingLogs(true);
    setLogError(null);

    try {
      // Extract stream selector from query, or default to {}
      const selMatch = /^\s*(\{[^}]*\})/.exec(query);
      const selector = selMatch ? selMatch[1] : '{}';
      const logQuery = `${selector} | logs | limit 50`;

      const start = ts - 5 * 60 * 1000;
      const end = ts + 5 * 60 * 1000;

      const res = await apiClient.post('/api/v1/query', {
        query: logQuery,
        start,
        end,
      });

      setPivotLogs(res.data?.lines || []);
    } catch (err) {
      setLogError(err.message || 'Failed to load correlated logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex-1 min-h-[10rem]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onClick={handlePointClick}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            className="cursor-pointer"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={ts => format(new Date(ts), 'HH:mm')}
              fontSize={11}
              stroke="#9ca3af"
            />
            <YAxis
              tickFormatter={v => formatValue(v, formatType)}
              fontSize={11}
              width={44}
              stroke="#9ca3af"
            />
            <Tooltip
              labelFormatter={ts => `${format(new Date(ts), 'yyyy-MM-dd HH:mm')} (Click to pivot logs)`}
              formatter={(v, k) => [formatValue(v, formatType), seriesName(series[Number(k.slice(2))]?.labels)]}
            />
            {series.map((s, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`s_${idx}`}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 6, fill: '#ef4444' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400 px-2">
        <span>Click any point on the chart to pivot to correlated logs (&plusmn;5m)</span>
        {selectedTs && (
          <button
            onClick={() => setSelectedTs(null)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800"
          >
            <X className="w-3 h-3" /> Clear pivot
          </button>
        )}
      </div>

      {/* Correlated Logs Drawer */}
      {selectedTs && (
        <div className="border border-gray-200 rounded-md bg-gray-900 text-gray-100 p-2.5 max-h-40 overflow-y-auto text-xs font-mono">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-1.5 text-gray-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              Logs around {format(new Date(selectedTs), 'yyyy-MM-dd HH:mm:ss')} (&plusmn;5m)
            </span>
            {loadingLogs && <RefreshCw className="w-3 h-3 animate-spin text-brand-400" />}
          </div>

          {logError && <p className="text-red-400">{logError}</p>}
          {!loadingLogs && !pivotLogs.length && !logError && (
            <p className="text-gray-500 italic">No logs recorded within &plusmn;5m of this point.</p>
          )}

          <div className="space-y-1">
            {pivotLogs.map((log, i) => (
              <div key={i} className="flex gap-2 hover:bg-gray-800/60 p-0.5 rounded">
                <span className="text-gray-500 flex-shrink-0">
                  {format(new Date(log.ts), 'HH:mm:ss.SSS')}
                </span>
                <span
                  className={`px-1 rounded text-[10px] uppercase font-bold flex-shrink-0 ${
                    log.level === 'error'
                      ? 'bg-red-900 text-red-200'
                      : log.level === 'warn'
                      ? 'bg-amber-900 text-amber-200'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {log.level || 'info'}
                </span>
                <span className="text-gray-200 break-all">{log.line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

