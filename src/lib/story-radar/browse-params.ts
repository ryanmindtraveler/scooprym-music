export const RADAR_STATUSES = ['all', 'new', 'shortlisted', 'adopted', 'generated', 'dismissed'] as const;
export type RadarStatus = (typeof RADAR_STATUSES)[number];
export interface RadarBrowseParams {
  page: number;
  size: number;
  status: RadarStatus;
  category: string;
  q: string;
  review: boolean;
  hideLow: boolean;
}
export function parseRadarBrowseParams(input: Record<string, unknown>): RadarBrowseParams {
  const page = Number(input.page);
  const size = Number(input.size);
  return {
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1,
    size: [10, 20, 50].includes(size) ? size : 20,
    status: RADAR_STATUSES.includes(input.status as RadarStatus) ? (input.status as RadarStatus) : 'all',
    category: ['celebrity_drama', 'internet_chaos', 'absurd_headlines'].includes(String(input.category))
      ? String(input.category)
      : 'all',
    q: typeof input.q === 'string' ? input.q.trim().slice(0, 200) : '',
    review: input.review === 'true' || input.review === true,
    hideLow: input.hideLow === 'true' || input.hideLow === true,
  };
}
export function radarBrowseSearch(params: RadarBrowseParams) {
  return new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();
}
export interface RadarBrowseView {
  params: RadarBrowseParams;
  total: number;
  counts: Record<RadarStatus, number>;
}
