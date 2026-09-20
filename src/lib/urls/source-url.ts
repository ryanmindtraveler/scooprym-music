/** 历史来源字段可能包含普通文字，仅允许作为外链的完整 HTTP(S) 地址。 */
export function getSourceUrl(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
