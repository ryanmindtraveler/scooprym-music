import { InternetLoreView } from '@/components/internet-lore/internet-lore-view';
import { JsonLd } from '@/components/seo/json-ld';
import { getInternetLoreTopicPreviews } from '@/lib/internet-lore/queries';
import { internetLoreTopics } from '@/lib/internet-lore/topics';
import { constructMetadata } from '@/lib/seo/metadata';
import { getCanonicalBaseUrl } from '@/lib/urls/urls';
import type { CollectionPage, WithContext } from 'schema-dts';

// 封面预览随作品公开状态更新，避免下架作品仍出现在栏目入口。
export const dynamic = 'force-dynamic';

export const metadata = constructMetadata({
  title: 'Internet Lore: Six Collections of Stories & Parody Songs',
  description:
    'Explore absurd social phenomena, entertainment, gossip and drama, news parody, meme culture and everyday contrast comedy with original ScoopRYM songs.',
  locale: 'en',
  pathname: '/internet-lore',
  includeDefaultKeywords: false,
});

export default async function InternetLorePage() {
  const previews = await getInternetLoreTopicPreviews();
  const url = new URL('/internet-lore', getCanonicalBaseUrl()).href;
  const data: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Internet Lore',
    description: 'Six thematic collections of internet stories and original parody songs.',
    url,
    inLanguage: 'en',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: internetLoreTopics.length,
      itemListElement: internetLoreTopics.map((topic, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: topic.title,
        url: `${url}/${topic.slug}`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={data} />
      <InternetLoreView topics={internetLoreTopics} previews={previews} />
    </>
  );
}
