import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Filter,
  Play,
  Copy,
  Plus,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import {
  GADGET_REGISTRY,
  GADGET_CATEGORIES,
  GADGET_DOMAINS,
} from '@/gadgets/registry';
import { GadgetRenderer } from '@/gadgets/GadgetRenderer';

// Pre-packaged rich showcase datasets for instant, zero-latency gallery rendering
const SHOWCASE_DATA = {
  'kpi-stat': {
    resultType: 'series',
    series: [
      {
        labels: { metric: 'revenue' },
        points: [
          [Date.now() - 6 * 86400000, 31200],
          [Date.now() - 5 * 86400000, 34500],
          [Date.now() - 4 * 86400000, 32800],
          [Date.now() - 3 * 86400000, 38900],
          [Date.now() - 2 * 86400000, 42100],
          [Date.now() - 1 * 86400000, 45600],
          [Date.now(), 48250],
        ],
      },
    ],
  },
  'threshold-gauge': {
    resultType: 'scalar',
    value: 78.4,
  },
  'time-trend': {
    resultType: 'series',
    series: [
      {
        labels: { channel: 'organic' },
        points: [
          [Date.now() - 4 * 86400000, 120],
          [Date.now() - 3 * 86400000, 150],
          [Date.now() - 2 * 86400000, 180],
          [Date.now() - 1 * 86400000, 210],
          [Date.now(), 240],
        ],
      },
      {
        labels: { channel: 'ads' },
        points: [
          [Date.now() - 4 * 86400000, 80],
          [Date.now() - 3 * 86400000, 110],
          [Date.now() - 2 * 86400000, 95],
          [Date.now() - 1 * 86400000, 130],
          [Date.now(), 165],
        ],
      },
    ],
  },
  'percentile-band': {
    resultType: 'series',
    series: [
      {
        labels: { quantile: '0.5' },
        points: [
          [Date.now() - 4 * 3600000, 45],
          [Date.now() - 3 * 3600000, 48],
          [Date.now() - 2 * 3600000, 42],
          [Date.now() - 1 * 3600000, 50],
          [Date.now(), 47],
        ],
      },
      {
        labels: { quantile: '0.9' },
        points: [
          [Date.now() - 4 * 3600000, 120],
          [Date.now() - 3 * 3600000, 135],
          [Date.now() - 2 * 3600000, 110],
          [Date.now() - 1 * 3600000, 140],
          [Date.now(), 125],
        ],
      },
      {
        labels: { quantile: '0.99' },
        points: [
          [Date.now() - 4 * 3600000, 310],
          [Date.now() - 3 * 3600000, 420],
          [Date.now() - 2 * 3600000, 290],
          [Date.now() - 1 * 3600000, 380],
          [Date.now(), 350],
        ],
      },
    ],
  },
  'category-donut': {
    resultType: 'series',
    series: [
      { labels: { country: 'United States' }, points: [[Date.now(), 48500]] },
      { labels: { country: 'Germany' }, points: [[Date.now(), 24200]] },
      { labels: { country: 'United Kingdom' }, points: [[Date.now(), 18900]] },
      { labels: { country: 'Japan' }, points: [[Date.now(), 14100]] },
      { labels: { country: 'France' }, points: [[Date.now(), 9800]] },
    ],
  },
  'top-n-bar': {
    resultType: 'series',
    series: [
      { labels: { user_id: 'Enterprise ACME' }, points: [[Date.now(), 14200]] },
      { labels: { user_id: 'Starlight Corp' }, points: [[Date.now(), 11800]] },
      { labels: { user_id: 'Nexus Dynamics' }, points: [[Date.now(), 9400]] },
      { labels: { user_id: 'Apex Systems' }, points: [[Date.now(), 7800]] },
      { labels: { user_id: 'HyperScale AI' }, points: [[Date.now(), 6100]] },
    ],
  },
  'conversion-funnel': {
    resultType: 'series',
    series: [
      { labels: { event: 'product_view' }, points: [[Date.now(), 12500]] },
      { labels: { event: 'add_to_cart' }, points: [[Date.now(), 4200]] },
      { labels: { event: 'checkout_started' }, points: [[Date.now(), 2100]] },
      { labels: { event: 'order_completed' }, points: [[Date.now(), 1680]] },
    ],
  },
  'metric-log-pivot': {
    resultType: 'series',
    series: [
      {
        labels: { metric: 'cpu_usage_percent' },
        points: [
          [Date.now() - 50 * 60000, 42],
          [Date.now() - 40 * 60000, 44],
          [Date.now() - 30 * 60000, 94], // Spike!
          [Date.now() - 20 * 60000, 52],
          [Date.now() - 10 * 60000, 46],
          [Date.now(), 45],
        ],
      },
    ],
  },
  'data-table': {
    resultType: 'table',
    columns: ['Customer', 'Plan', 'MRR', 'Status'],
    rows: [
      ['ACME Corp', 'Enterprise', 4500, 'active'],
      ['Cyberdyne Inc', 'Pro', 1200, 'active'],
      ['Starlight AI', 'Pro', 1200, 'active'],
      ['Nexus Labs', 'Team', 490, 'trialing'],
      ['Apex Tech', 'Team', 490, 'active'],
    ],
  },
  'event-log-feed': {
    resultType: 'logs',
    lines: [
      {
        ts: Date.now() - 45000,
        level: 'info',
        labels: { event: 'order_completed' },
        line: '{"user_id":"u-9412","amount":149.50,"country":"US","plan":"pro"}',
      },
      {
        ts: Date.now() - 120000,
        level: 'warn',
        labels: { event: 'payment_retry' },
        line: '{"user_id":"u-8811","error":"gateway_timeout","attempt":2}',
      },
      {
        ts: Date.now() - 250000,
        level: 'info',
        labels: { event: 'signup' },
        line: '{"user_id":"u-8812","source":"google_ads","country":"DE"}',
      },
    ],
  },
};

