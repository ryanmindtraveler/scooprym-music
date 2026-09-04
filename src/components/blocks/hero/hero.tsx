import { HeroUI } from '@/components/ui/hero';
import type { Song } from '@/types/song';
import { getTranslations } from 'next-intl/server';
import { HeroActions } from './hero-actions';

interface HeroSectionProps {
  featuredSong?: Song;
  songs: Song[];
}

export default async function HeroSection({ featuredSong, songs }: HeroSectionProps) {
  const t = await getTranslations('HomePage.hero');
  const generatorT = await getTranslations('HomePage.generator');

  return (
    <HeroUI
      title={
        <>
          <span className="block drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]">{t('titlePrimary')}</span>
          <span className="mt-5 block text-[0.58em] tracking-[-0.055em] sm:mt-6">{t('titleSecondary')}</span>
        </>
      }
      semanticTitle={t('semanticTitle')}
      subtitle={
        <>
          <span className="block text-lg font-extrabold leading-tight tracking-[-0.025em] text-[#201a29] drop-shadow-[0_2px_10px_rgba(255,255,255,0.72)] sm:text-xl md:text-2xl">
            <span className="text-[#087f8c]">{t('descriptionHeadlines')}</span>
            <span>, </span>
            <span className="text-[#b90851]">{t('descriptionDrama')}</span>
            <span>, and </span>
            <span className="text-[#c24f11]">{t('descriptionGossip')}</span>
          </span>
          <span className="mt-2 block text-base font-black leading-snug tracking-[-0.02em] text-[#201a29] drop-shadow-[0_2px_10px_rgba(255,255,255,0.65)] sm:text-lg md:text-xl">
            {t('descriptionLineTwo')}
          </span>
        </>
      }
      actions={
        <HeroActions
          featuredSong={featuredSong}
          songs={songs}
          playLabel={t('playNow')}
          pauseLabel={t('pause')}
          galleryLabel={t('galleryCta')}
        />
      }
      bottomMarquee={generatorT('marquee')}
      showMarquees={false}
      className="min-h-[74vh]"
    />
  );
}
