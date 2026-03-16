import { HeroUI } from '@/components/ui/hero';
import { getTranslations } from 'next-intl/server';

export default async function HeroSection() {
  return (
    <HeroUI
      title="ScoopRYM"
      subtitle={
        <>
          Turn <span className="font-extrabold text-cyan-600 drop-shadow-sm">headlines</span>,{' '}
          <span className="font-extrabold text-pink-600 drop-shadow-sm">drama</span>, and{' '}
          <span className="font-extrabold text-orange-600 drop-shadow-sm">gossip</span> into{' '}
          <span className="text-slate-900 drop-shadow-md font-black text-[1.3em]">AI Parody Songs</span>.
        </>
      }
      callToAction={{
        text: 'Start Creating',
        href: '#generator',
      }}
      className="min-h-[80vh]"
    />
  );
}
