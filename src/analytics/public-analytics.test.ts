import { recordSongEngagement } from '@/lib/songs/song-engagement-client';
import { sendGAEvent } from '@next/third-parties/google';
// @vitest-environment-options {"url":"https://scooprym.app"}
import { beforeEach, expect, it, vi } from 'vitest';
import {
  flushPublicSongEvents,
  isAdminAnalyticsPath,
  recordPublicSongEvent,
  setPublicAnalyticsEnabled,
} from './public-analytics';

vi.mock('@next/third-parties/google', () => ({ sendGAEvent: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
  Object.assign(window, { dataLayer: [] });
  setPublicAnalyticsEnabled(false, 'G-TEST');
  setPublicAnalyticsEnabled(true, 'G-TEST');
});

it('中文英文后台均排除，正常歌曲路径不排除', () => {
  for (const path of ['/admin', '/admin/songs', '/zh/admin/create', '/en/admin'])
    expect(isAdminAnalyticsPath(path)).toBe(true);
  expect(isAdminAnalyticsPath('/songs/admin-song')).toBe(false);
  window.history.replaceState(null, '', '/zh/admin/create');
  recordPublicSongEvent('song', 'play_start', 'admin');
  expect(sendGAEvent).not.toHaveBeenCalled();
});

it('管理员停用后不发送事件，设置官方停用开关', () => {
  setPublicAnalyticsEnabled(false, 'G-TEST');
  recordPublicSongEvent('song', 'play_start', 'disabled');
  expect((window as unknown as Record<string, unknown>)['ga-disable-G-TEST']).toBe(true);
  expect(sendGAEvent).not.toHaveBeenCalled();
});

it('同播放会话同事件只发送一次，不暴露会话标识', () => {
  recordPublicSongEvent('song', 'play_start', 'dedup');
  recordPublicSongEvent('song', 'play_start', 'dedup');
  recordPublicSongEvent('song', 'play_qualified', 'dedup');
  expect(sendGAEvent).toHaveBeenCalledTimes(2);
  expect(sendGAEvent).toHaveBeenCalledWith('event', 'song_play_start', { song_id: 'song' });
});

it('身份加载期间排队，管理员确认后丢弃', () => {
  setPublicAnalyticsEnabled(undefined, 'G-TEST');
  recordPublicSongEvent('song', 'detail_view', 'pending-admin');
  expect(sendGAEvent).not.toHaveBeenCalled();
  setPublicAnalyticsEnabled(false, 'G-TEST');
  flushPublicSongEvents();
  expect(sendGAEvent).not.toHaveBeenCalled();
});

it('标签准备后发送先到达的歌曲详情事件', () => {
  Object.assign(window, { dataLayer: undefined });
  recordPublicSongEvent('song', 'detail_view', 'pending-tag');
  expect(sendGAEvent).not.toHaveBeenCalled();
  Object.assign(window, { dataLayer: [] });
  flushPublicSongEvents();
  expect(sendGAEvent).toHaveBeenCalledTimes(1);
});

it('下架歌曲请求失败时不发送 GA，自建成功响应保持不变', async () => {
  const rejected = new Response(null, { status: 404 });
  const accepted = new Response(null, { status: 200 });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(rejected).mockResolvedValueOnce(accepted));
  expect(await recordSongEngagement('song', 'play_start', 'server-reject')).toBe(rejected);
  expect(sendGAEvent).not.toHaveBeenCalled();
  expect(await recordSongEngagement('song', 'play_start', 'server-accept')).toBe(accepted);
  expect(sendGAEvent).toHaveBeenCalledTimes(1);
  vi.unstubAllGlobals();
});
