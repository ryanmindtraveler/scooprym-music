import 'server-only';

import { randomUUID } from 'node:crypto';

export const SONG_REACTION_ACTOR_COOKIE = 'scooprym_reactor';

export function createAnonymousReactionId() {
  return randomUUID();
}

export function isValidAnonymousReactionId(value?: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function getSongReactionActorKey(userId?: string | null, anonymousId?: string | null) {
  if (userId) {
    return `user:${userId}`;
  }

  return anonymousId ? `anon:${anonymousId}` : null;
}
