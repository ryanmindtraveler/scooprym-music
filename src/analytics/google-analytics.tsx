'use client';

import { authClient } from '@/lib/auth/auth-client';
import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  ANALYTICS_ORIGIN,
  flushPublicSongEvents,
  isAdminAnalyticsPath,
  setPublicAnalyticsEnabled,
} from './public-analytics';

/**
 * Google Analytics
 *
 * https://analytics.google.com
 * https://mksaas.com/docs/analytics#google
 * https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries#google-analytics
 */
export default function GoogleAnalytics() {
  const { data: session, isPending, error } = authClient.useSession();
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  useLayoutEffect(() => {
    const publicPage = Boolean(
      process.env.NODE_ENV === 'production' &&
        analyticsId &&
        window.location.origin === ANALYTICS_ORIGIN &&
        !error &&
        session?.user?.role !== 'admin' &&
        !isAdminAnalyticsPath(pathname || window.location.pathname)
    );
    const allow = publicPage && !isPending;
    setPublicAnalyticsEnabled(publicPage && isPending ? undefined : allow, analyticsId || '');
    setEnabled(allow);
    const timer = allow
      ? window.setInterval(() => {
          if (flushPublicSongEvents()) window.clearInterval(timer);
        }, 500)
      : undefined;
    return () => window.clearInterval(timer);
  }, [analyticsId, isPending, error, session?.user?.role, pathname]);

  useEffect(() => () => setPublicAnalyticsEnabled(false, analyticsId || ''), [analyticsId]);

  // 等待身份确认后才加载，管理员在公开页面的操作也不计入公众统计。
  return enabled &&
    analyticsId &&
    !isPending &&
    !error &&
    session?.user?.role !== 'admin' &&
    !isAdminAnalyticsPath(pathname || '') ? (
    <NextGoogleAnalytics gaId={analyticsId} />
  ) : null;
}
