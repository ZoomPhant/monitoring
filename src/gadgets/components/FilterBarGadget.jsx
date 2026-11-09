import { useState, useEffect } from 'react';
import { Filter, Globe, X, ChevronDown } from 'lucide-react';
import { apiClient } from '@/api/client';
import { extractQueryDimensions } from '../queryRuntime';

const COMMON_TIMEZONES = [
  { label: 'UTC (Default)', value: 'UTC' },
  { label: 'Browser Local Time', value: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
  { label: 'America/New York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Los Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
  { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Australia/Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
];

export function FilterBarGadget({
  panels = [],
  activeFilters = {},
  onFilterChange,
  activeTz = 'UTC',
  onTzChange,
}) {
  const [dimensions, setDimensions] = useState([]);
  const [dimensionValues, setDimensionValues] = useState({});
  const [loadingValues, setLoadingValues] = useState(false);

  // 1. Discover dimensions from panels
  useEffect(() => {
    const dims = extractQueryDimensions(panels);
    setDimensions(dims.filter(d => !['level', 'ts', 'line', 'value', 'event'].includes(d)));
  }, [panels]);

  // 2. Fetch sample values for discovered dimensions
  useEffect(() => {
    if (!dimensions.length) return;
    setLoadingValues(true);

    const promises = dimensions.map(dim =>
      apiClient
        .get(`/api/v1/label/${encodeURIComponent(dim)}/values`)
        .then(res => ({ dim, values: res.data || [] }))
        .catch(() => ({ dim, values: [] }))
    );

    Promise.all(promises)
      .then(results => {
        const map = {};
        results.forEach(({ dim, values }) => {
          if (values.length > 0) map[dim] = values;
        });
        setDimensionValues(map);
      })
      .finally(() => setLoadingValues(false));
  }, [dimensions]);

  const handleSelectDimValue = (dim, val) => {
    const next = { ...activeFilters };
    if (!val) {
      delete next[dim];
    } else {
      next[dim] = val;
    }
    onFilterChange(next);
  };

  const handleClearAll = () => {
    onFilterChange({});
  };

  const activeCount = Object.keys(activeFilters).length;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Dimension Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-brand-600" /> Filters:
        </span>

        {dimensions.length === 0 ? (
          <span className="text-gray-400 text-xs italic">No common dimensions found in panels</span>
        ) : (
          dimensions.map(dim => {
            const currentVal = activeFilters[dim] || '';
            const values = dimensionValues[dim] || [];

            return (
              <div key={dim} className="flex items-center">
                <select
                  value={currentVal}
                  onChange={e => handleSelectDimValue(dim, e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                    currentVal
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-xs'
                      : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <option value="">{dim}: All</option>
                  {values.map(v => {
                    const strVal = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
                    return (
                      <option key={strVal} value={strVal}>
                        {dim}: {strVal}
                      </option>
                    );
                  })}
                  {currentVal && !values.map(x => (typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x))).includes(currentVal) && (
                    <option value={currentVal}>{dim}: {currentVal}</option>
                  )}
                </select>
              </div>
            );
          })
        )}

        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 font-medium ml-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Timezone Selector */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-indigo-600" /> Timezone:
        </span>
        <select
          value={activeTz}
          onChange={e => onTzChange(e.target.value)}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
            activeTz !== 'UTC'
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs'
              : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {COMMON_TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

