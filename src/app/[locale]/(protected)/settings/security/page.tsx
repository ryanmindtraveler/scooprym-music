import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default function LegacySecurityPage() {
  redirect(Routes.SettingsSecurity);
}
