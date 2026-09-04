import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default function LegacyCreditsPage() {
  redirect(Routes.SettingsCredits);
}
