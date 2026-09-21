'use client';

/**
 * 音乐创建表单组件 (CreateMusicForm)
 *
 * V16 Overhaul:
 * 1. Default Mode: Presents 6 "Viral Personas" (Karen, Sigma, NPC, etc.) for quick selection.
 * 2. Advanced Mode: Collapsible 2x2 grid for fine-grained 4-pillar control.
 * 3. Compact UI: Optimized for space while maintaining glassmorphism aesthetics.
 */

import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  FileText,
  Link as LinkIcon,
  Loader2,
  Music2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { recommendEditorialStyleId } from '@/lib/music/production-recipe';
import { cn } from '@/lib/utils';
import { useCreateStore } from '@/store';
import { ALL_KNOWN_TAGS, DEFAULT_CUSTOM_VIBE_PROMPT, VIBE_PERSONAS } from './create-music-data';
import { GenerationProgress } from './generation-progress';
import { ProductionRecipePreview } from './production-recipe-preview';

interface CreateMusicFormProps {
  newsLink: string;
  setNewsLink: (value: string) => void;
  newsContent: string;
  setNewsContent: (value: string) => void;
  musicPrompt: string;
  setMusicPrompt: (value: string) => void;
  newsSummary: string;
  lyrics: string;
  productionVariantId: string | null;
  setProductionVariantId: (variantId: string | null) => void;
  isProductionVariantLocked: boolean;
  setIsProductionVariantLocked: (locked: boolean) => void;
  handleGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  error?: string | null;
  musicError?: string | null;
  onClearError?: () => void;
  hasJustQueued?: boolean;
  onReset?: () => void;
}

// ==================== Main Component ====================

