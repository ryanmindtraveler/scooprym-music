import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  generateMusic: vi.fn(),
  generateCoverWithRetry: vi.fn(),
  dataUrlToImageBuffer: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getWorkflowRunBySongId: vi.fn(),
  startWorkflowStage: vi.fn(),
  completeWorkflowStage: vi.fn(),
  failWorkflowStep: vi.fn(),
  findAudioCheckpoint: vi.fn(),
}));

vi.mock('@/lib/creation/audio-checkpoint', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./audio-checkpoint')>()),
  findAudioCheckpoint: mocks.findAudioCheckpoint,
}));
vi.mock('node:dns/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:dns/promises')>();
  const lookup = vi.fn(async () => [{ address: '8.8.8.8', family: 4 }]);
  return { ...actual, lookup, default: { ...actual, lookup } };
});

afterEach(() => vi.unstubAllGlobals());

vi.mock('@/db/index', () => ({ getDb: mocks.getDb }));
vi.mock('@/ai/music/lib/generation', () => ({ generateMusic: mocks.generateMusic }));
vi.mock('@/ai/image/lib/cover-generation', () => ({
  generateCoverWithRetry: mocks.generateCoverWithRetry,
  dataUrlToImageBuffer: mocks.dataUrlToImageBuffer,
}));
vi.mock('@/storage', () => ({
  uploadFile: mocks.uploadFile,
  deleteFile: mocks.deleteFile,
}));
vi.mock('@/lib/creation/song-creation-workflow', () => ({
  getWorkflowRunBySongId: mocks.getWorkflowRunBySongId,
  startWorkflowStage: mocks.startWorkflowStage,
  completeWorkflowStage: mocks.completeWorkflowStage,
  failWorkflowStep: mocks.failWorkflowStep,
}));

import {
  MAX_GENERATED_AUDIO_BYTES,
  cleanLyricsForGeneration,
  createMusicRequestFingerprint,
  decodeGeneratedAudioHex,
  downloadGeneratedAudio,
  getAudioFileDescriptor,
  musicGenerationRequestSchema,
  prepareMiniMaxLyricsForGeneration,
  processMusicJob,
} from './song-workflow';

const songId = '11111111-1111-4111-8111-111111111111';

function validShortMp3Hex() {
  const frame = Buffer.alloc(417);
  frame.set([0xff, 0xfb, 0x90, 0x00], 0);
  return Buffer.concat(Array.from({ length: 40 }, () => frame)).toString('hex');
}

