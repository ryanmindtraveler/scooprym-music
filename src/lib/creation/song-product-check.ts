import { normalizeStructuredLyrics } from '@/lib/music/lyrics-utils';

export interface SongProductCheckInput {
  title?: string | null;
  lyrics?: string | null;
  audioUrl?: string | null;
  audioKey?: string | null;
  coverImageUrl?: string | null;
  coverImageKey?: string | null;
  durationSec?: number | null;
  sourceUrl?: string | null;
  sourceText?: string | null;
  sourceSummary?: string | null;
  coverFallback?: boolean;
  coverDimensions?: { width: number; height: number } | null;
}

export interface SongProductCheckResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
  checks: {
    title: boolean;
    lyrics: boolean;
    audio: boolean;
    cover: boolean;
    source: boolean;
    duration: boolean | null;
  };
}

export interface SongLyricsCheckResult {
  passed: boolean;
  lyrics: string;
  sungLineCount: number;
  issues: string[];
}

/**
 * 歌词进入付费音乐生成前与成品入库时共用同一套客观格式检查。
 * `<br>`、转义换行和段落标签粘连都属于可恢复的传输格式，不应让已经生成的音频报废。
 */
export function inspectSongLyrics(value: string | null | undefined): SongLyricsCheckResult {
  const lyrics = normalizeStructuredLyrics(value || '').trim();
  const sungLines = lyrics.split(/\r?\n/).filter((line) => line.trim() && !/^\[[^\]]+\]$/.test(line.trim()));
  const issues: string[] = [];

  if (!lyrics) issues.push('Lyrics are missing.');
  if (lyrics && !/^\[[^\]]+\]/m.test(lyrics)) {
    issues.push('Lyrics must contain at least one structured section such as [Verse 1] or [Hook].');
  }
  if (sungLines.length < 8) {
    issues.push(`Lyrics need at least 8 sung lines; found ${sungLines.length}.`);
  }
  // 结构化响应字段不是歌词；即使长度合格，也不能送入付费音乐模型。
  if (
    /\b(?:craft\s*Issues|fact\s*Audit|editorial\s*Notes|selected\s*Draft|prosody\s*Plan|risks)\s*["']?\s*:\s*(?:\[|\{|["'])/i.test(
      lyrics
    )
  ) {
    issues.push('Lyrics contain structured response metadata instead of sung text.');
  }
  if (/(?:<br\s*\/?>|&lt;br\s*\/?&gt;)/i.test(lyrics)) {
    issues.push('Lyrics still contain HTML line-break markup after normalization.');
  }

  return {
    passed: issues.length === 0,
    lyrics,
    sungLineCount: sungLines.length,
    issues,
  };
}

/** 读取常见封面格式的像素尺寸；不解码整张图片，避免在 Worker 中增加大型图像依赖。 */
export function readImageDimensions(buffer: Buffer, mime: string) {
  if (mime === 'image/png' && buffer.length >= 24 && buffer.subarray(12, 16).toString('ascii') === 'IHDR') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (mime === 'image/jpeg' && buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (segmentLength < 2) break;
      offset += segmentLength + 2;
    }
  }

  if (
    mime === 'image/webp' &&
    buffer.length >= 30 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP' &&
    buffer.subarray(12, 16).toString('ascii') === 'VP8X'
  ) {
    return {
      width: buffer.readUIntLE(24, 3) + 1,
      height: buffer.readUIntLE(27, 3) + 1,
    };
  }

  return null;
}

/**
 * 成品门禁只检查可客观判断的交付条件；艺术质量仍由管理员试听决定。
 * duration=null 表示服务端尚未获得真实音频时长，不能用歌词估算值冒充成品时长。
 */
export function inspectSongProduct(input: SongProductCheckInput): SongProductCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const title = input.title?.trim() || '';
  const lyricCheck = inspectSongLyrics(input.lyrics);
  const hasTitle = title.length >= 2 && title.length <= 80 && !/^new creation$/i.test(title);
  const hasLyrics = lyricCheck.passed;
  const hasAudio = !!input.audioUrl?.trim() && !!input.audioKey?.trim();
  const hasCover = !!input.coverImageUrl?.trim() && !!input.coverImageKey?.trim() && !input.coverFallback;
  const hasSource = !!(input.sourceUrl?.trim() || input.sourceText?.trim() || input.sourceSummary?.trim());
  const durationPassed = input.durationSec == null ? null : input.durationSec >= 30 && input.durationSec <= 90;

  if (!hasTitle) issues.push('Song title is missing, generic, or outside the 2-80 character delivery range.');
  if (!hasLyrics) issues.push(...lyricCheck.issues);
  if (!hasAudio) issues.push('The permanent audio asset is missing its URL or storage key.');
  if (!hasCover) issues.push('A permanent generated cover asset is required; fallback art is not publish-ready.');
  if (!hasSource) issues.push('The song is missing its source story metadata.');
  if (durationPassed === false)
    issues.push('The finished audio duration is outside the 30-90 second publishing range.');
  if (durationPassed === null) warnings.push('Finished audio duration still requires administrator confirmation.');

  if (input.coverDimensions) {
    const { width, height } = input.coverDimensions;
    const ratioDelta = Math.abs(width - height) / Math.max(width, height);
    if (width < 768 || height < 768 || ratioDelta > 0.04) {
      issues.push('The cover must be a near-square image of at least 768×768 pixels.');
    }
  } else {
    warnings.push('Cover dimensions were not available for automatic verification.');
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
    checks: {
      title: hasTitle,
      lyrics: hasLyrics,
      audio: hasAudio,
      cover: hasCover,
      source: hasSource,
      duration: durationPassed,
    },
  };
}