export function CreateMusicForm({
  newsLink,
  setNewsLink,
  newsContent,
  setNewsContent,
  musicPrompt = '',
  setMusicPrompt,
  newsSummary,
  lyrics,
  productionVariantId,
  setProductionVariantId,
  isProductionVariantLocked,
  setIsProductionVariantLocked,
  handleGenerate,
  canGenerate,
  isGenerating,
  error,
  musicError,
  onClearError,
  hasJustQueued = false,
  onReset,
}: CreateMusicFormProps) {
  const t = useTranslations('Dashboard.admin.createStudio');
  const hasActiveWorkflowTask = useCreateStore((state) =>
    state.tasks.some(
      (task) =>
        task.id === state.musicId &&
        !!state.workflowRunId &&
        task.workflowRunId === state.workflowRunId &&
        ['queued', 'processing', 'generating_cover'].includes(task.status)
    )
  );
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationNote, setRecommendationNote] = useState('');
  const recommendationRequest = useRef<AbortController | null>(null);

  // 输入、手动风格或生成状态改变后，旧推荐不得覆盖新上下文。
  useEffect(() => {
    recommendationRequest.current?.abort();
    recommendationRequest.current = null;
    setIsRecommending(false);
    setRecommendationNote('');
    return () => {
      recommendationRequest.current?.abort();
    };
  }, [newsLink, newsContent, isGenerating]);

  useEffect(() => {
    if (!recommendationRequest.current) return;
    recommendationRequest.current.abort();
    recommendationRequest.current = null;
    setIsRecommending(false);
    setRecommendationNote('');
  }, [musicPrompt]);

  const recommendStyle = async () => {
    if (recommendationRequest.current || isGenerating || (!newsLink.trim() && !newsContent.trim())) return;
    const controller = new AbortController();
    recommendationRequest.current = controller;
    setIsRecommending(true);
    setRecommendationNote('');
    const timeout = window.setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch('/api/admin/recommend-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ newsLink, newsContent }),
      });
      if (!response.ok) throw new Error('Recommendation failed');
      const result = await response.json();
      if (controller.signal.aborted || recommendationRequest.current !== controller) return;
      if (
        !VIBE_PERSONAS.some((item) => item.id === result.styleId) ||
        !Array.isArray(result.tags) ||
        !result.tags.length ||
        !result.tags.every((tag: unknown) => typeof tag === 'string' && ALL_KNOWN_TAGS.has(tag))
      ) {
        throw new Error('Invalid recommendation');
      }
      setDirectionTouched(true);
      setActivePersonaId(result.styleId);
      setVibeTags(result.tags);
      setCustomVibeText('');
      setProductionVariantId(null);
      setIsProductionVariantLocked(false);
      syncMusicPrompt(result.tags, '');
      setRecommendationNote(typeof result.reason === 'string' ? result.reason : '');
    } catch {
      if (recommendationRequest.current === controller) setRecommendationNote(t('recommendStyleError'));
    } finally {
      window.clearTimeout(timeout);
      if (recommendationRequest.current === controller) {
        recommendationRequest.current = null;
        setIsRecommending(false);
      }
    }
  };
  // Logic 1: Separate States for Independent Control
  const [activePersonaId, setActivePersonaId] = useState<string | null>(() => {
    const currentTags = musicPrompt.split(',').map((s) => s.trim());
    const matched = VIBE_PERSONAS.find((p) => p.tags.every((t) => currentTags.includes(t)));
    return matched?.id || null;
  });

  // vibeTags tracks the selections from Section 3 (Vibe Check)
  const [vibeTags, setVibeTags] = useState<string[]>(() => {
    const persona = VIBE_PERSONAS.find((p) => p.id === activePersonaId);
    if (persona) return [...persona.tags];
    return musicPrompt
      .split(',')
      .map((s) => s.trim())
      .filter((s) => ALL_KNOWN_TAGS.has(s));
  });

  const [customVibeText, setCustomVibeText] = useState(() => {
    return musicPrompt
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !ALL_KNOWN_TAGS.has(s))
      .join(', ');
  });

  // 新闻内容由系统自动分析；已有素材时默认收起，管理员需要时仍可查看或编辑。
  const [isSourceExpanded, setIsSourceExpanded] = useState(() => !newsLink && !newsContent);
  const [sourceVisibilityTouched, setSourceVisibilityTouched] = useState(false);
  const [directionTouched, setDirectionTouched] = useState(() =>
    Boolean(musicPrompt && musicPrompt !== DEFAULT_CUSTOM_VIBE_PROMPT)
  );
  const [showAllDirections, setShowAllDirections] = useState(false);

  const syncMusicPrompt = (vTags: string[] | readonly string[], customText: string) => {
    const combined = [...vTags, customText].filter(Boolean).join(', ');
    setMusicPrompt(combined);
  };

  const handlePersonaSelect = (id: string) => {
    const persona = VIBE_PERSONAS.find((p) => p.id === id);
    if (!persona) return;
    setDirectionTouched(true);
    setActivePersonaId(id);
    setVibeTags([...persona.tags]);
    setCustomVibeText(''); // Clear custom text when selecting a pure persona
    setProductionVariantId(null);
    setIsProductionVariantLocked(false);
    syncMusicPrompt(persona.tags, '');
    setShowAllDirections(false);
  };

  const handleCustomTextChange = (val: string) => {
    setCustomVibeText(val);
    syncMusicPrompt(vibeTags, val);
  };

  const storyContext = useMemo(() => (newsSummary || newsContent).trim(), [newsContent, newsSummary]);
  const recommendedPersonaId = useMemo(
    () => (storyContext ? recommendEditorialStyleId(storyContext) : null),
    [storyContext]
  );

  useEffect(() => {
    if (!newsLink && !newsContent) {
      setSourceVisibilityTouched(false);
      setIsSourceExpanded(true);
      return;
    }
    if (!sourceVisibilityTouched) setIsSourceExpanded(false);
  }, [newsContent, newsLink, sourceVisibilityTouched]);

  useEffect(() => {
    if (!recommendedPersonaId || directionTouched) return;
    const persona = VIBE_PERSONAS.find((item) => item.id === recommendedPersonaId);
    if (!persona) return;

    setActivePersonaId(persona.id);
    setVibeTags([...persona.tags]);
    setCustomVibeText('');
    setProductionVariantId(null);
    setIsProductionVariantLocked(false);
    syncMusicPrompt(persona.tags, '');
  }, [directionTouched, recommendedPersonaId, setIsProductionVariantLocked, setProductionVariantId]);

  const selectedPersona =
    VIBE_PERSONAS.find((persona) => persona.id === activePersonaId) ??
    VIBE_PERSONAS.find((persona) => persona.id === recommendedPersonaId) ??
    VIBE_PERSONAS[0];
  const directionLabel = (id: string) =>
    t.has(`directions.${id}.label` as never)
      ? t(`directions.${id}.label` as never)
      : (VIBE_PERSONAS.find((item) => item.id === id)?.label ?? id);
  const directionDescription = (id: string) =>
    t.has(`directions.${id}.description` as never)
      ? t(`directions.${id}.description` as never)
      : (VIBE_PERSONAS.find((item) => item.id === id)?.tooltip ?? '');

  // Reset local state when parent clears musicPrompt (e.g. after generation)
  // Sync Local State with Prop (Robust Handling for Resets / External Changes)
  useEffect(() => {
    // 1. Construct current local string to compare
    const currentLocal = [...vibeTags, customVibeText].filter(Boolean).join(', ');

    // 2. If Prop matches Local, do nothing to avoid loops/redraws
    if (musicPrompt === currentLocal) return;

    // 3. If Prop is different (e.g. Reset, Initial Load, or External Change), Re-Parse
    if (!musicPrompt) {
      // Special case: Empty
      setActivePersonaId(null);
      setVibeTags([]);
      setCustomVibeText('');
      setDirectionTouched(false);
      return;
    }

    const currentTags = musicPrompt.split(',').map((s) => s.trim());

    // Attempt to match a Persona
    const matched = VIBE_PERSONAS.find((p) => p.tags.every((t) => currentTags.includes(t)));

    if (matched) {
      setActivePersonaId(matched.id);
      setVibeTags([...matched.tags]);
      // Ideally, remaining text?
      // For simplicity in "Persona Mode", we often assume the Prompt IS the Persona.
      // But if there are extra tags, they should go to custom?
      // Let's stick to the "Unknown -> Custom" logic which is safer:
    } else {
      setActivePersonaId(null);
    }

    // Distribute Tags (Known vs Unknown)
    // If strict persona match, we might duplicate logic,
    // but relying on "Known Tags" is the ultimate truth for the Freestyle UI.
    // However, if we matched a Persona, we typically want vibeTags to explicitly match that Persona's tags
    // to keep the UI "Clean" (Persona Card Selected).

    if (matched) {
      // If matched, we force the Persona's definition to be the "Active Tags"
      // Any extra text in prompt is ignored? Or appended?
      // If we want "Pure", we ignore. If we want robustness, we parse rest.
      // Let's parse rest to be safe.
      const extra = currentTags.filter((t) => !matched.tags.includes(t)).join(', ');
      setCustomVibeText(extra);
    } else {
      // Freestyle Mode
      const known = currentTags.filter((s) => ALL_KNOWN_TAGS.has(s));
      const unknown = currentTags.filter((s) => s && !ALL_KNOWN_TAGS.has(s)).join(', ');
      setVibeTags(known);
      setCustomVibeText(unknown);
    }
  }, [musicPrompt]); // Depend only on prop provided by parent (Store)

  // --- Logic 2: Shake Animation on Selection ---
  const [triggerShake, setTriggerShake] = useState(false);

  useEffect(() => {
    if (activePersonaId) {
      setTriggerShake(true);
      const timer = setTimeout(() => setTriggerShake(false), 500); // 0.5s duration
      return () => clearTimeout(timer);
    }
  }, [activePersonaId]);

  const isCustomActive = !activePersonaId && (vibeTags.length > 0 || customVibeText.length > 0);

  useEffect(() => {
    if (!isProductionVariantLocked) setProductionVariantId(null);
  }, [newsContent, newsLink, isProductionVariantLocked, setProductionVariantId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Card
        className={cn(
          'flex h-full min-h-0 w-full flex-col p-4 2xl:p-5',
          'border border-slate-200/80 bg-white shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)]',
          'rounded-[24px] dark:border-white/8 dark:bg-slate-900'
        )}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-3 dark:border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <FileText className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white">{t('briefTitle')}</h3>
              <p className="text-[11px] font-medium text-slate-500">{t('briefDescription')}</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            {newsLink || newsContent ? t('storyLoaded') : t('addStory')}
          </span>
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden pr-1">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <LabelWithIcon icon={LinkIcon} label={t('storySource')} />
              {(newsLink || newsContent) && (
                <button
                  type="button"
                  onClick={() => {
                    setSourceVisibilityTouched(true);
                    setIsSourceExpanded((expanded) => !expanded);
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 transition-colors hover:text-indigo-600"
                >
                  {isSourceExpanded ? t('hideSource') : t('editSource')}
                  {isSourceExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              )}
            </div>
            {isSourceExpanded ? (
              <div className="space-y-2">
                <LabelWithIcon
                  icon={LinkIcon}
                  label={
                    <span>
                      {t('newsLink')}{' '}
                      <span className="ml-1 text-[10px] font-normal lowercase text-slate-400 opacity-80 transition-colors group-focus-within:text-indigo-400 dark:text-slate-500">
                        ({t('newsLinkHint')})
                      </span>
                    </span>
                  }
                />
                <Input
                  placeholder={t('newsLinkPlaceholder')}
                  className="h-11 rounded-xl border-slate-200/60 bg-slate-50/80 text-sm font-medium shadow-inner transition-all placeholder:text-slate-400 focus:border-indigo-500/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/5 dark:bg-slate-800/80 dark:focus:bg-slate-800"
                  value={newsLink}
                  onChange={(e) => setNewsLink(e.target.value)}
                />
                <div className="space-y-1">
                  <LabelWithIcon icon={FileText} label={t('sourceContext')} />
                  <Textarea
                    placeholder={t('sourceContextPlaceholder')}
                    className="h-36 w-full resize-none overflow-y-auto rounded-xl border-slate-200/80 bg-slate-50/70 p-3 text-sm leading-relaxed transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 dark:border-white/8 dark:bg-slate-800/70 dark:focus:bg-slate-800 2xl:h-44"
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200/70 bg-emerald-50/65 px-3 py-1.5 dark:border-emerald-400/15 dark:bg-emerald-400/5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-emerald-950 dark:text-emerald-200">{t('sourceReady')}</p>
                  <p className="truncate text-[10px] font-medium text-emerald-800/70 dark:text-emerald-300/65">
                    {t('sourceReadyDescription', { count: newsContent.length.toLocaleString() })}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="shrink-0 space-y-1.5 border-t border-slate-200/80 pt-2.5 dark:border-white/8">
            <div className="flex items-center justify-between">
              <LabelWithIcon icon={Music2} label={t('editorialDirection')} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAllDirections((visible) => !visible)}
                className="h-7 rounded-full border border-indigo-200 bg-indigo-50 px-3 text-[10px] font-black text-indigo-700 hover:bg-indigo-100"
              >
                {showAllDirections ? t('hideDirections') : t('changeDirection')}
                {showAllDirections ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </Button>
            </div>

            <div
              className={cn(
                'relative overflow-hidden rounded-xl border p-2.5 transition-all',
                'border-indigo-200/80 bg-[linear-gradient(120deg,rgba(238,242,255,0.95),rgba(253,242,248,0.72))]',
                triggerShake && 'animate-button-shake'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-indigo-100">
                  {selectedPersona?.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-white">
                      {activePersonaId === recommendedPersonaId && !directionTouched
                        ? t('autoRecommended')
                        : t('selectedDirection')}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-600/65">
                      {t('tagsReady', { count: vibeTags.length })}
                    </span>
                  </div>
                  <h4 className="mt-1 truncate text-sm font-black text-slate-950">
                    {selectedPersona ? directionLabel(selectedPersona.id) : t('analyzingDirection')}
                  </h4>
                  <p className="mt-0.5 truncate text-[10px] font-medium leading-4 text-slate-600">
                    {selectedPersona ? directionDescription(selectedPersona.id) : t('analyzingDirectionDescription')}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={recommendStyle}
                  disabled={isRecommending || isGenerating || (!newsLink.trim() && !newsContent.trim())}
                >
                  {isRecommending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {isRecommending ? t('recommendingStyle') : t('recommendStyle')}
                </Button>
                <Check className="size-5 shrink-0 text-indigo-600" />
              </div>
              {recommendationNote && (
                <p role="status" className="mt-2 text-xs text-slate-600">
                  {recommendationNote}
                </p>
              )}
            </div>

            {showAllDirections && (
              <div className="grid grid-cols-2 gap-2 pt-1 2xl:grid-cols-3">
                {VIBE_PERSONAS.map((persona) => {
                  const isThisActive = activePersonaId === persona.id;

                  return (
                    <TooltipProvider key={persona.id}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handlePersonaSelect(persona.id)}
                            className={cn(
                              'group relative flex min-h-14 items-center gap-2 rounded-xl border p-2 text-left transition-all active:scale-[0.98]',
                              isThisActive
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-500/10'
                                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                            )}
                          >
                            {isThisActive && (
                              <div className="absolute -right-1.5 -top-1.5 z-20 animate-in rounded-full bg-indigo-500 p-0.5 text-white shadow-sm zoom-in duration-200">
                                <Check className="size-2.5 stroke-[4px]" />
                              </div>
                            )}
                            <div className="shrink-0 text-lg transition-transform group-hover:scale-110">
                              {persona.icon}
                            </div>
                            <div className="pointer-events-none flex min-w-0 flex-col">
                              <span className="truncate text-[11px] font-black text-slate-900">
                                {directionLabel(persona.id)}
                              </span>
                              <span className="mt-0.5 line-clamp-2 text-[9px] font-medium leading-3 text-slate-500">
                                {directionDescription(persona.id)}
                              </span>
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="text-xs bg-black/90 text-white px-3 py-1.5 border-none max-w-[220px]"
                        >
                          <p>{directionDescription(persona.id)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-1.5 border-t border-slate-200/80 pt-2.5 dark:border-white/8">
            <LabelWithIcon icon={Sparkles} label={t('productionRecipe')} />
            <ProductionRecipePreview
              direction={musicPrompt}
              storyContext={newsSummary || newsContent.slice(0, 2_000)}
              lyrics={lyrics}
              variantId={productionVariantId}
              locked={isProductionVariantLocked}
              onVariantChange={setProductionVariantId}
              onLockChange={setIsProductionVariantLocked}
              onFineTune={() => setShowAllDirections(true)}
            />
          </section>

          <section className="space-y-1.5 border-t border-slate-200/80 pt-3 dark:border-white/8">
            <div className="flex justify-between items-center px-1">
              <LabelWithIcon icon={Sparkles} label={t('fineTune')} />
              <span className="text-[10px] font-bold text-slate-400">{customVibeText.length}/50</span>
            </div>
            <Input
              placeholder={t('fineTunePlaceholder')}
              className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-sm transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-black/20"
              value={customVibeText}
              maxLength={50}
              onChange={(e) => handleCustomTextChange(e.target.value)}
            />
          </section>

          <div className="flex shrink-0 gap-2 border-t border-slate-200/80 pt-3 dark:border-white/8">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setNewsLink('');
                      setNewsContent('');
                      setMusicPrompt('');
                      setProductionVariantId(null);
                      setIsProductionVariantLocked(false);
                    }}
                    className="size-11 shrink-0 rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-white/10 dark:hover:border-red-900/50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="size-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('clearForm')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="min-w-0 flex-1 space-y-2">
              {(isGenerating || hasActiveWorkflowTask) && <GenerationProgress className="shadow-none" />}
              {isGenerating ? null : hasJustQueued ? (
                <Button
                  type="button"
                  onClick={onReset}
                  className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-black tracking-wide text-white shadow-sm transition-all hover:bg-emerald-700"
                >
                  <Sparkles className="mr-2 size-4 text-white/90" />
                  {t('createAnother')}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={cn(
                    'h-11 w-full rounded-xl bg-slate-950 text-sm font-black tracking-wide text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200',
                    !canGenerate && 'cursor-not-allowed opacity-90'
                  )}
                >
                  <Sparkles className="mr-2 size-4 text-pink-300 dark:text-pink-600" />
                  {t('generate')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Modal Dialog */}
        <AlertDialog
          open={!!(error || musicError)}
          onOpenChange={(open) => {
            if (!open && onClearError) onClearError();
          }}
        >
          <AlertDialogContent className="bg-white dark:bg-zinc-900 border-red-100 dark:border-red-900/30">
            <AlertDialogHeader>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <AlertCircle className="size-5" />
                <AlertDialogTitle className="text-lg font-bold">
                  {(error || musicError)?.includes('2013') || (error || musicError)?.includes('sensitive')
                    ? 'Content Safety Policy'
                    : (error || musicError)?.includes('1008') ||
                        (error || musicError)?.includes('insufficient balance') ||
                        (error || musicError)?.includes('Insufficient credits')
                      ? 'Insufficient Credits'
                      : 'Generation Interrupted'}
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                {(error || musicError)?.includes('2013') || (error || musicError)?.includes('sensitive')
                  ? 'Your lyrics contain content that may violate safety guidelines (e.g. violence, explicit themes, or sensitive topics). Please revise your lyrics and try again.'
                  : (error || musicError)?.includes('1008') ||
                      (error || musicError)?.includes('insufficient balance') ||
                      (error || musicError)?.includes('Insufficient credits')
                    ? 'Insufficient Credits: You have run out of generation credits.'
                    : error || musicError}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClearError} className="bg-red-500 hover:bg-red-600 text-white border-none">
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}

// ==================== Sub-components ====================

// ==================== Sub-components ====================

function LabelWithIcon({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ElementType;
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 px-1 transition-colors duration-300', className)}>
      <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-500/20 group-focus-within:bg-indigo-100 dark:group-focus-within:bg-indigo-500/30 transition-colors duration-300">
        <Icon className="size-3.5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <span className="font-bold text-xs text-slate-700 dark:text-slate-200 tracking-wider group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-300 transition-colors duration-300">
        {label}
      </span>
    </div>
  );
}
