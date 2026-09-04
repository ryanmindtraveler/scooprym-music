export type SongEngagementEventType = 'detail_view' | 'play_start' | 'play_qualified' | 'play_complete' | 'share';

export function createEngagementSessionId(prefix = 'event') {
  return `${prefix}:${crypto.randomUUID()}`;
}

export function recordSongEngagement(songId: string, eventType: SongEngagementEventType, eventSessionId: string) {
  return fetch(`/api/songs/${songId}/engagement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, eventSessionId }),
    keepalive: true,
  });
}
