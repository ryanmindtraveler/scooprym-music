import {
  IMAGE_FALLBACK_MODEL,
  MINIMAX_MUSIC_MODEL,
  NANO_BANANA_IMAGE_MODEL,
  OPENAI_TEXT_MODEL,
  OPENROUTER_TEXT_FALLBACK_MODELS,
  OPENROUTER_TEXT_MODEL,
  QWEN_IMAGE_PRO_MODEL,
  SEEDREAM_IMAGE_PRO_MODEL,
} from '@/ai/config/models';

type Rate = { label: string; amount: number; unit: string };
export type ModelPrice = {
  provider: string;
  model: string;
  purpose: string;
  currency: 'USD' | 'CNY';
  rates: Rate[];
  source: string;
  checkedAt: string | null;
  note: string;
};

/** 缺失价格不能当作免费；拒绝负数、空串及非有限值。 */
export function parsePrice(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function tokenRates(pricing: Record<string, unknown>): Rate[] {
  return [
    ['prompt', 'Input'],
    ['completion', 'Output'],
    ['input_cache_read', 'Cache read'],
    ['input_cache_write', 'Cache write'],
  ].flatMap(([key, label]) => {
    const price = parsePrice(pricing[key]);
    return price === null ? [] : [{ label, amount: price * 1_000_000, unit: '1M tokens' }];
  });
}

/** 保留供应商和分辨率档位，不能把图像 token 价格误算成每张价格。 */
export function imageRates(payload: unknown): Rate[] {
  const data = payload as {
    endpoints?: Array<{ provider_name?: string; pricing?: Array<Record<string, unknown>> }>;
  } | null;
  if (!Array.isArray(data?.endpoints)) return [];
  return data.endpoints.flatMap((endpoint) =>
    (Array.isArray(endpoint.pricing) ? endpoint.pricing : []).flatMap((rate) => {
      const price = parsePrice(rate.cost_usd);
      if (price === null || !['image', 'token', 'megapixel'].includes(String(rate.unit))) return [];
      const billable = String(rate.billable || 'Unknown').replaceAll('_', ' ');
      return [
        {
          label: `${endpoint.provider_name || 'Provider'} · ${billable}${rate.variant ? ` · ${rate.variant}` : ''}`,
          amount: price * (rate.unit === 'token' ? 1_000_000 : 1),
          unit: rate.unit === 'token' ? '1M image tokens' : String(rate.unit),
        },
      ];
    })
  );
}

async function readCatalog(url: string) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error('Pricing catalog unavailable');
  return { data: await response.json(), checkedAt: new Date().toISOString() };
}

/** 只读公开报价，不发起生成请求，也不把目录报价伪装成账户扣款。 */
export async function getModelPrices(observed: Array<{ provider: string; model: string }> = []): Promise<ModelPrice[]> {
  const images = [QWEN_IMAGE_PRO_MODEL, NANO_BANANA_IMAGE_MODEL, SEEDREAM_IMAGE_PRO_MODEL];
  const results = await Promise.allSettled([
    readCatalog('https://openrouter.ai/api/v1/models'),
    ...images.map((model) => readCatalog(`https://openrouter.ai/api/v1/images/models/${model}/endpoints`)),
  ]);
  const catalog = results[0].status === 'fulfilled' ? results[0].value : null;
  const configured = [
    { provider: 'openrouter', model: OPENROUTER_TEXT_MODEL, purpose: 'Text · primary' },
    ...OPENROUTER_TEXT_FALLBACK_MODELS.map((model, i) => ({
      provider: 'openrouter',
      model,
      purpose: `Text · fallback ${i + 1}`,
    })),
    ...images.map((model, i) => ({
      provider: 'openrouter',
      model,
      purpose: i === 0 ? 'Cover · primary' : `Cover · fallback ${i}`,
    })),
    { provider: 'replicate', model: IMAGE_FALLBACK_MODEL, purpose: 'Cover · final fallback' },
    { provider: 'minimax', model: MINIMAX_MUSIC_MODEL, purpose: 'Music · direct' },
    { provider: 'openai', model: OPENAI_TEXT_MODEL, purpose: 'Text · direct backup' },
  ];
  for (const item of observed) {
    if (!configured.some((row) => row.provider === item.provider && row.model === item.model))
      configured.push({ ...item, purpose: 'Observed in last 24h' });
  }
  return configured.map((row): ModelPrice => {
    const base: ModelPrice = {
      ...row,
      currency: 'USD',
      rates: [],
      source: '',
      checkedAt: null,
      note: 'No verified price available.',
    };
    if (row.provider === 'openrouter') {
      base.source = row.model.includes('/') ? `https://openrouter.ai/${row.model}` : 'https://openrouter.ai/models';
      if (row.model === '未记录模型') base.model = 'Unrecorded model';
      const model = Array.isArray(catalog?.data?.data)
        ? catalog.data.data.find((item: { id: string }) => item.id === row.model)
        : null;
      base.rates = tokenRates(model?.pricing || {});
      base.checkedAt = catalog?.checkedAt || null;
      const imageIndex = images.indexOf(row.model);
      if (imageIndex >= 0) {
        const result = results[imageIndex + 1];
        if (result.status === 'fulfilled') {
          base.rates.push(...imageRates(result.value.data));
          base.checkedAt = result.value.checkedAt;
        }
      }
      base.note = base.rates.length
        ? 'Live catalog rates. Routing, resolution and usage can change the final charge.'
        : 'Price unavailable; catalog request failed or model not listed.';
    } else if (row.provider === 'minimax' && row.model === MINIMAX_MUSIC_MODEL) {
      base.currency = 'CNY';
      base.rates = [{ label: 'Historical list price', amount: 0.25, unit: 'song' }];
      base.source = 'https://platform.minimaxi.com/docs/guides/pricing-paygo';
      base.checkedAt = '2026-09-10T00:00:00.000Z';
      base.note =
        'Official page marks Music 2.0 as retired. Legacy paid accounts may retain access; confirm account billing.';
    } else if (row.provider === 'replicate' && row.model === IMAGE_FALLBACK_MODEL) {
      base.rates = [{ label: 'Published reference price', amount: 0.003, unit: 'image' }];
      base.source = 'https://replicate.com/blog/flux-state-of-the-art-image-generation';
      base.checkedAt = '2026-09-10T00:00:00.000Z';
      base.note = 'Manually verified published reference. Check current account pricing before budgeting.';
    } else if (row.provider === 'openai') {
      base.source = 'https://openai.com/api/pricing/';
    }
    return base;
  });
}
