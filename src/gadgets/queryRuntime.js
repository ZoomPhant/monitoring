/**
 * Client-Side Query Runtime Engine.
 *
 * Dynamically injects dashboard-level dimension filters (`where`) and IANA timezone (`in "<zone>"`)
 * into ZQL queries at execution time, preserving Event Summary matching and multi-pipeline `let` structures.
 */

const KNOWN_STREAM_LABELS = new Set([
  'app', 'service', 'job', 'env', 'environment', 'host', 'instance', 'namespace', 'region', 'cluster'
]);

/**
 * Injects stream label into a selector like `{app="api"}` or `{}`.
 */
function injectIntoSelector(selector, label, value) {
  // If the label is already explicitly matched in the selector, do not overwrite
  const labelCheck = new RegExp(`(?:^|[,{])\\s*${label}\\s*(=|!=|=~|!~)`);
  if (labelCheck.test(selector)) return selector;

  const inner = selector.slice(1, -1).trim();
  const escapedVal = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const part = `${label}="${escapedVal}"`;
  
  if (!inner) return `{${part}}`;
  return `{${inner}, ${part}}`;
}

/**
 * Apply dimension filters and timezone to a single ZQL pipeline.
 */
function applyToPipeline(pipeline, filters = {}, tz = 'UTC', indexedLabels = KNOWN_STREAM_LABELS) {
  let q = pipeline.trim();
  if (!q) return q;

  // 1. Process stream selector (the first stage `{...}`)
  const selectorMatch = /^\s*(\{[^}]*\})/.exec(q);
  if (selectorMatch) {
    let selector = selectorMatch[1];
    for (const [key, val] of Object.entries(filters)) {
      if (!val) continue;
      if (indexedLabels.has(key)) {
        selector = injectIntoSelector(selector, key, val);
      }
    }
    q = selector + q.slice(selectorMatch[0].length);
  }

  // 2. Process non-stream dimension filters for logs or metrics
  const nonStreamFilters = Object.entries(filters).filter(([k, v]) => v && !indexedLabels.has(k));
  if (nonStreamFilters.length > 0) {
    for (const [key, val] of nonStreamFilters) {
      const escapedVal = String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      // If query has `| logs`, insert `| where key = "val"` right after `| logs`
      if (/\|\s*logs\b/.test(q)) {
        // Avoid duplicate condition if already present
        const hasCond = new RegExp(`\\b${key}\\s*(=|==|in)\\s*["']?${escapedVal}["']?`);
        if (!hasCond.test(q)) {
          q = q.replace(/(\|\s*logs\b)/, `$1 | where ${key} = "${escapedVal}"`);
        }
      } else if (/\|\s*metric\b/.test(q)) {
        const hasCond = new RegExp(`\\b${key}\\s*(=|==|in)\\s*["']?${escapedVal}["']?`);
        if (!hasCond.test(q)) {
          q = q.replace(/(\|\s*metric\s+[^|]+)/, `$1 | where ${key} = "${escapedVal}"`);
        }
      }
    }
  }

  // 3. Process Timezone: if tz is specified and not UTC, inject `in "<tz>"` for day/week/month steps
  if (tz && tz !== 'UTC') {
    // Only apply if `window` is not present in the same clause
    if (!/\bwindow\s+\d+/.test(q)) {
      q = q.replace(/\bevery\s+(\d+[dwmoqy])(?!\s+in\b)/g, `every $1 in "${tz}"`);
    }
  }

  return q;
}

/**
 * Apply filters and timezone to a full ZQL query (which may include `let` statements and comments).
 */
export function applyRuntimeFilters(query, { filters = {}, tz = 'UTC', indexedLabels = KNOWN_STREAM_LABELS } = {}) {
  if (!query || typeof query !== 'string') return query;
  if ((!filters || Object.keys(filters).length === 0) && (!tz || tz === 'UTC')) {
    return query;
  }

  // Split lines to keep comments or multiple statements intact
  const lines = query.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    // Don't touch comment lines or empty lines
    if (trimmed.startsWith('#') || !trimmed) return line;

    // Split pipeline by semicolon if multiple statements on one line
    const statements = line.split(';');
    const transformed = statements.map(stmt => {
      // If it contains a pipeline, transform it
      if (stmt.includes('{') || stmt.includes('|')) {
        return applyToPipeline(stmt, filters, tz, indexedLabels);
      }
      return stmt;
    });

    return transformed.join(';');
  });

  return processedLines.join('\n');
}

/**
 * Discover dimension names from panel queries and active event summaries.
 */
export function extractQueryDimensions(panels = [], activeSummaries = []) {
  const dims = new Set(['app', 'env']);

  // Extract from active event summaries
  for (const s of activeSummaries) {
    if (Array.isArray(s.by)) {
      s.by.forEach(d => dims.add(d));
    }
  }

  // Extract common dimensions from panel queries
  for (const p of panels) {
    const q = p.query || '';
    // Look for by (...)
    const byMatches = q.matchAll(/\bby\s*\(([^)]+)\)/g);
    for (const m of byMatches) {
      m[1].split(',').forEach(d => {
        const clean = d.trim();
        if (clean && clean !== '*') dims.add(clean);
      });
    }

    // Look for where field = ...
    const whereMatches = q.matchAll(/\bwhere\s+([A-Za-z_][A-Za-z0-9_.]*)\s*(=|!=|in)\s*/g);
    for (const m of whereMatches) {
      const field = m[1].trim();
      if (field && !['level', 'event', 'value', 'line', 'ts'].includes(field)) {
        dims.add(field);
      }
    }
  }

  return Array.from(dims);
}

