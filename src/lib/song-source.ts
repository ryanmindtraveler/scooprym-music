type NullableString = string | null | undefined;

export interface SongSourceLike {
  sourceSummary?: NullableString;
  newsSummary?: NullableString;
  sourceText?: NullableString;
  newsContent?: NullableString;
  sourceUrl?: NullableString;
  newsLink?: NullableString;
}

function toOptionalString(value: NullableString) {
  return value ? value : undefined;
}

export interface SongSourceCompatFields {
  sourceSummary?: string;
  newsSummary?: string;
  sourceText?: string;
  newsContent?: string;
  sourceUrl?: string;
  newsLink?: string;
}

export function getSongSourceSummary(song: SongSourceLike) {
  return toOptionalString(song.sourceSummary) || toOptionalString(song.newsSummary);
}

export function getSongSourceText(song: SongSourceLike) {
  return toOptionalString(song.sourceText) || toOptionalString(song.newsContent);
}

export function getSongSourceUrl(song: SongSourceLike) {
  return toOptionalString(song.sourceUrl) || toOptionalString(song.newsLink);
}

export function getSongSourceCompatFields(song: SongSourceLike): SongSourceCompatFields {
  const sourceSummary = getSongSourceSummary(song);
  const sourceText = getSongSourceText(song);
  const sourceUrl = getSongSourceUrl(song);

  return {
    sourceSummary,
    newsSummary: sourceSummary,
    sourceText,
    newsContent: sourceText,
    sourceUrl,
    newsLink: sourceUrl,
  };
}
