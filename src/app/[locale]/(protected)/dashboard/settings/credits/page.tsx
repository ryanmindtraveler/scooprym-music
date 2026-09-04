import CreditsPageClient from '@/components/settings/credits/credits-page-client';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

/**
 * 用户控制台积分余额与交易记录页面。
 */
export default function CreditsPage() {
  // If credits are disabled, redirect to billing page
  if (!websiteConfig.credits.enableCredits) {
    redirect(Routes.SettingsBilling);
  }

  return <CreditsPageClient />;
}
