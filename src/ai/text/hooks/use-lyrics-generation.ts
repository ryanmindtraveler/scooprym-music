import { useCreateStore } from '@/store';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

// API 响应：生成歌词
import type { GenerateLyricsResponse, RewriteLyricsResponse } from '@/ai/text/types';

/**
 * 辅助函数：规范化歌词段落格式
 * 确保每个段落标签（如 [Verse]）前后有正确的换行，使显示更整洁
 */
function normalizeLyricsSections(raw: string) {
  return raw
    .replace(/\s*\[(intro|verse|pre-chorus|chorus|bridge|outro)\]\s*/gi, '\n[$1]\n')
    .replace(/\n{3,}/g, '\n\n') // 消除多余的空行
    .trim();
}

// ==================== 类型定义 ====================

// Hook 返回值接口
export interface UseLyricsGenerationReturn {
  // --- 歌词基础状态 ---
  lyrics: string; // 当前显示的歌词内容
  setLyrics: (value: string) => void;
  lyricsInputRef: React.RefObject<HTMLTextAreaElement | null>; // 歌词输入框的引用，用于聚焦/滚动

  // --- 编辑状态 ---
  isEditing: boolean; // 是否处于编辑模式
  setIsEditing: (value: boolean) => void;

  // --- 快照状态 (用于比对修改) ---
  musicLyricsSnapshot: string | null; // 上一次生成音频时的歌词快照
  setMusicLyricsSnapshot: (value: string | null) => void;
  hasUnsavedLyricsChanges: boolean; // 是否有未保存（未重新生成音乐）的歌词修改
  setHasUnsavedLyricsChanges: (value: boolean) => void;

  // --- 操作方法 ---
  handleGenerateLyrics: (
    newsContent: string,
    newsLink: string,
    musicPrompt: string
  ) => Promise<{ lyrics: string; title: string; summary?: string } | undefined>;

  handleRewriteLyrics: (musicPrompt: string) => Promise<void>;

  selectionRange: { start: number; end: number } | null;
  setSelectionRange: (range: { start: number; end: number } | null) => void;

  isRewriting: boolean; // 是否正在重写中（独立状态，用于UI展示加载特效）

  // --- 综合 Loading/Error 状态 ---
  loading: boolean;
  setLoading: (value: boolean) => void;
  error: string | null;
  setError: (value: string | null) => void;
}

/**
 * 歌词生成与管理核心 Hook (业务逻辑层)
 * 封装了 API 调用、状态管理、格式化处理
 */
export function useLyricsGeneration(): UseLyricsGenerationReturn {
  // ==================== 状态管理 ====================

  // 1. Persistent State (Zustand) - 通过 useCreateStore 获取全局状态
  // 这里的 lyrics 等状态其实托管在 store 中可能会更好，但目前的架构可能是混合的
  // 假设 lyrics 是在这个 Hook 内部管理的局部状态，或者从 prop 传入
  // 根据前面的代码分析，create-music-page 似乎也在管理 lyrics
  // 为了保持一致性，我们在这里维护内部状态，但如果需要持久化，应该同步到 store

  const [lyrics, setLyrics] = useState('');
  const lyricsInputRef = useRef<HTMLTextAreaElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [musicLyricsSnapshot, setMusicLyricsSnapshot] = useState<string | null>(null);
  const [hasUnsavedLyricsChanges, setHasUnsavedLyricsChanges] = useState(false);

  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // 2. Transient State (Loading/Error)
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // ==================== React Query Mutations ====================

  /**
   * Mutation: 生成歌词
   */
  const generateLyricsMutation = useMutation({
    mutationFn: async (payload: {
      newsUrl?: string;
      prompt?: string;
      modelProvider?: string;
    }) => {
      const res = await fetch('/api/generate/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as GenerateLyricsResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate lyrics');
      }
      return data;
    },
    onError: (error: Error) => {
      setManualError(error.message);
      toast.error(error.message || 'Failed to generate lyrics');
    },
  });

  /**
   * Mutation: 重写歌词
   */
  const rewriteLyricsMutation = useMutation({
    mutationFn: async (payload: {
      selectedText: string;
      context?: string;
      style?: string;
    }) => {
      const res = await fetch('/api/generate/lyrics/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as RewriteLyricsResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to rewrite lyrics');
      }
      return data;
    },
    onSuccess: (data, variables) => {
      // 重写成功后的处理逻辑
      // 替换原文中的选中部分
      const originalLyrics = lyrics;
      const { selectedText } = variables; // 注意：这里需要知道原始选中的文本或范围
      // 由于 mutationFn 的 payload 只包含 selectedText，我们可能需要依赖外部状态 selectionRange
      // 但为了准确性，最好在调用 mutate 时处理，或者在这里只能做通用提示
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to rewrite lyrics');
    },
  });

  // ==================== 业务逻辑方法 ====================

  /**
   * 处理完整的歌词生成流程
   */
  const handleGenerateLyrics = async (
    newsContent: string,
    newsLink: string,
    musicPrompt: string
  ): Promise<{ lyrics: string; title: string; summary?: string } | undefined> => {
    setManualLoading(true);
    setManualError(null);
    setLyrics(''); // 清空旧数据

    try {
      // 优先使用链接，其次是内容
      const payload = {
        newsUrl: newsLink || undefined,
        prompt: newsContent || undefined,
        modelProvider: 'openai', // 默认或从配置获取
      };

      const data = await generateLyricsMutation.mutateAsync(payload);

      const newLyrics = normalizeLyricsSections(data.lyrics || '');
      const songTitle = data.title || 'Generated Track';
      const summary = data.summary;

      setLyrics(newLyrics);
      // 生成新歌词后，重置“未保存修改”标记
      setHasUnsavedLyricsChanges(false);

      return { lyrics: newLyrics, title: songTitle, summary };
    } catch (e: any) {
      // 错误已在 onError 处理
      return undefined;
    } finally {
      setManualLoading(false);
    }
  };

  /**
   * 处理歌词局部重写
   */
  const handleRewriteLyrics = async (musicPrompt: string) => {
    if (!selectionRange || !lyrics) return;

    const { start, end } = selectionRange;
    const selectedText = lyrics.substring(start, end);

    if (!selectedText.trim()) return;

    try {
      const data = await rewriteLyricsMutation.mutateAsync({
        selectedText,
        context: lyrics,
        style: musicPrompt,
      });

      if (data.rewrittenText) {
        // 拼接新歌词： 前段 + 重写段 + 后段
        const before = lyrics.substring(0, start);
        const after = lyrics.substring(end);
        const newLyrics = before + data.rewrittenText + after;

        setLyrics(normalizeLyricsSections(newLyrics));
        setSelectionRange(null); // 重置选择
        toast.success('Lyrics rewritten! Fresh bars.');
      }
    } catch (e) {
      // Error handled in mutation
    }
  };

  // ==================== 返回 Hooks 接口 ====================
  return {
    lyrics,
    setLyrics,
    lyricsInputRef,
    isEditing,
    setIsEditing,
    loading: manualLoading || generateLyricsMutation.isPending || rewriteLyricsMutation.isPending,
    setLoading: setManualLoading,
    error: manualError,
    setError: setManualError,
    musicLyricsSnapshot,
    setMusicLyricsSnapshot,
    hasUnsavedLyricsChanges,
    setHasUnsavedLyricsChanges,
    handleGenerateLyrics,
    selectionRange,
    setSelectionRange,
    isRewriting: rewriteLyricsMutation.isPending,
    handleRewriteLyrics,
  };
}
