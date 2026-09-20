import { isPublicAnalyticsLocation, recordPublicSongEvent } from '@/analytics/public-analytics';

export type SongEngagementEventType = 'detail_view' | 'play_start' | 'play_qualified' | 'play_complete' | 'share';

export function createEngagementSessionId(prefix = 'event') {
  return `${prefix}:${crypto.randomUUID()}`;
}

export function recordSongEngagement(songId: string, eventType: SongEngagementEventType, eventSessionId: string) {
  const publicAudience = isPublicAnalyticsLocation();
  return fetch(`/api/songs/${songId}/engagement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, eventSessionId }),
    keepalive: true,
  }).then((response) => {
    // 仅镜像通过服务端公开歌曲校验的事件，避免后台预览或下架内容污染 GA。
    if (response.ok && publicAudience) recordPublicSongEvent(songId, eventType, eventSessionId);
    return response;
  });
}
