import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SongCoverImage } from './song-cover-image';

vi.mock('next/image', () => ({
  default: ({ fill, priority, unoptimized, ...props }: Record<string, unknown>) => (
    <img {...props} alt={String(props.alt || '')} data-original={String(!!unoptimized)} />
  ),
}));

afterEach(cleanup);

describe('详情封面恢复', () => {
  it('存储桶封面直接加载，绕过返回 402 的优化服务', () => {
    render(<SongCoverImage src="https://pub-example.r2.dev/song-covers/cover.png" alt="Song cover" sizes="560px" />);
    expect(screen.getByRole('img').getAttribute('data-original')).toBe('true');
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img').tagName).toBe('DIV');
  });

  it('优化失败后请求原图，原图失败后不再露出破图文字', () => {
    render(<SongCoverImage src="https://example.com/cover.png" alt="Song cover" sizes="560px" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img').getAttribute('data-original')).toBe('true');
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img').tagName).toBe('DIV');
    expect(screen.getByRole('img').textContent).toBe('');
  });

  it('切换歌曲后重新尝试新封面', () => {
    const { rerender } = render(<SongCoverImage src="/first.png" alt="Song cover" sizes="560px" />);
    fireEvent.error(screen.getByRole('img'));
    fireEvent.error(screen.getByRole('img'));
    rerender(<SongCoverImage src="/second.png" alt="Song cover" sizes="560px" />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('/second.png');
    expect(screen.getByRole('img').getAttribute('data-original')).toBe('false');
  });

  it.each([null, '/images/funny-censored-fallback.png'])('缺图和旧文字占位图都使用无文字唱片：%s', (src) => {
    render(<SongCoverImage src={src} alt="Song cover" sizes="560px" />);
    expect(screen.getByRole('img').tagName).toBe('DIV');
    expect(screen.getByRole('img').textContent).toBe('');
  });
});
