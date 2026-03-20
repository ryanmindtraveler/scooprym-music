'use client';

import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { usePathname, useRouter } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

import { toast } from 'sonner';

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
  clientId?: string;
  select_by_user?: boolean;
}

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
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Routes where One Tap should NOT appear
  const isAuthRoute = pathname?.includes(Routes.Login) || pathname?.includes(Routes.Register);
  const isHomepage = pathname === '/' || /^\/[a-z]{2}$/.test(pathname || '');
  const shouldEnableOneTap = process.env.NODE_ENV === 'production' && isHomepage && !isAuthRoute;

  useEffect(() => {
    if (isPending || session || !shouldEnableOneTap || !scriptLoaded) {
      return;
    }

    if (!(window as any).google) {
      console.error('Google One Tap: Script not loaded despite onLoad callback');
      return;
    }

    // Prevent duplicate initialization if already rendered
    // typically One Tap handles this safely, but good to be mindful

    console.log('Initializing Google One Tap (Manual Callback Mode)...');

    const google = (window as unknown as { google: any }).google;

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: async (response: GoogleCredentialResponse) => {
        console.log('One Tap Credential Received');
        const { credential } = response;

        if (!credential) {
          console.error('No credential received from One Tap');
          return;
        }

        try {
          // "Fundamental Solution": Send token to backend via authClient
          // The idToken field for Google provider in Better Auth typically expects the string directly OR an object depending on the specific plugin/adapter.
          // Based on previous TS error, we are passing it as an object to match the expected type signature.
          await authClient.signIn.social({
            provider: 'google',
            idToken: { token: credential } as any, // Keeping mild cast to be safe against complex union types, but properly structured
            callbackURL: pathname || '/',
          });

          console.log('One Tap Login Success');
          toast.success('Logged in with Google');
          await refetch();
          router.refresh();
        } catch (error: any) {
          console.error('One Tap Verification Error:', error);
          toast.error(error?.message || 'Failed to login with Google One Tap');
        }
      },
      auto_select: false, // Explicitly disable auto-select to avoid loop issues
      use_fedcm_for_prompt: true, // Crucial for modern browser support (Chrome 117+)
    });

    google.accounts.id.prompt((notification: any) => {
      console.log(
        'One Tap Prompt Status:',
        notification.getMomentType(),
        notification.isNotDisplayed() ? 'Not Displayed' : 'Displayed'
      );
    });
  }, [session, isPending, scriptLoaded, shouldEnableOneTap, router, refetch, pathname]);

  if (!shouldEnableOneTap) {
    return null;
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
    />
  );
}
