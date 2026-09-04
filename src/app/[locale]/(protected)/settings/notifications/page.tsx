import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default function LegacyNotificationsPage() {
  redirect(Routes.SettingsNotifications);
}
