export const SONG_ARCHIVE_PAGE_SIZE = 50;

/** 拒绝重复、负数、小数及超大页码，避免产生无限抓取路径。 */
export function parseArchivePage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 1_000_000 ? page : null;
}

export function getArchivePagePath(page: number) {
  return page === 1 ? '/songs' : `/songs?page=${page}`;
}
