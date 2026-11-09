import { useMemo } from 'react';
import { ArrowDown, CheckCircle2 } from 'lucide-react';
import { formatValue, seriesName } from '../formatters';

export function ConversionFunnelGadget({ data, config = {} }) {
  const { stepsOrder = [], format: formatType = 'compact' } = config;

  const steps = useMemo(() => {
    if (!data) return [];

    const map = new Map();

    if (data.series && data.series.length) {
      data.series.forEach(s => {
        // Look for event name or step label
        const name = s.labels?.event || s.labels?.step || seriesName(s.labels);
        const pts = s.points || [];
        const sum = pts.reduce((acc, p) => acc + (p[1] != null && !Number.isNaN(p[1]) ? Number(p[1]) : 0), 0);
        map.set(name, (map.get(name) || 0) + sum);
      });
    } else if (data.resultType === 'table' && data.rows && data.rows.length) {
      data.rows.forEach(r => {
        const name = String(r[0] || 'step');
        const val = typeof r[r.length - 1] === 'number' ? r[r.length - 1] : 0;
        map.set(name, (map.get(name) || 0) + val);
      });
    }

    let orderedNames = [];
    if (stepsOrder && stepsOrder.length) {
      orderedNames = stepsOrder.filter(name => map.has(name));
      // Append any extra steps found
      for (const k of map.keys()) {
        if (!orderedNames.includes(k)) orderedNames.push(k);
      }
    } else {
      // Sort descending by count
      orderedNames = Array.from(map.keys()).sort((a, b) => map.get(b) - map.get(a));
    }

    const firstVal = orderedNames.length ? map.get(orderedNames[0]) || 0 : 0;

    return orderedNames.map((name, idx) => {
      const val = map.get(name) || 0;
      const prevVal = idx > 0 ? map.get(orderedNames[idx - 1]) || 0 : val;
      const stepConv = prevVal > 0 ? (val / prevVal) * 100 : 0;
      const overallConv = firstVal > 0 ? (val / firstVal) * 100 : 0;

      return {
        name,
        value: val,
        stepConv,
        overallConv,
        dropoff: Math.max(100 - stepConv, 0),
      };
    });
  }, [data, stepsOrder]);

  if (!steps.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 p-6">
        No funnel data in this range
      </div>
    );
  }

  const maxVal = steps[0].value || 1;

  return (
    <div className="flex flex-col h-full p-4 space-y-3 overflow-y-auto">
      {steps.map((step, idx) => {
        const widthPct = Math.max((step.value / maxVal) * 100, 15);

        return (
          <div key={step.name} className="space-y-1">
            {/* Step header */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800 capitalize flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 font-mono text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                {step.name.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900">{formatValue(step.value, formatType)}</span>
                <span className="text-gray-400 text-[11px] font-mono">({step.overallConv.toFixed(1)}% total)</span>
              </div>
            </div>

            {/* Funnel Bar */}
            <div className="h-6 w-full bg-gray-100 rounded-md overflow-hidden relative flex items-center px-2">
              <div
                className="absolute inset-y-0 left-0 bg-brand-500 rounded-md transition-all duration-500 opacity-90"
                style={{ width: `${widthPct}%` }}
              />
              <span className="relative z-10 text-[11px] font-medium text-white drop-shadow-sm">
                {step.overallConv.toFixed(1)}%
              </span>
            </div>

            {/* Dropoff connector between steps */}
            {idx < steps.length - 1 && (
              <div className="flex items-center gap-2 py-0.5 px-4 text-[11px] text-gray-400">
                <ArrowDown className="w-3 h-3 text-gray-300" />
                <span>
                  Step conversion: <strong className="text-gray-700">{steps[idx + 1].stepConv.toFixed(1)}%</strong>
                  {' '}&middot;{' '}
                  Drop-off: <span className="text-rose-600 font-medium">{steps[idx + 1].dropoff.toFixed(1)}%</span>
                </span>
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          End-to-End Conversion Rate
        </span>
        <span className="font-bold text-gray-900 font-mono">
          {steps.length > 1 ? `${steps[steps.length - 1].overallConv.toFixed(1)}%` : '100%'}
        </span>
      </div>
    </div>
  );
}

