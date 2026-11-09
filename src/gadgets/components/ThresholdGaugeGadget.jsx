import { useMemo } from 'react';
import { formatValue, seriesName } from '../formatters';

export function ThresholdGaugeGadget({ data, config = {} }) {
  const {
    warn = 75,
    crit = 90,
    max = 100,
    format: formatType = 'percent',
  } = config;

  const { value, label } = useMemo(() => {
    if (!data) return { value: null, label: '' };
    if (data.resultType === 'scalar') return { value: data.value, label: '' };
    const s = data.series || [];
    if (!s.length) return { value: null, label: 'No data' };
    const pts = s[0].points || [];
    const latest = pts.length ? pts[pts.length - 1][1] : null;
    return {
      value: latest,
      label: seriesName(s[0].labels) !== 'value' ? seriesName(s[0].labels) : '',
    };
  }, [data]);

  const numVal = value != null ? Number(value) : null;
  const pct = numVal != null ? Math.min(Math.max((numVal / max) * 100, 0), 100) : 0;

  // Determine status
  let status = 'normal';
  let colorClass = 'text-emerald-600 bg-emerald-500 stroke-emerald-500';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let statusLabel = 'Normal';

  if (numVal != null) {
    if (numVal >= crit) {
      status = 'critical';
      colorClass = 'text-rose-600 bg-rose-500 stroke-rose-500';
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      statusLabel = 'Critical';
    } else if (numVal >= warn) {
      status = 'warning';
      colorClass = 'text-amber-600 bg-amber-500 stroke-amber-500';
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      statusLabel = 'Warning';
    }
  }

  // Semi-circle SVG gauge calculation
  const radius = 60;
  const circumference = Math.PI * radius; // Half-circle circumference
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="relative w-44 h-24 flex items-end justify-center mb-1">
        <svg viewBox="0 0 140 75" className="w-full h-full overflow-visible">
          {/* Background Arc */}
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value Arc */}
          {numVal != null && (
            <path
              d="M 10 70 A 60 60 0 0 1 130 70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-700 ease-out ${colorClass}`}
            />
          )}
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">
            {formatValue(numVal, formatType)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
          {statusLabel}
        </span>
        <span className="text-xs text-gray-400">
          Warn &ge; {warn} · Crit &ge; {crit}
        </span>
      </div>

      {label && (
        <p className="mt-1 text-xs text-gray-500 max-w-xs truncate" title={label}>
          {label}
        </p>
      )}
    </div>
  );
}

