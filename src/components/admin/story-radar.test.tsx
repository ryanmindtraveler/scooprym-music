import { RADAR_STATUSES, parseRadarBrowseParams } from '@/lib/story-radar/browse-params';
import { groupRadarSongs } from '@/lib/story-radar/generated-song-view';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoryRadar, type StoryRadarCandidateView } from './story-radar';

const { router } = vi.hoisted(() => ({ router: { refresh: vi.fn(), push: vi.fn() } }));
vi.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/navigation', () => ({
  useLocaleRouter: () => router,
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
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
function setup() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {}))
  );
  return render(
    <StoryRadar
      browse={{
        params: parseRadarBrowseParams({ page: 2 }),
        total: 194,
        counts: { all: 194, new: 99, shortlisted: 14, adopted: 4, generated: 16, dismissed: 73 },
      }}
      candidates={[base, { ...base, id: 'two', sourceTitle: 'Pending news', generatedSongs: [] }]}
    />
  );
}
describe('热点雷达已生成入口', () => {
  it.each(RADAR_STATUSES.filter((status) => status !== 'all'))(
    '从第二页切换到 %s 时重置页码并保留筛选',
    async (status) => {
      setup();
      const names = {
        new: /New Inbox/,
        shortlisted: /Shortlisted/,
        adopted: /In Production/,
        generated: /Generated/,
        dismissed: /Dismissed/,
      };
      fireEvent.click(screen.getByRole('button', { name: names[status] }));
      await waitFor(() => expect(router.push).toHaveBeenCalled());
      const params = new URLSearchParams(router.push.mock.calls.at(-1)![0].split('?')[1]);
      expect(params.get('page')).toBe('1');
      expect(params.get('status')).toBe(status);
    }
  );
  it('下一页使用服务端总数并推进页码', async () => {
    vi.stubGlobal('scrollTo', vi.fn());
    setup();
    expect(screen.getByText('Showing 21-40 of 194 stories')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(router.push.mock.calls.at(-1)![0]).toContain('page=3');
  });
  it('未发布歌曲打开精确工作台，历史已发布版本可以访问详情', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Preview', exact: true }).getAttribute('href')).toBe(
      '/admin/create?songId=latest'
    );
    fireEvent.click(screen.getByText('View all 2 versions'));
    expect(screen.getByRole('link', { name: /Older song/ }).getAttribute('href')).toBe('/songs/older');
    expect(screen.getByLabelText('Preview Latest song').getAttribute('preload')).toBe('none');
    expect(screen.getByText('Pending news')).toBeTruthy();
  });
  it('按新闻 ID 隔离歌曲，重复关联不重复显示，保留最新排序', () => {
    const grouped = groupRadarSongs([...songs, songs[0], { ...songs[0], candidateId: 'two' }]);
    expect(grouped.one.map((song) => song.id)).toEqual(['latest', 'older']);
    expect(grouped.two).toHaveLength(1);
  });
});
