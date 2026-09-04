import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default function LegacyProfilePage() {
  redirect(Routes.SettingsProfile);
}
