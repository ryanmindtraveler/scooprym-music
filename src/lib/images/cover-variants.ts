import manifest from './cover-manifest.json';

export const COVER_WIDTHS = [160, 480, 1024] as const;
export const COVER_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const historicalCovers: Record<string, string> = manifest;
const familyPattern = /\/cover-v1-[a-f0-9]{64}\/w(\d+)\.webp$/;

/** 只有全部尺寸上传成功的版本化封面才使用响应式地址；旧图继续保留原地址回退。 */
export function getCoverSources(original: string) {
  const src = Object.hasOwn(historicalCovers, original) ? historicalCovers[original] : original;
  const match = src.match(familyPattern);
  if (!match) return { src, srcSet: undefined };
  const width = Number(match[1]);
  const widths = [...COVER_WIDTHS.filter((size) => size < width), width];
  return {
    src,
    srcSet: widths.map((size) => `${src.replace(/w\d+\.webp$/, `w${size}.webp`)} ${size}w`).join(', '),
  };
}

export function getSmallCoverSource(original: string) {
  const { src, srcSet } = getCoverSources(original);
  return srcSet ? srcSet.split(', ')[0].split(' ')[0] : src;
}

/** 删除一张版本化主封面时，同时清理其缩略图；普通音频与旧文件不受影响。 */
export function getCoverFamilyKeys(key: string) {
  const { srcSet } = getCoverSources(key);
  return srcSet ? srcSet.split(', ').map((entry) => entry.split(' ')[0]) : [key];
}

export function isDirectCover(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && (url.hostname.endsWith('.r2.dev') || familyPattern.test(url.pathname));
  } catch {
    return false;
  }
}
