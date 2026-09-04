/**
 * Cleans lyrics for display by removing meta-tag instructions.
 * Converts "[Verse: Fast Rap]" to "[Verse]".
 */
export function normalizeLyricMarkup(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div)>/gi, '\n')
    .replace(/<(?:p|div|span)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '');
}

const SECTION_ALIASES: Record<string, string> = {
  intro: 'Intro',
  verse: 'Verse 1',
  'verse 1': 'Verse 1',
  'verse one': 'Verse 1',
  'verse 2': 'Verse 2',
  'verse two': 'Verse 2',
  'pre chorus': 'Pre Chorus',
  prechorus: 'Pre Chorus',
  chorus: 'Chorus',
  hook: 'Hook',
  'final chorus': 'Chorus',
  'final hook': 'Hook',
  bridge: 'Bridge',
  break: 'Break',
  breakdown: 'Breakdown',
  drop: 'Drop',
  interlude: 'Interlude',
  instrumental: 'Instrumental',
  inst: 'Inst',
  'build up': 'Build Up',
  buildup: 'Build Up',
  solo: 'Solo',
  transition: 'Transition',
  'post chorus': 'Post Chorus',
  postchorus: 'Post Chorus',
  outro: 'Outro',
};

const STRUCTURED_SECTION_PATTERN =
  /\[((?:intro|verse(?:[-_ ]?(?:one|two|1|2))?|pre[-_ ]?chorus|(?:final[-_ ]?)?chorus|(?:final[-_ ]?)?hook|bridge|breakdown|break|drop|interlude|instrumental|inst|build[-_ ]?up|solo|transition|post[-_ ]?chorus|outro))(?:\s*(?::|—|–|-)\s*[^\]]*)?\]/gi;

function normalizeSectionName(value: string) {
  const key = value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  return SECTION_ALIASES[key] || value.trim();
}

/**
 * 部分结构化输出供应商会保留段落标签，却把段落中的所有歌词压成一个字符串。
 * 这里只补回换行，不增加、删除或改写任何歌词文字，确保音频输入与编辑稿语义一致。
 */
function restoreCollapsedLyricLines(value: string) {
  const repairedBoundaries = value
    // 例如 `doorRang`、`creepy'Her`：原换行在 JSON 结构化过程中丢失。
    .replace(/(?<=[\p{Ll}\p{N}'’”])(?=\p{Lu}\p{Ll})/gu, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const restored: string[] = [];

  for (const line of repairedBoundaries) {
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length <= 16) {
      restored.push(line);
      continue;
    }

    let current: string[] = [];
    for (const word of words) {
      current.push(word);
      const naturalPause = /[,;:.!?][”’'"]?$/.test(word);
      if ((current.length >= 5 && naturalPause) || current.length >= 12) {
        restored.push(current.join(' '));
        current = [];
      }
    }
    if (current.length > 0) restored.push(current.join(' '));
  }

  return restored;
}

/**
 * 将歌词统一为供应商可识别的独立段落标签和真实换行。
 * 支持模型常见的 `[Verse 1 - vocal note]Line`、冒号/长横线说明以及字面量 `\\n`。
 */
export function normalizeStructuredLyrics(value: string | null | undefined): string {
  if (!value) return '';

  const source = normalizeLyricMarkup(value)
    .trim()
    .replace(/^```(?:text|lyrics)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(STRUCTURED_SECTION_PATTERN, (_match, section: string) => `\n[${normalizeSectionName(section)}]\n`);
  const normalized: string[] = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^\[[^\]]+\]$/.test(line)) {
      if (normalized.length > 0 && normalized.at(-1) !== '') normalized.push('');
      normalized.push(line);
      continue;
    }

    const compactLine = line.replace(/[ \t]+/g, ' ');
    normalized.push(...restoreCollapsedLyricLines(compactLine));
  }

  return normalized
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanLyricsForDisplay(lyrics: string | null | undefined): string {
  if (!lyrics) return '';
  return normalizeStructuredLyrics(lyrics)
    .replace(/\[\d{2}:\d{2}(\.\d{2,3})?\]/g, '') // Remove timestamps [00:12.00]
    .trim();
}

function titleCase(value: string) {
  const minorWords = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to']);
  return value
    .split(/\s+/)
    .map((word, index) => {
      const normalized = word.toLocaleLowerCase();
      if (index > 0 && minorWords.has(normalized)) return normalized;
      return normalized.charAt(0).toLocaleUpperCase() + normalized.slice(1);
    })
    .join(' ');
}

function cleanTitleCandidate(value: string) {
  return value
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[“”"'`]+/g, '')
    .replace(/[^\p{L}\p{N}&!?'-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PERFORMANCE_DIRECTION_PATTERN =
  /\((?=[^)]*(?:stabs?|chops?|instrumental|pizzicato|beat|drums?|bass|guitar|synth|filtered|whispered|spoken|build|drop))[^)]*\)/giu;

function extractTitleFromLyrics(lyrics?: string | null) {
  if (!lyrics?.trim()) return '';

  const withoutDirections = lyrics.replace(PERFORMANCE_DIRECTION_PATTERN, ' ');
  const sections = withoutDirections.split(/^\s*\[[^\]]+\]\s*$/gmu);
  const candidates = sections
    .flatMap((section) => section.split(/\r?\n/))
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of candidates) {
    const phraseBeforeAdlib = line.split('(')[0]?.trim() || line;
    const cleanedPhrase = cleanTitleCandidate(phraseBeforeAdlib);
    const words = cleanedPhrase.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 6 && cleanedPhrase.length <= 48) {
      return cleanedPhrase;
    }
  }

  return '';
}

/**
 * 旧任务可能把新闻标题写入 songTitle。界面优先保留真正的短歌名，
 * 否则从锁定 Hook 的第一拍提炼一个 2-6 词的可展示歌名。
 */
export function buildDisplaySongTitle(songTitle?: string | null, lockedHook?: string | null, lyrics?: string | null) {
  const cleanedSongTitle = cleanTitleCandidate(songTitle || '');
  const songTitleWords = cleanedSongTitle.split(/\s+/).filter(Boolean);
  const isUsableSongTitle = cleanedSongTitle.length <= 48 && songTitleWords.length >= 2 && songTitleWords.length <= 6;

  if (isUsableSongTitle) return titleCase(cleanedSongTitle);

  const hookOpening = (lockedHook || '').split('(')[0] || lockedHook || '';
  const cleanedHook = cleanTitleCandidate(hookOpening);
  const hookWords = cleanedHook.split(/\s+/).filter(Boolean).slice(0, 6);
  if (hookWords.length > 0) return titleCase(hookWords.join(' '));

  const lyricTitle = extractTitleFromLyrics(lyrics);
  if (lyricTitle) return titleCase(lyricTitle);

  return 'New Creation';
}
