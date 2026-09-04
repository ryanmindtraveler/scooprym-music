import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

/**
 * 兼容旧的个人歌曲链接。
 */
export default function LegacyMySongsPage() {
  redirect(Routes.MySongs);
}
