import { HeroUI } from '@/components/ui/hero';
import { getTranslations } from 'next-intl/server';

export default async function HeroSection() {
  const t = await getTranslations('HomePage.hero');

  return (
    <HeroUI
      title="ScoopRYM"
      semanticTitle={t('semanticTitle')}
      subtitle={t.rich('subtitle', {
        headlines: (chunks) => <span className="font-extrabold text-cyan-600 drop-shadow-sm">{chunks}</span>,
        drama: (chunks) => <span className="font-extrabold text-pink-600 drop-shadow-sm">{chunks}</span>,
        gossip: (chunks) => <span className="font-extrabold text-orange-600 drop-shadow-sm">{chunks}</span>,
        songs: (chunks) => <span className="text-slate-900 drop-shadow-md font-black text-[1.3em]">{chunks}</span>,
      })}
      callToAction={{
        text: 'Start Creating',
        href: '#generator',
      }}
      className="min-h-[80vh]"
    />
  );
}
