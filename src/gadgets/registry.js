/**
 * Central Gadget Registry for TSDB Portal & AI Agents.
 *
 * Defines all available visualizations, their categories, domains (BI, Monitoring, APM, AI),
 * config schemas, ready-to-run showcase presets, and component mappings.
 */

import { KpiStatGadget } from './components/KpiStatGadget';
import { ThresholdGaugeGadget } from './components/ThresholdGaugeGadget';
import { TimeTrendGadget } from './components/TimeTrendGadget';
import { PercentileBandGadget } from './components/PercentileBandGadget';
import { CategoryDonutGadget } from './components/CategoryDonutGadget';
import { TopNBarGadget } from './components/TopNBarGadget';
import { ConversionFunnelGadget } from './components/ConversionFunnelGadget';
import { MetricLogPivotGadget } from './components/MetricLogPivotGadget';
import { DataTableGadget } from './components/DataTableGadget';
import { EventLogFeedGadget } from './components/EventLogFeedGadget';

export const GADGET_CATEGORIES = [
  { id: 'kpi', name: 'KPI & Status', description: 'Headline metric cards, goal gauges, and status badges' },
  { id: 'trend', name: 'Time-Series & Trends', description: 'Line, area, stacked bar, and percentile trend charts' },
  { id: 'breakdown', name: 'Breakdown & Ranking', description: 'Donut category shares and Top-N ranked progress bars' },
  { id: 'flow', name: 'Flow & Correlation', description: 'Conversion funnels and metric-to-log drilldowns' },
  { id: 'table', name: 'Tables & Feeds', description: 'Sortable business tables and live structured event streams' },
];

export const GADGET_DOMAINS = [
  { id: 'all', name: 'All Gadgets' },
  { id: 'bi', name: '📊 Business & Product BI' },
  { id: 'monitoring', name: '🖥️ Host & Infra Monitoring' },
  { id: 'apm', name: '🔍 Application & Log APM' },
  { id: 'ai', name: '🤖 AI & LLM Telemetry' },
];

