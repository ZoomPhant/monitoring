/**
 * Gadget Metadata Protocol for TSDB Panels.
 *
 * Persists extended gadget options (type, format, variant, warn/crit thresholds, showDelta, showSparkline)
 * as a trailing ZQL comment `# @gadget {...}` while ensuring the panel.kind sent to the backend
 * stays strictly within ['line', 'bar', 'table', 'stat'].
 *
 * Zero backend change required.
 */

export const GADGET_BASE_KINDS = {
  'kpi-stat': 'stat',
  'threshold-gauge': 'stat',
  'time-trend': 'line',
  'percentile-band': 'line',
  'category-donut': 'bar',
  'top-n-bar': 'bar',
  'conversion-funnel': 'bar',
  'metric-log-pivot': 'line',
  'data-table': 'table',
  'event-log-feed': 'table',
};

const GADGET_PRAGMA_REGEX = /(?:\r?\n|^)\s*#\s*@gadget\s*(\{[\s\S]*\})\s*$/;

/**
 * Extract `# @gadget {...}` from panel query (or raw query string), or infer defaults from panel.kind.
 */
export function parseGadgetPragma(panelOrQuery) {
  if (!panelOrQuery) return { cleanQuery: '', gadgetConfig: { type: 'time-trend', variant: 'line' } };

  const rawQuery = typeof panelOrQuery === 'string' ? panelOrQuery : panelOrQuery.query || '';
  const panelKind = typeof panelOrQuery === 'object' ? panelOrQuery.kind : null;
  const match = GADGET_PRAGMA_REGEX.exec(rawQuery);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const cleanQuery = rawQuery.slice(0, match.index).trim();
      const type = parsed.type || (panelKind === 'stat' ? 'kpi-stat' : panelKind === 'bar' ? 'time-trend' : 'time-trend');
      return {
        cleanQuery,
        metadata: parsed,
        gadgetConfig: {
          ...parsed,
          type,
        },
      };
    } catch {
      // If corrupted, fallback to inference
    }
  }

  // Infer default gadget configuration based on panel.kind
  let gadgetConfig = { type: 'time-trend', variant: 'line' };
  switch (panelKind) {
    case 'stat':
      gadgetConfig = { type: 'kpi-stat', format: 'compact', showDelta: true, showSparkline: true };
      break;
    case 'bar':
      gadgetConfig = { type: 'time-trend', variant: 'bar' };
      break;
    case 'table':
      gadgetConfig = { type: 'data-table' };
      break;
    case 'line':
    default:
      gadgetConfig = { type: 'time-trend', variant: 'line' };
      break;
  }

  return {
    cleanQuery: rawQuery.trim(),
    metadata: { type: gadgetConfig.type, config: gadgetConfig },
    gadgetConfig,
  };
}

/**
 * Serialize query text and gadget config into a single query string with `# @gadget {...}` pragma.
 */
export function serializeGadgetPragma(query, type = 'time-trend', config = {}) {
  const { cleanQuery } = parseGadgetPragma(query);
  const payload = { type, config };
  const pragmaComment = `# @gadget ${JSON.stringify(payload)}`;
  return cleanQuery ? `${cleanQuery} ${pragmaComment}` : pragmaComment;
}

/**
 * Attach or update `# @gadget {...}` comment on panel query, setting panel.kind to the valid baseKind.
 */
export function serializeGadgetPanel(panel, gadgetConfig) {
  const { cleanQuery } = parseGadgetPragma(panel);
  const type = gadgetConfig?.type || 'time-trend';
  
  // Resolve base kind for backend validation
  let baseKind = GADGET_BASE_KINDS[type] || 'line';
  if (type === 'time-trend' && gadgetConfig?.variant === 'bar') {
    baseKind = 'bar';
  }

  const pragmaComment = `# @gadget ${JSON.stringify(gadgetConfig)}`;
  const finalQuery = cleanQuery ? `${cleanQuery}\n${pragmaComment}` : pragmaComment;

  return {
    ...panel,
    kind: baseKind,
    query: finalQuery,
  };
}
