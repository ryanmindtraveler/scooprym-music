'use client';

import dynamic from 'next/dynamic';

const FaqSection = dynamic(() => import('./faqs'), {
  ssr: false,
});

export default function NoSsrFaqSection() {
  return <FaqSection />;
}
