import type { Song } from '@/types/song';
import { cleanLyricsForDisplay } from '../music/lyrics-utils';
import { getNewsDescription, getNewsTitle } from './song-editorial';

type SeoSong = Pick<Song, 'id' | 'title' | 'newsSummary' | 'sourceText'> & Partial<Pick<Song, 'lyrics' | 'prompt'>>;
type SongIdentity = Pick<Song, 'id'>;
type PublicDatedSong = Pick<Song, 'createdAt'> & Partial<Pick<Song, 'publishedAt'>>;

/** 路由和国际化重写可能保留百分号编码，比较规范路径前统一解码一次。 */
export function decodeSongSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  const shortened = value.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  const end = lastSpace > Math.floor(maxLength * 0.65) ? lastSpace : maxLength;
  return `${shortened.slice(0, end).replace(/[,:;\s-]+$/, '')}…`;
}

function getSongPrimaryStyle(song: SeoSong) {
  const rawStyle = song.prompt
    ?.split(/[,，.|]+|\s+(?=#)/)
    .map((value) => value.replace(/^#+/, '').trim())
    .find(Boolean);
  if (!rawStyle) return '';

  return truncateAtWord(
    rawStyle
      .replace(/[^\p{L}\p{N}&+'-]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    28
  );
}

function getSongLyricHook(song: SeoSong) {
  const hook = cleanLyricsForDisplay(song.lyrics)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !/^\[[^\]]+\]$/.test(line));
  if (!hook) return '';
  return truncateAtWord(hook.replace(/^[(\[][^\])]+[)\]]\s*/, '').trim(), 34);
}

/**
 * 公开时间只来自真实发布事件；旧数据没有发布事件时回退创建时间。
 * updatedAt 还承载迁移、任务恢复等内部维护，不能充当 sitemap 或结构化数据的内容更新时间。
 */
export function getSongPublicDate(song: PublicDatedSong) {
  const candidate = song.publishedAt || song.createdAt;
  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? new Date(song.createdAt) : date;
}

/**
 * 歌曲详情页首先承接新闻八卦搜索意图，歌曲名只作为作品名出现。
 */
export function getSongSearchHeadline(song: SeoSong) {
  const headline = getNewsTitle(song as Song, { truncate: false }).trim();
  return truncateAtWord(headline || song.title || 'The internet did what?', 150);
}

export function getSongStoryContext(song: SeoSong) {
  const context = getNewsDescription(song as Song);
  return context.startsWith('A strange true story') ? '' : context;
}

export function getSongCanonicalSlug<T extends SongIdentity>(song: T) {
  // UUID 是歌曲创建后唯一不变的公开身份。标题、摘要和歌词都允许编辑，
  // 因此不能再参与 canonical URL；历史标题型地址仍可从末尾 UUID 解析并 308 归并。
  return song.id;
}

export function getSongSeoTitle(song: SeoSong) {
  const headline = getSongSearchHeadline(song);
  const title = truncateAtWord(song.title, 55);
  const style = getSongPrimaryStyle(song);
  const titleStyle = style ? `${style.charAt(0).toLocaleUpperCase()}${style.slice(1)}` : '';
  const titleWithStyle = titleStyle ? `${title} (${titleStyle})` : title;
  return truncateAtWord(
    headline === song.title
      ? `${titleWithStyle} — Listen & Lyrics`
      : `${titleWithStyle} — ${truncateAtWord(headline, 65)}`,
    100
  );
}

export function getSongSeoDescription(song: SeoSong) {
  const style = getSongPrimaryStyle(song);
  const hook = getSongLyricHook(song);
  const recording = style ? `${style} meme song` : 'meme song';
  const opening = hook ? ` opening with “${hook}”` : '';

  if (!song.newsSummary?.trim()) {
    return truncateAtWord(
      `Listen to “${song.title},” a ${recording}${opening}. Play the song, read the lyrics, and join the conversation.`,
      158
    );
  }
  const headline = getSongSearchHeadline(song);
  const context = getSongStoryContext(song);
  const lead = context && !context.startsWith('A strange true story') ? `${headline} ${context}` : headline;

  return truncateAtWord(
    `Hear “${song.title},” a ${recording}${opening}, inspired by: ${lead} Read the lyrics and join the conversation.`,
    158
  );
}
