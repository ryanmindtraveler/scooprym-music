import type { Song } from '@/types/song';
import { getNewsDescription, getNewsTitle } from './song-editorial';

type SeoSong = Pick<Song, 'id' | 'title' | 'newsSummary' | 'sourceText'>;

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

export function getSongCanonicalSlug(song: SeoSong) {
  // UUID 是歌曲创建后唯一不变的公开身份。标题、摘要和歌词都允许编辑，
  // 因此不能再参与 canonical URL；历史标题型地址仍可从末尾 UUID 解析并 308 归并。
  return song.id;
}

export function getSongSeoTitle(song: SeoSong) {
  const headline = getSongSearchHeadline(song);
  const title = truncateAtWord(song.title, 55);
  return truncateAtWord(
    headline === song.title ? `${title} — Listen & Lyrics` : `${title} — ${truncateAtWord(headline, 65)}`,
    100
  );
}

export function getSongSeoDescription(song: SeoSong) {
  if (!song.newsSummary?.trim()) {
    return truncateAtWord(
      `Listen to “${song.title}” on ScoopRYM. Play the song, read the lyrics, and join the conversation.`,
      158
    );
  }
  const headline = getSongSearchHeadline(song);
  const context = getSongStoryContext(song);
  const lead = context && !context.startsWith('A strange true story') ? `${headline} ${context}` : headline;

  return truncateAtWord(
    `Hear “${song.title},” the meme song inspired by this story: ${lead} Read the lyrics and join the conversation.`,
    158
  );
}
