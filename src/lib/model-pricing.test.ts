import { afterEach, describe, expect, it, vi } from 'vitest';
import { getModelPrices, imageRates, parsePrice, tokenRates } from './model-pricing';

afterEach(() => vi.unstubAllGlobals());

describe('模型官方报价', () => {
  it('区分免费、缺失和无效价格', () => {
    expect(parsePrice('0')).toBe(0);
    for (const value of [null, undefined, '', ' ', -1, 'NaN', Number.POSITIVE_INFINITY, false])
      expect(parsePrice(value)).toBeNull();
    expect(tokenRates({ prompt: '0.00000007', completion: '0' })).toEqual([
      { label: 'Input', amount: 0.07, unit: '1M tokens' },
      { label: 'Output', amount: 0, unit: '1M tokens' },
    ]);
  });
  it('区分输出图像 token、输入图片和分辨率报价', () => {
    const rates = imageRates({
      endpoints: [
        {
          provider_name: 'Google',
          pricing: [
            { billable: 'output_image', unit: 'token', cost_usd: 0.00006 },
            { billable: 'input_image', unit: 'image', cost_usd: 0.003 },
            { billable: 'output_image', unit: 'image', cost_usd: 0.04, variant: '1k' },
          ],
        },
      ],
    });
    expect(rates[0]).toMatchObject({ amount: 60, unit: '1M image tokens' });
    expect(rates[1]).toMatchObject({ amount: 0.003, unit: 'image' });
    expect(rates[2].label).toContain('1k');
  });
  it('目录故障不阻塞其他价格，也不把直连供应商套成 OpenRouter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const rows = await getModelPrices([{ provider: 'other', model: 'unknown' }]);
    expect(rows.find((row) => row.provider === 'openrouter')?.rates).toEqual([]);
    expect(rows.find((row) => row.provider === 'replicate')?.rates[0].amount).toBe(0.003);
    expect(rows.find((row) => row.provider === 'minimax')?.currency).toBe('CNY');
    expect(rows.find((row) => row.provider === 'other')?.rates).toEqual([]);
  });
});
