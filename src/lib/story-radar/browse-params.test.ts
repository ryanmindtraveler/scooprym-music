import { describe, expect, it } from 'vitest';
import { parseRadarBrowseParams, radarBrowseSearch } from './browse-params';

describe('雷达分页参数', () => {
  it('无效与超大页码、页大小使用有界默认值', () => {
    expect(parseRadarBrowseParams({ page: '-1', size: '400', status: 'invalid' })).toMatchObject({
      page: 1,
      size: 20,
      status: 'all',
    });
    expect(parseRadarBrowseParams({ page: '999999999', size: '50' })).toMatchObject({ page: 100000, size: 50 });
  });
  it('筛选条件完整编码到 URL，中文及特殊字符往返不丢失', () => {
    const params = parseRadarBrowseParams({
      page: 2,
      size: 10,
      status: 'generated',
      q: ' 明星 & 100% ',
      category: 'celebrity_drama',
      review: true,
      hideLow: true,
    });
    expect(parseRadarBrowseParams(Object.fromEntries(new URLSearchParams(radarBrowseSearch(params))))).toEqual(params);
  });
});
