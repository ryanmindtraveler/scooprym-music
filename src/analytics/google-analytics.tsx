'use client';

import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';

const CANONICAL_ANALYTICS_ORIGIN = 'https://scooprym.app';

/**
 * Google Analytics
 *
 * https://analytics.google.com
 * https://mksaas.com/docs/analytics#google
 * https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries#google-analytics
 */
export default function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  if (!analyticsId) {
    return null;
  }

  // Only enable the production GA property on the canonical production origin.
  // This prevents preview/staging deployments from polluting the main GA4 reports.
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || CANONICAL_ANALYTICS_ORIGIN;

  if (configuredBaseUrl.replace(/\/$/, '') !== CANONICAL_ANALYTICS_ORIGIN) {
    return null;
  }

  return <NextGoogleAnalytics gaId={analyticsId} />;
}
