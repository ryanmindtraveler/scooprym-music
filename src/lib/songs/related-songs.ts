interface RelatedSong {
  id: string;
  title: string;
}

/** 同题作品仅保留不同歌名，避免推荐区重复展示同名生成版本。 */
export function selectRelatedSongs<T extends RelatedSong>(current: RelatedSong, candidates: T[], limit = 4): T[] {
  const normalizeTitle = (title: string) => title.trim().toLowerCase().replace(/[’‘]/g, "'");
  const seen = new Set([normalizeTitle(current.title)]);
  const selected: T[] = [];
  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    const title = normalizeTitle(candidate.title);
    if (candidate.id === current.id || !title || seen.has(title)) continue;
    seen.add(title);
    selected.push(candidate);
  }
  return selected;
}
