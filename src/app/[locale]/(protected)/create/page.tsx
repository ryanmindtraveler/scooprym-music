'use client';

// ... imports ...
import { DEFAULT_CUSTOM_VIBE_PROMPT } from '@/components/create/form/create-music-data';
import { CreateMusicForm } from '@/components/create/form/create-music-form';
import { CreationStage } from '@/components/create/stage/creation-stage'; // Updated Import

import { useCreditBalance } from '@/hooks/billing/use-credits';
import { useCreateStore, usePlayerStore } from '@/store';
import type { CreationTask } from '@/store/create-store'; // Data Type

import { creditsKeys } from '@/hooks/billing/use-credits';
import { useQueryClient } from '@tanstack/react-query';
import { Music, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Routes } from '@/routes';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateMusicPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- Store State ---
  const {
    newsLink,
    setNewsLink,
    newsContent,
    setNewsContent,
    newsSummary,
    setNewsSummary,
    musicPrompt,
    setMusicPrompt,
    musicTitle,
    setMusicTitle,
    lyrics,
    setLyrics,
    musicLyricsSnapshot,
    setMusicLyricsSnapshot,
    hasUnsavedLyricsChanges,
    setHasUnsavedLyricsChanges,
    musicUrl,
    setMusicUrl,
    musicCoverUrl,
    setMusicCoverUrl,
    musicId,
    setMusicId,
    processingTaskId, // Legacy / Current poller
    setProcessingTaskId,
    tasks, // New Queue
    addTask,
    updateTask,
    shouldAutoGenerate,
    setShouldAutoGenerate,
    reset,
  } = useCreateStore();

  const playSong = usePlayerStore((state) => state.play);
  const stopPlayer = usePlayerStore((state) => state.stop);
  const setGlobalIsGenerating = usePlayerStore((state) => state.setIsGenerating);
  const setPlayerCoverImage = usePlayerStore((state) => state.setCoverImage);
  const { data: balance, isLoading: isBalanceLoading } = useCreditBalance();
  const queryClient = useQueryClient();

  // --- Local UI State ---
  const [isGenerating, setIsGenerating] = useState(false); // For Lyrics Gen only now
  const [isEditing, setIsEditing] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false); // Tracks if "Current Stage" is loading (Legacy or Direct)
  const [isRewriting, setIsRewriting] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null); // For current stage
  const [error, setError] = useState<string | null>(null);
  const [hasJustQueued, setHasJustQueued] = useState(false);

  const MUSIC_CREDIT_COST = 2;

  // --- Effect: Reset Player on Mount (Decoupling) ---
  useEffect(() => {
    stopPlayer();
    setGlobalIsGenerating(false);
  }, [stopPlayer, setGlobalIsGenerating]);

  // --- Effect: Handle URL Params (e.g. from Marketing Page) ---
  useEffect(() => {
    // ... Existing logic kept same for brevity ...
    const contentParam = searchParams.get('content');
    if (contentParam && !isGenerating) {
      // ... (Simplified re-inclusion of same logic)
      try {
        reset();
        const decoded = decodeURIComponent(contentParam).trim();
        // ... parsing logic ...
        // Smart Detect: URL vs Text
        if (/^(https?:\/\/|www\.)[^ "]+$/i.test(decoded)) {
          setNewsLink(decoded);
          setNewsContent('');
        } else {
          setNewsContent(decoded);
          setNewsLink('');
        }
        setShouldAutoGenerate(true);
        router.replace(Routes.Create);
      } catch (e) {
        router.replace(Routes.Create);
      }
    }
  }, [searchParams, reset, setNewsContent, setNewsLink, setMusicPrompt, setShouldAutoGenerate, isGenerating, router]);

  // --- Ref: Prevent Double Fire in Strict Mode ---
  const autoGenLock = useRef(false);

  // --- Effect: Auto-Generate on Mount ---
  useEffect(() => {
    if (shouldAutoGenerate && (newsContent || newsLink) && !isGenerating && !autoGenLock.current) {
      autoGenLock.current = true;
      setShouldAutoGenerate(false);
      setTimeout(() => {
        handleGenerate();
      }, 100);
    }
  }, [shouldAutoGenerate, newsContent, newsLink, isGenerating]);

  // Safety: If user edits inputs manually after queuing, cancel the "Create Another" (Reset) mode
  useEffect(() => {
    if (hasJustQueued) {
      setHasJustQueued(false);
    }
  }, [newsContent, newsLink, musicPrompt, lyrics, musicTitle]);

  const normalizeLyricsSections = (raw: string) => {
    // ... existing normalization ...
    return raw
      .replace(/\s*\[(intro|verse|pre-chorus|chorus|bridge|outro|instrumental)\]\s*/gi, '\n\n[$1]\n')
      .replace(/([.!?])\s+/g, '$1\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // --- POLLING LOGIC (Multi-Task) ---
  // Replaces the old single-task poller
  useEffect(() => {
    // Find active tasks
    // Find active tasks
    // FIX: Also poll 'completed' tasks if they are missing a cover URL (and not explicitly failed/skipped)
    // TIMEOUT: Stop polling if task is older than 3 minutes to prevent resource waste
    const MAX_POLL_DURATION = 3 * 60 * 1000; // 3 minutes

    const activeTasks = tasks.filter((t) => {
      // 1. Check Age (Initial Filter)
      if (Date.now() - t.createdAt > MAX_POLL_DURATION) return false;

      // 2. Check Status
      return t.status === 'processing' || t.status === 'generating_cover' || (t.status === 'completed' && !t.coverUrl);
    });
    if (activeTasks.length === 0) return;

    let isCancelled = false;

    // We poll each active task (could be optimized to batch, but reliable for now)
    const pollLoop = async () => {
      if (isCancelled) return;

      await Promise.all(
        activeTasks.map(async (task) => {
          // Dynamic Timeout Check inside loop (prevents stale closure infinite loop)
          if (Date.now() - task.createdAt > MAX_POLL_DURATION) return;

          try {
            const res = await fetch(`/api/songs/${task.id}/processing-status`);
            const result = await res.json();
            if (result.success && result.status) {
              // Detect status change
              const newStatus = result.status;
              const updates: Partial<CreationTask> = { status: newStatus };

              if (result.song?.coverImageUrl && result.song.coverImageUrl !== task.coverUrl) {
                updates.coverUrl = result.song.coverImageUrl;
              }
              if (result.song?.audioUrl && result.song.audioUrl !== task.audioUrl) {
                updates.audioUrl = result.song.audioUrl;
              }

              // Only update store if changed (avoid spam)
              if (newStatus !== task.status || updates.coverUrl || updates.audioUrl) {
                updateTask(task.id, updates);

                // If *this* task is currently loaded on Stage, sync stage state
                if (musicId === task.id) {
                  if (newStatus === 'completed' || newStatus === 'completed_without_cover') {
                    setMusicUrl(result.song.audioUrl);
                    setMusicCoverUrl(result.song.coverImageUrl);
                    setMusicLoading(false);
                    setProcessingStatus(newStatus);

                    if (result.song.coverImageUrl) {
                      // setPlayerCoverImage is not defined in the provided context, assuming it's a global or parent function
                      // setPlayerCoverImage(result.song.coverImageUrl);
                    }

                    toast.success('Track ready! Playing now.');

                    // Auto-play only if it's the *same* song we are looking at
                    playSong({
                      id: task.id,
                      title: task.title,
                      audioUrl: result.song.audioUrl,
                      coverImageUrl: result.song.coverImageUrl,
                      artist: 'AI Generation',
                    });
                  } else {
                    setProcessingStatus(newStatus);
                  }
                } else if (newStatus === 'completed') {
                  toast.success(`"${task.title}" is ready!`);
                }
              }
            }
          } catch (e) {
            console.error('Poll error', e);
          }
        })
      );

      if (!isCancelled) setTimeout(pollLoop, 4000);
    };

    pollLoop();

    return () => {
      isCancelled = true;
    };
  }, [tasks, updateTask, musicId, playSong, setMusicUrl, setMusicCoverUrl, /* setPlayerCoverImage, */ setMusicLoading]);

  /**
   * Phase 2: Generate Music (Queue Based)
   */
  const handleGenerateMusic = async (inputLyrics?: string, inputTitle?: string) => {
    // if (musicLoading) return; // Non-blocking now!
    const targetLyrics = inputLyrics || lyrics;
    const targetTitle = inputTitle || musicTitle;

    if (!targetLyrics) return;

    // 1. Create Task Object (Optimistic)
    const clientSongId =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); // simple fallback

    const newTask: CreationTask = {
      id: clientSongId,
      status: 'processing',
      title: targetTitle || 'Untitled Track',
      lyrics: targetLyrics,
      style: musicPrompt,
      // Context Inheritance: Use Store (New) -> Current Task (Regen) -> Empty
      newsSummary:
        useCreateStore.getState().newsSummary ||
        useCreateStore.getState().tasks.find((t) => t.id === useCreateStore.getState().musicId)?.newsSummary,
      newsContent:
        useCreateStore.getState().newsContent ||
        useCreateStore.getState().tasks.find((t) => t.id === useCreateStore.getState().musicId)?.newsContent,
      newsLink:
        useCreateStore.getState().newsLink ||
        useCreateStore.getState().tasks.find((t) => t.id === useCreateStore.getState().musicId)?.newsLink,
      createdAt: Date.now(),
    };

    // 2. Add to Queue immediately
    addTask(newTask);
    setMusicId(clientSongId); // Link Stage to this Task
    setMusicCoverUrl(null); // Reset cover to show loading state for new song
    setHasJustQueued(true); // Enable "Create Another" button mode
    toast.success('Added to Queue!', {
      description: 'Your song is cooking in the background.',
      duration: 5000,
    });

    // 3. Clear Input (Unlock UI) - REMOVED to allow multiple generations
    // setNewsContent('');
    // setNewsLink('');
    // The user stays on the current stage, or we could auto-minimize lyrics?
    // "Scheme A" preserves immersion.

    // 4. Fire Async Request (Do not block UI)
    // We execute the fetch detached.
    fetch('/api/generate/music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId: clientSongId, // Pass to API
        lyrics: targetLyrics,
        prompt: musicPrompt || DEFAULT_CUSTOM_VIBE_PROMPT, // Fallback to Viral Default
        title: targetTitle,
        sourceText: newsContent,
        sourceUrl: newsLink,
        newsSummary: useCreateStore.getState().newsSummary, // Use fresh state (avoid stale closure)
        useStream: false, // Poll mode for stability
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          updateTask(clientSongId, { status: 'failed' });
          toast.error(data.error || 'Generation failed');
        } else {
          // Success (Optimistic / Pre-computation)
          // The API returns audioUrl immediately in some cases, or just starts job.
          // If it returns audioUrl, great.
          if (data.audio) {
            updateTask(clientSongId, { status: 'completed', audioUrl: data.audio });
            // We don't auto-switch Stage to this task to avoid interrupting.
          }
        }
      })
      .catch((e: any) => {
        console.error('Generation Request Failed', e);
        updateTask(clientSongId, { status: 'failed' });
        toast.error(e.message || 'Network failed on request.');
      });

    // Invalidate credits
    queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
  };

  /**
   * Phase 1: Full Workflow
   */
  const handleGenerate = async () => {
    if (isGenerating) return;
    if (!newsContent && !newsLink) {
      toast.error('Give us some tea to spill first!');
      return;
    }

    // Phase 1 (Lyrics) is still blocking because we need lyrics to generate music.
    // Unless we move Lyrics Gen to background too?
    // The previous flow: Lyrics -> Review -> Music.
    // "Scheme A" implies "Click Generate -> Task Queue".
    // If the backend handles "News -> Lyrics -> Music" in one go, we can queue it all.
    // BUT currently `handleGenerate` separates them.
    // To match user expectation of "Input News -> Click Generate -> Done", we should verify if we want 1-step or 2-step.
    // "CreatePage" logic (Line 341) does Phase 1 then Phase 2.
    // If we want "One Click", we keep it blocking for *Lyrics Generation* (fast, ~5s), then Queue *Music* (slow, ~80s).

    setIsGenerating(true);
    setError(null);

    try {
      // 2. Generate Lyrics (Blocking UI - Fast)
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

      // Update UI with result (User sees lyrics flash before queuing music?)
      setLyrics(formattedLyrics);
      setMusicTitle(generatedTitle);

      // Force Populate Summary (Fall back to content if AI returns nothing)
      const finalSummary = lyricsData.summary || newsContent || newsLink || 'New Creation';
      setNewsSummary(finalSummary);

      // 3. Queue Music Generation (Non-blocking)
      await handleGenerateMusic(formattedLyrics, generatedTitle);
    } catch (e: any) {
      setError(e.message || 'Workflow failed');
      toast.error(e.message);
    } finally {
      setIsGenerating(false); // Unlock UI
    }
  };

  const handleRewriteLyrics = async () => {
    // ... same logic ...
    if (!selectionRange || !lyrics) return;
    setIsRewriting(true);
    try {
      const { start, end } = selectionRange;
      const selectedText = lyrics.substring(start, end);
      const res = await fetch('/api/generate/lyrics/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedText, context: lyrics, style: musicPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        const newLyrics = lyrics.substring(0, start) + data.rewrittenText + lyrics.substring(end);
        setLyrics(normalizeLyricsSections(newLyrics));
        setSelectionRange(null);
        toast.success('Rewritten!');
      }
    } catch (e) {
      toast.error('Rewrite failed');
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-zinc-950 transition-colors duration-500">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-linear-to-r from-indigo-500/15 via-purple-500/15 to-blue-500/15 blur-[120px] rounded-full pointer-events-none -z-10 opacity-60" />

      {/* Header */}
      <div className="w-full shrink-0 flex justify-center relative z-0 mt-6 md:mt-8 mb-6 px-4">
        <h1 className="text-4xl md:text-5xl font-black text-center tracking-tighter flex items-center justify-center gap-3 group">
          <div className="size-12 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-3 transition-transform group-hover:rotate-6 group-hover:scale-105">
            <Music className="size-7" />
          </div>
          <span className="text-slate-900 dark:text-white drop-shadow-sm tracking-tight">Music</span>
          <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x drop-shadow-sm pb-1">
            Studio
          </span>
          <Sparkles className="size-6 text-pink-400 animate-pulse" />
        </h1>
      </div>

      <main className="flex-1 min-h-0 w-full max-w-[1920px] mx-auto px-4 md:px-6 pb-14 grid gap-8 md:grid-cols-[450px_1fr] lg:grid-cols-[600px_1fr] xl:grid-cols-[720px_1fr] items-stretch">
        {/* Left: Input (Scrollable) */}
        <div className="flex flex-col gap-6 w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/10 scrollbar-track-transparent pr-2">
          <CreateMusicForm
            newsLink={newsLink}
            setNewsLink={setNewsLink}
            newsContent={newsContent}
            setNewsContent={setNewsContent}
            musicPrompt={musicPrompt}
            setMusicPrompt={setMusicPrompt}
            handleGenerate={handleGenerate}
            canGenerate={!!(newsContent || newsLink)}
            isGenerating={isGenerating} // Only blocks for Lyric Gen
            musicCreditCost={MUSIC_CREDIT_COST}
            error={error}
            onClearError={() => setError(null)}
            hasJustQueued={hasJustQueued}
            onReset={() => {
              setNewsLink('');
              setNewsContent('');
              setLyrics('');
              setMusicTitle('');
              setMusicPrompt(DEFAULT_CUSTOM_VIBE_PROMPT);
              setHasJustQueued(false);
              // Clear URL params if any
              window.history.replaceState(null, '', Routes.Create);
            }}
          />
        </div>

        {/* Right: Stage & Queue (Fixed Full Height) */}
        <div className="flex-1 w-full min-h-0">
          {/* Derive Stage Data from Active Task (Persistence) OR Store (Drafting) */}
          {(() => {
            const activeTask = tasks.find((t) => t.id === musicId);
            const displayNewsSummary = activeTask?.newsSummary || newsSummary;
            const displayNewsContent = activeTask?.newsContent || newsContent;
            const displayNewsLink = activeTask?.newsLink || newsLink;
            const stageMusicLoading =
              musicLoading || activeTask?.status === 'processing' || activeTask?.status === 'generating_cover';

            return (
              <CreationStage
                lyrics={lyrics}
                setLyrics={setLyrics}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                musicLyricsSnapshot={musicLyricsSnapshot}
                hasUnsavedLyricsChanges={hasUnsavedLyricsChanges}
                setHasUnsavedLyricsChanges={setHasUnsavedLyricsChanges}
                processingStatus={activeTask?.status || processingStatus}
                handleRegenerateAudio={handleGenerateMusic}
                musicLoading={stageMusicLoading}
                handleRewriteLyrics={handleRewriteLyrics}
                isRewriting={isRewriting}
                setSelectionRange={setSelectionRange}
                selectionRange={selectionRange}
                newsSummary={displayNewsSummary}
                newsContent={displayNewsContent}
                newsLink={displayNewsLink}
                musicUrl={musicUrl}
                songTitle={musicTitle}
                songId={musicId}
                coverImageUrl={musicCoverUrl}
                onPrevious={() => {
                  const currentIndex = tasks.findIndex((t) => t.id === musicId);
                  if (currentIndex > 0) {
                    const prevTask = tasks[currentIndex - 1];
                    setMusicId(prevTask.id);
                    setLyrics(prevTask.lyrics || '');
                    setMusicTitle(prevTask.title || '');
                    setNewsContent(prevTask.newsContent || '');
                    setNewsLink(prevTask.newsLink || '');
                    setNewsSummary(prevTask.newsSummary || '');
                    setMusicPrompt(prevTask.style || '');
                    setMusicUrl(prevTask.audioUrl || null);
                    setMusicCoverUrl(prevTask.coverUrl || null);
                    setProcessingStatus(prevTask.status);

                    // Auto-play new song (or stop if invalid)
                    if (prevTask.audioUrl) {
                      playSong({
                        id: prevTask.id,
                        title: prevTask.title || 'Untitled',
                        audioUrl: prevTask.audioUrl,
                        coverImageUrl: prevTask.coverUrl || null,
                        artist: 'AI Generation',
                      });
                    } else {
                      stopPlayer();
                    }
                  }
                }}
                onNext={() => {
                  const currentIndex = tasks.findIndex((t) => t.id === musicId);
                  if (currentIndex < tasks.length - 1 && currentIndex !== -1) {
                    const nextTask = tasks[currentIndex + 1];
                    setMusicId(nextTask.id);
                    setLyrics(nextTask.lyrics || '');
                    setMusicTitle(nextTask.title || '');
                    setNewsContent(nextTask.newsContent || '');
                    setNewsLink(nextTask.newsLink || '');
                    setNewsSummary(nextTask.newsSummary || '');
                    setMusicPrompt(nextTask.style || '');
                    setMusicUrl(nextTask.audioUrl || null);
                    setMusicCoverUrl(nextTask.coverUrl || null);
                    setProcessingStatus(nextTask.status);

                    // Auto-play new song (or stop if invalid)
                    if (nextTask.audioUrl) {
                      playSong({
                        id: nextTask.id,
                        title: nextTask.title || 'Untitled',
                        audioUrl: nextTask.audioUrl,
                        coverImageUrl: nextTask.coverUrl || null,
                        artist: 'AI Generation',
                      });
                    } else {
                      stopPlayer();
                    }
                  }
                }}
                hasPrevious={tasks.findIndex((t) => t.id === musicId) > 0}
                hasNext={
                  tasks.findIndex((t) => t.id === musicId) < tasks.length - 1 &&
                  tasks.findIndex((t) => t.id === musicId) !== -1
                }
              />
            );
          })()}
        </div>
      </main>
    </div>
  );
}
