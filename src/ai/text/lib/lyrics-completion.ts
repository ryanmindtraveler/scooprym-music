import { inspectSongLyrics } from '@/lib/creation/song-product-check';
import { normalizeGeneratedLyrics } from './lyrics-quality';

/** 写词服务完全不可用时只复用事实，明确作为低质量保底，不添加新闻情节。 */
export function createFactDraft(facts: string[]) {
  const available = facts
    .map((fact) =>
      fact
        .replace(/[\r\n\[\]{}<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .sort((a, b) => a.length - b.length);
  if (!available.length) throw new Error('No source facts are available for lyric completion');
  return {
    songTitle: 'Story On Repeat',
    hook: 'Read it back, read it back',
    prosodyPlan: 'Plain spoken rhythm; short sung replies between complete reported facts.',
    lyrics: [
      '[Verse 1]',
      'Here is the story in the report',
      available[0],
      '[Hook]',
      'Read it back, read it back',
      'Keep the detail in the track',
      '[Verse 2]',
      'Here is another line to hear',
      available[1] || available[0],
      '[Outro]',
      'Read it back, read it back',
      'That is the story in the track',
    ].join('\n'),
  };
}

/** 只整理新生成的候选；按完整行收束超长稿，优先保留结尾，不拆词。 */
export function prepareDeliverableLyrics(raw: string) {
  const clean = normalizeGeneratedLyrics(raw)
    .split(/\[\s*production\s+notes\s*\]/i)[0]
    .trim();
  if (clean.length <= 1200 && inspectSongLyrics(clean).passed) return clean;
  const lines = clean.split('\n').filter((line) => line.trim());
  const ending = lines.slice(-4);
  const opening: string[] = [];
  for (const line of lines.slice(0, -4)) {
    if ([...opening, line, ...ending].join('\n').length > 1200) break;
    opening.push(line);
  }
  const compact = [...opening, ...ending].join('\n');
  return compact.length <= 1200 && inspectSongLyrics(compact).passed ? compact : null;
}

/** 质量不构成退回条件；格式不可用或修改明显增加格式问题时，自动保留可交付初稿。 */
export function preferEditedLyrics(draftIssues: string[], editedIssues: string[]) {
  return editedIssues.length <= draftIssues.length;
}
