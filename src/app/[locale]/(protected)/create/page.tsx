'use client';

/**
 * AI Music Creation Page - Core Interface
 *
 * Strategy: Modular & State-Driven
 * 1. Uses `useCreateStore` for persistent UI state (Zustand).
 * 2. Uses `CreateMusicForm` for input and style selection.
 * 3. Uses `LyricsDisplay` for AI lyrics management and immersive loading.
 * 4. Implements polling for background song processing.
 */

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { CreateMusicForm } from '@/components/create/create-music-form';
import { LyricsDisplay } from '@/components/create/lyrics-display';
import { MusicPlayer } from '@/components/player/music-player';
import { useCreateStore } from '@/store/create-store';
import { usePlayerStore } from '@/store/player-store';
import { useCreditBalance } from '@/hooks/billing/use-credits';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Music, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

  import { useSearchParams, useRouter } from 'next/navigation';
  import { Routes } from '@/routes';

  export default function CreateMusicPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- Store State ---
  const {
    newsLink, setNewsLink,
    newsContent, setNewsContent,
    newsSummary, setNewsSummary,
    musicPrompt, setMusicPrompt,
    musicTitle, setMusicTitle,
    lyrics, setLyrics,
    musicLyricsSnapshot, setMusicLyricsSnapshot,
    hasUnsavedLyricsChanges, setHasUnsavedLyricsChanges,
    musicUrl, setMusicUrl,
    musicCoverUrl, setMusicCoverUrl,
    musicId, setMusicId,
    processingTaskId, setProcessingTaskId,
    shouldAutoGenerate, setShouldAutoGenerate,
    reset,
  } = useCreateStore();

  const playSong = usePlayerStore((state) => state.play);
  const stopPlayer = usePlayerStore((state) => state.stop);
  const setGlobalIsGenerating = usePlayerStore((state) => state.setIsGenerating);
  const { data: balance, isLoading: isBalanceLoading } = useCreditBalance();

  // --- Local UI State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const MUSIC_CREDIT_COST = 2;

  // --- Effect: Handle URL Params (e.g. from Marketing Page) ---
  useEffect(() => {
    const contentParam = searchParams.get('content');
    if (contentParam && !isGenerating) {
       try {
          // 1. Reset Store to ensure "Viral Pop" (Custom Vibe) defaults
          reset();

          // 2. Set Content (Safe Decode)
          const decoded = decodeURIComponent(contentParam);

          // Smart Detect: URL vs Text
          // Simple heuristic: If it looks like a URL, treat as link.
          if (/^(https?:\/\/|www\.)[^ "]+$/i.test(decoded)) {
              setNewsLink(decoded);
              setNewsContent('');
          } else {
              setNewsContent(decoded);
              setNewsLink('');
          }

          // 3. Trigger Auto-Generate
          setShouldAutoGenerate(true);

          // 4. Clean URL (Prevent reprocessing)
          router.replace(Routes.Create);
       } catch (err) {
          console.error("Failed to parse content param:", err);
          // Fallback: Just clear the param to avoid loop
          router.replace(Routes.Create);
       }
    }
  }, [searchParams, reset, setNewsContent, setNewsLink, setShouldAutoGenerate, isGenerating, router]);

  // --- Effect: Auto-Generate on Mount if signaled ---
  useEffect(() => {
    if (shouldAutoGenerate && (newsContent || newsLink) && !isGenerating) {
      // 1. Consume the flag to prevent double-fire
      setShouldAutoGenerate(false);

      // 2. Trigger Generation Logic
      // We wrap in timeout to ensure state hydration is settled
      setTimeout(() => {
        handleGenerate();
      }, 100);
    }
  }, [shouldAutoGenerate, newsContent, newsLink, isGenerating]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // --- Breadcrumbs ---
  const breadcrumbs = [
    { label: t('Dashboard.dashboard.title') },
    { label: t('Dashboard.create.title', { default: 'Create' }), isCurrentPage: true },
  ];

  /**
   * Normalize lyrics section formatting
   */
  const normalizeLyricsSections = (raw: string) => {
    return raw
      // Ensure section headers are on their own lines with spacing
      .replace(/\s*\[(intro|verse|pre-chorus|chorus|bridge|outro|instrumental)\]\s*/gi, '\n\n[$1]\n')
      // Split sentences into new lines for better readability (Song Verse format)
      .replace(/([.!?])\s+/g, '$1\n')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  /**
   * Handle Poll for Back-end completion
   */
  /**
   * Effect: Handle Polling for Back-end completion
   * Replaces ad-hoc startPolling to prevent multiple intervals/toasts on re-renders.
   */
  useEffect(() => {
    if (!processingTaskId) return;

    setMusicLoading(true);
    let notFoundCount = 0;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/songs/${processingTaskId}/processing-status`);
        const result = await res.json();

        if (result.success) {
          notFoundCount = 0;
          setProcessingStatus(result.status);

          if (result.song?.coverImageUrl) {
            setMusicCoverUrl(result.song.coverImageUrl);
          }

          if (result.status === 'completed' || result.status === 'failed' || result.status === 'completed_without_cover') {
            clearInterval(intervalId);
            setProcessingTaskId(null);
            setMusicLoading(false);

            if (result.status === 'completed') {
               // Only toast if it was a real completion logic
               // Since we have fast playback, this toast confirms persistence.
               toast.success('Track fully persisted & cover ready!');
            } else if (result.status === 'failed') {
               setProcessingStatus('failed');
               toast.error('Processing failed in background.');
            }
          }
        } else {
             if (res.status === 404 || result.error === 'Song not found') {
                 notFoundCount++;
                 if (notFoundCount > 10) {
                     clearInterval(intervalId);
                     setProcessingTaskId(null);
                     setMusicLoading(false);
                     setProcessingStatus('failed');
                     toast.error('Task vanished via polling timeout.');
                 }
             }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 4000);

    return () => {
      clearInterval(intervalId);
      setMusicLoading(false); // Optional: clear loading on unmount, or leave it?
    };
  }, [processingTaskId, setProcessingTaskId, setMusicCoverUrl]);

  /**
   * Phase 2: Generate Music from Lyrics
   */
  const handleGenerateMusic = async (inputLyrics?: string, inputTitle?: string) => {
    const targetLyrics = inputLyrics || lyrics;
    const targetTitle = inputTitle || musicTitle;

    if (!targetLyrics) return;

    setMusicCoverUrl(null);

    // Generate Client-Side ID for Session Recovery
    // Use crypto.randomUUID if available, otherwise fallback to manual generation
    const clientSongId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    setProcessingTaskId(clientSongId); // Save immediately to store - This triggers useEffect polling

    try {
      const res = await fetch('/api/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: clientSongId, // Pass to API
          lyrics: targetLyrics,
          prompt: musicPrompt,
          title: targetTitle,
          sourceText: newsContent,
          sourceUrl: newsLink,
          useStream: false, // Poll mode for stability
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate music');

      const song = data.song;
      const audioUrl = song?.audioUrl || data.audio;

      setMusicUrl(audioUrl);
      setMusicId(song?.id);
      setMusicLyricsSnapshot(targetLyrics);
      setHasUnsavedLyricsChanges(false);

      if (song?.id) {
        // startPolling(song.id); // Replaced by useEffect listening to processingTaskId
        setProcessingTaskId(song.id); // Ensure task ID is set (redundant but safe)

        // Auto-play the preview
        playSong({
          id: song.id,
          title: song.title || targetTitle,
          audioUrl: audioUrl,
          coverImageUrl: song.coverImageUrl || null,
          artist: 'AI Generation',
        });
      }

      toast.success('Vibe generated! Playing now.');
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
      setError(e.message);
    } finally {
      setMusicLoading(false);
    }
  };

  /**
   * Phase 1: Full Generation Flow (Lyrics -> Music)
   */
  const handleGenerate = async () => {
    if (!newsContent && !newsLink) {
      toast.error('Give us some tea to spill first!');
      return;
    }

    // 1. Reset Player & Show Loading UI globally
    stopPlayer();
    setGlobalIsGenerating(true);
    setIsGenerating(true);
    setError(null);

    try {
      // 2. Generate Lyrics
      const lyricsRes = await fetch('/api/generate/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: newsContent,
          newsUrl: newsLink,
          style: musicPrompt,
        }),
      });

      const lyricsData = await lyricsRes.json();
      if (!lyricsRes.ok || !lyricsData.success) throw new Error(lyricsData.error || 'Failed to generate lyrics');

      const formattedLyrics = normalizeLyricsSections(lyricsData.lyrics);
      const generatedTitle = lyricsData.title || 'Breaking News Track';

      setLyrics(formattedLyrics);
      setMusicTitle(generatedTitle);
      if (lyricsData.summary) setNewsSummary(lyricsData.summary);

      // 3. Generate Music
      await handleGenerateMusic(formattedLyrics, generatedTitle);
    } catch (e: any) {
      setError(e.message || 'Workflow failed');
      toast.error(e.message);
    } finally {
      setIsGenerating(false);
      setGlobalIsGenerating(false);
    }
  };

  /**
   * Handle AI Rewrite Selection
   */
  const handleRewriteLyrics = async () => {
    if (!selectionRange || !lyrics) return;
    const { start, end } = selectionRange;
    const selectedText = lyrics.substring(start, end);
    if (!selectedText.trim()) return;

    setIsRewriting(true);
    try {
      const res = await fetch('/api/generate/lyrics/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          context: lyrics,
          style: musicPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to rewrite');

      const newLyrics = lyrics.substring(0, start) + data.rewrittenText + lyrics.substring(end);
      setLyrics(normalizeLyricsSections(newLyrics));
      setSelectionRange(null);
      toast.success('Fresh bars added!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsRewriting(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950">
      <DashboardHeader breadcrumbs={breadcrumbs} />

      {/* Ambient Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Unified Layout Wrapper: Controls vertical position of Header + Grid together */}
      {/* Header Block with Reallocated Breathing Space */}
      <div className="w-full flex justify-center relative z-0 mt-10 md:mt-14 mb-8 px-4">
        <h1 className="text-4xl md:text-5xl font-black text-center tracking-tighter flex items-center justify-center gap-3">
          {/* Logo Icon */}
          <div className="size-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-3">
            <Music className="size-6" />
          </div>

          <span className="text-slate-900 dark:text-white drop-shadow-sm">Music</span>
          <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient-x drop-shadow-sm">
            Studio
          </span>

          {/* Decorative Sparkle */}
          <Sparkles className="size-6 text-purple-400 animate-pulse" />
        </h1>
      </div>

        {/* L O C K E D   L A Y O U T   (DO NOT MODIFY) */}
        {/* User explicitly requested to FREEZE these dimensions (md:450px, lg:600px, xl:720px) forever. 2026-01-03 */}
      <main className="w-full max-w-[1920px] mx-auto px-4 md:px-6 pb-48 grid gap-8 md:grid-cols-[450px_1fr] lg:grid-cols-[600px_1fr] xl:grid-cols-[720px_1fr] items-stretch">
        {/* Left Column: Input Form */}
        <div className="flex flex-col gap-6 w-full h-full">
          <CreateMusicForm
            newsLink={newsLink}
            setNewsLink={setNewsLink}
            newsContent={newsContent}
            setNewsContent={setNewsContent}
            musicPrompt={musicPrompt}
            setMusicPrompt={setMusicPrompt}
            handleGenerate={handleGenerate}
            canGenerate={!!(newsContent || newsLink)}
            isGenerating={isGenerating || musicLoading}
            musicCreditCost={MUSIC_CREDIT_COST}
            error={error}
            onClearError={() => setError(null)}
          />
        </div>

        {/* Right Column: Lyrics & Immersive Visuals */}
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex flex-col gap-6">
            <LyricsDisplay
              lyrics={lyrics}
              setLyrics={setLyrics}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              musicLyricsSnapshot={musicLyricsSnapshot}
              hasUnsavedLyricsChanges={hasUnsavedLyricsChanges}
              setHasUnsavedLyricsChanges={setHasUnsavedLyricsChanges}
              processingStatus={processingStatus}
              handleRegenerateAudio={() => handleGenerateMusic()}
              musicLoading={musicLoading}
              handleRewriteLyrics={handleRewriteLyrics}
              isRewriting={isRewriting}
              setSelectionRange={setSelectionRange}
              selectionRange={selectionRange}
              newsSummary={newsSummary}
              musicUrl={musicUrl}
              songTitle={musicTitle}
            />
          </div>
        </div>
      </main>

      <MusicPlayer />
    </div>
  );
}
