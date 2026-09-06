import { Routes } from '@/routes';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ user: vi.fn(), push: vi.fn(), error: vi.fn() }));
vi.mock('@/hooks/auth/use-current-user', () => ({ useCurrentUser: mocks.user }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
import { useActionPermission } from './use-permission';

describe('歌曲操作仅要求登录', () => {
  beforeEach(() => vi.resetAllMocks());

  it('普通登录账号无需订阅即可下载和点赞', () => {
    mocks.user.mockReturnValue({ id: 'free-user' });
    const { result } = renderHook(() => useActionPermission());
    expect(result.current.checkDownload()).toBe(true);
    expect(result.current.checkLike()).toBe(true);
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it('未登录下载提示登录，不跳转付费页面', () => {
    mocks.user.mockReturnValue(undefined);
    const { result } = renderHook(() => useActionPermission());
    expect(result.current.checkDownload()).toBe(false);
    expect(mocks.error).toHaveBeenCalledWith('Please sign in to download', expect.any(Object));
    mocks.error.mock.calls[0][1].action.onClick();
    expect(mocks.push).toHaveBeenCalledWith(Routes.Login);
  });

  it('退出账号后重新禁止下载', () => {
    mocks.user.mockReturnValue({ id: 'user' });
    const { result, rerender } = renderHook(() => useActionPermission());
    expect(result.current.checkDownload()).toBe(true);
    mocks.user.mockReturnValue(undefined);
    rerender();
    expect(result.current.checkDownload()).toBe(false);
    expect(result.current.checkLike()).toBe(false);
  });
});
