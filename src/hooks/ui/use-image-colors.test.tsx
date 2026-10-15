import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), palette: vi.fn() }));
vi.mock('node-vibrant/browser', () => ({ Vibrant: { from: mocks.from } }));
import { useImageColors } from './use-image-colors';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe('详情页取色资源', () => {
  it('代理请求最小预生成图，避免为取色重新下载主图', async () => {
    mocks.palette.mockResolvedValue({ Vibrant: { hex: '#112233' } });
    mocks.from.mockReturnValue({ getPalette: mocks.palette });
    const family = `https://covers.example.com/song-covers/one/cover-v1-${'a'.repeat(64)}`;
    const { result } = renderHook(() => useImageColors(`${family}/w1024.webp`));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mocks.from).toHaveBeenCalledWith(`/api/proxy-image?url=${encodeURIComponent(`${family}/w160.webp`)}`);
    expect(result.current.primary).toBe('#112233');
  });
  it('取色失败保持默认颜色，不阻断详情页', async () => {
    mocks.palette.mockRejectedValue(new Error('image unavailable'));
    mocks.from.mockReturnValue({ getPalette: mocks.palette });
    const { result } = renderHook(() => useImageColors('https://example.com/legacy.png'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.primary).toBe('#64748b');
  });
});
