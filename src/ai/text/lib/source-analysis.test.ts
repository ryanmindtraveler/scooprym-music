import { beforeEach, describe, expect, it, vi } from 'vitest';

const extractorMocks = vi.hoisted(() => ({
  assertReaderSafeHttpUrl: vi.fn(),
  extractUrlContent: vi.fn(),
}));

vi.mock('./url-content-extractor', () => extractorMocks);

import { prepareSourceMaterial } from './source-analysis';

describe('prepareSourceMaterial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    extractorMocks.assertReaderSafeHttpUrl.mockImplementation(async (url: string) => {
      const parsed = new URL(url);
      parsed.hash = '';
      return parsed.toString();
    });
  });

  it('返回用于生成的同一份规范化来源快照', async () => {
    extractorMocks.extractUrlContent.mockResolvedValue({
      success: true,
      urlType: 'generic',
      title: 'A verified headline',
      content: 'Verified article body with enough concrete reporting context for the downstream lyrics generator.',
    });

    const source = await prepareSourceMaterial({
      newsUrl: 'https://example.com/story#comments',
      prompt: 'Write it as a sharp diss track.',
    });

    expect(source).toMatchObject({
      url: 'https://example.com/story',
      title: 'A verified headline',
      text: 'Verified article body with enough concrete reporting context for the downstream lyrics generator.',
    });
    expect(source.fetchedAt).toEqual(expect.any(String));
  });

  it('抓取失败时直接拒绝，不退化为仅凭 URL 或用户提示猜测', async () => {
    extractorMocks.extractUrlContent.mockResolvedValue({
      success: false,
      urlType: 'generic',
      error: 'Reader could not extract the page',
    });

    await expect(
      prepareSourceMaterial({
        newsUrl: 'https://example.com/unreadable',
        prompt: 'Invent a funny angle.',
      })
    ).rejects.toMatchObject({ statusCode: 422, message: 'Reader could not extract the page' });
  });

  it('纯文本输入保留为来源正文且不调用抓取器', async () => {
    await expect(prepareSourceMaterial({ prompt: 'A complete story supplied by the administrator.' })).resolves.toEqual(
      {
        text: 'A complete story supplied by the administrator.',
      }
    );
    expect(extractorMocks.extractUrlContent).not.toHaveBeenCalled();
  });
});
