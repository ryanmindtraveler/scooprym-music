import { RADAR_STATUSES, parseRadarBrowseParams } from '@/lib/story-radar/browse-params';
import { groupRadarSongs } from '@/lib/story-radar/generated-song-view';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoryRadar, type StoryRadarCandidateView } from './story-radar';

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));

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
  vi.clearAllMocks();
});
function setup(server = false) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {}))
  );
  return render(
    <StoryRadar
      browse={
        server
          ? {
              params: parseRadarBrowseParams({ page: 2 }),
              total: 194,
              counts: { all: 194, new: 99, shortlisted: 14, adopted: 4, generated: 16, dismissed: 73 },
            }
          : undefined
      }
      candidates={[base, { ...base, id: 'two', sourceTitle: 'Pending news', generatedSongs: [] }]}
    />
  );
}
describe('热点雷达已生成入口', () => {
  it.each(RADAR_STATUSES.filter((status) => status !== 'all'))(
    '从第二页切换到 %s 时重置页码并保留筛选',
    async (status) => {
      setup(true);
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
    setup(true);
    expect(screen.getByText('Showing 21-40 of 194 stories')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(router.push.mock.calls.at(-1)![0]).toContain('page=3');
  });
  it('失败筛选重试入口只请求失败记录，并显示失败原因', async () => {
    const fetchMock = vi.fn((url: string) =>
      url === '/api/admin/story-radar/ai-screen'
        ? Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                processedCount: 0,
                failedCount: 0,
                skippedCount: 0,
                dismissedCount: 0,
                highMatchCount: 0,
              })
            )
          )
        : new Promise(() => {})
    );
    vi.stubGlobal('fetch', fetchMock);
    render(
      <StoryRadar
        candidates={[
          {
            ...base,
            aiScreening: {
              token: 'test',
              title: base.sourceTitle,
              domain: base.sourceDomain,
              status: 'failed',
              attemptedAt: '2026-09-07T00:00:00Z',
              error: 'Provider offline',
            },
          },
        ]}
      />
    );
    expect(screen.getByText(/AI screening failed · original score retained/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry failed screening' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/story-radar/ai-screen',
        expect.objectContaining({ body: JSON.stringify({ autoDismiss: true, limit: 40, retryFailed: true }) })
      )
    );
  });
  it('服务端第二页保留当前行，全库计数不受当前页限制，翻页写入 URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
    render(
      <StoryRadar
        candidates={[base]}
        browse={{
          params: parseRadarBrowseParams({ page: 2 }),
          total: 1000,
          counts: { all: 1000, new: 900, shortlisted: 20, adopted: 5, generated: 25, dismissed: 50 },
        }}
      />
    );
    expect(screen.getByText('First news')).toBeTruthy();
    expect(screen.getByRole('button', { name: /All\s*1000/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(expect.stringContaining('page=3&size=20')));
    expect(fetch).toHaveBeenCalledWith('/api/admin/story-radar/jobs?ids=one', expect.anything());
  });

  it('显示失败原因并打开原歌曲工坊，避免重新入队整首歌', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              jobs: [
                {
                  candidateId: 'one',
                  status: 'handed_off',
                  workflowStatus: 'failed',
                  songId: 'original-song',
                  error: 'Audio saved. Cover request timed out.',
                },
              ],
              generatedSongs: [],
            })
          )
      )
    );
    render(<StoryRadar candidates={[{ ...base, generatedSongs: [] }]} />);
    expect(await screen.findByText('Audio saved. Cover request timed out.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Review and retry in Studio' }).getAttribute('href')).toBe(
      '/admin/create?songId=original-song'
    );
  });
  it('显示Trends热搜与观测时间，支持按热搜词查找', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
    render(
      <StoryRadar
        candidates={[
          {
            ...base,
            trendSignals: [
              {
                term: 'surprise album',
                region: 'US',
                approximateTraffic: '20,000+',
                startedAt: null,
                observedAt: '2026-09-07T06:00:00Z',
              },
            ],
          },
        ]}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Search title, domain, keywords...'), {
      target: { value: 'surprise album' },
    });
    expect(screen.getByText('First news')).toBeTruthy();
    expect(screen.getByLabelText('Google Trends context').textContent).toContain('20,000+ searches (approx.)');
    expect(screen.getByLabelText('Google Trends context').textContent).toContain('Observed 2026-09-07 06:00 UTC');
  });
  it('始终显示已生成筛选，并从制作中排除完成新闻', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Generated/ }));
    expect(screen.getByText('First news')).toBeTruthy();
    expect(screen.queryByText('Pending news')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /In Production/ }));
    expect(screen.queryByText('First news')).toBeNull();
    expect(screen.getByText('Pending news')).toBeTruthy();
  });
  it('未发布歌曲打开精确工作台，历史已发布版本可以访问详情', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Preview' }).getAttribute('href')).toBe('/admin/create?songId=latest');
    expect(screen.getByRole('link', { name: /Older song/ }).getAttribute('href')).toBe('/songs/older');
    expect(screen.getByLabelText('Preview Latest song').getAttribute('preload')).toBe('none');
    expect(screen.getAllByRole('button', { name: 'Re-generate' })).toHaveLength(1);
  });
  it('按新闻 ID 隔离歌曲，重复关联不重复显示，保留最新排序', () => {
    const grouped = groupRadarSongs([...songs, songs[0], { ...songs[0], candidateId: 'two' }]);
    expect(grouped.one.map((song) => song.id)).toEqual(['latest', 'older']);
    expect(grouped.two).toHaveLength(1);
  });
  it('未匹配文章进入待审筛选，人工精选不被误当作未审', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
    render(
      <StoryRadar
        candidates={[
          { ...base, id: 'review', sourceTitle: 'Unmatched report', status: 'new', generatedSongs: [] },
          { ...base, id: 'picked', sourceTitle: 'Editor picked report', status: 'shortlisted', generatedSongs: [] },
        ]}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Needs editorial review only|仅看需人工复审/ }));
    expect(screen.getByText('Unmatched report')).toBeTruthy();
    expect(screen.queryByText('Editor picked report')).toBeNull();
    expect(screen.getByText(/Needs review/)).toBeTruthy();
    expect(screen.getByText('Date unknown')).toBeTruthy();
  });

  it('按匹配分数从大到小严格排序候选新闻', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
    const { container } = render(
      <StoryRadar
        candidates={[
          {
            ...base,
            id: 'low',
            sourceTitle: 'Low score gossip',
            relevanceScore: 15,
            status: 'new',
            generatedSongs: [],
          },
          {
            ...base,
            id: 'high',
            sourceTitle: 'High score viral drama',
            relevanceScore: 95,
            status: 'new',
            generatedSongs: [],
          },
          {
            ...base,
            id: 'mid',
            sourceTitle: 'Mid score pop news',
            relevanceScore: 60,
            status: 'new',
            generatedSongs: [],
          },
        ]}
      />
    );
    const titles = Array.from(container.querySelectorAll('article h3, article a.block')).map((el) =>
      el.textContent?.trim()
    );
    expect(titles[0]).toBe('High score viral drama');
    expect(titles[1]).toBe('Mid score pop news');
    expect(titles[2]).toBe('Low score gossip');
  });

  it('支持隐藏低分不契合主题的噪音新闻', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
    render(
      <StoryRadar
        candidates={[
          {
            ...base,
            id: 'low',
            sourceTitle: 'Low score gossip',
            relevanceScore: 10,
            status: 'new',
            generatedSongs: [],
          },
          {
            ...base,
            id: 'high',
            sourceTitle: 'High score viral drama',
            relevanceScore: 90,
            status: 'new',
            generatedSongs: [],
          },
        ]}
      />
    );
    expect(screen.getByText('Low score gossip')).toBeTruthy();
    expect(screen.getByText('High score viral drama')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Hide Low-Score|仅看契合主题/ }));
    expect(screen.queryByText('Low score gossip')).toBeNull();
    expect(screen.getByText('High score viral drama')).toBeTruthy();
  });
});
