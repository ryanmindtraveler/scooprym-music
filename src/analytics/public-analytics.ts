import { sendGAEvent } from '@next/third-parties/google';

export const ANALYTICS_ORIGIN = 'https://scooprym.app';
let audienceEnabled: boolean | undefined;
const sentEvents = new Set<string>();
const pendingEvents: Array<[string, string, string]> = [];

export function isAdminAnalyticsPath(pathname: string) {
  return /^\/(?:en\/|zh\/)?admin(?:\/|$)/.test(pathname);
}

export function setPublicAnalyticsEnabled(enabled: boolean | undefined, measurementId: string) {
  audienceEnabled = enabled;
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = !enabled;
  }
  if (enabled === false) pendingEvents.length = 0;
}

export function isPublicAnalyticsLocation() {
  return (
    typeof window !== 'undefined' &&
    window.location.origin === ANALYTICS_ORIGIN &&
    !isAdminAnalyticsPath(window.location.pathname)
  );
}

export function recordPublicSongEvent(songId: string, eventType: string, eventSessionId: string) {
  if (!isPublicAnalyticsLocation() || audienceEnabled === false) return;
  if (audienceEnabled === undefined || !Array.isArray((window as unknown as { dataLayer?: unknown }).dataLayer)) {
    if (pendingEvents.length < 100) pendingEvents.push([songId, eventType, eventSessionId]);
    return;
  }
  const key = `${songId}:${eventType}:${eventSessionId}`;
  if (sentEvents.has(key)) return;
  // GA 故障不能影响播放器或自建统计；不向第三方传递用户或会话标识。
  try {
    sendGAEvent('event', `song_${eventType}`, {
      song_id: songId,
      ...(eventType === 'share' ? { method: 'copy_link' } : {}),
    });
    sentEvents.add(key);
    // 限制长时间打开页面的内存占用。
    if (sentEvents.size > 2000) sentEvents.delete(sentEvents.values().next().value!);
  } catch {
    // 保留业务操作结果，不因第三方统计失败而报错。
  }
}

export function flushPublicSongEvents() {
  for (const event of pendingEvents.splice(0)) recordPublicSongEvent(...event);
  return typeof window !== 'undefined' && Array.isArray((window as unknown as { dataLayer?: unknown }).dataLayer);
}
