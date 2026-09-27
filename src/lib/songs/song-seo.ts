import { slugify } from '@/lib/utils';
import type { Song } from '@/types/song';
import { cleanLyricsForDisplay } from '../music/lyrics-utils';
import legacyStorySongSlugs from './legacy-story-song-slugs.json';
import shortenedSongSlugs from './shortened-song-slugs.json';
import { getNewsDescription, getNewsTitle } from './song-editorial';

type SeoSong = Pick<Song, 'id' | 'title' | 'newsSummary' | 'sourceText'> &
  Partial<Pick<Song, 'storyId' | 'seoTopic' | 'lyrics' | 'prompt'>>;
type SongIdentity = Pick<Song, 'id'> & Partial<Pick<Song, 'seoSlug'>>;
type PublicDatedSong = Pick<Song, 'createdAt'> & Partial<Pick<Song, 'publishedAt'>>;
export type SongRecordingVersion = { number: number; total: number };

const legacySongSlugRedirects = new Map(legacyStorySongSlugs.map(({ old, slug }) => [old, slug]));
const shortenedSongSlugIds = new Map(shortenedSongSlugs.map(({ old, id }) => [old, id]));

export function getLegacySongSlugRedirect(slug: string) {
  const target = legacySongSlugRedirects.get(slug);
  return target ? getSongCanonicalSlug({ id: '', seoSlug: target }) : undefined;
}

/** 兼容两种已保存的后缀，以便旧网址跳转到 funny-song 规范地址。 */
export function getSongStoredSlug(slug: string) {
  if (/-funny-song(?=-\d+$|$)/.test(slug)) {
    return slug.replace(/-funny-song(?=-\d+$|$)/, '-scooprym');
  }
  return slug.replace(/-scooprym(?=-\d+$|$)/, '-funny-song');
}

/** 迁移后的长地址先按歌曲 ID 查库，再跳转到当前规范地址，避免迁移期间出现死链。 */
export function getShortenedSongSlugId(slug: string) {
  return shortenedSongSlugIds.get(slug);
}

/** 早期作品的摘要是完整句子，单独给搜索标题使用精简的事件描述。 */
const legacyStorySeoTopics: Record<string, string> = {
  '0238dcd1-6d25-4424-acc3-c7c4dc0a085b': 'Jasveen Sangha and the Matthew Perry ketamine case',
  '0321d2ed-c599-434b-966b-a3ddfd191e0a': 'Taylor Swift and Travis Kelce hotel wedding rumor',
  '361ba154-ed23-44e9-b2a9-bb73a9b8ff67': "Andy Cohen's CNN New Year's Eve remarks",
  '4f9df063-e4b4-4100-97cd-377fcc3034c8': 'Tom Brady, Alix Earle and the NHL Winter Classic',
  '5b802e73-cf2d-4e6b-a25d-5af09d1643d0': "Dax Shepard and Kristen Bell's New Year celebration",
  '5ccdaff4-3a70-46cb-a4a8-4f52d96939e4': 'Virginia liquor store raccoon break-in',
  '71a02ee2-afb2-4c38-82a8-667e594d4a5e': "Gene Simmons' comments on Ace Frehley's death",
  '7a044e76-92eb-4bdb-aaae-2d9f3691910d': 'Corporate hourly fee satire',
  '7cbbe13c-5cd1-42bf-9520-3f371096af11': 'G Herbo and Taina Williams engagement',
  '8155fdcb-1ef0-456e-9a9b-a7b4c7a52d68': 'Sydney Sweeney Bond Girl casting rumor',
  '874cf370-e018-4e0d-b7fd-c73e7347845a': "Brooklyn Beckham and Nicola Peltz's New Year's Eve",
  '8b31dbe4-f50d-4fb3-adfb-6abdb81062b9': 'Donald Trump and Elon Musk Mar-a-Lago dinner',
  '9b00f64a-c6e6-475d-b3c3-c1650dcae4c5': '$1.7 million luxury motorhome',
  'd9e0eab7-21d0-485e-84c3-2a906c2c2df5': 'Timothée Chalamet and Kylie Jenner at the Critics Choice Awards',
  'f44581e9-015e-422a-a3eb-ea118b6abffb': 'Hailee Steinfeld and Josh Allen Baby Beau hint',
  'fccb884e-bbcd-4247-9503-e190efb346d0': 'Ellen DeGeneres and Portia de Rossi U.S. visit',
};

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

  const style = rawStyle
    .replace(/[^\p{L}\p{N}&+'-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return style.length <= 28 ? style : '';
}

function getSongLyricHook(song: SeoSong) {
  const hook = cleanLyricsForDisplay(song.lyrics)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !/^\[[^\]]+\]$/.test(line));
  if (!hook) return '';
  return hook.replace(/^[(\[][^\])]+[)\]]\s*/, '').trim();
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

