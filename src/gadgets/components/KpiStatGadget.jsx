import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatValue, seriesName } from '../formatters';

export function KpiStatGadget({ data, config = {} }) {
  const {
    format: formatType = 'compact',
    showDelta = true,
    showSparkline = true,
    sparkColor = '#3b82f6',
  } = config;

  // Process data from scalar, series, or table
  const { headlineValue, subtitle, deltaInfo, sparklinePoints } = useMemo(() => {
    if (!data) return { headlineValue: null, subtitle: '', deltaInfo: null, sparklinePoints: [] };

    // Scalar resultType
    if (data.resultType === 'scalar') {
      return { headlineValue: data.value, subtitle: '', deltaInfo: null, sparklinePoints: [] };
    }

    const series = data.series || [];
    if (!series.length) {
      return { headlineValue: null, subtitle: 'No data', deltaInfo: null, sparklinePoints: [] };
    }

    const first = series[0];
    const pts = first.points || [];
    if (!pts.length) {
      return { headlineValue: null, subtitle: seriesName(first.labels), deltaInfo: null, sparklinePoints: [] };
    }

    const latestVal = pts[pts.length - 1][1];
    const sub = series.length > 1
      ? `${seriesName(first.labels)} (+${series.length - 1} more)`
      : seriesName(first.labels) !== 'value' ? seriesName(first.labels) : '';

    // Calculate period-over-period delta if we have at least 2 points
    let delta = null;
    if (pts.length >= 2) {
      // Split points into halves to compare periods, or compare latest vs previous
      if (pts.length >= 6) {
        const mid = Math.floor(pts.length / 2);
        const prevHalf = pts.slice(0, mid).map(p => p[1]).filter(v => v != null);
        const curHalf = pts.slice(mid).map(p => p[1]).filter(v => v != null);

        const prevSum = prevHalf.reduce((a, b) => a + b, 0);
        const curSum = curHalf.reduce((a, b) => a + b, 0);

        if (prevSum !== 0) {
          const pct = ((curSum - prevSum) / Math.abs(prevSum)) * 100;
          delta = {
            pct,
            label: `vs prior period`,
            positive: pct > 0,
            neutral: Math.abs(pct) < 0.1,
          };
        }
      } else {
        const prevVal = pts[pts.length - 2][1];
        if (prevVal != null && prevVal !== 0 && latestVal != null) {
          const pct = ((latestVal - prevVal) / Math.abs(prevVal)) * 100;
          delta = {
            pct,
            label: `vs prev`,
            positive: pct > 0,
            neutral: Math.abs(pct) < 0.1,
          };
        }
      }
    }

    const spark = pts
      .filter(p => p[1] != null && !Number.isNaN(p[1]))
      .map(([ts, val]) => ({ ts, val }));

    return {
      headlineValue: latestVal,
      subtitle: sub,
      deltaInfo: delta,
      sparklinePoints: spark,
    };
  }, [data]);

  return (
    <div className="relative flex flex-col justify-between h-full p-4 overflow-hidden">
      <div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            {formatValue(headlineValue, formatType)}
          </span>

          {showDelta && deltaInfo && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                deltaInfo.neutral
                  ? 'bg-gray-100 text-gray-600'
                  : deltaInfo.positive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {deltaInfo.neutral ? (
                <Minus className="w-3 h-3" />
              ) : deltaInfo.positive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {Math.abs(deltaInfo.pct).toFixed(1)}%
              <span className="font-normal opacity-75 ml-0.5">{deltaInfo.label}</span>
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-gray-500 font-medium truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {showSparkline && sparklinePoints.length > 2 && (
        <div className="h-14 w-full mt-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklinePoints} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="kpiSparkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="val"
                stroke={sparkColor}
                strokeWidth={2}
                fill="url(#kpiSparkGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

