/**
 * Cleans lyrics for display by removing meta-tag instructions.
 * Converts "[Verse: Fast Rap]" to "[Verse]".
 */
export function cleanLyricsForDisplay(lyrics: string | null | undefined): string {
  if (!lyrics) return '';
  return lyrics
    .replace(/\[(.*?):\s*.*?\]/g, '[$1]') // Clean Meta-Tags
    .trim();
}
