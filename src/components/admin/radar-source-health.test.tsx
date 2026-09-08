import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { RadarSourceHealth } from './radar-source-health';

afterEach(cleanup);
it('显示真实失败原因、关闭的渠道与新增和刷新计数', () => {
  const base = {
    url: 'https://example.com',
    fetched: 0,
    accepted: 0,
    needsReview: 0,
    older: 0,
    invalid: 0,
    latestPublishedAt: null,
    durationMs: 12,
  };
  render(
    <RadarSourceHealth
      scan={{
        id: 'scan',
        status: 'partial',
        startedAt: '2026-09-07T01:00:00Z',
        completedAt: '2026-09-07T01:01:00Z',
        inserted: 9,
        updated: 12,
        discovered: 21,
        error: null,
        sources: [
          { ...base, name: 'TMZ', status: 'failed', error: 'HTTP 403' },
          { ...base, name: 'GDELT', status: 'disabled' },
        ],
      }}
    />
  );
  expect(screen.getByText('PARTIAL')).toBeTruthy();
  expect(screen.getByText('HTTP 403')).toBeTruthy();
  expect(screen.getByText('Disabled')).toBeTruthy();
  expect(screen.getByText('9').parentElement?.textContent).toContain('12 existing articles refreshed');
});
