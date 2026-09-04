import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoryRadar, type StoryRadarCandidateView } from './story-radar';
import { groupRadarSongs } from '@/lib/story-radar/generated-song-view';

vi.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/navigation', () => ({
  useLocaleRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  LocaleLink: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
const songs = [
  {
    candidateId: 'one',
    id: 'latest',
    title: 'Latest song',
    audioUrl: 'https://example.com/song.mp3',
    isPublished: false,
  },
  { candidateId: 'one', id: 'older', title: 'Older song', audioUrl: 'https://example.com/old.mp3', isPublished: true },
];
const base: StoryRadarCandidateView = {
  id: 'one',
  sourceUrl: 'https://example.com/story',
  sourceTitle: 'First news',
  sourceDomain: 'example.com',
  sourceImageUrl: null,
  category: 'internet_chaos',
  matchedTerms: [],
  relevanceScore: 10,
  status: 'adopted',
  publishedAt: null,
  publishedAgo: null,
  generatedSongs: songs,
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function setup() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {}))
  );
  return render(
    <StoryRadar candidates={[base, { ...base, id: 'two', sourceTitle: 'Pending news', generatedSongs: [] }]} />
  );
}
describe('热点雷达已生成入口', () => {
  it('始终显示已生成筛选，并从制作中排除完成新闻', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Generated/ }));
    expect(screen.getByText('First news')).toBeTruthy();
    expect(screen.queryByText('Pending news')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /statuses.adopted/ }));
    expect(screen.queryByText('First news')).toBeNull();
    expect(screen.getByText('Pending news')).toBeTruthy();
  });
  it('未发布歌曲打开精确工作台，历史已发布版本可以访问详情', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Preview song' }).getAttribute('href')).toBe('/admin/create?songId=latest');
    expect(screen.getByRole('link', { name: /Older song/ }).getAttribute('href')).toBe('/songs/older');
    expect(screen.getByLabelText('Preview Latest song').getAttribute('preload')).toBe('none');
    expect(screen.getAllByRole('button', { name: 'createSong' })).toHaveLength(1);
  });
  it('按新闻 ID 隔离歌曲，重复关联不重复显示，保留最新排序', () => {
    const grouped = groupRadarSongs([...songs, songs[0], { ...songs[0], candidateId: 'two' }]);
    expect(grouped.one.map((song) => song.id)).toEqual(['latest', 'older']);
    expect(grouped.two).toHaveLength(1);
  });
});
