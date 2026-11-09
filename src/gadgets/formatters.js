/**
 * Formatting and data export utilities for TSDB BI & Monitoring Gadgets.
 */

export function formatCompact(v) {
  if (v == null || Number.isNaN(v)) return '-';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(2);
}

export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const idx = Math.min(Math.max(i, 0), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(idx === 0 ? 0 : 2))} ${sizes[idx]}`;
}

export function formatDurationMs(ms) {
  if (ms == null || Number.isNaN(ms)) return '-';
  const abs = Math.abs(ms);
  if (abs < 1000) return `${Math.round(ms)}ms`;
  if (abs < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (abs < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  if (abs < 86400000) return `${(ms / 3600000).toFixed(1)}h`;
  return `${(ms / 86400000).toFixed(1)}d`;
}

export function formatValue(v, formatType = 'compact') {
  if (v == null || Number.isNaN(v)) return '-';
  if (typeof v !== 'number') return String(v);

  const [type, currency] = String(formatType || 'compact').split(':');

  switch (type) {
    case 'currency': {
      const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
      return `${sym}${formatCompact(v)}`;
    }
    case 'percent': {
      // If absolute value <= 1 and not 0, assume 0.0 - 1.0 ratio
      const pct = Math.abs(v) <= 1 && v !== 0 ? v * 100 : v;
      return `${pct.toFixed(1)}%`;
    }
    case 'bytes':
      return formatBytes(v);
    case 'duration_ms':
      return formatDurationMs(v);
    case 'number':
      return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'compact':
    default:
      return formatCompact(v);
  }
}

export function seriesName(labels) {
  if (!labels || Object.keys(labels).length === 0) return 'value';
  return (
    Object.entries(labels)
      .filter(([k]) => k !== 'metric')
      .map(([k, v]) => `${k}="${typeof v === 'object' && v !== null ? JSON.stringify(v) : v}"`)
      .join(', ') ||
    (typeof labels.metric === 'object' ? JSON.stringify(labels.metric) : labels.metric) ||
    'value'
  );
}

/**
 * Trigger client-side browser download for a Blob.
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export table or series data as a CSV file.
 * Supports dual calling conventions:
 * 1. exportToCsv(filename, columns, rows)
 * 2. exportToCsv(dataObject, filename)
 */
export function exportToCsv(arg1, arg2 = [], arg3 = []) {
  let filename = 'export.csv';
  let cols = [];
  let rowData = [];

  if (typeof arg1 === 'string') {
    filename = arg1;
    cols = Array.isArray(arg2) ? arg2 : [];
    rowData = Array.isArray(arg3) ? arg3 : [];
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    const data = arg1;
    filename = typeof arg2 === 'string' ? arg2 : 'export.csv';

    if (data.resultType === 'table' && data.columns && data.rows) {
      cols = data.columns;
      rowData = data.rows;
    } else if (data.table && data.table.columns && data.table.rows) {
      cols = data.table.columns;
      rowData = data.table.rows;
    } else if (data.series && Array.isArray(data.series)) {
      cols = ['timestamp', 'series', 'value'];
      rowData = data.series.flatMap(s =>
        (s.points || []).map(([t, v]) => [
          new Date(t).toISOString(),
          seriesName(s.labels),
          v,
        ])
      );
    } else if (data.lines && Array.isArray(data.lines)) {
      cols = ['timestamp', 'line'];
      rowData = data.lines.map(l => {
        if (Array.isArray(l)) {
          return [new Date(l[0]).toISOString(), typeof l[1] === 'object' ? JSON.stringify(l[1]) : String(l[1] ?? '')];
        }
        return [
          new Date(l.ts || Date.now()).toISOString(),
          typeof l.line === 'object' ? JSON.stringify(l.line) : String(l.line ?? ''),
        ];
      });
    }
  }

  const escapeCell = cell => {
    if (cell == null) return '';
    const s = typeof cell === 'object' ? JSON.stringify(cell) : String(cell);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = cols.map(escapeCell).join(',');
  const body = rowData.map(r => (Array.isArray(r) ? r : [r]).map(escapeCell).join(',')).join('\n');
  const csvContent = `${header}\n${body}`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export object or array as a JSON file.
 * Supports dual calling conventions: exportToJson(filename, data) or exportToJson(data, filename).
 */
export function exportToJson(arg1, arg2) {
  let filename = 'export.json';
  let data = null;

  if (typeof arg1 === 'string') {
    filename = arg1;
    data = arg2;
  } else {
    data = arg1;
    filename = typeof arg2 === 'string' ? arg2 : 'export.json';
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

