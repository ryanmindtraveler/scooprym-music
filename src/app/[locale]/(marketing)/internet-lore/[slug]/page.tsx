import { InternetLoreTopicView } from '@/components/internet-lore/internet-lore-topic-view';
import { JsonLd } from '@/components/seo/json-ld';
import { getLoreTopicArchiveCases } from '@/lib/internet-lore/archive-cases';
import { getInternetLoreTopicContent } from '@/lib/internet-lore/queries';
import { getInternetLoreTopic } from '@/lib/internet-lore/topics';
import { constructMetadata } from '@/lib/seo/metadata';
import { getCanonicalBaseUrl } from '@/lib/urls/urls';
import { notFound } from 'next/navigation';
import type { CollectionPage, WithContext } from 'schema-dts';

// 专题正文稳定，歌曲需在每次请求时遵循公开条件。
export const dynamic = 'force-dynamic';

type TopicPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = getInternetLoreTopic(slug);
  if (!topic) notFound();
  return constructMetadata({
    title: `${topic.title}: Original Archive | Internet Lore`,
    description: topic.description,
    locale: 'en',
    pathname: `/internet-lore/${topic.slug}`,
    includeDefaultKeywords: false,
  });
}

export default async function InternetLoreTopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = getInternetLoreTopic(slug);
  if (!topic) notFound();
  const { entries, songs } = await getInternetLoreTopicContent(slug);
  const cases = getLoreTopicArchiveCases(topic);
  const baseUrl = getCanonicalBaseUrl();
  const url = new URL(`/internet-lore/${topic.slug}`, baseUrl).href;
  const data: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: topic.title,
    description: topic.description,
    url,
    inLanguage: 'en',
    isPartOf: { '@type': 'CollectionPage', name: 'Internet Lore', url: new URL('/internet-lore', baseUrl).href },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Internet Lore', item: new URL('/internet-lore', baseUrl).href },
        { '@type': 'ListItem', position: 2, name: topic.title, item: url },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Original archive themes',
      numberOfItems: cases.length,
      itemListElement: cases.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: entry.title,
        url: `${url}#${entry.id}`,
        item: {
          '@type': 'CreativeWork',
          name: entry.title,
          description: entry.premise,
          url: `${url}#${entry.id}`,
          inLanguage: 'en',
        },
      })),
    },
  };
  return (
    <>
      <JsonLd data={data} />
      <InternetLoreTopicView topic={topic} entries={entries} songs={songs} />
    </>
  );
}
