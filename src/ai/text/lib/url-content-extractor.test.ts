import { describe, expect, it } from 'vitest';
import {
  assertPublicHttpUrl,
  detectUrlType,
  isBlockedIpAddress,
  isDevelopmentFakeIpResolution,
  isUrl,
} from './url-content-extractor';

describe('URL 内容提取安全边界', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.1.1',
    '::1',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
  ])('拦截私网或保留地址 %s', (address) => {
    expect(isBlockedIpAddress(address)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('允许公开地址 %s', (address) => {
    expect(isBlockedIpAddress(address)).toBe(false);
  });

  it('仅在非生产环境兼容本地代理的完整 Fake-IP 解析结果', () => {
    const fakeIpAnswers = [{ address: '198.18.1.186', family: 4 }];

    expect(isDevelopmentFakeIpResolution(fakeIpAnswers, 'development')).toBe(true);
    expect(isDevelopmentFakeIpResolution(fakeIpAnswers, 'test')).toBe(true);
    expect(isDevelopmentFakeIpResolution(fakeIpAnswers, 'production')).toBe(false);
    expect(
      isDevelopmentFakeIpResolution([...fakeIpAnswers, { address: '192.0.66.32', family: 4 }], 'development')
    ).toBe(false);
    expect(isDevelopmentFakeIpResolution([{ address: '192.168.1.8', family: 4 }], 'development')).toBe(false);
  });

  it.each(['file:///etc/passwd', 'http://localhost/admin', 'http://127.0.0.1:3000', 'http://[::1]/'])(
    '拒绝不安全的来源 URL %s',
    async (url) => {
      await expect(assertPublicHttpUrl(url)).rejects.toThrow();
    }
  );

  it('不会把查询参数中的平台域名误判成 YouTube', () => {
    expect(detectUrlType('https://example.com/?next=https://youtube.com/watch?v=abc')).toBe('generic');
    expect(detectUrlType('https://www.youtube.com/watch?v=abc')).toBe('youtube');
  });

  it('isUrl 只接受 HTTP(S)', () => {
    expect(isUrl('https://example.com/story')).toBe(true);
    expect(isUrl('javascript:alert(1)')).toBe(false);
  });
});
