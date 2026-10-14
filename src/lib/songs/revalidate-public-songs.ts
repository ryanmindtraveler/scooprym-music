import { revalidatePath } from 'next/cache';

// 发布、下架和排期共享失效范围，涵盖国际化路由及其弹窗和用户列表。
export function revalidatePublicSongs() {
  revalidatePath('/');
  revalidatePath('/songs');
  revalidatePath('/internet-lore');
  revalidatePath('/[locale]/(marketing)/internet-lore/[slug]', 'page');
  revalidatePath('/[locale]', 'layout');
  revalidatePath('/sitemap.xml');
}
