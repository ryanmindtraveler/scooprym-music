import type { Song } from '@/types/song';
import { getNewsDescription, getNewsTitle } from './song-editorial';
import { slugify } from './utils';

type SeoSong = Pick<Song, 'id' | 'title' | 'newsSummary' | 'sourceText'>;

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
  const searchableHeadline = truncateAtWord(getSongSearchHeadline(song), 82);
  return `${slugify(searchableHeadline) || slugify(song.title) || 'story-song'}-${song.id}`;
}

export function getSongSeoTitle(song: SeoSong) {
  return truncateAtWord(`${getSongSearchHeadline(song)} — ${song.title}`, 100);
}

export function getSongSeoDescription(song: SeoSong) {
  const headline = getSongSearchHeadline(song);
  const context = getSongStoryContext(song);
  const lead = context && !context.startsWith('A strange true story') ? `${headline} ${context}` : headline;

  return truncateAtWord(
    `Hear “${song.title},” the meme song inspired by this story: ${lead} Read the lyrics and join the conversation.`,
    158
  );
}
