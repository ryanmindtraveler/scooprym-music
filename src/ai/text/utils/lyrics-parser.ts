/**
 * Represents a single line of synced lyrics
 */
export interface LyricLine {
  time: number; // Time in seconds
  text: string; // Lyric text
}

/**
 * Parses an LRC string into an array of LyricLine objects
 * @param lrcContent The raw LRC string
 * @returns Sorted array of LyricLine objects
 */
export function parseLrc(lrcContent: string): LyricLine[] {
  if (!lrcContent) return [];

  const lines = lrcContent.split('\n');
  const lyrics: LyricLine[] = [];

  // Regex to match time tags: [mm:ss.xx] or [mm:ss:xx]
  const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Find all time tags in the line (a line might describe lyrics for multiple timestamps)
    const matches = Array.from(trimmedLine.matchAll(timeRegex));

    if (matches.length > 0) {
      // Extract the text part (remove all time tags)
      const text = trimmedLine.replace(timeRegex, '').trim();

      // Add a consolidated entry for each timestamp found using the same text
      for (const match of matches) {
        const minutes = Number.parseInt(match[1], 10);
        const seconds = Number.parseInt(match[2], 10);
        const milliseconds = Number.parseInt(match[3], 10);

        // Convert to total seconds
        // Pad milliseconds to standard ms (e.g., .2 -> .200, .20 -> .200) if needed, but usually regex captures existing digits
        // Standard LRC is usually hundredths (2 digits) or thousandths (3 digits)
        const msDivisor = match[3].length === 3 ? 1000 : 100;
        const totalSeconds = minutes * 60 + seconds + milliseconds / msDivisor;

        lyrics.push({
          time: totalSeconds,
          text: text,
        });
      }
    }
  }

  // Sort by time
  return lyrics.sort((a, b) => a.time - b.time);
}

/**
 * Finds the index of the active lyric line based on current playback time
 * @param lyrics Array of LyricLine objects
 * @param currentTime Current playback time in seconds
 * @returns Index of the active line, or -1 if none
 */
export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics.length) return -1;

  // Find the last line that has a start time <= current time
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }

  return -1; // Before first lyric
}
