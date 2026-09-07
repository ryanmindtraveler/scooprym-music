export const SONG_REACTION_TYPES = ['clown', 'dead', 'popcorn', 'eyes', 'receipts'] as const;

export type SongReactionType = (typeof SONG_REACTION_TYPES)[number];

export type SongReactionCounts = Record<SongReactionType, number>;

export const EMPTY_SONG_REACTION_COUNTS: SongReactionCounts = {
  clown: 0,
  dead: 0,
  popcorn: 0,
  eyes: 0,
  receipts: 0,
};

export const SONG_REACTION_OPTIONS: ReadonlyArray<{
  type: SongReactionType;
  emoji: string;
  label: string;
  effectLabel: string;
}> = [
  { type: 'clown', emoji: '🤡', label: 'Clown behavior', effectLabel: 'CLOWN BEHAVIOR' },
  { type: 'dead', emoji: '💀', label: "I'm dead", effectLabel: 'I AM DONE' },
  { type: 'popcorn', emoji: '🍿', label: 'Need more', effectLabel: 'KEEP IT COMING' },
  { type: 'eyes', emoji: '👀', label: 'No way', effectLabel: 'NO WAY' },
  { type: 'receipts', emoji: '🧾', label: 'Show receipts', effectLabel: 'SOURCE CHECK' },
] as const;

export function isSongReactionType(value: unknown): value is SongReactionType {
  return typeof value === 'string' && SONG_REACTION_TYPES.includes(value as SongReactionType);
}

export function createSongReactionCounts(
  rows: ReadonlyArray<{ reactionType: string; count: number | string }>
): SongReactionCounts {
  const counts = { ...EMPTY_SONG_REACTION_COUNTS };

  for (const row of rows) {
    if (isSongReactionType(row.reactionType)) {
      counts[row.reactionType] = Number(row.count) || 0;
    }
  }

  return counts;
}
