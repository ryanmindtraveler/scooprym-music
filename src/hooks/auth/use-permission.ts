'use client';

import { useCurrentUser } from '@/hooks/auth/use-current-user';
import { Routes } from '@/routes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useActionPermission() {
  const user = useCurrentUser();
  const router = useRouter();

  const isLoggedIn = !!user;

  const checkLike = () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to like songs', {
        action: {
          label: 'Sign In',
          onClick: () => router.push(Routes.Login),
        },
      });
      return false;
    }
    return true;
  };

  const checkDownload = () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to download', {
        action: {
          label: 'Sign In',
          onClick: () => router.push(Routes.Login),
        },
      });
      return false;
    }

    return true;
  };

  return {
    isLoggedIn,
    checkLike,
    checkDownload,
  };
}
