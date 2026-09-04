import { normalizeStructuredLyrics } from '@/lib/lyrics-utils';
import type { MemePropagationAction } from '@/types/lyric-workshop';

/** ScoopRYM 默认作品是紧凑但完整的 meme 单曲，而不是几句口号或传统三分钟长歌。 */
export const SHORT_FORM_LYRIC_LIMITS = {
  minSungLines: 14,
  maxSungLines: 24,
  minWords: 90,
  maxWords: 140,
  targetDurationSeconds: '45-65',
  hardDurationLimitSeconds: 90,
} as const;

/**
 * 用演唱词数、标点停顿与段落切换估算实际演唱时长。
 * 它不是音频裁剪器，只用于在提交音乐模型前拦截明显过长的歌词。
 */
export function estimateLyricDurationSeconds(lyrics: string) {
  const lines = lyrics.split('\n').filter(Boolean);
  const sungLines = lines.filter((line) => !isSectionLine(line));
  const wordCount = sungLines.reduce((total, line) => total + line.split(/\s+/).filter(Boolean).length, 0);
  const sectionCount = lines.length - sungLines.length;
  const shortPauses = (lyrics.match(/[,;:]/g) || []).length;
  const longPauses = (lyrics.match(/[.!?]/g) || []).length;
  const vocalSeconds = (wordCount / 135) * 60;
  const pauseSeconds = shortPauses * 0.12 + longPauses * 0.28 + Math.max(0, sectionCount - 1) * 0.55;
  return Math.round(vocalSeconds + pauseSeconds);
}

function isSectionLine(line: string) {
  return /^\[[^\]]+\]$/.test(line);
}

/**
 * 清理由文本模型偶尔添加的 Markdown，并统一为音乐模型可识别的段落标签。
 */
export function normalizeGeneratedLyrics(rawLyrics: string) {
  return normalizeStructuredLyrics(rawLyrics);
}

function sectionCounts(lyrics: string) {
  const counts = new Map<string, number>();
  for (const line of lyrics.split('\n')) {
    const match = line.match(/^\[([^\]]+)\]$/);
    if (!match) continue;
    const section = match[1];
    counts.set(section, (counts.get(section) || 0) + 1);
  }
  return counts;
}

/**
 * 对短篇新闻歌曲做轻量质量检查；不自动篡改文案，只决定是否需要编辑模型再润色一次。
 */
export function inspectLyricsQuality(
  lyrics: string,
  options?: { lockedHook?: string; propagationAction?: MemePropagationAction }
) {
  const issues: string[] = [];
  const lines = lyrics.split('\n').filter(Boolean);
  const sungLines = lines.filter((line) => !isSectionLine(line));
  const counts = sectionCounts(lyrics);

  const verseCount = [...counts.entries()].reduce(
    (total, [section, count]) => total + (section.startsWith('Verse') ? count : 0),
    0
  );
  if (verseCount < 1) issues.push('Use at least one verse to carry the scene and factual details.');

  const hookSectionCount = (counts.get('Chorus') || 0) + (counts.get('Hook') || 0);
  const propagationAction = options?.propagationAction || 'exact_repeat';
  const requiresHookReturn = [
    'exact_repeat',
    'mutating_repeat',
    'call_response',
    'escalating_list',
    'callback',
  ].includes(propagationAction);
  const protectsSingleReveal = propagationAction === 'delayed_reveal' || propagationAction === 'one_shot';

  if (requiresHookReturn && hookSectionCount < 2) {
    issues.push('The chorus or hook must return at least twice for replay value.');
  }

  if (
    sungLines.length < SHORT_FORM_LYRIC_LIMITS.minSungLines ||
    sungLines.length > SHORT_FORM_LYRIC_LIMITS.maxSungLines
  ) {
    issues.push(
      `Use ${SHORT_FORM_LYRIC_LIMITS.minSungLines}-${SHORT_FORM_LYRIC_LIMITS.maxSungLines} sung lines for a complete, compact meme song; found ${sungLines.length}.`
    );
  }

  const wordCount = sungLines.reduce((total, line) => total + line.split(/\s+/).filter(Boolean).length, 0);
  if (wordCount < SHORT_FORM_LYRIC_LIMITS.minWords || wordCount > SHORT_FORM_LYRIC_LIMITS.maxWords) {
    issues.push(
      `Keep the lyric near ${SHORT_FORM_LYRIC_LIMITS.minWords}-${SHORT_FORM_LYRIC_LIMITS.maxWords} words for a ${SHORT_FORM_LYRIC_LIMITS.targetDurationSeconds} second meme song; found ${wordCount}.`
    );
  }

  const estimatedDurationSeconds = estimateLyricDurationSeconds(lyrics);
  if (estimatedDurationSeconds > 72) {
    issues.push(
      `Reduce the estimated sung duration to about ${SHORT_FORM_LYRIC_LIMITS.targetDurationSeconds} seconds; the current lyric is estimated near ${estimatedDurationSeconds} seconds before instrumental padding.`
    );
  }

  if (sungLines.some((line) => line.split(/\s+/).filter(Boolean).length > 16)) {
    issues.push('Some lines are too dense to sing cleanly; keep each line at 16 words or fewer.');
  }

  if (sungLines.some((line) => /^(yeah|yo|uh|listen|let['’]?s go)\b/i.test(line))) {
    issues.push('Remove generic opening filler and start with a distinctive image or action.');
  }

  const lockedHook = options?.lockedHook?.trim().toLocaleLowerCase();
  if (lockedHook && propagationAction !== 'none') {
    const normalizedLines = sungLines.map((line) => line.toLocaleLowerCase());
    const hookAppearances = normalizedLines.filter((line) => line.includes(lockedHook)).length;
    if (requiresHookReturn && hookAppearances < 2) {
      issues.push('Repeat the locked hook phrase at least twice without paraphrasing it away.');
    }
    if (requiresHookReturn && !normalizedLines.slice(0, 4).some((line) => line.includes(lockedHook))) {
      issues.push('Bring the locked hook into the first four sung lines for a faster social-media payoff.');
    }
    if (propagationAction === 'callback' && !normalizedLines.slice(-4).some((line) => line.includes(lockedHook))) {
      issues.push('Return to the callback phrase within the final four sung lines.');
    }
    if (protectsSingleReveal) {
      if (hookAppearances !== 1) {
        issues.push('Protect the delayed reveal or one-shot punchline for exactly one lyrical appearance.');
      }
      if (!normalizedLines.slice(-4).some((line) => line.includes(lockedHook))) {
        issues.push('Land the delayed reveal or one-shot punchline within the final four sung lines.');
      }
    }
  }

  return issues;
}
