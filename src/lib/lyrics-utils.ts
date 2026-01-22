/**
 * Cleans lyrics for display by removing meta-tag instructions.
 * Converts "[Verse: Fast Rap]" to "[Verse]".
 */
export function cleanLyricsForDisplay(lyrics: string | null | undefined): string {
  if (!lyrics) return '';
  return lyrics
    .replace(/\[\d{2}:\d{2}(\.\d{2,3})?\]/g, '') // Remove timestamps [00:12.00]
    .replace(/\[(.*?):\s*.*?\]/g, '[$1]') // Clean Meta-Tags
    .trim();
}
