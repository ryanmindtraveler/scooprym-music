export interface RadarGeneratedSong {
  candidateId: string;
  id: string;
  title: string;
  audioUrl: string;
  isPublished: boolean | null;
}

export function groupRadarSongs(songs: RadarGeneratedSong[]) {
  const groups: Record<string, RadarGeneratedSong[]> = {};
  for (const song of songs) {
    const group = (groups[song.candidateId] ??= []);
    if (!group.some((existing) => existing.id === song.id)) group.push(song);
  }
  return groups;
}
