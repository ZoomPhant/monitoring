/**
 * Synthetic Sample Data Generator for TSDB Templates & Gadgets.
 *
 * Generates realistic, time-distributed events, metrics, and logs over the past 24 hours
 * matching any template schema, and pushes them via POST /api/v1/push.
 */

import { apiClient } from '@/api/client';

const COUNTRIES = ['US', 'DE', 'GB', 'FR', 'JP', 'CA'];
const CHANNELS = ['organic', 'ads', 'email', 'social', 'referral'];
const PLANS = ['starter', 'pro', 'team', 'enterprise'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randFloat(min, max, dec = 2) {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(dec));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate push payload for a specific template.
 */
export function generateTemplateData(templateName, count = 120) {
  const now = Date.now();
  const dayAgo = now - 23 * 3600000;
  const timeStep = (now - dayAgo) / count;

  switch (templateName) {
    case 'ecommerce': {
      const logs = [];
      for (let i = 0; i < count; i++) {
        const ts = Math.floor(dayAgo + i * timeStep + randInt(0, 5000));
        const user = `u-${randInt(100, 180)}`;
        const orderId = `o-${1000 + i}`;
        const roll = Math.random();

        if (roll < 0.45) {
          // product_view
          logs.push({
            ts,
            labels: { event: 'product_view', user_id: user },
            line: JSON.stringify({ product_id: `prod-${randInt(1, 20)}`, channel: pick(CHANNELS) }),
          });
        } else if (roll < 0.70) {
          // add_to_cart
          logs.push({
            ts,
            labels: { event: 'add_to_cart', user_id: user },
            line: JSON.stringify({ product_id: `prod-${randInt(1, 20)}`, channel: pick(CHANNELS) }),
          });
        } else if (roll < 0.93) {
          // order_completed
          const amount = randFloat(19.99, 249.99);
          logs.push({
            ts,
            labels: { event: 'order_completed', user_id: user, order_id: orderId },
            line: JSON.stringify({
              amount,
              currency: 'USD',
              country: pick(COUNTRIES),
              channel: pick(CHANNELS),
            }),
          });
        } else {
          // refund
          logs.push({
            ts,
            labels: { event: 'refund', user_id: user, order_id: orderId },
            line: JSON.stringify({ amount: randFloat(15, 80), reason: pick(['damaged', 'wrong_size', 'late_delivery']) }),
          });
        }
      }
      return { streams: [{ labels: { app: 'shop', env: 'prod' }, logs }] };
    }

    case 'web-analytics': {
      const paths = ['/home', '/pricing', '/docs', '/blog/ai-trends', '/signup', '/checkout'];
      const referrers = ['google.com', 'twitter.com', 'github.com', 'direct', 'linkedin.com'];
      const devices = ['desktop', 'mobile', 'tablet'];
      const logs = [];

      for (let i = 0; i < count; i++) {
        const ts = Math.floor(dayAgo + i * timeStep + randInt(0, 5000));
        logs.push({
          ts,
          labels: { event: 'page_view', user_id: `u-${randInt(100, 200)}` },
          line: JSON.stringify({
            path: pick(paths),
            referrer: pick(referrers),
            device: pick(devices),
            country: pick(COUNTRIES),
          }),
        });
      }
      return { streams: [{ labels: { app: 'website', env: 'prod' }, logs }] };
    }

    case 'ai-llm-usage': {
      const models = ['claude-3-5-sonnet', 'gpt-4o', 'gemini-1.5-pro', 'llama-3.1-70b'];
      const providers = ['anthropic', 'openai', 'google', 'meta'];
      const logs = [];

      for (let i = 0; i < count; i++) {
        const ts = Math.floor(dayAgo + i * timeStep + randInt(0, 5000));
        const model = pick(models);
        const promptTokens = randInt(250, 4000);
        const compTokens = randInt(100, 1500);
        const total = promptTokens + compTokens;
        const cost = Number(((promptTokens * 0.000003) + (compTokens * 0.000015)).toFixed(4));
        const duration = randInt(400, 3200);

        logs.push({
          ts,
          labels: { event: 'llm_completion', user_id: `u-${randInt(10, 40)}` },
          line: JSON.stringify({
            model,
            provider: providers[models.indexOf(model)],
            prompt_tokens: promptTokens,
            completion_tokens: compTokens,
            total_tokens: total,
            cost_usd: cost,
            duration_ms: duration,
          }),
        });
      }
      return { streams: [{ labels: { app: 'ai-gateway', env: 'prod' }, logs }] };
    }

    case 'host-monitoring': {
      const hosts = ['web-01', 'web-02'];
      const streams = [];

      for (const host of hosts) {
        const cpuPoints = [];
        const memPoints = [];
        const netPoints = [];
        const diskPoints = [];

        for (let i = 0; i < count; i++) {
          const ts = Math.floor(dayAgo + i * timeStep);
          cpuPoints.push([ts, randFloat(15, 85)]);
          memPoints.push([ts, randFloat(40, 75)]);
          netPoints.push([ts, randInt(1000000, 25000000)]);
          diskPoints.push([ts, randFloat(60, 68)]);
        }

        streams.push({
          labels: { app: 'host_agent', host },
          metrics: [
            { name: 'cpu_usage_percent', kind: 'gauge', points: cpuPoints },
            { name: 'memory_used_percent', kind: 'gauge', points: memPoints },
            { name: 'disk_used_percent', kind: 'gauge', points: diskPoints },
            { name: 'network_rx_bytes_total', kind: 'counter', points: netPoints },
          ],
        });
      }
      return { streams };
    }

    case 'saas': {
      const logs = [];
      for (let i = 0; i < count; i++) {
        const ts = Math.floor(dayAgo + i * timeStep);
        const user = `u-${randInt(10, 50)}`;
        const roll = Math.random();

        if (roll < 0.2) {
          logs.push({ ts, labels: { event: 'signup', user_id: user }, line: JSON.stringify({ plan: pick(PLANS), source: pick(CHANNELS) }) });
        } else if (roll < 0.65) {
          logs.push({ ts, labels: { event: 'login', user_id: user }, line: '{}' });
        } else if (roll < 0.95) {
          logs.push({ ts, labels: { event: 'feature_used', user_id: user }, line: JSON.stringify({ feature: pick(['dashboard', 'export', 'invite', 'api']) }) });
        } else {
          logs.push({ ts, labels: { event: 'subscription_cancelled', user_id: user }, line: JSON.stringify({ plan: pick(PLANS), reason: 'cost' }) });
        }
      }
      return { streams: [{ labels: { app: 'saas_app', env: 'prod' }, logs }] };
    }

    case 'nginx':
    case 'apache': {
      const logs = [];
      const statuses = ['200', '200', '200', '200', '304', '404', '500'];
      for (let i = 0; i < count; i++) {
        const ts = Math.floor(dayAgo + i * timeStep);
        const ip = `192.168.1.${randInt(10, 99)}`;
        const status = pick(statuses);
        const bytes = randInt(250, 15000);
        const line = `${ip} - - [${new Date(ts).toISOString()}] "GET /api/v1/resource HTTP/1.1" ${status} ${bytes}`;
        logs.push({ ts, line });
      }
      return { streams: [{ labels: { app: templateName }, logs }] };
    }

    default: {
      // Generic events
      const logs = [];
      for (let i = 0; i < count; i++) {
        const ts = Math.floor(dayAgo + i * timeStep);
        logs.push({
          ts,
          labels: { event: 'action', user_id: `u-${randInt(1, 20)}` },
          line: JSON.stringify({ value: randFloat(10, 100) }),
        });
      }
      return { streams: [{ labels: { app: 'demo' }, logs }] };
    }
  }
}

/**
 * Send synthetic sample data to the active tenant.
 */
export async function pushSampleData(templateName, count = 120) {
  const payload = generateTemplateData(templateName, count);
  const response = await apiClient.post('/api/v1/push', payload);
  return response;
}

