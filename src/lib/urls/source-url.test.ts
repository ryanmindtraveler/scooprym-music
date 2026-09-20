import { describe, expect, it } from 'vitest';
import { getSourceUrl } from './source-url';

describe('公开新闻来源', () => {
  it.each([null, undefined, '', '工时费大公司', '/relative', 'javascript:alert(1)', 'data:text/plain,news'])(
    '拒绝非网页来源 %s',
    (value) => {
      expect(getSourceUrl(value)).toBeUndefined();
    }
  );
  it('保留真实来源地址及参数', () => {
    expect(getSourceUrl('https://example.com/article?id=2')).toBe('https://example.com/article?id=2');
  });
});
