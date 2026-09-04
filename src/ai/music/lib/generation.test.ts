import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateMusic, resolveMusicGenerationProvider } from './generation';

describe('MiniMax 官方音乐生成渠道', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('只有配置官方密钥并选择 minimax 时才启用音乐生成', () => {
    expect(
      resolveMusicGenerationProvider(undefined, {
        MUSIC_GENERATION_PROVIDER: 'minimax',
        MINIMAX_API_KEY: 'official-key',
        MUREKA_API_KEY: 'unused-key',
        REPLICATE_API_TOKEN: 'unused-token',
      })
    ).toBe('minimax');

    expect(
      resolveMusicGenerationProvider(undefined, {
        MUSIC_GENERATION_PROVIDER: 'mureka',
        MINIMAX_API_KEY: 'official-key',
      })
    ).toBeNull();
  });

  it('缺少官方密钥时明确失败且不会调用第三方渠道', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateMusic(
      { prompt: 'meme rap', lyrics: '[Hook]\nSay it again' },
      { MUSIC_GENERATION_PROVIDER: 'minimax' }
    );

    expect(result).toMatchObject({ success: false, statusCode: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('固定调用官方端点和统一配置的音乐模型，并保留项目创作的歌词', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { audio: 'https://cdn.example.com/minimax-song.mp3', status: 2 },
          base_resp: { status_code: 0, status_msg: 'success' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateMusic(
      {
        prompt: 'satirical hip-hop, hook first, abrupt ending',
        lyrics: '[Hook]\nInternet chaos all night',
        outputFormat: 'url',
        audioFormat: 'mp3',
      },
      {
        MUSIC_GENERATION_PROVIDER: 'minimax',
        MINIMAX_API_KEY: 'official-key',
      }
    );

    const [url, request] = fetchMock.mock.calls[0] || [];
    const requestBody = JSON.parse(String(request?.body));

    expect(url).toBe('https://api.minimax.io/v1/music_generation');
    expect(requestBody).toMatchObject({
      model: 'music-2.0',
      lyrics: '[Hook]\nInternet chaos all night',
      lyrics_optimizer: false,
      is_instrumental: false,
      output_format: 'url',
    });
    expect(result).toMatchObject({
      success: true,
      audioContent: 'https://cdn.example.com/minimax-song.mp3',
      outputFormat: 'url',
    });
  });
});
