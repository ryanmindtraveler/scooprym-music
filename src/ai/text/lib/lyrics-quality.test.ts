import { describe, expect, it } from 'vitest';
import {
  SHORT_FORM_LYRIC_LIMITS,
  estimateLyricDurationSeconds,
  inspectLyricsQuality,
  normalizeGeneratedLyrics,
} from './lyrics-quality';

const GOOD_LYRICS = `[Hook]
Smile for the fallout, hold the flash
Truth wears sequins when headlines crash

[Verse 1]
Flashbulbs freeze the borrowed grin
Blue receipts glow under velvet rope
Everybody talks when silence costs gold
Camera shutters tap a nervous little snare
One clean screenshot leaves the alibi bare

[Chorus]
Smile for the fallout, hold the flash
Truth wears sequins when headlines crash
Everybody poses till the group chat talks

[Verse 2]
Velvet doors close but the rumor gets through
Deleted little captions leave a neon clue
Morning hits the lobby, whispers wearing shoes

[Hook]
Smile for the fallout, hold the flash
Truth wears sequins when headlines crash
Everybody poses till the group chat talks`;

describe('歌词质量工具', () => {
  it('基于演唱词数和停顿估算时长', () => {
    const estimate = estimateLyricDurationSeconds(GOOD_LYRICS);
    expect(estimate).toBeGreaterThan(35);
    expect(estimate).toBeLessThan(90);
  });

  it('锁定 ScoopRYM 历史短歌规格，防止供应商适配再次改坏歌词长度', () => {
    expect(SHORT_FORM_LYRIC_LIMITS).toEqual({
      minSungLines: 14,
      maxSungLines: 24,
      minWords: 90,
      maxWords: 140,
      targetDurationSeconds: '45-65',
      hardDurationLimitSeconds: 90,
    });
  });

  it('统一常见段落标签并移除 Markdown 围栏', () => {
    expect(normalizeGeneratedLyrics('```lyrics\n[verse-one]\n  A   clean line  \n[pre_chorus]\nLift it\n```')).toBe(
      '[Verse 1]\nA clean line\n\n[Pre Chorus]\nLift it'
    );
  });

  it('还原结构化模型二次转义的换行和行内段落标签', () => {
    expect(
      normalizeGeneratedLyrics(
        '[Intro]\\nSuperfan with a mortgage\\n[Verse 1] Neighbor at the door\\n[Chorus] Superfan with a mortgage'
      )
    ).toBe(
      '[Intro]\nSuperfan with a mortgage\n\n[Verse 1]\nNeighbor at the door\n\n[Chorus]\nSuperfan with a mortgage'
    );
  });

  it('清除 HTML 换行并折叠带制作说明的段落标签', () => {
    expect(normalizeGeneratedLyrics('[Hook — cold open, vocal chops]<br>Best fake shock<br>You know damn well')).toBe(
      '[Hook]\nBest fake shock\nYou know damn well'
    );
  });

  it('兼容模型使用普通短横线书写的段落制作说明', () => {
    expect(normalizeGeneratedLyrics('[Verse 1 - low gossip tone]Receipts hit the table')).toBe(
      '[Verse 1]\nReceipts hit the table'
    );
  });

  it('接受结构完整且适合短篇演唱的歌词', () => {
    expect(inspectLyricsQuality(GOOD_LYRICS)).toEqual([]);
  });

  it('不根据副歌标签误报，但仍识别过度稀疏的草稿', () => {
    const issues = inspectLyricsQuality('[Verse 1]\nOne line\n[Chorus]\nOnly once');
    expect(issues).not.toContain('The chorus or hook must return at least twice for replay value.');
    expect(issues.some((issue) => issue.includes('14-24 sung lines'))).toBe(true);
  });

  it('允许不含桥段的动态短结构，并检查锁定 hook 的提前出现与复现', () => {
    const adaptiveLyrics = `[Hook]
Screenshot season, keep group chat breathing
Blue light turns whispers into weather

[Verse 1]
One post becomes a midnight boom
Names go quiet, phones stay loud
Every delete leaves a bright outline
Elevator mirrors catch the practiced grin
Velvet ropes part and the screenshots walk in

[Chorus]
Screenshot season, keep group chat breathing
Blue light turns whispers into weather
Every quiet statement gets a caption by dawn

[Verse 2]
Receipts ride shotgun through the neon rain
One more denial starts the loop again
Nobody says the secret, everybody knows the name

[Hook]
Screenshot season, keep group chat breathing
Blue light turns whispers into weather
Every quiet statement gets a caption by dawn`;

    expect(
      inspectLyricsQuality(adaptiveLyrics, { lockedHook: 'Screenshot season', propagationAction: 'exact_repeat' })
    ).toEqual([]);
  });

  it('无显式传播机制时不强迫副歌或 Hook 重复', () => {
    const issues = inspectLyricsQuality('[Verse 1]\nThe open door keeps changing what the room means', {
      lockedHook: 'the open door',
      propagationAction: 'none',
    });

    expect(issues).not.toContain('The chorus or hook must return at least twice for replay value.');
    expect(issues).not.toContain('Repeat the locked hook phrase at least twice without paraphrasing it away.');
  });

  it('单句击穿要求 Punchline 只在结尾出现一次', () => {
    const validIssues = inspectLyricsQuality(
      '[Verse 1]\nSet the room and hold the secret\n[Outro]\nFive years on my couch',
      {
        lockedHook: 'Five years on my couch',
        propagationAction: 'one_shot',
      }
    );
    expect(validIssues).not.toContain(
      'Protect the delayed reveal or one-shot punchline for exactly one lyrical appearance.'
    );
    expect(validIssues).not.toContain(
      'Land the delayed reveal or one-shot punchline within the final four sung lines.'
    );

    const repeatedIssues = inspectLyricsQuality(
      '[Hook]\nFive years on my couch\n[Verse 1]\nThe room pretends it never knew\n[Outro]\nFive years on my couch',
      {
        lockedHook: 'Five years on my couch',
        propagationAction: 'one_shot',
      }
    );
    expect(repeatedIssues).toContain(
      'Protect the delayed reveal or one-shot punchline for exactly one lyrical appearance.'
    );
  });
});

describe('策略感知检查', () => {
  it.each(['callback', 'mutating_repeat', 'call_response', 'escalating_list'] as const)(
    '允许 %s 的语义变化且不强制副歌',
    (propagationAction) => {
      const issues = inspectLyricsQuality(
        GOOD_LYRICS.replaceAll('[Hook]', '[Verse 1]').replaceAll('[Chorus]', '[Verse 2]'),
        { lockedHook: 'A different image', propagationAction }
      );
      expect(issues).toEqual([]);
    }
  );
  it('原句复现可以发生在主歌内', () => {
    expect(
      inspectLyricsQuality(GOOD_LYRICS.replaceAll('[Hook]', '[Verse 1]').replaceAll('[Chorus]', '[Verse 2]'), {
        lockedHook: 'Smile for the fallout',
        propagationAction: 'exact_repeat',
      })
    ).toEqual([]);
  });
  it('结尾同一行重复两次包袱也被识别', () => {
    const issues = inspectLyricsQuality('[Verse 1]\nSet up the joke\n[Outro]\nCouch king, couch king!', {
      lockedHook: 'couch king',
      propagationAction: 'one_shot',
    });
    expect(issues).toContain('Protect the delayed reveal or one-shot punchline for exactly one lyrical appearance.');
  });
});
