import type { BreadcrumbList, FAQPage, WebSite, WithContext } from 'schema-dts';

export function JsonLd<T extends WithContext<any>>({ data }: { data: T }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires this
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function getWebsiteJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    alternateName: 'ScoopRYM',
    url,
    description,
  };
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; item: string }[] }) {
  const breadcrumbList: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.item,
    })),
  };

  return <JsonLd data={breadcrumbList} />;
}

export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  const faqSchema: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={faqSchema} />;
}