/** 优先保存创作阶段核对的短主题；旧工作流回退到完整事件首句。 */
export function buildSongSeoTopic(song: SeoSong) {
  const supplied = song.seoTopic?.trim();
  const summary = song.newsSummary?.trim();
  const sourceHeadline = song.sourceText?.match(/(?:^|\n)Title:\s*([^\r\n]+)/i)?.[1]?.trim();
  const headline =
    supplied || (summary ? getNewsTitle({ ...song, title: '' } as Song, { truncate: false }) : sourceHeadline);
  if (!headline) return '';

  const cleaned = headline
    .replace(/^Title:\s*/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?\s]+$/, '')
    .trim();
  // 没有人工或模型提供的短主题时，保留完整陈述，避免截掉「否认」「尚未」等关键限定。
  return cleaned;
}

/** 首句优先，避免详情页把自造歌名排在真实事件之前。 */
export function getSongSeoTopic(song: SeoSong) {
  if (song.seoTopic?.trim()) return song.seoTopic.trim();
  const legacyTopic = song.storyId ? legacyStorySeoTopics[song.storyId] : undefined;
  if (legacyTopic && song.newsSummary?.trim()) return legacyTopic;
  const headline = getNewsTitle(song as Song, { truncate: false }).trim() || song.title;
  const firstClause = headline.split(/[,;—–]/, 1)[0]?.trim() || '';
  return (firstClause.length >= 28 ? firstClause : headline).replace(/[.!?]+$/, '');
}

/** 仅用于首次分配固定 slug，不随新闻摘要或歌名的后续编辑重新计算。 */
export function getSongSeoSlugBase(song: SeoSong) {
  const topic = getSongSeoTopic(song);
  const topicWords = slugify(topic).split('-').filter(Boolean).slice(0, 15);
  return `${topicWords.join('-')}-funny-song`;
}

/** 同一新闻从第二首起编号；其他新闻占用目标地址时继续递增。 */
export function allocateSongSeoSlug(base: string, storySlugs: string[], reservedSlugs: Set<string>) {
  const highest = storySlugs.reduce((number, slug) => {
    const match = slug.match(/-funny-song-(\d+)$/);
    return Math.max(number, match ? Number(match[1]) : 1);
  }, 1);
  let number = storySlugs.length ? highest + 1 : 1;
  let candidate = number === 1 ? base : `${base}-${number}`;
  while (reservedSlugs.has(candidate)) {
    number += 1;
    candidate = `${base}-${number}`;
  }
  return candidate;
}

export function getSongStoryContext(song: SeoSong) {
  const context = getNewsDescription(song as Song);
  return context.startsWith('A strange true story') ? '' : context;
}

export function getSongCanonicalSlug<T extends SongIdentity>(song: T) {
  return song.seoSlug?.replace(/-scooprym(?=-\d+$|$)/, '-funny-song') || song.id;
}

export function getSongSeoTitle(song: SeoSong) {
  const topic = getSongSeoTopic(song);
  return topic === song.title ? `Funny Song — ${song.title}` : `${topic} Song — ${song.title}`;
}

export function getSongSeoDescription(song: SeoSong, version?: SongRecordingVersion) {
  const style = getSongPrimaryStyle(song);
  const hook = getSongLyricHook(song);
  const recording = style ? `${style} funny song` : 'funny song';
  const versionLabel = version ? ` (recording ${version.number} of ${version.total})` : '';
  const article = /^[aeiou]/i.test(recording) ? 'an' : 'a';
  const introduction = `Hear “${song.title}”${versionLabel}, ${article} ${recording}.`;
  const headline = song.newsSummary?.trim() ? getNewsTitle(song as Song, { truncate: false }).trim() : '';
  const story = headline ? ` ${/[.!?]$/.test(headline) ? headline : `${headline}.`}` : '';
  const lyric = hook ? ` It opens with “${hook}”.` : '';
  const action = ' Play the track and read the lyrics.';

  // 按完整句子取舍；不能为了固定字符数截断事实或歌词。
  const candidates = [
    introduction + story + lyric + action,
    introduction + story + lyric,
    introduction + lyric + action,
    introduction + story + action,
    introduction + story,
    introduction + action,
    introduction,
  ];
  return candidates.find((candidate) => candidate.length <= 170) || introduction;
}