describe('musicGenerationRequestSchema', () => {
  it('仅接受严格且可幂等的管理员生成参数', () => {
    const valid = musicGenerationRequestSchema.safeParse({
      songId,
      lyrics: '[Verse]\nThis is a sufficiently long lyric',
      prompt: 'fast comedy rap',
      productionVariantId: 'flashbulb_rnb',
      sourceUrl: 'https://example.com/story',
      outputFormat: 'hex',
      audioFormat: 'pcm',
      useStream: false,
    });
    expect(valid.success).toBe(true);

    expect(
      musicGenerationRequestSchema.safeParse({
        songId,
        lyrics: 'long enough lyrics',
        prompt: 'rap',
        sourceUrl: 'file:///etc/passwd',
      }).success
    ).toBe(false);
    expect(
      musicGenerationRequestSchema.safeParse({
        songId,
        lyrics: 'long enough lyrics',
        prompt: 'rap',
        injectedWorkerOptions: { userId: 'attacker' },
      }).success
    ).toBe(false);
  });

  it('为同一语义请求生成稳定指纹', () => {
    const first = musicGenerationRequestSchema.parse({
      songId,
      lyrics: 'These lyrics are definitely long enough',
      prompt: 'comedy rap',
      sourceSummary: 'A strange headline',
    });
    const second = musicGenerationRequestSchema.parse({
      songId,
      lyrics: 'These lyrics are definitely long enough',
      prompt: 'comedy rap',
      newsSummary: 'A strange headline',
    });
    expect(createMusicRequestFingerprint(first)).toBe(createMusicRequestFingerprint(second));
  });

  it('把管理员锁定的制作变体纳入幂等指纹', () => {
    const base = {
      songId,
      lyrics: 'These lyrics are definitely long enough',
      prompt: 'celebrity gossip R&B',
    };
    const first = musicGenerationRequestSchema.parse({
      ...base,
      productionVariantId: 'flashbulb_rnb',
    });
    const second = musicGenerationRequestSchema.parse({
      ...base,
      productionVariantId: 'afterparty_garage',
    });

    expect(createMusicRequestFingerprint(first)).not.toBe(createMusicRequestFingerprint(second));
  });

  it('清理段落制作说明，但保留可演唱的呼应与 ad-lib', () => {
    expect(cleanLyricsForGeneration('[Chorus — bigger drums]<br>Hold that line (hold that line)')).toBe(
      '[Chorus]\nHold that line (hold that line)'
    );
  });

  it('提交供应商前拆开普通短横线说明和粘连正文', () => {
    expect(cleanLyricsForGeneration('[Verse 1 - Miley, gossip tone]Superfan on my mic')).toBe(
      '[Verse 1]\nSuperfan on my mic'
    );
  });

  it('调用 MiniMax 官方音乐模型前只清理格式，不截断或删除歌词段落', () => {
    const prepared = prepareMiniMaxLyricsForGeneration(`[Hook — cold open]
Best fake shock I ever saw<br>You know damn well where I live
[Verse 1]
Made her money and moved next door
Acted surprised at my address
Five years back you sat on my floor
[Bridge]
(pizzicato stabs, vocal chops)
Cut the lights and let the group chat roar
[Hook]
Best fake shock I ever saw
You know damn well where I live
[Outro]
Repeat it forever and fade away`);
    const sungLines = prepared.split('\n').filter((line) => line && !/^\[[^\]]+\]$/.test(line));
    expect(prepared.match(/^\[Hook\]$/gm)).toHaveLength(2);
    expect(prepared).not.toContain('<br>');
    expect(prepared).toContain('pizzicato stabs, vocal chops');
    expect(prepared).toContain('[Bridge]');
    expect(prepared).toContain('[Outro]');
    expect(prepared).toContain('Repeat it forever and fade away');
    expect(sungLines).toHaveLength(10);
  });
});

