'use client';

/**
 * AI音乐生成页面 - 创建新音乐的核心界面
 *
 * 主要功能：
 * 1. 用户输入新闻链接或内容作为创作素材
 * 2. 选择音乐风格和情绪标签
 * 3. 生成AI歌词并支持实时编辑
 * 4. 将歌词转换为AI生成的音乐
 * 5. 提供歌词重写和音频重新生成功能
 * 6. 集成积分消费系统（每次生成消耗2积分）
 *
 * 页面路径：/(protected)/create
 * 访问权限：需要用户登录
 */

import { cn } from '@/lib/utils';
import { FileText, Link as LinkIcon, Loader2, Mic2, Music2, Sparkles, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MusicPlayer } from '@/components/player/music-player';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePlayerStore } from '@/store';

import { useConsumeCredits, useCreditBalance } from '@/hooks/billing/use-credits';

/**
 * 规范化歌词段落格式
 *
 * 功能：
 * 1. 分割：确保歌词段落标记（如[intro]、[verse]等）前后都有换行
 * 2. 换行：将连续的多个换行压缩为两个换行
 * 3. 去空白：去除首尾空白字符
 *
 * @param raw 原始歌词文本
 * @returns 格式化后的歌词文本
 */
function normalizeLyricsSections(raw: string) {
  return raw
    .replace(/\s*\[(intro|verse|pre-chorus|chorus|bridge|outro)\]\s*/gi, '\n[$1]\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 音乐创作主页面组件
 *
 * 核心流程：
 * 1. 用户输入新闻内容/链接 → 生成AI歌词 → 生成AI音乐
 * 2. 支持歌词编辑和段落重写
 * 3. 集成积分消费和余额检查
 * 4. 提供实时音乐播放器
 *
 * @returns 音乐创作页面JSX
 */
export default function CreateMusicPage() {
  const t = useTranslations(); // 获取多语言翻译函数
  const searchParams = useSearchParams(); // 获取URL查询参数

  // 每次生成音乐消耗的积分数量
  const MUSIC_CREDIT_COST = 2;

  // 用户积分余额相关状态
  const { data: balance, isLoading: isBalanceLoading } = useCreditBalance();
  const currentBalance = balance ?? 0;
  const isOutOfCredits = !isBalanceLoading && currentBalance <= 0;
  const consumeCreditsMutation = useConsumeCredits();
  const playSong = usePlayerStore((state) => state.play);

  // 面包屑导航数据 t()是翻译函数
  const breadcrumbs = [
    { label: t('Dashboard.dashboard.title') },
    {
      label: t('Dashboard.create.title', { default: 'Create' }),
      isCurrentPage: true,
    },
  ];

  // ==================== 状态变量 ====================
  // 用户输入和内容相关
  const [newsLink, setNewsLink] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [lyrics, setLyrics] = useState('');
  const lyricsInputRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 音乐生成相关状态
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicTitle, setMusicTitle] = useState<string>('');
  const [musicCoverUrl, setMusicCoverUrl] = useState<string | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  // 后台处理状态跟踪
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<
    'processing' | 'generating_cover' | 'completed' | 'failed' | null
  >(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  const [musicLyricsSnapshot, setMusicLyricsSnapshot] = useState<string | null>(null);
  const [hasUnsavedLyricsChanges, setHasUnsavedLyricsChanges] = useState(false);

  // 新增状态变量用于延迟播放和详细状态显示
  const [hasPlayed, setHasPlayed] = useState(false); // 是否已播放
  const [temporaryAudioUrl, setTemporaryAudioUrl] = useState<string | null>(null); // 临时音频URL（等待扣费后播放）
  const [musicStatus, setMusicStatus] = useState<'processing' | 'uploaded' | 'failed'>('processing'); // 音乐生成状态
  const [coverStatus, setCoverStatus] = useState<'processing' | 'generating' | 'completed' | 'failed' | 'skipped'>(
    'processing'
  ); // 封面生成状态
  const [creditsDeducted, setCreditsDeducted] = useState(false); // 是否已扣费

  const canGenerate = newsContent.trim().length > 0 || newsLink.trim().length > 0;
  const isGenerating = loading || musicLoading;

  // 从URL查询参数中预填充内容（例如从分享链接进入）
  useEffect(() => {
    const content = searchParams?.get('content');
    if (content && !newsContent) {
      setNewsContent(content);
    }
  }, [searchParams]);

  // 清理轮询间隔
  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  /**
   * 生成AI音乐的核心函数
   *
   * 流程：
   * 1. 检查用户积分余额
   * 2. 调用 /api/generate-music API 生成音乐
   * 3. 处理音频返回格式（URL或HEX）
   * 4. 更新音乐URL、标题、封面等状态
   * 5. 扣除相应积分
   * 6. 保存歌词快照用于检测未保存的修改
   *
   * @param inputLyrics 可选的歌词输入（用于重新生成时传入新歌词）
   * @param inputTitle 可选的标题输入
   */
  const handleGenerateMusic = async (inputLyrics?: string, inputTitle?: string) => {
    const currentLyrics = (inputLyrics ?? lyricsInputRef.current?.value ?? lyrics)?.trim();
    if (!currentLyrics) return;
    setMusicLoading(true);
    setMusicError(null);
    setMusicUrl(null);
    setMusicCoverUrl(null);
    // 重置后台处理状态
    setProcessingStatus(null);
    setProcessingTaskId(null);
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }

    try {
      if (!isBalanceLoading && currentBalance < MUSIC_CREDIT_COST) {
        toast.error('Insufficient credits. You need more juice to drop this track.');
        return;
      }

      const res = await fetch('/api/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: currentLyrics,
          prompt: musicPrompt,
          outputFormat: 'url',
          audioFormat: 'mp3',
          title: (inputTitle ?? musicTitle)?.trim() || undefined,
          sourceText: newsContent || undefined,
          sourceUrl: newsLink || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to generate music');
      }
      const format = data?.meta?.format ?? 'url';
      let temporaryAudioUrl: string | null = null;
      if (format === 'url') {
        temporaryAudioUrl = (data.audio as string) ?? (data.song?.audioUrl as string);
      } else {
        const hex: string = data.audio as string;
        const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b: string) => Number.parseInt(b, 16)));
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        temporaryAudioUrl = URL.createObjectURL(blob);
      }
      // 不立即设置 musicUrl，等待扣费完成

      const songTitle = (data?.song?.title as string | undefined) || (inputTitle ?? musicTitle) || 'Generated Track';
      setMusicTitle(songTitle);
      // 封面URL将通过轮询更新，不在这里设置初始值
      setMusicCoverUrl(null);

      // 启动后台处理状态轮询
      const songId = data?.song?.id || data?.meta?.songId;
      if (songId) {
        // 清除现有轮询
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
          setPollingIntervalId(null);
        }

        setProcessingTaskId(songId);
        setProcessingStatus('processing');

        // 启动轮询
        const intervalId = setInterval(() => {
          fetch(`/api/songs/${songId}/processing-status`)
            .then((res) => res.json())
            .then((result) => {
              if (result.success) {
                // 更新所有状态
                setProcessingStatus(result.status);
                setMusicStatus(result.musicStatus);
                setCoverStatus(result.coverStatus);
                setCreditsDeducted(result.creditsDeducted);

                // 扣费完成且之前未播放，则开始播放
                if (result.creditsDeducted && !hasPlayed) {
                  // 使用当前的临时音频URL
                  const currentTempUrl = temporaryAudioUrl;
                  if (currentTempUrl) {
                    setMusicUrl(currentTempUrl); // 开始播放
                    setHasPlayed(true);
                    playSong({
                      id: songId,
                      title: songTitle,
                      audioUrl: currentTempUrl,
                      coverImageUrl: result.song?.coverImageUrl || null,
                      artist: 'AI Generated',
                    });
                    toast.success('Credits deducted, now playing!');
                  }
                }

                // 封面生成完成，更新显示
                if (result.coverStatus === 'completed' && result.song?.coverImageUrl) {
                  setMusicCoverUrl(result.song.coverImageUrl);
                }

                // 处理完成，清除轮询
                if (result.status === 'completed' || result.status === 'failed') {
                  clearInterval(intervalId);
                  setPollingIntervalId(null);

                  if (result.status === 'completed') {
                    toast.success('Background processing completed!');
                  } else {
                    toast.error('Background processing failed. Audio saved but cover may be missing.');
                  }
                }
              }
            })
            .catch((error) => {
              console.error('Polling error:', error);
              // 错误时不停止轮询，继续尝试
            });
        }, 3000); // 每3秒轮询一次

        setPollingIntervalId(intervalId);
      }
      setMusicLyricsSnapshot(currentLyrics);
      setHasUnsavedLyricsChanges(false);

      // 保存临时音频URL，等待扣费完成后再播放
      setTemporaryAudioUrl(temporaryAudioUrl);
      setHasPlayed(false);
      setCreditsDeducted(false);
      setMusicStatus('processing');
      setCoverStatus('processing');

      toast.success('Track saved to My Songs. Processing in background...');
    } catch (e: any) {
      setMusicError(e?.message || 'Failed to generate music');
      // 重新抛出错误，让外层handleGenerate也能捕获
      throw e;
    } finally {
      setMusicLoading(false);
    }
  };

  /**
   * 完整的音乐生成流程（歌词生成 + 音乐生成）
   *
   * 流程：
   * 1. 检查积分余额
   * 2. 调用 /api/generate-lyrics API 生成AI歌词
   * 3. 规范化歌词格式
   * 4. 调用 handleGenerateMusic 生成音乐
   * 5. 处理错误和加载状态
   *
   * 注意：此函数在用户点击"Generate Track"按钮时触发
   */
  const handleGenerate = async () => {
    if (isOutOfCredits) {
      toast.error('Insufficient credits. Top up to keep the flow going.');
      return;
    }

    setLoading(true);
    setError(null);
    setLyrics('');

    try {
      const text = newsContent;

      // 步骤1: 生成歌词
      const res = await fetch('/api/generate/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          url: newsLink || undefined,
          modelProvider: 'openrouter',
          style: musicPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate lyrics');
      }

      const newLyrics = normalizeLyricsSections(data.lyrics as string);
      const songTitle = (data.title as string | undefined) || 'Generated Track';
      setLyrics(newLyrics);
      setMusicTitle(songTitle);
      setHasUnsavedLyricsChanges(false);

      await handleGenerateMusic(newLyrics, songTitle);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate lyrics');
    } finally {
      setLoading(false);
    }
  };

  // 歌词重写功能相关状态
  const [selectionRange, setSelectionRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  /**
   * 重写选中的歌词段落
   *
   * 流程：
   * 1. 检查是否有选中的文本范围
   * 2. 提取选中文本
   * 3. 调用 /api/rewrite-lyrics API 重写选中部分
   * 4. 将重写后的文本替换到原歌词中
   * 5. 规范化歌词格式并更新状态
   *
   * 注意：用户在歌词编辑器中选择文本后点击"Rewrite Selected"按钮触发
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to rewrite lyrics');
      }

      const rewrittenText = data.rewrittenText;
      const newLyrics = lyrics.substring(0, start) + rewrittenText + lyrics.substring(end);
      setLyrics(normalizeLyricsSections(newLyrics));
      setSelectionRange(null);
      toast.success('Lyrics rewritten! Fresh bars.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to rewrite lyrics');
    } finally {
      setIsRewriting(false);
    }
  };

  /**
   * 音乐创作页面主渲染函数
   *
   * 页面结构：
   * 1. DashboardHeader - 顶部导航栏，显示面包屑路径
   * 2. 主内容区域 - 两栏响应式布局
   *    - 左侧：新闻输入、音乐风格选择、生成按钮
   *    - 右侧：歌词显示、编辑和重写功能
   * 3. MusicPlayer - 底部固定音乐播放器（条件渲染）
   *
   * 状态依赖：
   * - 用户输入：newsLink, newsContent, musicPrompt
   * - 歌词状态：lyrics, isEditing, selectionRange
   * - 生成状态：loading, musicLoading, error, musicError
   * - 音乐结果：musicUrl, musicTitle, musicCoverUrl
   * - 积分状态：currentBalance, isBalanceLoading
   *
   * @returns {JSX.Element} 音乐创作页面JSX结构
   */
  return (
    <>
      {/**
       * DashboardHeader - 页面顶部导航栏组件
       *
       * 功能：显示当前页面的面包屑导航路径，提供页面导航上下文
       * 参数：breadcrumbs - 面包屑数组，包含当前页面和父页面的标签信息
       *       breadcrumbs 定义在组件内部，包含 'Dashboard' 和 'Create' 两个层级
       */}
      <DashboardHeader breadcrumbs={breadcrumbs} />

      {/**
       * 主内容容器 - 页面核心内容区域
       */}
      <div className="flex flex-1 flex-col bg-background min-h-screen pb-32">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
            {/**
             * 页面标题区域 - 包含页面标题和用户积分余额显示
             *
             * 布局：移动端垂直排列，桌面端水平排列并两端对齐
             * 左侧：页面标题和描述文本
             * 右侧：用户当前积分余额（仅在积分数据加载完成后显示）
             */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/**
               * 页面标题和描述区域
               *
               * 显示页面主标题 "Studio Session" 和描述文本
               * 标题使用 primary 颜色高亮 "Session" 单词，增强视觉层次
               */}
              <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase">
                  Studio <span className="text-primary">Session</span>
                </h1>
                <p className="text-muted-foreground">Turn the news into a banger. Let's cook.</p>
              </div>
              {/**
               * 用户积分余额显示组件
               *
               * 条件渲染：仅在积分余额数据加载完成(!isBalanceLoading)后显示
               * 避免在加载期间显示不准确的数据或闪烁
               *
               * 显示内容：
               * - Zap 图标：使用主题主色，表示能量/积分概念
               * - 当前余额：从 currentBalance 状态变量获取并显示
               */}
              {!isBalanceLoading && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border/50">
                  <Zap className="size-4 text-primary fill-primary" />
                  <span className="font-bold">{currentBalance} Credits</span>
                </div>
              )}
            </div>

            {/**
             * 两栏响应式网格布局容器
             *
             * 功能：在桌面端(lg以上)显示两栏布局，移动端堆叠显示
             * 左侧栏：新闻输入和音乐风格选择区域
             * 右侧栏：歌词显示和编辑区域
             */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/**
               * 左侧栏容器 - 新闻输入和音乐风格选择区域
               *
               * 功能：包含用户输入新闻内容、选择音乐风格的完整表单
               * 布局：垂直弹性布局，子元素间距为6个单位(24px)
               */}
              <div className="flex flex-col gap-6">
                {/**
                 * 输入卡片组件 - 主要输入区域容器
                 *
                 * 使用Card组件包装，提供视觉层次和边框效果
                 * 包含：新闻链接输入、新闻内容输入、音乐风格选择、生成按钮
                 */}
                <Card className="p-6 flex h-full flex-col shadow-xl bg-card/50 backdrop-blur-sm border-border/50">
                  {/**
                   * 卡片标题区域 - 输入区域的标题和图标
                   *
                   * 布局：水平居中布局，包含图标和文字标题
                   * 底部有分割线，与内容区域视觉分离
                   */}
                  <div className="flex items-center gap-2 pb-4 border-b border-border/50 mb-6">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <h3 className="text-lg font-bold uppercase tracking-wide">Source Material</h3>
                  </div>

                  {/**
                   * 输入表单区域容器 - 包含所有输入字段
                   *
                   * 使用垂直间距布局，子元素之间间距为6个单位(24px)
                   * 包含：新闻链接输入、新闻内容输入、音乐风格选择
                   */}
                  <div className="space-y-6">
                    {/**
                     * 新闻链接输入字段 - 用于输入新闻文章的URL
                     *
                     * 布局：垂直间距布局，包含标签和输入框
                     * 状态绑定：newsLink状态变量，通过setNewsLink更新
                     */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">News Link</span>
                      </div>
                      <Input
                        placeholder="Paste a URL..."
                        className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all font-mono"
                        value={newsLink}
                        onChange={(e) => setNewsLink(e.target.value)}
                      />
                    </div>

                    {/**
                     * 新闻内容输入字段 - 用于输入新闻文章内容或描述
                     *
                     * 布局：垂直间距布局，包含标签和多行文本输入框
                     * 状态绑定：newsContent状态变量，通过setNewsContent更新
                     * 用途：用户可以直接粘贴新闻文本或描述想要创作的音乐氛围
                     */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">Content / Context</span>
                      </div>
                      <Textarea
                        placeholder="Paste the article text or describe the vibe..."
                        className="h-[200px] resize-none overflow-y-auto font-mono bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                        value={newsContent}
                        onChange={(e) => setNewsContent(e.target.value)}
                      />
                    </div>

                    {/**
                     * 音乐风格标签选择区域 - 用于选择音乐的风格和情绪
                     *
                     * 布局：垂直间距布局，包含标题和可点击的标签按钮
                     * 功能：用户可以选择多个音乐风格标签，标签状态会更新musicPrompt状态
                     * 状态绑定：musicPrompt状态变量，包含逗号分隔的选中标签字符串
                     *
                     * 交互逻辑：
                     * 1. 将musicPrompt字符串按逗号分割为标签数组
                     * 2. 检查每个标签是否在当前选中标签数组中
                     * 3. 点击标签时，根据当前选中状态添加或移除标签
                     * 4. 更新musicPrompt状态为新的逗号分隔字符串
                     */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Music2 className="size-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">Vibe Check</span>
                      </div>
                      {/* 标签容器 */}
                      <div className="flex flex-wrap gap-2">
                        {/* 渲染所有可选的音乐风格标签 */}
                        {[
                          'Hip-Hop',
                          'Trap',
                          'Drill',
                          'Boom Bap',
                          'R&B',
                          'Aggressive',
                          'Chill',
                          'Dark',
                          'Fast',
                          'Slow',
                        ].map((tag) => {
                          // 检查当前标签是否已被选中
                          const isSelected = musicPrompt
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .includes(tag);
                          return (
                            <Button
                              key={tag}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                'h-8 text-xs font-bold uppercase tracking-wider transition-all rounded-full',
                                isSelected
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                  : 'bg-background hover:bg-muted'
                              )}
                              onClick={() => {
                                // 处理标签选择/取消选择逻辑
                                const currentTags = musicPrompt
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter((s: string) => s);
                                let newTags: string[];
                                if (isSelected) {
                                  // 如果标签已选中，则移除
                                  newTags = currentTags.filter((t) => t !== tag);
                                } else {
                                  // 如果标签未选中，则添加
                                  newTags = [...currentTags, tag];
                                }
                                setMusicPrompt(newTags.join(', '));
                              }}
                            >
                              {tag}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/**
                   * 底部操作区域 - 包含生成按钮和错误信息显示
                   *
                   * 布局：顶部内边距32px，自动上边距将内容推到底部
                   * 功能：触发音乐生成流程，显示生成过程中的错误信息
                   *
                   * 按钮状态：
                   * - 启用条件：canGenerate(有输入内容)且不在生成中(!isGenerating)
                   * - 禁用状态：灰色显示，不可点击
                   * - 加载状态：显示旋转加载图标和"Cooking..."文本
                   * - 正常状态：显示Sparkles图标和消耗积分提示
                   *
                   * 错误显示：
                   * - 歌词生成错误(error)：从handleGenerate函数捕获
                   * - 音乐生成错误(musicError)：从handleGenerateMusic函数捕获
                   * - 使用destructive颜色主题，突出显示错误
                   */}
                  <div className="pt-8 mt-auto">
                    {/* 主生成按钮 */}
                    <Button
                      className="w-full justify-center py-8 text-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      onClick={handleGenerate}
                      disabled={!canGenerate || isGenerating}
                    >
                      {isGenerating ? (
                        // 生成中的加载状态
                        <>
                          <Loader2 className="mr-3 size-6 animate-spin" />
                          Cooking...
                        </>
                      ) : (
                        // 正常状态的生成按钮
                        <>
                          <Sparkles className="mr-3 size-6" />
                          Generate Track{' '}
                          <span className="ml-2 text-sm opacity-70 font-normal">(-{MUSIC_CREDIT_COST})</span>
                        </>
                      )}
                    </Button>

                    {/* 歌词生成错误显示 */}
                    {error && (
                      <p className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-lg font-medium text-center border border-destructive/20">
                        {error}
                      </p>
                    )}
                    {/* 音乐生成错误显示 */}
                    {musicError && (
                      <p className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-lg font-medium text-center border border-destructive/20">
                        {musicError}
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              {/**
               * 右侧栏容器 - 歌词显示和编辑区域
               *
               * 功能：显示AI生成的歌词，提供歌词编辑和重写功能
               * 包含：歌词编辑器、编辑模式切换、选中文本重写、重新生成音频按钮
               */}
              <Card className="p-6 flex h-full flex-col shadow-xl bg-card/50 backdrop-blur-sm border-border/50">
                {/**
                 * 歌词卡片标题区域 - 包含歌词区域标题和操作控件
                 *
                 * 布局：水平两端对齐布局
                 * 左侧：歌词图标、标题、重新生成音频按钮（条件显示）
                 * 右侧：编辑模式切换开关
                 *
                 * 条件渲染逻辑：
                 * - 重新生成音频按钮：仅在存在歌词快照(musicLyricsSnapshot)且有未保存更改(hasUnsavedLyricsChanges)时显示
                 * - 点击触发handleGenerateMusic()重新生成音乐
                 * - 音乐生成期间禁用按钮(musicLoading)
                 *
                 * 编辑模式开关：
                 * - 控制歌词文本区域是否可编辑
                 * - 状态绑定：isEditing布尔值
                 * - 事件：setIsEditing更新函数
                 */}
                <div className="flex items-center pb-4 border-b border-border/50 mb-6">
                  {/* 左侧：图标和标题 */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent">
                      <Mic2 className="size-5" />
                    </div>
                    <h3 className="text-lg font-bold uppercase tracking-wide">Lyrics</h3>
                    {/* 后台处理状态指示器 */}
                    {processingStatus && processingStatus !== 'completed' && (
                      <div className="ml-2 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-muted border border-border/50">
                        <div
                          className={`size-2 rounded-full ${
                            processingStatus === 'processing'
                              ? 'bg-yellow-500 animate-pulse'
                              : processingStatus === 'generating_cover'
                                ? 'bg-blue-500 animate-pulse'
                                : 'bg-red-500'
                          }`}
                        />
                        <span className="text-muted-foreground">
                          {processingStatus === 'processing' && 'Processing...'}
                          {processingStatus === 'generating_cover' && 'Generating cover...'}
                          {processingStatus === 'failed' && 'Processing failed'}
                        </span>
                      </div>
                    )}
                    {/* 如果有未保存的歌词修改，显示重新生成音频按钮 */}
                    {musicLyricsSnapshot && hasUnsavedLyricsChanges ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 h-7 text-xs"
                        onClick={() => {
                          void handleGenerateMusic();
                        }}
                        disabled={musicLoading}
                      >
                        Regenerate Audio
                      </Button>
                    ) : null}
                  </div>
                  {/* 右侧：编辑模式切换开关 */}
                  <div className="ml-auto flex items-center gap-3 text-sm font-medium text-muted-foreground">
                    <span>Edit Mode</span>
                    <Switch checked={isEditing} onCheckedChange={setIsEditing} aria-label="Edit Lyrics" />
                  </div>
                </div>

                {/**
                 * 歌词内容显示区域 - 显示歌词编辑器或空状态提示
                 *
                 * 布局：最小高度420px，弹性布局占满剩余空间
                 * 条件渲染：
                 * - 有歌词(lyrics)：显示歌词文本编辑器
                 * - 无歌词：显示空状态提示，引导用户输入新闻内容
                 *
                 * 歌词编辑器功能：
                 * 1. 文本编辑：根据isEditing状态控制是否可编辑
                 * 2. 修改检测：对比当前歌词与快照，标记未保存更改
                 * 3. 文本选择：监听选择事件，用于歌词重写功能
                 * 4. 重写按钮：选中文本时显示重写按钮（仅在编辑模式）
                 *
                 * 状态依赖：
                 * - lyrics: 当前歌词文本
                 * - isEditing: 编辑模式状态
                 * - musicLyricsSnapshot: 最后生成音乐时的歌词快照
                 * - hasUnsavedLyricsChanges: 是否有未保存的歌词修改
                 * - selectionRange: 当前选中的文本范围
                 * - isRewriting: 歌词重写加载状态
                 */}
                <div className="min-h-[420px] flex flex-col flex-1">
                  {lyrics ? (
                    // 有歌词时的显示
                    <>
                      <div className="relative flex-1">
                        {/* 歌词文本编辑器 */}
                        <Textarea
                          ref={lyricsInputRef}
                          value={lyrics}
                          onChange={(e) => {
                            const value = e.target.value;
                            setLyrics(value);
                            // 检测歌词是否有未保存的修改
                            if (musicLyricsSnapshot) {
                              const trimmed = value.trim();
                              setHasUnsavedLyricsChanges(trimmed !== musicLyricsSnapshot);
                            }
                          }}
                          onSelect={(e) => {
                            // 监听文本选择，用于歌词重写功能
                            const target = e.target as HTMLTextAreaElement;
                            if (target.selectionStart !== target.selectionEnd) {
                              setSelectionRange({
                                start: target.selectionStart,
                                end: target.selectionEnd,
                              });
                            } else {
                              setSelectionRange(null);
                            }
                          }}
                          placeholder="Your generated lyrics will appear here..."
                          readOnly={!isEditing}
                          className="h-full min-h-[400px] resize-none font-mono text-lg leading-relaxed bg-transparent border-none focus:ring-0 p-0"
                        />
                        {/* 选中文本时的重写按钮（仅在编辑模式下显示） */}
                        {selectionRange && isEditing && (
                          <div className="absolute bottom-4 right-4 z-10">
                            <Button
                              size="sm"
                              onClick={handleRewriteLyrics}
                              disabled={isRewriting}
                              className="shadow-lg bg-background text-foreground hover:bg-muted border border-border"
                            >
                              {isRewriting ? (
                                <Loader2 className="mr-2 size-3 animate-spin" />
                              ) : (
                                <Sparkles className="mr-2 size-3 text-accent" />
                              )}
                              Rewrite Selected
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    // 无歌词时的空状态显示
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/5 p-8">
                      <div className="size-16 rounded-full bg-muted/20 flex items-center justify-center">
                        <Mic2 className="size-8 opacity-50" />
                      </div>
                      <p className="font-medium max-w-xs">
                        Enter news content on the left to start generating your track.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/**
       * 固定底部音乐播放器组件 - 条件渲染的音频播放器
       *
       * 渲染条件：有音乐URL(musicUrl)或正在加载音乐(musicLoading)时显示
       * 位置：固定在视口底部，全宽度（桌面端考虑侧边栏偏移）
       * 功能：播放生成的AI音乐，显示歌曲信息、封面图片和加载状态
       *
       * MusicPlayer组件参数：
       * - audioUrl: 音频文件地址
       * - title: 歌曲标题
       * - artist: 艺术家名称（固定为"AI Generated"）
       * - loading: 加载状态，显示加载指示器
       * - coverImageUrl: 封面图片URL，可选
       * - className: 自定义样式类
       */}
      {musicUrl || musicLoading ? (
        <div className="fixed bottom-0 right-0 z-50 left-0 md:left-[288px]">
          <MusicPlayer className="border-t border-border/50 shadow-2xl bg-background/95 backdrop-blur-md" />
        </div>
      ) : null}
    </>
  );
}
