import { HeroUI } from '@/components/ui/hero';
import { getTranslations } from 'next-intl/server';

export default async function HeroSection() {
  // const t = await getTranslations('HomePage.hero');

  return (
    <HeroUI
      title="ScoopRYM"
      subtitle={
        <>
          Turning <span className="font-extrabold text-indigo-900">news</span>,{' '}
          <span className="font-extrabold text-purple-900">entertainment</span>, and{' '}
          <span className="font-extrabold text-pink-900">gossip</span> into{' '}
          <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-black text-[1.3em] drop-shadow-sm">
            Music Beats
          </span>
          .
        </>
      }
      callToAction={{
        text: 'Start Dissing',
        href: '#generator',
      }}
      className="min-h-[80vh]"
    />
  );
}