describe('generated audio validation', () => {
  it('正确保留 PCM 扩展名与 MIME', () => {
    expect(getAudioFileDescriptor('pcm')).toEqual({ extension: 'pcm', mimeType: 'audio/L16' });
  });

  it('拒绝畸形 hex，并校验音频头', () => {
    expect(decodeGeneratedAudioHex('494433', 'mp3').toString('ascii')).toBe('ID3');
    expect(() => decodeGeneratedAudioHex('abc', 'pcm')).toThrow(/invalid hexadecimal/i);
    expect(() => decodeGeneratedAudioHex('zz', 'pcm')).toThrow(/invalid hexadecimal/i);
    expect(() => decodeGeneratedAudioHex('00112233', 'wav')).toThrow(/invalid header/i);
  });

  it('校验 URL、响应类型及声明大小', async () => {
    await expect(downloadGeneratedAudio('data:audio/mpeg;base64,SUQz', 'mp3')).rejects.toThrow(/HTTP\(S\)/);

    await expect(downloadGeneratedAudio('http://127.0.0.1/song.mp3', 'mp3')).rejects.toThrow(/public IP/i);

    const oversizedFetch = vi.fn(
      async () =>
        new Response(new Uint8Array([0x49, 0x44, 0x33]), {
          headers: {
            'content-type': 'audio/mpeg',
            'content-length': String(MAX_GENERATED_AUDIO_BYTES + 1),
          },
        })
    ) as unknown as typeof fetch;
    const publicLookup = vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]);
    await expect(
      downloadGeneratedAudio('https://cdn.example.com/song.mp3', 'mp3', oversizedFetch, publicLookup)
    ).rejects.toThrow(/maximum allowed size/i);
  });

  it('逐跳校验重定向目标，拒绝跳转到私网', async () => {
    const redirectFetch = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'http://169.254.169.254/latest/meta-data' },
        })
    ) as unknown as typeof fetch;
    const publicLookup = vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]);

    await expect(
      downloadGeneratedAudio('https://cdn.example.com/song.mp3', 'mp3', redirectFetch, publicLookup)
    ).rejects.toThrow(/public IP/i);
    expect(redirectFetch).toHaveBeenCalledTimes(1);
  });

  it('仅在非生产环境兼容域名被本地代理完整解析为 Fake-IP', async () => {
    const audioFetch = vi.fn(
      async () =>
        new Response(new Uint8Array([0x49, 0x44, 0x33]), {
          headers: { 'content-type': 'audio/mpeg' },
        })
    ) as unknown as typeof fetch;
    const fakeIpLookup = vi.fn(async () => [{ address: '198.18.1.186', family: 4 }]);

    vi.stubEnv('NODE_ENV', 'development');
    await expect(
      downloadGeneratedAudio('https://audio.example.com/song.mp3', 'mp3', audioFetch, fakeIpLookup)
    ).resolves.toEqual(Buffer.from([0x49, 0x44, 0x33]));

    vi.stubEnv('NODE_ENV', 'production');
    await expect(
      downloadGeneratedAudio('https://audio.example.com/song.mp3', 'mp3', audioFetch, fakeIpLookup)
    ).rejects.toThrow(/public IP/i);
    vi.unstubAllEnvs();
  });

  it('即使在开发环境也拒绝 Fake-IP 字面量和混合私网解析', async () => {
    const audioFetch = vi.fn(
      async () =>
        new Response(new Uint8Array([0x49, 0x44, 0x33]), {
          headers: { 'content-type': 'audio/mpeg' },
        })
    ) as unknown as typeof fetch;

    vi.stubEnv('NODE_ENV', 'development');
    await expect(downloadGeneratedAudio('http://198.18.1.186/song.mp3', 'mp3', audioFetch)).rejects.toThrow(
      /public IP/i
    );
    await expect(
      downloadGeneratedAudio('https://audio.example.com/song.mp3', 'mp3', audioFetch, async () => [
        { address: '198.18.1.186', family: 4 },
        { address: '192.168.1.8', family: 4 },
      ])
    ).rejects.toThrow(/public IP/i);
    vi.unstubAllEnvs();
  });
});

describe('音频下载重试', () => {
  it('连接断开后仅重新下载同一地址', async () => {
    const download = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(
        new Response(new Uint8Array([0x49, 0x44, 0x33]), { headers: { 'content-type': 'audio/mpeg' } })
      );
    const buffer = await downloadGeneratedAudio('https://audio.example.com/song.mp3', 'mp3', download, async () => [
      { address: '8.8.8.8', family: 4 },
    ]);
    expect(buffer.length).toBe(3);
    expect(download).toHaveBeenCalledTimes(2);
    expect(String(download.mock.calls[0][0])).toBe(String(download.mock.calls[1][0]));
  });
  it('地址已失效时停止，不自动重新生成', async () => {
    const download = vi.fn().mockResolvedValue(new Response('', { status: 403 }));
    await expect(
      downloadGeneratedAudio('https://audio.example.com/song.mp3', 'mp3', download, async () => [
        { address: '8.8.8.8', family: 4 },
      ])
    ).rejects.toThrow('403');
    expect(download).toHaveBeenCalledTimes(1);
  });
});

