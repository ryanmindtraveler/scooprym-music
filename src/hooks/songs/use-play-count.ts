import { useCallback, useState } from 'react';

export function usePlayCount(initialPlays = 0) {
  const [plays, setPlays] = useState(initialPlays);

  const incrementPlays = useCallback(async (songId: string) => {
    // Optimistic update
    setPlays((prev) => prev + 1);

    try {
      const res = await fetch(`/api/songs/${songId}/play`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data?.success && data.data?.plays != null) {
        setPlays(data.data.plays);
      }
    } catch (error) {
      // If error, we keep the optimistic update or could revert
      console.error('Failed to increment plays', error);
    }
  }, []);

  return { plays, incrementPlays, setPlays };
}
