// @vitest-environment-options {"url":"https://scooprym.app"}
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import GoogleAnalytics from './google-analytics';

const state = vi.hoisted(() => ({
  path: '/',
  pending: false,
  role: undefined as string | undefined,
  error: null as unknown,
}));
vi.mock('next/navigation', () => ({ usePathname: () => state.path }));
vi.mock('@/lib/auth/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: state.role ? { user: { role: state.role } } : null,
      isPending: state.pending,
      error: state.error,
    }),
  },
}));
vi.mock('@next/third-parties/google', () => ({
  GoogleAnalytics: () => <span data-testid="ga-script" />,
  sendGAEvent: vi.fn(),
}));

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-TEST');
  Object.assign(state, { path: '/', pending: false, role: undefined, error: null });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

it('匿名公众身份确认后加载，切换管理员后禁用已有标签', () => {
  const view = render(<GoogleAnalytics />);
  expect(screen.queryByTestId('ga-script')).not.toBeNull();
  state.role = 'admin';
  view.rerender(<GoogleAnalytics />);
  expect(screen.queryByTestId('ga-script')).toBeNull();
  expect((window as unknown as Record<string, unknown>)['ga-disable-G-TEST']).toBe(true);
});

it('身份未确定、身份请求错误和中文后台不加载', () => {
  state.pending = true;
  const view = render(<GoogleAnalytics />);
  expect(screen.queryByTestId('ga-script')).toBeNull();
  state.pending = false;
  state.error = new Error('auth unavailable');
  view.rerender(<GoogleAnalytics />);
  expect(screen.queryByTestId('ga-script')).toBeNull();
  state.error = null;
  state.path = '/zh/admin/story-radar';
  view.rerender(<GoogleAnalytics />);
  expect(screen.queryByTestId('ga-script')).toBeNull();
});

it('开发环境不加载', () => {
  vi.stubEnv('NODE_ENV', 'development');
  render(<GoogleAnalytics />);
  expect(screen.queryByTestId('ga-script')).toBeNull();
});
