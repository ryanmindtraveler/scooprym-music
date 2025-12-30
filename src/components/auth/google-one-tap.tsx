'use client';

import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Google One Tap Component
 *
 * This component triggers the Better Auth One Tap login prompt.
 * It does not render any UI elements.
 *
 * One Tap logic is handled by the better-auth oneTapClient plugin configured in src/lib/auth-client.ts.
 */
export function GoogleOneTap() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending, refetch } = authClient.useSession();

  // Routes where One Tap should NOT appear
  // We check for specific auth routes to avoid false positives (e.g. /dashboard/authority)
  const isAuthRoute = pathname?.includes(Routes.Login) || pathname?.includes(Routes.Register);

  useEffect(() => {
    // If session is loading, or user is logged in, or we are on an auth page, DO NOT show One Tap
    if (isPending || session || isAuthRoute) {
      console.log('One Tap skipped: Session loading/exists or on Auth route.');
      return;
    }

    console.log('No session detected & not on auth route, initializing One Tap...');

    // @ts-ignore - Trigger Better Auth One Tap
    authClient.oneTap({
      fetchOptions: {
        onSuccess: async (ctx) => {
          console.log('One Tap Success, context:', ctx);
          // Wait a bit for the cookie to be fully propagated/set
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log('Refetching session...');
          await refetch();
          console.log('Refetch done. Refreshing router...');

          router.refresh(); // Refresh server components (e.g. Navbar)
        },
        onError: (ctx) => {
          console.error('One Tap Error:', ctx);
        },
      },
    });
  }, [session, isPending, router, refetch, isAuthRoute]);

  return null;
}
