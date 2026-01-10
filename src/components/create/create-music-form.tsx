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
  FileText,
  Info,
  Link as LinkIcon,
  Loader2,
  Music2,
  Sparkles,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCreateStore } from '@/store';
import { ALL_KNOWN_TAGS, DEFAULT_CUSTOM_VIBE_PROMPT, MUSIC_STYLE_CATEGORIES, VIBE_PERSONAS, getActiveStyle } from './create-music-data';
import { GenerationProgress } from './generation-progress';



interface CreateMusicFormProps {
  newsLink: string;
  setNewsLink: (value: string) => void;
  newsContent: string;
  setNewsContent: (value: string) => void;
  musicPrompt: string;
  setMusicPrompt: (value: string) => void;
  handleGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  musicCreditCost: number;
  error?: string | null;
  musicError?: string | null;
  isAdmin?: boolean;
  onClearError?: () => void;
}





// ==================== Main Component ====================

export function CreateMusicForm({
  newsLink,
  setNewsLink,
  newsContent,
  setNewsContent,
  musicPrompt = '',
  setMusicPrompt,
  handleGenerate,
  canGenerate,
  isGenerating,
  musicCreditCost,
  error,
  musicError,
  isAdmin = false,
  onClearError,
}: CreateMusicFormProps) {
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

  // State for Popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const syncMusicPrompt = (vTags: string[] | readonly string[], customText: string) => {
    const combined = [...vTags, customText].filter(Boolean).join(', ');
    setMusicPrompt(combined);
  };

  const handlePersonaSelect = (id: string) => {
    const persona = VIBE_PERSONAS.find((p) => p.id === id);
    if (!persona) return;
    setActivePersonaId(id);
    setVibeTags([...persona.tags]);
    setCustomVibeText(''); // Clear custom text when selecting a pure persona
    syncMusicPrompt(persona.tags, '');
  };

  const handleCustomTextChange = (val: string) => {
    setCustomVibeText(val);
    syncMusicPrompt(vibeTags, val);
  };

  const toggleTag = (tag: string) => {
    let newTags: string[];
    if (vibeTags.includes(tag)) {
      newTags = vibeTags.filter((t) => t !== tag);
    } else {
      newTags = [...vibeTags, tag];
    }
    setVibeTags(newTags);
    setActivePersonaId(null);
    syncMusicPrompt(newTags, customVibeText);
  };

  const selectedTags = useMemo(() => vibeTags, [vibeTags]);

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
         const extra = currentTags.filter(t => !matched.tags.includes(t)).join(', ');
         setCustomVibeText(extra);
    } else {
         // Freestyle Mode
         const known = currentTags.filter(s => ALL_KNOWN_TAGS.has(s));
         const unknown = currentTags.filter(s => s && !ALL_KNOWN_TAGS.has(s)).join(', ');
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

  return (
    <div className="flex flex-col">

      <Card
        className={cn(
          'p-5 flex flex-col w-full',
          'shadow-2xl shadow-indigo-500/10',
          'bg-white/80 dark:bg-zinc-900/90', // More transparency for glassmorphism
          'bg-linear-to-b from-white to-purple-50/30 dark:from-zinc-900 dark:to-zinc-900/50', // Subtle mesh gradient
          'border border-white/50 dark:border-white/5 backdrop-blur-xl rounded-[32px]', // Increased blur and roundedness
          'transition-all duration-300'
        )}
      >
        {/* Header Section */}
        <div className="flex items-center gap-3 pb-2 border-b border-purple-100/50 dark:border-white/5 mb-1 shrink-0">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-indigo-950 dark:text-indigo-50">Scoop Content</h3>
          </div>
        </div>

        {/* Form Body - flex-none to condense content, empty space will be below footer */}
        <div className="flex-1 min-h-0 pr-1 flex flex-col space-y-2 mt-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* 1. News Link Input */}
          <div className="space-y-1">
            <LabelWithIcon
              icon={LinkIcon}
              label={
                <span>
                  1. News Link{' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal ml-1 text-[10px] lowercase opacity-80">
                    (or fill Content below)
                  </span>
                </span>
              }
            />
            <Input
              placeholder="Paste a URL..."
              className="h-10 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm rounded-xl placeholder:text-slate-400 shadow-sm"
              value={newsLink}
              onChange={(e) => setNewsLink(e.target.value)}
            />
          </div>

          {/* 2. Content Input */}
          <div className="space-y-1 flex flex-col">
            <LabelWithIcon
              icon={FileText}
              label={
                <span>
                  2. Content / Context{' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal ml-1 text-[10px] lowercase opacity-80">
                    (or paste Link above)
                  </span>
                </span>
              }
            />
            <Textarea
              placeholder="Paste the article text or describe the vibe..."
              className="w-full h-48 resize-none overflow-y-auto bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm rounded-xl placeholder:text-slate-400 leading-relaxed custom-scrollbar shadow-sm"
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
            />
          </div>

          {/* 3. Vibe Check */}
          <div className="space-y-2 mt-2 shrink-0">
            <div className="flex items-center justify-between">
              {/* POPOVER TRIGGER */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <div className="flex items-center justify-between w-full">
                  <LabelWithIcon icon={Music2} label="3. Vibe Check" />

                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-6 px-3 text-xs font-black tracking-wide transition-all border border-transparent',
                        isPopoverOpen
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700'
                          : activePersonaId
                            ? cn(
                                'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-zinc-900',
                                triggerShake && 'animate-button-shake'
                              )
                            : 'text-indigo-600/80 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 border-indigo-200/50'
                      )}
                    >
                      {isPopoverOpen ? 'Close Freestyle' : 'Freestyle'}
                      {isPopoverOpen ? (
                        <ChevronUp className="ml-1.5 size-3.5" />
                      ) : (
                        <ChevronDown className="ml-1.5 size-3.5" />
                      )}
                    </Button>
                  </PopoverTrigger>
                </div>

                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  className="w-[320px] sm:w-[640px] p-0 border-none bg-transparent shadow-none outline-none z-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/30 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {MUSIC_STYLE_CATEGORIES.map((category) => (
                      <div key={category.id} className="flex flex-col gap-1.5 p-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[12px] font-bold text-indigo-900 dark:text-indigo-200 tracking-tight opacity-90">
                            {category.title}
                          </h4>
                          <TooltipProvider>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <div className="cursor-help opacity-40 hover:opacity-100 transition-opacity">
                                  <Info className="size-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="max-w-[200px] text-[10px] bg-black/90 text-white border-none"
                              >
                                <p>{category.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {category.tags.map((tagObj) => {

                            const isSelected = selectedTags.includes(tagObj.label);
                            return (
                              <TooltipProvider key={tagObj.label}>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      onClick={() => toggleTag(tagObj.label)}
                                      className={cn(
                                        'h-6 px-2 text-[10px] font-bold transition-all rounded-md border',
                                        isSelected
                                          ? `${getActiveStyle(category.id)} text-white border-transparent shadow-sm scale-105`
                                          : 'bg-slate-100 dark:bg-zinc-800/50 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-white/10 hover:border-indigo-300 hover:text-indigo-600 hover:bg-white'
                                      )}
                                    >
                                      {tagObj.label}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="bottom"
                                    className="text-[10px] bg-black text-white px-2 py-0.5 border-none"
                                  >
                                    <p>{tagObj.desc}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Content Area: Relative container with fixed height matching the "Presets" grid */}
            <div className="relative h-[216px]">
              {/* A. Default Mode: 11 Viral Personas (Readable 3-Column Grid) */}

              {/* ALWAYS VISIBLE in background */}
              <div className="grid grid-cols-3 gap-1.5 absolute inset-0">
                  {/* Persona Grid */}
                  {VIBE_PERSONAS.map((persona) => {
                    const isSpecialCustom = persona.id === 'viral_pop';
                    const isThisActive = activePersonaId === persona.id || (isSpecialCustom && !activePersonaId && (vibeTags.length > 0 || customVibeText.length > 0));

                    return (
                      <TooltipProvider key={persona.id}>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => {
                                if (isSpecialCustom && isThisActive) {
                                  setIsPopoverOpen(true);
                                } else {
                                  handlePersonaSelect(persona.id);
                                }
                              }}
                              className={cn(
                                'flex items-center gap-2 p-1 px-2 text-left rounded-xl border-2 transition-all active:scale-95 group relative h-12',
                                isThisActive
                                  ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/5 z-10'
                                  : cn(
                                      persona.color,
                                      isSpecialCustom ? 'opacity-80 hover:opacity-100' : 'border-transparent opacity-80 hover:opacity-100'
                                    ),
                                'hover:shadow-md'
                              )}
                            >
                              {/* Active Checkmark Badge */}
                              {isThisActive && (
                                <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm z-20 animate-in zoom-in duration-200">
                                  <Check className="size-2.5 stroke-[4px]" />
                                </div>
                              )}

                              <div
                                className={cn(
                                  'text-lg shrink-0 transition-transform',
                                  isThisActive ? 'scale-110 rotate-3' : 'group-hover:scale-110'
                                )}
                              >
                                {persona.icon}
                              </div>
                              <div className="flex flex-col min-w-0 pointer-events-none leading-none">
                                <span
                                  className={cn(
                                    'text-xs font-bold truncate',
                                    isThisActive
                                      ? 'text-indigo-900 dark:text-indigo-100'
                                      : 'opacity-90'
                                  )}
                                >
                                  {persona.label}
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] font-medium truncate mt-0.5',
                                    isThisActive
                                      ? 'text-indigo-600/70 dark:text-indigo-300/70'
                                      : 'opacity-50'
                                  )}
                                >
                                  {isSpecialCustom && isThisActive
                                    ? ((vibeTags.length > 0 || customVibeText.length > 0) ? `${vibeTags.length + (customVibeText ? 1 : 0)} tags selected` : persona.desc)
                                    : persona.desc}
                                </span>
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="text-xs bg-black/90 text-white px-3 py-1.5 border-none max-w-[220px]"
                          >
                            <p>{isSpecialCustom && isThisActive ? 'Click to edit in Freestyle mode.' : (persona.desc || persona.label)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}


                </div>
            </div>
          </div>

          {/* 4. Custom Vibe */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex justify-between items-center px-1">
              <LabelWithIcon icon={Sparkles} label="4. Custom Vibe (Optional)" />
              <span className="text-[10px] font-bold text-slate-400">{customVibeText.length}/50</span>
            </div>
            <Input
              placeholder="e.g. Spooky, Underwater, 90s Sitcom..."
              className="h-10 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm rounded-xl placeholder:text-slate-400 shadow-sm"
              value={customVibeText}
              maxLength={50}
              onChange={(e) => handleCustomTextChange(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-3 shrink-0 flex gap-3 pb-1 mt-auto">
          {/* Reset / Clear Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => useCreateStore.getState().reset()}
                  className="h-[68px] w-[68px] shrink-0 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                >
                  <Trash2 className="size-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Form</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1">
            {isGenerating ? (
              <GenerationProgress />
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={cn(
                  'w-full h-[68px] text-lg font-black tracking-wide transition-all rounded-2xl relative overflow-hidden shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 group',
                  'bg-linear-to-r from-violet-600 via-fuchsia-400 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5',
                  !canGenerate && 'cursor-not-allowed opacity-90'
                )}
              >
                {/* Dynamic Shimmer Effect */}
                <div className="absolute inset-0 w-full h-full">
                  <div className="absolute top-0 -left-full w-1/2 h-full bg-linear-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer-fast" />
                </div>

                <div className="relative z-10 flex items-center justify-center w-full">
                  <Sparkles className="mr-2.5 size-5 fill-current text-indigo-100 group-hover:animate-pulse" />
                  Generate Music
                  <span className="ml-2.5 text-xs px-2 py-0.5 rounded-full font-bold bg-white/20 opacity-90">
                    -{musicCreditCost}
                  </span>
                </div>
              </Button>
            )}
          </div>
        </div>

        {/* Credit Transparency Tip */}
        <div className="px-1 mt-3 flex items-start gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <div className="mt-0.5 p-0.5 rounded-full bg-slate-100 dark:bg-white/5">
            <Info className="size-3 text-slate-500" />
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Credits are only consumed for <b>successful</b> generations. Failed tasks due to safety or system errors are automatically refunded.
          </p>
        </div>


      {/* Error Modal Dialog */}
      <AlertDialog open={!!(error || musicError)} onOpenChange={(open) => {
        if (!open && onClearError) onClearError();
      }}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-red-100 dark:border-red-900/30">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <AlertCircle className="size-5" />
              <AlertDialogTitle className="text-lg font-bold">
                {(error || musicError)?.includes('2013') || (error || musicError)?.includes('sensitive')
                  ? 'Content Safety Policy'
                  : (error || musicError)?.includes('1008') || (error || musicError)?.includes('insufficient balance') || (error || musicError)?.includes('Insufficient credits')
                    ? 'Insufficient Credits'
                    : 'Generation Interrupted'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
              {(error || musicError)?.includes('2013') || (error || musicError)?.includes('sensitive')
                ? 'Your lyrics contain content that may violate safety guidelines (e.g. violence, explicit themes, or sensitive topics). Please revise your lyrics and try again.'
                  : (error || musicError)?.includes('1008') || (error || musicError)?.includes('insufficient balance') || (error || musicError)?.includes('Insufficient credits')
                    ? 'Insufficient Credits: You have run out of generation credits.'
                    : error || musicError}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={onClearError}
              className="bg-red-500 hover:bg-red-600 text-white border-none"
            >
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

function LabelWithIcon({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-500/20">
        <Icon className="size-3.5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <span className="font-bold text-xs text-slate-700 dark:text-slate-200 tracking-wider">{label}</span>
    </div>
  );
}
