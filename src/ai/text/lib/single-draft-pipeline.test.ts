import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 防止后续重构意外重新启用双稿与无条件整合；不替代真实模型质量验证。
const source = readFileSync('src/ai/text/lib/generation.ts', 'utf8');
describe('单稿管线结构约束', () => {
  it('坏审校稿在检查点保存前拦截，旧坏定稿不用于恢复', () => {
    expect(source).toContain('safeParse(usableEditorial)');
    expect(source).toContain('inspectSongLyrics(response.object.lyrics)');
    expect(source.indexOf('if (!finalIntegrity.passed)')).toBeLessThan(source.indexOf("await onCheckpoint?.('editing_lyrics'", source.indexOf('if (!finalIntegrity.passed)')));
  });
  it('只保留单稿写作和一次审校定稿入口', () => {
    expect(source).toContain("scope: 'lyrics-single-draft'");
    expect(source).toContain("scope: 'lyrics-finalize'");
    expect(source).not.toContain("scope: 'lyrics-single-audit'");
    expect(source).not.toContain('lyrics-quality-edit-');
    expect(source).not.toContain("scope: 'lyrics-editorial-pass'");
    expect(source).not.toContain('writeDraft(');
  });
  it('审校直接返回完整定稿，无问题保留原稿', () => {
    expect(source).toContain('If the song is already strong, preserve it unchanged');
    expect(source).toContain('Report the factAudit of the RETURNED final lyrics');
    expect(source).toContain('Preserve every unaffected line verbatim');
  });
  it('保存完整定稿，通过版本区分旧版检查结果', () => {
    expect(source).toContain("onCheckpoint?.('drafting_lyrics', { draft,");
    expect(source).toContain('finalizationVersion: z.literal(1)');
    expect(source).toContain('lyrics: finalLyrics,');
    expect(source).toContain('finalizationVersion: 1,');
    expect(source).toContain('legacyCheckpoint.success');
  });
  it('不收紧歌词长度来规避输出上限', () => {
    expect(source).toMatch(/maxOutputTokens: 6_?000/);
    expect(source).toContain('SHORT_FORM_LYRIC_LIMITS.minSungLines');
    expect(source).toContain('never reduce the song to a hook plus two fragments');
  });
});
