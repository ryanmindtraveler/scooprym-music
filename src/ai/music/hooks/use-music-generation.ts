'use client';

import type { GenerateMusicApiResponse, ProcessingStatusResponse } from '@/ai/music/lib/api-types';
import { useCreditBalance } from '@/hooks/billing/use-credits';
import { usePlayerStore } from '@/store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook: 音乐生成与任务轮询
 * 负责调用 /api/generate/music，并根据返回的 taskId (songId) 轮询任务状态
 */
export function useMusicGeneration() {
  // ==================== 1. 状态管理 ====================
  // 用户输入与配置
  const [musicPrompt, setMusicPrompt] = useState<string>(''); // 用户自定义风格（预设 Tag 组合）

  // 生成结果
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicTitle, setMusicTitle] = useState<string>('');
  const [musicCoverUrl, setMusicCoverUrl] = useState<string | null>(null);
  const [musicId, setMusicId] = useState<string | null>(null);

  // 状态控制
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null); // 有 ID 则轮询

  // External Stores
  const {
    play: playGlobal,
    stop: stopGlobal,
    setCoverImage,
    setExpanded,
    setIsGenerating: setGlobalGenerating,
  } = usePlayerStore();
  const { data: balance, isLoading: isBalanceLoading } = useCreditBalance();
  const currentBalance = balance ?? 0;
  const MUSIC_CREDIT_COST = 2; // Keep in sync with UI cost

  // ==================== 2. Mutation: 触发音乐生成 ====================
  const generateMusicMutation = useMutation({
    mutationFn: async (payload: {
      lyrics: string;
      prompt: string;
      title?: string;
      sourceText?: string;
      sourceUrl?: string; // 传递原始链接
      newsSummary?: string; // 传递摘要
      useStream?: boolean; // 新增：流式开关
    }) => {
      setManualLoading(true);
      setManualError(null);

      const musicStartTime = performance.now();

      // 调用后端 API
      const res = await fetch('/api/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          outputFormat: payload.useStream === false ? 'hex' : 'url',
          audioFormat: 'mp3',
          useStream: payload.useStream !== false,
        }),
      });

      console.log(
        `[Performance] Hook: Music API initial response in ${(performance.now() - musicStartTime).toFixed(2)}ms`
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to generate music' }));
        throw new Error(errorData.error || 'Failed to generate music');
      }

      const data = (await res.json()) as GenerateMusicApiResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate music');
      }
      return data;
    },
    onSuccess: (data: GenerateMusicApiResponse, variables: any) => {
      // --- 处理成功响应 ---
      const songId = data.song?.id || data.meta?.songId;
      const songTitle = data.song?.title || musicTitle || 'Generated Track';
      let audioUrl: string | undefined;

      const format = data.meta?.format ?? 'url';
      if (format === 'url') {
        // Mode A (Streaming proxy URL)
        audioUrl = data.audio || data.song?.audioUrl;
      } else {
        // Mode B (HEX data from non-streaming)
        const hex = data.audio;
        if (hex && typeof hex === 'string') {
          const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => Number.parseInt(b, 16)));
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          audioUrl = URL.createObjectURL(blob);
        }
      }

      setMusicUrl(audioUrl ?? null);
      setMusicTitle(songTitle);

      if (audioUrl) {
        playGlobal({
          id: songId || 'temp',
          title: songTitle,
          audioUrl: audioUrl,
          coverImageUrl: null,
          artist: 'AI Generated',
        });
        setExpanded(true);
      }

      if (songId) {
        setMusicId(songId);
        setProcessingTaskId(songId);
        setMusicCoverUrl(null);
      }

      const isStreaming = variables.useStream !== false && audioUrl?.includes('/stream');
      toast.success(isStreaming ? 'Generation started! Streaming in real-time...' : 'Music generated! Playing now.');
    },
    onError: (error: Error) => {
      // Handle sensitive content errors gracefully
      const isSensitiveError = error.message.includes('2013') || error.message.includes('sensitive');

      if (isSensitiveError) {
        console.warn('Music generation blocked by safety policy:', error.message);
        setManualError(error.message); // Keep raw message for the UI Alert to parse
        toast.error('Content Safety: Please revise your lyrics.');
      } else {
        console.error('Music generation failed:', error);
        setManualError(error.message);
        toast.error(`Music generation failed: ${error.message}`);
      }

      setProcessingTaskId(null);
      setGlobalGenerating(false);
    },
    onSettled: () => {
      setManualLoading(false);
    },
  });

  // ==================== 3. Query: 轮询后台任务状态 ====================
  const { data: pollingData } = useQuery({
    queryKey: ['song-processing', processingTaskId],
    queryFn: async () => {
      if (!processingTaskId) return null;
      const res = await fetch(`/api/songs/${processingTaskId}/processing-status`);
      return (await res.json()) as ProcessingStatusResponse;
    },
    enabled: !!processingTaskId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 3000;
    },
    gcTime: 0,
  });

  // ==================== 4. 派生状态与副作用处理 ====================
  const processingResult = pollingData;
  const processingStatus = processingResult?.status ?? null;
  const musicStatus = processingResult?.musicStatus ?? 'processing';
  const coverStatus = processingResult?.coverStatus ?? 'processing';

  // Sync Cover Image
  useEffect(() => {
    if (processingResult?.song?.coverImageUrl && processingResult.song.coverImageUrl !== musicCoverUrl) {
      const newCoverUrl = processingResult.song.coverImageUrl;
      setMusicCoverUrl(newCoverUrl);
      setCoverImage(newCoverUrl);
    }
  }, [processingResult?.song?.coverImageUrl, musicCoverUrl, setCoverImage, setMusicCoverUrl]);

  // Sync Global Loading State
  // Crucial: When page reloads, processingTaskId exists. We should setGlobalGenerating(true) if status is not completed.
  useEffect(() => {
    if (processingTaskId && processingStatus !== 'completed' && processingStatus !== 'failed') {
      setGlobalGenerating(true);
    }
  }, [processingTaskId, processingStatus, setGlobalGenerating]);

  // Handle Completion/Failure
  const handleProcessingComplete = useCallback(
    (result: ProcessingStatusResponse | undefined | null) => {
      setGlobalGenerating(false);

      // Sync Music URL if missing (e.g. resumption after reload)
      if (result?.song?.audioUrl && !musicUrl) {
        setMusicUrl(result.song.audioUrl);
        // Optionally update global player to show the new track
        playGlobal({
          id: musicId || 'resumed-song',
          title: musicTitle || 'Generated Track',
          audioUrl: result.song.audioUrl,
          coverImageUrl: result.song.coverImageUrl || musicCoverUrl,
          artist: 'AI Generated',
        });
        setExpanded(true);
      }
    },
    [musicUrl, setMusicUrl, playGlobal, musicId, musicTitle, musicCoverUrl, setExpanded, setGlobalGenerating]
  );

  useEffect(() => {
    if (processingStatus === 'completed') {
      handleProcessingComplete(processingResult);
    } else if (processingStatus === 'failed') {
      setGlobalGenerating(false);
      const errorMsg = 'Music generation failed in background. Please try again.';
      setManualError(errorMsg);
      toast.error(errorMsg);
    }
  }, [processingStatus, processingResult, handleProcessingComplete, setGlobalGenerating]);

  // ==================== 5. 对外暴露的核心方法 ====================
  const handleGenerateMusic = async (
    inputLyrics?: string | null,
    inputTitle?: string,
    newsContent?: string,
    newsLink?: string,
    newsSummary?: string,
    useStream?: boolean
  ) => {
    const currentLyrics = inputLyrics?.trim();
    if (!currentLyrics) return;

    // Reset State
    stopGlobal();
    setExpanded(true);
    setManualLoading(true);
    setManualError(null);
    setMusicUrl(null);
    setMusicCoverUrl(null);
    setProcessingTaskId(null);
    setGlobalGenerating(true);

    if (!isBalanceLoading && currentBalance < MUSIC_CREDIT_COST) {
      toast.error('Insufficient credits. You need more juice to drop this track.');
      setManualLoading(false);
      setGlobalGenerating(false);
      return;
    }

    await generateMusicMutation
      .mutateAsync({
        lyrics: currentLyrics,
        prompt: musicPrompt,
        title: (inputTitle ?? musicTitle)?.trim() || undefined,
        sourceText: newsContent || undefined,
        sourceUrl: newsLink || undefined,
        newsSummary: newsSummary || undefined,
        useStream: useStream,
      })
      .catch((error) => {
        console.warn('Suppressing unhandled mutation error:', error);
      });
  };

  // ==================== 6. 返回结果 ====================
  return {
    musicPrompt,
    setMusicPrompt,
    musicUrl,
    setMusicUrl,
    musicTitle,
    setMusicTitle,
    musicCoverUrl,
    setMusicCoverUrl,
    musicId: processingTaskId || musicId, // Prefer task ID if valid

    musicLoading: manualLoading || generateMusicMutation.isPending,
    setMusicLoading: setManualLoading,

    musicError: manualError,
    setMusicError: setManualError,

    handleGenerateMusic,

    musicStatus,
    coverStatus,
    processingStatus,
  };
}
