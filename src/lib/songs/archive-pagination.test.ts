import { describe, expect, it } from 'vitest';
import { getArchivePagePath, parseArchivePage } from './archive-pagination';

describe('公开曲库分页', () => {
  it('首页与后续页面有各自的稳定地址', () => {
    expect(parseArchivePage(undefined)).toBe(1);
    expect(parseArchivePage('2')).toBe(2);
    expect(getArchivePagePath(1)).toBe('/songs');
    expect(getArchivePagePath(2)).toBe('/songs?page=2');
  });
  it.each(['0', '-1', '1.5', '02', '', 'NaN', '1e3', '99999999999999999999', ['2', '3']])(
    '拒绝非规范或重复页码 %s',
    (value) => expect(parseArchivePage(value)).toBeNull()
  );
});
