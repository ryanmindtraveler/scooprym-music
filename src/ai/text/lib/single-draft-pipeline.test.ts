import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 防止后续重构意外重新启用双稿与无条件整合；不替代真实模型质量验证。
const source = readFileSync('src/ai/text/lib/generation.ts', 'utf8');
const promptSource = readFileSync('src/ai/text/lib/lyrics-craft-prompts.ts', 'utf8');
describe('单稿管线结构约束', () => {
  it('坏审校稿在检查点保存前拦截，旧坏定稿不用于恢复', () => {
    expect(source).toContain('safeParse(usableEditorial)');
    expect(source).toContain('inspectSongLyrics(finalObject.lyrics)');
    expect(source.indexOf('if (!finalIntegrity.passed)')).toBeLessThan(
      source.indexOf("await onCheckpoint?.('editing_lyrics'", source.indexOf('if (!finalIntegrity.passed)'))
    );
  });
  it('单稿后独立检查并只修改一次', () => {
    expect(source).toContain("scope: 'lyrics-single-draft'");
    expect(source).toContain("scope: 'lyrics-finalize'");
    expect(source).toContain("scope: 'lyrics-critique'");
    expect(source).not.toContain("scope: 'lyrics-single-audit'");
    expect(source).not.toContain('lyrics-quality-edit-');
    expect(source).not.toContain("scope: 'lyrics-editorial-pass'");
    expect(source).not.toContain('writeDraft(');
  });
  it('审校直接返回完整定稿，无问题保留原稿', () => {
    expect(promptSource).toContain('If the song is already strong, preserve it unchanged');
    expect(source).toContain('Report the factAudit of the RETURNED final lyrics');
    expect(promptSource).toContain('Preserve every strong unaffected line verbatim');
  });
  it('保存完整定稿，通过版本区分旧版检查结果', () => {
    expect(source).toMatch(/onCheckpoint\?\.\('drafting_lyrics',\s*\{\s*draft,/);
    expect(source).toContain('finalizationVersion: z.literal(10)');
    expect(source).toContain('lyrics: finalLyrics,');
    expect(source).toContain('finalizationVersion: 10,');
    expect(source).not.toContain('legacyCheckpoint');
    expect(source).not.toContain('draftB');
    expect(source).not.toContain('hybrid');
  });
  it('不收紧歌词长度来规避输出上限', () => {
    expect(source).toMatch(/maxOutputTokens: 6_?000/);
    expect(source).toContain('SHORT_FORM_LYRIC_LIMITS.minSungLines');
    expect(source).toContain('never reduce the song to a hook plus two fragments');
  });
});
