'use client';

import { Button } from '@/components/ui/button';
import {
  buildDynamicProductionRecipe,
  explainProductionRecipeSelection,
  getProductionVariantsForStyle,
} from '@/lib/music/production-recipe';
import { cn } from '@/lib/utils';
import { AudioLines, Lock, RefreshCw, SlidersHorizontal, Unlock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface ProductionRecipePreviewProps {
  direction: string;
  storyContext: string;
  lyrics: string;
  variantId: string | null;
  locked: boolean;
  onVariantChange: (variantId: string | null) => void;
  onLockChange: (locked: boolean) => void;
  onFineTune: () => void;
}

export function ProductionRecipePreview({
  direction,
  storyContext,
  lyrics,
  variantId,
  locked,
  onVariantChange,
  onLockChange,
  onFineTune,
}: ProductionRecipePreviewProps) {
  const t = useTranslations('Dashboard.admin.createStudio');
  const locale = useLocale();
  const recommendedRecipe = useMemo(
    () => buildDynamicProductionRecipe({ direction, storyContext, lyrics }),
    [direction, storyContext, lyrics]
  );
  const recipe = useMemo(
    () => buildDynamicProductionRecipe({ direction, storyContext, lyrics, variantId }),
    [direction, storyContext, lyrics, variantId]
  );

  if (!recipe || !recommendedRecipe) return null;

  const variants = getProductionVariantsForStyle(recipe.editorialStyleId);
  const selectedIndex = Math.max(
    0,
    variants.findIndex((variant) => variant.id === recipe.variantId)
  );
  const isManualChoice = recipe.variantId !== recommendedRecipe.variantId;
  const directionTranslationId = recipe.editorialStyleId === 'custom_vibe' ? 'viral_pop' : recipe.editorialStyleId;

  const cycleVariant = () => {
    const next = variants[(selectedIndex + 1) % variants.length];
    if (next) onVariantChange(next.id);
  };

  const toggleLock = () => {
    if (locked) {
      onLockChange(false);
      return;
    }

    onVariantChange(recipe.variantId);
    onLockChange(true);
  };

  return (
    <section
      aria-label={t('recommendedRecipe')}
      className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-[#fffaf0] dark:border-amber-300/15 dark:bg-[#17140f]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-amber-400/70" />
      <div className="absolute -right-10 -top-12 size-28 rounded-full border-[18px] border-slate-950/[0.035] dark:border-white/[0.025]" />

      <div className="relative px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-0.5 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-pink-600 dark:text-pink-400">
              <AudioLines className="size-3" />
              {t('producerPick')}
              <span className="rounded-full bg-slate-950 px-1.5 py-0.5 tracking-normal text-white dark:bg-white dark:text-slate-950">
                {selectedIndex + 1}/{variants.length}
              </span>
            </div>
            <div className="flex min-w-0 items-baseline gap-2">
              <h4 className="truncate text-sm font-black tracking-tight text-slate-950 dark:text-white 2xl:text-[15px]">
                {t.has(`productionVariants.${recipe.variantId}` as never)
                  ? t(`productionVariants.${recipe.variantId}` as never)
                  : recipe.variantLabel}
              </h4>
              <span className="truncate text-[10px] font-semibold text-slate-400">
                {t('viaDirection', {
                  direction: t.has(`directions.${directionTranslationId}.label` as never)
                    ? t(`directions.${directionTranslationId}.label` as never)
                    : recipe.editorialStyleLabel,
                })}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 dark:text-slate-400">
              {isManualChoice
                ? t('alternateRecipeReady')
                : locale === 'zh'
                  ? t('recipeRecommendedReason')
                  : explainProductionRecipeSelection(recipe)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cycleVariant}
              disabled={variants.length < 2}
              className="h-7 rounded-full border border-slate-200 bg-white px-2.5 text-[9px] font-black text-slate-700 shadow-sm hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              aria-label={t('nextRecipe')}
            >
              <RefreshCw className="mr-1.5 size-3" />
              {t('next')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleLock}
              className={cn(
                'size-7 rounded-full border shadow-sm transition-colors',
                locked
                  ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800 dark:border-white dark:bg-white dark:text-slate-950'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-white/5'
              )}
              aria-label={locked ? t('unlockRecipe') : t('lockRecipe')}
              title={locked ? t('recipeLocked') : t('lockRecipe')}
            >
              {locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
            </Button>
          </div>
        </div>

        {locale !== 'zh' && (
          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-dashed border-slate-200/90 pt-2.5 dark:border-white/10">
            <RecipeLine label="Foundation" value={recipe.foundation} />
            <RecipeLine label="Groove" value={recipe.groove} />
            <RecipeLine label="Vocal" value={recipe.vocal} />
            <RecipeLine label="Colors" value={recipe.colors.join(' + ')} />
          </div>
        )}
        {locale !== 'zh' && (
          <button
            type="button"
            onClick={onFineTune}
            className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-300"
          >
            <SlidersHorizontal className="size-3" />
            {t('fineTuneRecipe')}
          </button>
        )}
      </div>
    </section>
  );
}

function RecipeLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="mr-1.5 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</span>
      <span className="line-clamp-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300">{value}</span>
    </div>
  );
}
