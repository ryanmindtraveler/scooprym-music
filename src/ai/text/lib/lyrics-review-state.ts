import type { LyricWorkshop } from '@/types/lyric-workshop';
import { estimateLyricDurationSeconds, inspectLyricsQuality } from './lyrics-quality';

/** 编辑仅刷新本地建议，不把旧事实审核当作新歌词的结论。 */
export function refreshEditedLyricsReview(workshop: LyricWorkshop | null, lyrics: string): LyricWorkshop | null {
  if (!workshop) return null;
  const hook = workshop.hookCandidates.find((item) => item.id === workshop.selectedHookId);
  const strategy = workshop.memeStrategyCandidates?.find((item) => item.id === workshop.selectedMemeStrategyId);
  return {
    ...workshop,
    qualityGate: {
      ...workshop.qualityGate,
      passed: false,
      reviewStatus: 'stale',
      deterministicIssues: inspectLyricsQuality(lyrics, {
        lockedHook: hook?.phrase,
        propagationAction: strategy?.propagationAction,
      }),
      factualIssues: [],
      craftIssues: [],
      estimatedDurationSeconds: estimateLyricDurationSeconds(lyrics),
      repairAttempts: workshop.qualityGate?.repairAttempts || 0,
    },
  };
}
