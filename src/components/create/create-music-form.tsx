'use client';

/**
 * 闊充箰鍒涘缓琛ㄥ崟缁勪欢 (CreateMusicForm)
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

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCreateStore } from '@/store/create-store';
import { ALL_KNOWN_TAGS, MUSIC_STYLE_CATEGORIES, VIBE_PERSONAS, getActiveStyle } from './create-music-data';



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

const SHAKE_ANIMATION_CSS = `
  .animate-button-shake {
    animation: button-shake 0.5s ease-in-out;
  }
  @keyframes button-shake {
    0%, 100% { transform: translateX(0); }
    10% { transform: translateX(-6px) rotate(-6deg); }
    30% { transform: translateX(6px) rotate(6deg); }
    50% { transform: translateX(-4px) rotate(-3deg); }
    70% { transform: translateX(4px) rotate(3deg); }
    90% { transform: translateX(-2px) rotate(0deg); }
  }
`;



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
  const [isAdvancedVibeOpen, setIsAdvancedVibeOpen] = useState(false);

  // --- Logic 1: Separate States for Independent Control ---
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

  const syncMusicPrompt = (vTags: string[], customText: string) => {
    const combined = [...vTags, customText].filter(Boolean).join(', ');
    setMusicPrompt(combined);
  };

  const handlePersonaSelect = (id: string) => {
    const persona = VIBE_PERSONAS.find((p) => p.id === id);
    if (!persona) return;
    setActivePersonaId(id);
    setVibeTags([...persona.tags]);
    syncMusicPrompt(persona.tags, customVibeText);
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
  useEffect(() => {
    if (!musicPrompt) {
      setActivePersonaId(null);
      setVibeTags([]);
      setCustomVibeText('');
    }
  }, [musicPrompt]);

  // --- Logic 2: Shake Animation on Selection ---
  const [triggerShake, setTriggerShake] = useState(false);

  useEffect(() => {
    if (activePersonaId) {
      setTriggerShake(true);
      const timer = setTimeout(() => setTriggerShake(false), 500); // 0.5s duration
      return () => clearTimeout(timer);
    }
  }, [activePersonaId]);

  const isCustomActive = !activePersonaId && vibeTags.length > 0;

  return (
    <div className="flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: SHAKE_ANIMATION_CSS }} />
      <Card
        className={cn(
          'p-5 flex flex-col min-h-[860px] h-fit w-full', // Expanded "Pro Studio" height
          'shadow-2xl shadow-indigo-500/10',
          'bg-white/80 dark:bg-zinc-900/90', // More transparency for glassmorphism
          'bg-linear-to-b from-white to-purple-50/30 dark:from-zinc-900 dark:to-zinc-900/50', // Subtle mesh gradient
          'border border-white/50 dark:border-white/5 backdrop-blur-xl rounded-[32px]', // Increased blur and roundedness
          'transition-all duration-300'
        )}
      >
        {/* Header Section */}
        <div className="flex items-center gap-3 pb-3 border-b border-purple-100/50 dark:border-white/5 mb-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-linear-to-br from-indigo-200 to-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/30">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-indigo-950 dark:text-indigo-50">Scoop Content</h3>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 pr-1 space-y-3 mt-1 overflow-visible">
          {/* 1. News Link Input */}
          <div className="space-y-1">
            <LabelWithIcon icon={LinkIcon} label="1. News Link" />
            <Input
              placeholder="Paste a URL..."
              className="h-10 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm rounded-xl placeholder:text-slate-400 shadow-sm"
              value={newsLink}
              onChange={(e) => setNewsLink(e.target.value)}
            />
          </div>

          {/* 2. Content Input */}
          <div className="space-y-1">
            <LabelWithIcon icon={FileText} label="2. Content / Context" />
            <Textarea
              placeholder="Paste the article text or describe the vibe..."
              className="h-[160px] resize-none overflow-y-auto font-mono bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm rounded-xl placeholder:text-slate-400 leading-relaxed custom-scrollbar shadow-sm"
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
            />
          </div>

          {/* 3. Vibe Check */}
          <div className="space-y-2 mt-2 shrink-0">
            <div className="flex items-center justify-between">
              <LabelWithIcon icon={Music2} label="3. Vibe Check" />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsAdvancedVibeOpen(!isAdvancedVibeOpen)}
                className={cn(
                  'h-6 px-3 text-xs font-black tracking-wide transition-all border border-transparent',
                  isAdvancedVibeOpen
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700'
                    : activePersonaId
                      ? cn(
                          'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-zinc-900',
                          triggerShake && 'animate-button-shake'
                        )
                      : 'text-indigo-600/80 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 border-indigo-200/50'
                )}
              >
                {isAdvancedVibeOpen ? 'Presets' : 'Freestyle'}
                {isAdvancedVibeOpen ? (
                  <ChevronUp className="ml-1.5 size-3.5" />
                ) : (
                  <ChevronDown className="ml-1.5 size-3.5" />
                )}
              </Button>
            </div>

            {/* Content Area: Relative container with fixed height matching the "Presets" grid */}
            <div className="relative h-[216px]">
              {/* A. Default Mode: 11 Viral Personas (Readable 3-Column Grid) */}
              {!isAdvancedVibeOpen && (
                <div className="grid grid-cols-3 gap-1.5 absolute inset-0">
                  {VIBE_PERSONAS.map((persona) => {
                    const isActive = persona.tags.every((t) => selectedTags.includes(t));
                    return (
                      <TooltipProvider key={persona.id}>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handlePersonaSelect(persona.id)}
                              className={cn(
                                'flex items-center gap-2 p-1 px-2 text-left rounded-xl border-2 transition-all active:scale-95 group relative h-12',
                                activePersonaId === persona.id
                                  ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/5 z-10'
                                  : cn(persona.color, 'border-transparent opacity-80 hover:opacity-100'),
                                'hover:shadow-md'
                              )}
                            >
                              {/* Active Checkmark Badge */}
                              {activePersonaId === persona.id && (
                                <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm z-20 animate-in zoom-in duration-200">
                                  <Check className="size-2.5 stroke-[4px]" />
                                </div>
                              )}

                              <div
                                className={cn(
                                  'text-lg shrink-0 transition-transform',
                                  isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110'
                                )}
                              >
                                {persona.icon}
                              </div>
                              <div className="flex flex-col min-w-0 pointer-events-none leading-none">
                                <span
                                  className={cn(
                                    'text-xs font-bold truncate',
                                    activePersonaId === persona.id
                                      ? 'text-indigo-900 dark:text-indigo-100'
                                      : 'opacity-90'
                                  )}
                                >
                                  {persona.label}
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] font-medium truncate mt-0.5',
                                    activePersonaId === persona.id
                                      ? 'text-indigo-600/70 dark:text-indigo-300/70'
                                      : 'opacity-50'
                                  )}
                                >
                                  {persona.desc}
                                </span>
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="text-xs bg-black/90 text-white px-3 py-1.5 border-none max-w-[220px]"
                          >
                            <p>{persona.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}

                  {/* 12th Slot: Custom / Freestyle Indicator */}
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setIsAdvancedVibeOpen(true)}
                          className={cn(
                            'flex items-center gap-2 p-1 px-2 text-left rounded-xl border-2 transition-all active:scale-95 group relative h-12',
                            isCustomActive
                              ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/5 z-10'
                              : 'border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 opacity-60 hover:opacity-100 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                          )}
                        >
                          {isCustomActive && (
                            <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm z-20 animate-in zoom-in duration-200">
                              <Check className="size-2.5 stroke-[4px]" />
                            </div>
                          )}
                          <div
                            className={cn(
                              'text-lg shrink-0 transition-transform',
                              isCustomActive ? 'scale-110 rotate-12' : 'group-hover:scale-110'
                            )}
                          >
                            馃帹
                          </div>
                          <div className="flex flex-col min-w-0 pointer-events-none leading-none">
                            <span
                              className={cn(
                                'text-xs font-bold truncate',
                                isCustomActive
                                  ? 'text-indigo-900 dark:text-indigo-100'
                                  : 'opacity-70'
                              )}
                            >
                              Custom Vibe
                            </span>
                            <span
                              className={cn(
                                'text-[9px] font-medium truncate mt-0.5',
                                isCustomActive
                                  ? 'text-indigo-600/70 dark:text-indigo-300/70'
                                  : 'opacity-50'
                              )}
                            >
                              {isCustomActive ? `${vibeTags.length} tags selected` : 'Create your own'}
                            </span>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="text-xs bg-black/90 text-white px-3 py-1.5 border-none max-w-[220px]"
                      >
                        <p>Your unique combination of tags. Click to edit in Freestyle mode.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {/* B. Advanced Mode: Manual 2x2 Grid (Floating Overlay) */}
              {isAdvancedVibeOpen && (
                <div className="absolute top-0 left-0 w-full z-50 grid grid-cols-1 md:grid-cols-2 gap-3 p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[320px] overflow-y-auto custom-scrollbar">
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
              )}
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
        <div className="pt-6 shrink-0 flex gap-3">
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

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={cn(
              'flex-1 justify-center h-[68px] text-lg font-black tracking-wide transition-all rounded-2xl relative overflow-hidden shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 group',
              'bg-linear-to-r from-violet-600 via-fuchsia-400 to-indigo-600 text-white shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5',
              isGenerating && 'cursor-wait opacity-90',
              !canGenerate && !isGenerating && 'cursor-not-allowed opacity-90' // Keep opacity high and NO grayscale
            )}
          >
            <div className="relative z-10 flex items-center justify-center w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-3 size-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2.5 size-5 fill-current text-indigo-100" />
                  Generate Music
                  <span className="ml-2.5 text-xs px-2 py-0.5 rounded-full font-bold bg-white/20 opacity-90">
                    -{musicCreditCost}
                  </span>
                </>
              )}
            </div>
          </Button>

        </div>

        {(error || musicError) && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
            <Alert
              variant="destructive"
              className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 relative pr-10"
            >
              <AlertCircle className="size-4" />
              <AlertTitle className="ml-2 text-red-800 dark:text-red-400 font-bold">
                {(error || musicError)?.includes('2013') ||
                (error || musicError)?.includes('sensitive')
                  ? 'Content Safety Policy'
                  : (error || musicError)?.includes('1008') ||
                      (error || musicError)?.includes('insufficient balance')
                    ? isAdmin
                      ? 'Admin Alert: Vendor Quota Exceeded'
                      : 'System Maintenance'
                    : 'Generation Interrupted'}
              </AlertTitle>
              <AlertDescription className="ml-2 text-red-700 dark:text-red-300/90 mt-1">
                {(error || musicError)?.includes('2013') ||
                (error || musicError)?.includes('sensitive')
                  ? 'Your lyrics contain content that may violate safety guidelines (e.g. violence, explicit themes, or sensitive topics). Please revise your lyrics and try again.'
                  : (error || musicError)?.includes('1008') ||
                      (error || musicError)?.includes('insufficient balance')
                    ? isAdmin
                      ? 'The MiniMax API key has run out of credits. Please top up your developer account immediately.'
                      : 'The music generation service is currently undergoing maintenance. Please try again later.'
                    : error || musicError}
              </AlertDescription>
              {/* Close Button */}
              {onClearError && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearError();
                  }}
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Close alert</span>
                </Button>
              )}
            </Alert>
          </div>
        )}
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
  label: string;
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

