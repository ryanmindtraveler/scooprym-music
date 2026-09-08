import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  replicateRun: vi.fn(),
}));

vi.mock('replicate', () => ({
  default: class ReplicateMock {
    run = mocks.replicateRun;
  },
}));

import { buildCoverPrompt, generateCoverImageDataUrl } from './cover-generation';

describe('cover generation', () => {
  it('总预算耗尽后停止后备模型，避免继续发起付费请求', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    vi.stubEnv('REPLICATE_API_TOKEN', 'configured');
    const controller = new AbortController();
    mocks.fetch.mockImplementationOnce(async () => {
      controller.abort(new Error('Cover budget exhausted'));
      throw controller.signal.reason;
    });
    await expect(generateCoverImageDataUrl({ title: 'Test', signal: controller.signal })).rejects.toThrow(
      'Cover budget exhausted'
    );
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.replicateRun).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubGlobal('fetch', mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('生成适合娱乐新闻歌曲且禁止画面文字的封面提示词', () => {
    const prompt = buildCoverPrompt({
      title: 'A Very Loud Headline',
      sourceText: 'A celebrity story is taking over the internet.',
      artPrompt: 'Electric pink editorial portrait',
    });

    expect(prompt).toContain('ScoopRYM Gallery house style');
    expect(prompt).toContain('full-bleed editorial pop-art');
    expect(prompt).toContain('dynamic narrative scene');
    expect(prompt).toContain('Avoid plain or single-color backgrounds');
    expect(prompt).toContain('Reported story cue');
    expect(prompt).toContain('Electric pink editorial portrait');
    expect(prompt).toContain('no text');
  });

  it('优先使用 Qwen Image 3 Pro', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ data: [{ media_type: 'image/png', b64_json: 'pro-cover' }] }), { status: 200 })
    );

    await expect(generateCoverImageDataUrl({ title: 'Test Song' })).resolves.toBe('data:image/png;base64,pro-cover');
    const request = JSON.parse(mocks.fetch.mock.calls[0][1].body as string);
    expect(request).toMatchObject({
      model: 'qwen/qwen-image-3-pro',
      resolution: '1K',
      aspect_ratio: '1:1',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.replicateRun).not.toHaveBeenCalled();
  });

  it('Qwen 失败后降级到 Nano Banana 2', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    mocks.fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Qwen unavailable' } }), { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ media_type: 'image/png', b64_json: 'standard-cover' }] }), {
          status: 200,
        })
      );

    await expect(generateCoverImageDataUrl({ title: 'Test Song' })).resolves.toBe(
      'data:image/png;base64,standard-cover'
    );
    const firstRequest = JSON.parse(mocks.fetch.mock.calls[0][1].body as string);
    const secondRequest = JSON.parse(mocks.fetch.mock.calls[1][1].body as string);
    expect(firstRequest.model).toBe('qwen/qwen-image-3-pro');
    expect(secondRequest).toMatchObject({
      model: 'google/gemini-3.1-flash-image',
      resolution: '1K',
      aspect_ratio: '1:1',
    });
    expect(mocks.replicateRun).not.toHaveBeenCalled();
  });

  it('Qwen 与 Gemini 失败后降级到 Seedream 5.0 Pro', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    mocks.fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Qwen unavailable' } }), { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Gemini unavailable' } }), { status: 503 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ media_type: 'image/png', b64_json: 'seedream-cover' }] }), {
          status: 200,
        })
      );

    await expect(generateCoverImageDataUrl({ title: 'Test Song' })).resolves.toBe(
      'data:image/png;base64,seedream-cover'
    );
    const thirdRequest = JSON.parse(mocks.fetch.mock.calls[2][1].body as string);
    expect(thirdRequest).toMatchObject({
      model: 'bytedance-seed/seedream-5-0-pro',
      resolution: '1K',
      aspect_ratio: '1:1',
    });
    expect(mocks.replicateRun).not.toHaveBeenCalled();
  });

  it('三个 OpenRouter 模型均失败后使用 FLUX Schnell', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'configured');
    vi.stubEnv('REPLICATE_API_TOKEN', 'configured');
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'OpenRouter unavailable' } }), { status: 503 })
    );
    mocks.replicateRun.mockResolvedValue(['https://cdn.example.com/cover.webp']);

    await expect(generateCoverImageDataUrl({ title: 'Test Song' })).resolves.toBe('https://cdn.example.com/cover.webp');
    expect(mocks.replicateRun).toHaveBeenCalledWith('black-forest-labs/flux-schnell', expect.any(Object));
  });
});
