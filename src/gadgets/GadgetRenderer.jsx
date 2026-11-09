import { useState, useEffect, useMemo } from 'react';
import {
  Pencil,
  Trash2,
  Download,
  Share2,
  Zap,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FileJson,
  Check,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { parseGadgetPragma } from './pragma';
import { applyRuntimeFilters } from './queryRuntime';
import { getGadgetDefinition } from './registry';
import { exportToCsv, exportToJson } from './formatters';

const UNIT_MS = { m: 60000, h: 3600000, d: 86400000, w: 604800000 };
const toMs = r => {
  const m = /^(\d+)([mhdw])$/.exec(r || '');
  return m ? Number(m[1]) * UNIT_MS[m[2]] : 86400000;
};

export function GadgetRenderer({
  panel,
  range = '7d',
  filters = {},
  tz = 'UTC',
  refresh = 0,
  canEdit = false,
  onEdit,
  onDelete,
  onShare,
  previewData = null,
}) {
  const [state, setState] = useState({ loading: !previewData, data: previewData });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [acceleratedNotice, setAcceleratedNotice] = useState(null);

  // 1. Parse `# @gadget {...}` pragma from query
  const { cleanQuery, gadgetConfig } = useMemo(() => parseGadgetPragma(panel), [panel]);

  // 2. Apply runtime dimension filters & timezone
  const executableQuery = useMemo(() => {
    return applyRuntimeFilters(cleanQuery, { filters, tz });
  }, [cleanQuery, filters, tz]);

  // 3. Resolve Gadget definition and component
  const gadgetDef = useMemo(() => getGadgetDefinition(gadgetConfig.type), [gadgetConfig.type]);
  const GadgetComponent = gadgetDef.component;

  // 4. Query execution
  useEffect(() => {
    if (previewData) {
      setState({ loading: false, data: previewData });
      return;
    }

    let cancelled = false;
    const end = Date.now();
    const effectiveRange = panel.range || range;
    const start = end - toMs(effectiveRange);

    setState(prev => ({ ...prev, loading: true, error: null }));

    apiClient
      .post('/api/v1/query', {
        query: executableQuery,
        start,
        end,
        explain: true,
      })
      .then(res => {
        if (!cancelled) {
          setState({
            loading: false,
            data: res.data,
            warnings: res.warnings || [],
            partial: res.status === 'partial',
            explain: res.explain,
            stats: res.stats,
          });
        }
      })
      .catch(err => {
        if (!cancelled) {
          setState({ loading: false, error: err.message || 'Query failed' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [executableQuery, panel.range, range, refresh, previewData]);

  // 5. Diagnostics: Acceleration badge
  const accelerationBadge = useMemo(() => {
    if (!state.stats && !state.explain) return null;
    const rawTiers = state.stats?.tiers;
    const tiers = Array.isArray(rawTiers) ? rawTiers : Array.from(rawTiers || []);
    const explainList = Array.isArray(state.explain) ? state.explain : state.explain ? [state.explain] : [];

    const hasSummary =
      tiers.includes('summary') ||
      explainList.some(e => e.path === 'summary' || e.kind === 'esummary');

    if (hasSummary) {
      return {
        type: 'summary',
        label: '⚡ Summary',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        title: 'Instant query served from SQLite pre-computed Event Summary (0 R2 reads).',
      };
    }

    const hasRollup =
      tiers.includes('rollup') ||
      tiers.includes('sketch') ||
      tiers.includes('volume') ||
      explainList.some(e => e.path === 'rollup');

    if (hasRollup) {
      return {
        type: 'rollup',
        label: '⚡ Rollup',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        title: 'Accelerated from hourly/daily rollups.',
      };
    }

    const scanStep = explainList.find(e => e.path === 'scan');
    if (scanStep) {
      return {
        type: 'scan',
        label: '🐢 Raw Scan',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        title: scanStep.reason || 'Scanned raw log blocks. Consider adding an Event Summary.',
      };
    }
    return null;
  }, [state.stats, state.explain]);

  // 6. Data Export handlers
  const handleExportCsv = () => {
    const filename = (panel.title || 'export').toLowerCase().replace(/\s+/g, '-');
    if (state.data?.resultType === 'table') {
      exportToCsv(filename, state.data.columns, state.data.rows);
    } else if (state.data?.series) {
      const rows = state.data.series.flatMap(s =>
        (s.points || []).map(([t, v]) => [
          new Date(t).toISOString(),
          JSON.stringify(s.labels || {}),
          v,
        ])
      );
      exportToCsv(filename, ['timestamp', 'labels', 'value'], rows);
    }
    setShowExportMenu(false);
  };

  const handleExportJson = () => {
    const filename = (panel.title || 'export').toLowerCase().replace(/\s+/g, '-');
    exportToJson(filename, state.data);
    setShowExportMenu(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 flex flex-col min-h-[19rem] overflow-hidden transition-shadow hover:shadow-md">
      {/* Gadget Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 truncate pr-2">
          <h3 className="text-sm font-semibold text-gray-800 truncate" title={panel.title}>
            {panel.title}
          </h3>
          {panel.range && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {panel.range}
            </span>
          )}
          {accelerationBadge && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${accelerationBadge.className}`}
              title={accelerationBadge.title}
            >
              {accelerationBadge.label}
            </span>
          )}
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-1.5 text-gray-400">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="p-1 hover:text-gray-700 rounded hover:bg-gray-100"
              title="Export data (CSV / JSON)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20 text-xs">
                <button
                  onClick={handleExportCsv}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                </button>
                <button
                  onClick={handleExportJson}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileJson className="w-3.5 h-3.5 text-blue-600" /> Export JSON
                </button>
              </div>
            )}
          </div>

          {/* Share / Embed */}
          {onShare && (
            <button
              onClick={() => onShare(panel, gadgetConfig)}
              className="p-1 hover:text-brand-600 rounded hover:bg-gray-100"
              title="Share / Embed Gadget"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit & Delete */}
          {canEdit && (
            <>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1 hover:text-brand-600 rounded hover:bg-gray-100"
                  title="Edit gadget"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1 hover:text-rose-600 rounded hover:bg-gray-100"
                  title="Remove gadget"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Warnings & Notices */}
      {state.warnings?.length > 0 && (
        <div className="px-4 py-1.5 bg-amber-50 text-[11px] text-amber-800 border-b border-amber-100 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{state.warnings.map(w => w.message).join(' · ')}</span>
        </div>
      )}

      {state.partial && (
        <div className="px-4 py-1.5 bg-amber-50 text-[11px] text-amber-800 border-b border-amber-100">
          Partial result: query reached storage budget. Use coarser step or summary.
        </div>
      )}

      {/* Gadget Content Body */}
      <div className="flex-1 p-2 flex flex-col overflow-auto relative">
        {state.loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <span className="text-xs text-gray-500 animate-pulse font-medium">Running query…</span>
          </div>
        )}

        {state.error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-xs font-semibold text-rose-700">{state.error}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-mono break-all max-w-sm">{executableQuery}</p>
          </div>
        ) : (
          <GadgetComponent
            data={state.data}
            config={gadgetConfig}
            query={executableQuery}
          />
        )}
      </div>
    </div>
  );
}

