'use client';

import { useCurrentUser } from '@/hooks/auth/use-current-user';
import { useCurrentPlan } from '@/hooks/billing/use-payment';
import { Routes } from '@/routes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useActionPermission() {
  const user = useCurrentUser();
  const { data: planData } = useCurrentPlan(user?.id);
  const router = useRouter();

  const isLoggedIn = !!user;
  // Check if subscription or lifetime plan is active
  const isPaidUser = !!(planData?.subscription?.status === 'active' || planData?.currentPlan?.isLifetime);

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

    if (!isPaidUser) {
      toast.error('Downloads are available for paid users only', {
        action: {
          label: 'Upgrade',
          onClick: () => router.push(Routes.SettingsBilling),
        },
      });
      return false;
    }
    return true;
  };

  return {
    isLoggedIn,
    isPaidUser,
    checkLike,
    checkDownload,
  };
}
