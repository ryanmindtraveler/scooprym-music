'use client';

import Script from 'next/script';

const CANONICAL_ANALYTICS_ORIGIN = 'https://www.scooprym.app';

/**
 * Clarity Analytics
 *
 * https://clarity.microsoft.com
 * https://mksaas.com/docs/analytics#clarity
 */
export default function ClarityAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!projectId) {
    return null;
  }

  // Only enable the production Clarity project on the canonical production origin.
  // This prevents preview/staging deployments from polluting the main Clarity reports.
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || CANONICAL_ANALYTICS_ORIGIN;

  if (configuredBaseUrl.replace(/\/$/, '') !== CANONICAL_ANALYTICS_ORIGIN) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity-init"
      strategy="afterInteractive"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
      dangerouslySetInnerHTML={{
        __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${projectId}");
                `,
      }}
    />
  );
}
