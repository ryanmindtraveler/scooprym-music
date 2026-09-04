import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect(Routes.AdminDashboard);
}
