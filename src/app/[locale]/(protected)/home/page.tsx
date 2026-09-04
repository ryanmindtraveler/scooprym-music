import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

/**
 * 旧用户首页仅用于兼容历史链接。
 */
export default async function LegacyHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  redirect(query ? `${Routes.Dashboard}?${query}` : Routes.Dashboard);
}
