import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default function LegacyBillingPage() {
  redirect(Routes.SettingsBilling);
}
