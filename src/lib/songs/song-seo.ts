import type { Song } from '@/types/song';
import { slugify } from '../utils';
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
  // 缺失摘要的历史地址保持不变；改善展示标题不应再次迁移规范地址。
  const searchableHeadline = truncateAtWord(getSongSearchHeadline({ ...song, title: '' }), 82);
  // 只允许路径中稳定的字符，避免加号等符号在路由转换后造成规范地址自循环。
  // 保留 Unicode 字母与数字；旧链接仍通过末尾的歌曲 ID 找到同一首作品。
  const headlineSlug = slugify(searchableHeadline)
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${headlineSlug || 'story-song'}-${song.id}`;
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