export default function GadgetsGalleryPage() {
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Filter gadgets
  const filteredGadgets = GADGET_REGISTRY.filter(g => {
    const matchDomain = selectedDomain === 'all' || g.domains.includes(selectedDomain);
    const matchCategory = selectedCategory === 'all' || g.category === selectedCategory;
    return matchDomain && matchCategory;
  });

  const copyBlueprint = (gadget, preset) => {
    const blueprint = {
      gadgetType: gadget.id,
      title: preset.title,
      query: preset.query,
      config: preset.config,
      baseKind: gadget.baseKind,
      zqlQueryWithPragma: `${preset.query}\n# @gadget ${JSON.stringify({ type: gadget.id, ...preset.config })}`,
    };
    navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
    setCopiedId(gadget.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenInQuery = query => {
    navigate('/query', { state: { query } });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand-100 text-brand-700 rounded-lg">
                <LayoutGrid className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-bold text-gray-900">Gadget Gallery</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Reusable, standardized visualization gadgets for Business Intelligence, Host Monitoring, and AI Telemetry.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          {/* Domain Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Domain:
            </span>
            {GADGET_DOMAINS.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDomain === d.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">Category:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Types
            </button>
            {GADGET_CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGadgets.map(gadget => {
            // Pick BI preset if available, otherwise first preset
            const presetKey = gadget.presets.bi ? 'bi' : Object.keys(gadget.presets)[0];
            const preset = gadget.presets[presetKey];
            const showcase = SHOWCASE_DATA[gadget.id] || null;

            const fakePanel = {
              title: preset.title,
              query: `${preset.query}\n# @gadget ${JSON.stringify({ type: gadget.id, ...preset.config })}`,
              kind: gadget.baseKind,
            };

            return (
              <div
                key={gadget.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{gadget.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{gadget.description}</p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-200 flex-shrink-0">
                      {gadget.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {gadget.domains.map(d => (
                      <span
                        key={d}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live Preview Gadget */}
                <div className="p-3 bg-white min-h-[16rem] flex flex-col justify-center">
                  <GadgetRenderer
                    panel={fakePanel}
                    previewData={showcase}
                    canEdit={false}
                  />
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenInQuery(preset.query)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
                      title="Open query in console"
                    >
                      <Play className="w-3.5 h-3.5 text-brand-600" /> Try Query
                    </button>
                    <button
                      onClick={() => copyBlueprint(gadget, preset)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
                      title="Copy JSON blueprint for AI coding agents"
                    >
                      {copiedId === gadget.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-500" /> AI Blueprint
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => navigate('/dashboards', { state: { addGadget: fakePanel } })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-brand-600 text-white font-medium hover:bg-brand-700 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Dashboard
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