describe('processMusicJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getWorkflowRunBySongId.mockResolvedValue(undefined);
    mocks.findAudioCheckpoint.mockResolvedValue(null);
    mocks.failWorkflowStep.mockResolvedValue(undefined);
    process.env.MINIMAXI_API_KEY = 'test-api-key';
  });

  it('仅补封面模式绝不领取排队中的音乐生成任务', async () => {
    const chain: any = {
      from: vi.fn(() => chain),
      innerJoin: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
      limit: vi.fn(async () => [{ attemptId: songId, processingStatus: 'queued' }]),
    };
    const update = vi.fn();
    mocks.getDb.mockReturnValue({ select: vi.fn(() => chain), update });
    const result = await processMusicJob(songId, { coverOnly: true });
    expect(result.skipped).toBe(true);
    expect(update).not.toHaveBeenCalled();
    expect(mocks.generateMusic).not.toHaveBeenCalled();
    expect(mocks.generateCoverWithRetry).not.toHaveBeenCalled();
  });

  it.each([
    'fresh_hex',
    'resume_url',
    'fresh_url',
    'checkpoint_read_failure',
    'checkpoint_write_failure',
    'cover_generation_failure',
    'cover_upload_failure',
  ])('通过 CAS 与恢复点避免重复付费：%s', async (mode) => {
    if (mode !== 'fresh_hex') {
      mocks.getWorkflowRunBySongId.mockResolvedValue({ id: 'run-1' });
      mocks.startWorkflowStage.mockResolvedValue('step-1');
      if (mode === 'resume_url') mocks.findAudioCheckpoint.mockResolvedValue('https://audio.example.com/song.mp3');
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(Buffer.from(validShortMp3Hex(), 'hex'), { headers: { 'content-type': 'audio/mpeg' } })
        )
      );
    }
    const trustedJob = {
      attemptId: songId,
      id: songId,
      userId: 'admin-user',
      title: 'A strange headline',
      lyrics: cleanLyricsForGeneration(
        '[Verse 1]\nLine one lands\nLine two lands\nLine three lands\nLine four lands\n[Hook]\nLine five lands\nLine six lands\nLine seven lands\nLine eight lands'
      ),
      prompt: 'comedy rap',
      generationPrompt: 'fast comedy rap production',
      coverArtPrompt: null,
      sourceText: 'Publicly reported story',
      newsSummary: 'A short summary',
      sourceUrl: 'https://example.com/story',
      outputFormat: 'hex',
      audioFormat: 'mp3',
      generationBillingMode: 'internal_admin',
    };
    const selectResults = [
      [{ attemptId: songId }],
      [
        {
          id: trustedJob.id,
          userId: trustedJob.userId,
          title: trustedJob.title,
          lyrics: trustedJob.lyrics,
          audioUrl: '',
          audioKey: null,
          coverImageUrl: null,
          coverImageKey: null,
          sourceText: trustedJob.sourceText,
          newsSummary: trustedJob.newsSummary,
          sourceUrl: trustedJob.sourceUrl,
          durationSec: null,
        },
      ],
      [
        {
          attemptId: songId,
          title: trustedJob.title,
          lyrics: trustedJob.lyrics,
          audioUrl: 'https://cdn.example.com/song.mp3',
          audioKey: 'songs/admin/song.mp3',
          coverImageUrl: 'https://cdn.example.com/cover.png',
          coverImageKey: 'song-covers/admin/cover.png',
          durationSec: null,
          sourceUrl: trustedJob.sourceUrl,
          sourceText: trustedJob.sourceText,
          sourceSummary: trustedJob.newsSummary,
        },
      ],
      [{ attemptId: songId, processingStatus: 'completed' }],
      [{ processingStatus: 'completed' }],
    ];
    let selectNumber = 0;
    let updateNumber = 0;
    const db: any = {
      update: vi.fn(() => {
        updateNumber += 1;
        const currentUpdate = updateNumber;
        return {
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn(async () => {
                if (currentUpdate === 1) {
                  return [
                    {
                      attemptId: trustedJob.attemptId,
                      prompt: trustedJob.prompt,
                      generationPrompt: trustedJob.generationPrompt,
                      coverArtPrompt: trustedJob.coverArtPrompt,
                      outputFormat: trustedJob.outputFormat,
                      audioFormat: trustedJob.audioFormat,
                      generationBillingMode: trustedJob.generationBillingMode,
                    },
                  ];
                }
                if (currentUpdate === 5) return [{ id: songId }];
                if (currentUpdate === 6) return [{ id: songId }];
                if (currentUpdate === 7) return [];
                return [];
              }),
            })),
          })),
        };
      }),
      select: vi.fn(() => {
        const result = selectResults[selectNumber++] || [];
        const chain: any = {
          from: vi.fn(() => chain),
          innerJoin: vi.fn(() => chain),
          where: vi.fn(() => chain),
          orderBy: vi.fn(() => chain),
          limit: vi.fn(async () => result),
        };
        return chain;
      }),
    };
    db.transaction = vi.fn(async (callback: (tx: typeof db) => unknown) => callback(db));
    mocks.getDb.mockReturnValue(db);
    mocks.generateMusic.mockResolvedValue(
      mode === 'fresh_url'
        ? { success: true, audioContent: 'https://audio.example.com/song.mp3', outputFormat: 'url' }
        : { success: true, audioContent: validShortMp3Hex() }
    );
    mocks.generateCoverWithRetry.mockResolvedValue('data:image/png;base64,cover');
    const coverBuffer = Buffer.alloc(24);
    coverBuffer.write('IHDR', 12, 'ascii');
    coverBuffer.writeUInt32BE(1024, 16);
    coverBuffer.writeUInt32BE(1024, 20);
    mocks.dataUrlToImageBuffer.mockResolvedValue({ buffer: coverBuffer, mime: 'image/png', extension: 'png' });
    mocks.uploadFile
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/song.mp3', key: 'songs/admin/song.mp3' })
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/cover.png', key: 'song-covers/admin/cover.png' });

    if (mode === 'checkpoint_read_failure')
      mocks.findAudioCheckpoint.mockRejectedValueOnce(new Error('DB unavailable'));
    if (mode === 'checkpoint_write_failure')
      mocks.completeWorkflowStage.mockRejectedValueOnce(new Error('DB unavailable'));
    if (mode === 'cover_generation_failure')
      mocks.generateCoverWithRetry.mockRejectedValueOnce(new Error('Image provider unavailable'));
    if (mode === 'cover_upload_failure') {
      mocks.uploadFile.mockReset();
      mocks.uploadFile
        .mockResolvedValueOnce({ url: 'https://cdn.example.com/song.mp3', key: 'songs/admin/song.mp3' })
        .mockRejectedValueOnce(new Error('fetch failed'));
    }
    const first = await processMusicJob(songId);
    if (mode.startsWith('cover_')) {
      expect(first).toMatchObject({ success: false, processingStatus: 'failed_cover' });
      expect(first.error).toContain('Audio is saved. Cover');
      expect(mocks.failWorkflowStep).toHaveBeenCalledWith('run-1', 'step-1', expect.any(Error));
      expect(mocks.completeWorkflowStage).not.toHaveBeenCalledWith(
        'run-1',
        'step-1',
        'generating_cover',
        expect.anything()
      );
      expect(mocks.startWorkflowStage).not.toHaveBeenCalledWith('run-1', 'finalizing', expect.anything());
      expect(mocks.generateMusic).toHaveBeenCalledOnce();
      return;
    }
    if (mode.startsWith('checkpoint_')) {
      expect(first).toMatchObject({ success: false, processingStatus: 'failed_audio_upload' });
      expect(mocks.generateMusic).toHaveBeenCalledTimes(mode === 'checkpoint_read_failure' ? 0 : 1);
      expect(mocks.uploadFile).not.toHaveBeenCalled();
      return;
    }
    const duplicate = await processMusicJob(songId);

    expect(first).toMatchObject({ success: true, processingStatus: 'completed' });
    expect(duplicate).toMatchObject({ success: true, skipped: true, processingStatus: 'completed' });
    expect(mocks.generateMusic).toHaveBeenCalledTimes(mode === 'resume_url' ? 0 : 1);
    if (mode !== 'resume_url')
      expect(mocks.generateMusic).toHaveBeenCalledWith(
        expect.objectContaining({
          lyrics: trustedJob.lyrics,
          prompt: trustedJob.generationPrompt,
        })
      );
    expect(mocks.uploadFile).toHaveBeenCalledTimes(2);
    if (mode === 'fresh_url')
      expect(mocks.completeWorkflowStage).toHaveBeenCalledWith(
        'run-1',
        'step-1',
        'generating_audio',
        expect.objectContaining({
          metadata: expect.objectContaining({
            generatedAudioUrl: 'https://audio.example.com/song.mp3',
            audioInputHash: expect.any(String),
          }),
        })
      );
    vi.unstubAllGlobals();
  });
});
