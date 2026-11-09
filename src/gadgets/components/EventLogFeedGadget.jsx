import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronRight, ChevronDown, Tag } from 'lucide-react';

export function EventLogFeedGadget({ data }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const logs = useMemo(() => {
    if (!data) return [];
    if (data.lines && Array.isArray(data.lines)) return data.lines;
    return [];
  }, [data]);

  if (!logs.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 p-6">
        No log or event lines in this range
      </div>
    );
  }

  const toggleExpand = i => {
    setExpandedIndex(current => (current === i ? null : i));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto divide-y divide-gray-100 text-xs font-mono">
      {logs.map((log, i) => {
        const isExpanded = expandedIndex === i;
        let parsedJson = null;
        try {
          if (log.line && log.line.startsWith('{') && log.line.endsWith('}')) {
            parsedJson = JSON.parse(log.line);
          }
        } catch {
          // not json
        }

        const level = log.level || 'info';
        const isError = level === 'error';
        const isWarn = level === 'warn';

        return (
          <div key={i} className="p-2 hover:bg-gray-50/80 transition-colors">
            <div
              className="flex items-start gap-2 cursor-pointer select-none"
              onClick={() => toggleExpand(i)}
            >
              <button className="text-gray-400 mt-0.5 hover:text-gray-600">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              <span className="text-gray-400 flex-shrink-0 text-[11px]">
                {format(new Date(log.ts), 'HH:mm:ss.SSS')}
              </span>

              <span
                className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold flex-shrink-0 ${
                  isError
                    ? 'bg-rose-100 text-rose-800'
                    : isWarn
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {level}
              </span>

              {/* Event Name Tag if present */}
              {log.labels?.event && (
                <span className="px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 text-[10px] font-semibold border border-brand-200 flex-shrink-0">
                  {log.labels.event}
                </span>
              )}

              <span className="text-gray-800 break-all font-mono line-clamp-2">
                {parsedJson ? (
                  <span className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(parsedJson).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 px-1 bg-gray-100 rounded text-[11px]">
                        <span className="text-gray-500">{k}:</span>
                        <span className="text-gray-900 font-medium">
                          {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                        </span>
                      </span>
                    ))}
                  </span>
                ) : typeof log.line === 'object' && log.line !== null ? (
                  JSON.stringify(log.line)
                ) : (
                  log.line
                )}
              </span>
            </div>

            {/* Expanded metadata drawer */}
            {isExpanded && (
              <div className="mt-2 ml-6 p-2 bg-gray-50 rounded border border-gray-200 space-y-2">
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">Timestamp:</span>
                  <p className="text-gray-800">{new Date(log.ts).toISOString()} ({log.ts})</p>
                </div>

                {log.labels && Object.keys(log.labels).length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 uppercase flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Labels:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(log.labels).map(([k, v]) => (
                        <span key={k} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[11px] text-gray-700">
                          {k}=<strong>{typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">Raw Line:</span>
                  <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {typeof log.line === 'object' ? JSON.stringify(log.line, null, 2) : log.line}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