export const GADGET_REGISTRY = [
  {
    id: 'kpi-stat',
    title: 'KPI Stat & Sparkline',
    category: 'kpi',
    domains: ['bi', 'monitoring', 'apm', 'ai'],
    baseKind: 'stat',
    description: 'Headline number with unit/currency formatting, period-over-period % delta badge, and background sparkline.',
    configSchema: {
      format: { label: 'Format', type: 'enum', values: ['compact', 'currency:USD', 'currency:EUR', 'percent', 'bytes', 'duration_ms', 'number'], default: 'compact' },
      showDelta: { label: 'Show % Change', type: 'boolean', default: true },
      showSparkline: { label: 'Show Sparkline', type: 'boolean', default: true },
    },
    presets: {
      bi: {
        title: '30d Revenue',
        query: '{} | events order_completed | sum(amount) every 1d',
        config: { format: 'currency:USD', showDelta: true, showSparkline: true },
      },
      monitoring: {
        title: 'Avg Host CPU',
        query: '{app="host_agent"} | metric cpu_usage_percent | avg(value) every 5m',
        config: { format: 'percent', showDelta: true, showSparkline: true },
      },
    },
    component: KpiStatGadget,
  },
  {
    id: 'threshold-gauge',
    title: 'Threshold Gauge Meter',
    category: 'kpi',
    domains: ['monitoring', 'bi'],
    baseKind: 'stat',
    description: 'Radial semi-circle saturation and goal meter with green/amber/red threshold status zones.',
    configSchema: {
      warn: { label: 'Warning Threshold', type: 'number', default: 75 },
      crit: { label: 'Critical Threshold', type: 'number', default: 90 },
      max: { label: 'Max Value', type: 'number', default: 100 },
      format: { label: 'Format', type: 'enum', values: ['percent', 'number', 'compact'], default: 'percent' },
    },
    presets: {
      monitoring: {
        title: 'Disk Saturation',
        query: '{app="host_agent"} | metric disk_used_percent | last(value)',
        config: { warn: 80, crit: 90, max: 100, format: 'percent' },
      },
      bi: {
        title: 'Monthly Sales Target',
        query: '{} | events order_completed | count()',
        config: { warn: 70, crit: 90, max: 1000, format: 'compact' },
      },
    },
    component: ThresholdGaugeGadget,
  },
  {
    id: 'time-trend',
    title: 'Time Trend Chart',
    category: 'trend',
    domains: ['bi', 'monitoring', 'apm', 'ai'],
    baseKind: 'line',
    description: 'Versatile time-series chart with line, area, or stacked-bar variants, timezone alignment, and CSV export.',
    configSchema: {
      variant: { label: 'Chart Variant', type: 'enum', values: ['line', 'area', 'bar', 'stacked-bar'], default: 'line' },
      format: { label: 'Y-Axis Format', type: 'enum', values: ['compact', 'currency:USD', 'percent', 'bytes', 'duration_ms', 'number'], default: 'compact' },
      showLegend: { label: 'Show Legend', type: 'boolean', default: true },
    },
    presets: {
      bi: {
        title: 'Daily Orders by Channel',
        query: '{} | events order_completed | count() every 1d by (channel)',
        config: { variant: 'stacked-bar', format: 'compact' },
      },
      monitoring: {
        title: 'Network RX/TX Bandwidth',
        query: '{app="host_agent"} | metric network_rx_bytes_total | rate every 5m by (host)',
        config: { variant: 'area', format: 'bytes' },
      },
    },
    component: TimeTrendGadget,
  },
  {
    id: 'percentile-band',
    title: 'Percentile Band (p50/p90/p99)',
    category: 'trend',
    domains: ['apm', 'monitoring', 'bi'],
    baseKind: 'line',
    description: 'Multi-quantile latency or size distribution curve powered by DDSketch rollups or event summaries.',
    configSchema: {
      format: { label: 'Unit Format', type: 'enum', values: ['duration_ms', 'bytes', 'number', 'compact'], default: 'duration_ms' },
    },
    presets: {
      apm: {
        title: 'API Request Latency',
        query: '{app="api"} | logs | parse json | quantile(0.95, duration_ms) every 1h',
        config: { format: 'duration_ms' },
      },
      bi: {
        title: 'Order Value Percentiles',
        query: '{} | events order_completed | quantile(0.9, amount) every 1d',
        config: { format: 'currency:USD' },
      },
    },
    component: PercentileBandGadget,
  },
  {
    id: 'category-donut',
    title: 'Category Share (Donut)',
    category: 'breakdown',
    domains: ['bi', 'apm', 'monitoring'],
    baseKind: 'bar',
    description: 'Proportional distribution donut/pie chart with centered total and interactive ranked share table.',
    configSchema: {
      format: { label: 'Value Format', type: 'enum', values: ['compact', 'currency:USD', 'number'], default: 'compact' },
      maxItems: { label: 'Max Categories', type: 'number', default: 8 },
    },
    presets: {
      bi: {
        title: 'Revenue Share by Country',
        query: '{} | events order_completed | sum(amount) every 1d by (country)',
        config: { format: 'currency:USD', maxItems: 6 },
      },
      apm: {
        title: 'HTTP Status Code Distribution',
        query: '{app="web"} | logs | count() every 1h by (status)',
        config: { format: 'compact', maxItems: 5 },
      },
    },
    component: CategoryDonutGadget,
  },
  {
    id: 'top-n-bar',
    title: 'Top-N Horizontal Bars',
    category: 'breakdown',
    domains: ['bi', 'monitoring', 'apm'],
    baseKind: 'bar',
    description: 'Ranked horizontal progress bars showing top entities with individual values and percentage of total.',
    configSchema: {
      format: { label: 'Value Format', type: 'enum', values: ['compact', 'currency:USD', 'bytes', 'number'], default: 'compact' },
      maxItems: { label: 'Max Ranks', type: 'number', default: 10 },
    },
    presets: {
      bi: {
        title: 'Top Customers by Spend',
        query: '{} | events order_completed | sum(amount) by (user_id) | top 10',
        config: { format: 'currency:USD', maxItems: 10 },
      },
      monitoring: {
        title: 'Top Routes by Error Count',
        query: '{app="api"} | logs | where level = "error" | count() by (path) | top 10',
        config: { format: 'compact', maxItems: 10 },
      },
    },
    component: TopNBarGadget,
  },
  {
    id: 'conversion-funnel',
    title: 'Conversion Funnel',
    category: 'flow',
    domains: ['bi', 'apm'],
    baseKind: 'bar',
    description: 'Sequential multi-step conversion funnel with step volumes, step-to-step conversion, and drop-off %.',
    configSchema: {
      format: { label: 'Count Format', type: 'enum', values: ['compact', 'number'], default: 'compact' },
    },
    presets: {
      bi: {
        title: 'E-commerce Purchase Funnel',
        query: '{} | events product_view, add_to_cart, checkout_started, order_completed | count() by (event)',
        config: {
          stepsOrder: ['product_view', 'add_to_cart', 'checkout_started', 'order_completed'],
          format: 'compact',
        },
      },
    },
    component: ConversionFunnelGadget,
  },
  {
    id: 'metric-log-pivot',
    title: 'Metric Chart with Log Spike Pivot',
    category: 'flow',
    domains: ['monitoring', 'apm', 'bi'],
    baseKind: 'line',
    description: 'Interactive metric chart where clicking on any spike timestamp automatically queries and inspects logs ±5m.',
    configSchema: {
      format: { label: 'Y-Axis Format', type: 'enum', values: ['compact', 'percent', 'number'], default: 'compact' },
    },
    presets: {
      monitoring: {
        title: 'CPU Spikes with Correlated Logs',
        query: '{app="host_agent"} | metric cpu_usage_percent | avg(value) every 5m by (host)',
        config: { format: 'percent' },
      },
      bi: {
        title: 'Payment Failures with Error Logs',
        query: '{} | events payment_failed | count() every 1h',
        config: { format: 'compact' },
      },
    },
    component: MetricLogPivotGadget,
  },
  {
    id: 'data-table',
    title: 'Formatted Data Table',
    category: 'table',
    domains: ['bi', 'monitoring', 'apm', 'ai'],
    baseKind: 'table',
    description: 'Multi-column tabular display with click-to-sort headers, number formatting, and 1-click CSV export.',
    configSchema: {
      format: { label: 'Numeric Format', type: 'enum', values: ['compact', 'currency:USD', 'number'], default: 'compact' },
      maxRows: { label: 'Max Rows', type: 'number', default: 200 },
    },
    presets: {
      bi: {
        title: 'Orders Overview Table',
        query: '{} | events order_completed | select ts, user_id, amount, country | limit 100',
        config: { format: 'currency:USD', maxRows: 100 },
      },
      monitoring: {
        title: 'Host Inventory Status',
        query: '{app="host_agent"} | metric cpu_usage_percent | avg(value) every 5m by (host)',
        config: { format: 'percent', maxRows: 50 },
      },
    },
    component: DataTableGadget,
  },
  {
    id: 'event-log-feed',
    title: 'Live Structured Event Stream',
    category: 'table',
    domains: ['apm', 'bi', 'monitoring'],
    baseKind: 'table',
    description: 'Activity stream showing JSON attribute badges, severity levels, timestamps, and expandable raw detail.',
    configSchema: {},
    presets: {
      bi: {
        title: 'Live Customer Event Feed',
        query: '{} | events | where event exists | limit 50',
        config: {},
      },
      apm: {
        title: 'Error & Warning Log Stream',
        query: '{} | logs | where level >= "warn" | limit 50',
        config: {},
      },
    },
    component: EventLogFeedGadget,
  },
];

export function getGadgetDefinition(type) {
  return GADGET_REGISTRY.find(g => g.id === type) || GADGET_REGISTRY[2]; // default to time-trend
}

export function getGadgetsByDomain(domain) {
  if (!domain || domain === 'all') return GADGET_REGISTRY;
  return GADGET_REGISTRY.filter(g => g.domains.includes(domain));
}

export function getGadgetsByCategory(category) {
  if (!category || category === 'all') return GADGET_REGISTRY;
  return GADGET_REGISTRY.filter(g => g.category === category);
}

