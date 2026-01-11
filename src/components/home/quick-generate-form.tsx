'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Routes } from '@/routes';
import { ArrowUp, Bot, Image as ImageIcon, Sparkles, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCreateStore } from '@/store';

export function QuickGenerateForm() {
  const router = useRouter();
  const [content, setContent] = useState('');

  // Use stable individual selectors to prevent "Maximum update depth exceeded"
  const setNewsContent = useCreateStore((state) => state.setNewsContent);
  const setNewsLink = useCreateStore((state) => state.setNewsLink);
  const reset = useCreateStore((state) => state.reset);
  const setShouldAutoGenerate = useCreateStore((state) => state.setShouldAutoGenerate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error('Please enter some content to generate music');
      return;
    }

    // 1. Reset previous session data for a fresh start
    reset();

    // 2. Smart Detect: URL vs Text
    // Supports http://, https://, and www.
    const isUrl = /^(https?:\/\/|www\.)[^ "]+$/i.test(trimmed);

    if (isUrl) {
      setNewsLink(trimmed);
    } else {
      setNewsContent(trimmed);
    }

    // Set auto-generate flag to true so Create page starts immediately
    setShouldAutoGenerate(true);

    // 3. Navigate to Studio
    router.push(Routes.Create);
  };

  return (
    <div className="w-full mx-auto relative group">
      {/* Ambient Glow - Backlight */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[28px] shadow-2xl overflow-hidden border border-white/50 dark:border-white/10 ring-1 ring-black/5">
        {/* Header Section */}
        <div className="h-14 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20 text-white backdrop-blur-md shadow-inner">
              <Sparkles className="size-4 text-yellow-300 fill-yellow-300/20" />
            </div>
            <span className="font-bold text-sm tracking-wide text-white shadow-sm">Quick Create</span>
          </div>

          {/* Pill Tabs */}
          <div className="flex bg-black/20 p-1 rounded-full border border-white/10 backdrop-blur-md">
            <button
              type="button"
              className="px-3 py-1 bg-white/90 rounded-full shadow-sm text-[10px] font-bold text-indigo-600 flex items-center gap-1.5 transition-all"
            >
              <span>📰</span> News
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-full text-[10px] font-medium text-white/70 flex items-center gap-1.5 hover:text-white transition-colors cursor-not-allowed"
            >
              <span>📝</span> Lyrics
            </button>
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-1 relative">
          <div className="relative group/input rounded-[24px] bg-slate-50/50 dark:bg-black/20 m-1 transition-colors duration-300 focus-within:bg-white dark:focus-within:bg-black/40">
            <Textarea
              name="content"
              placeholder="What's on your mind? Paste a link or describe a vibe..."
              className="w-full h-[140px] border-0 shadow-none resize-none text-xl md:text-2xl font-medium leading-relaxed p-6 pb-28 placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent rounded-[24px] focus-visible:ring-0 text-slate-800 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            {/* Action Bar inside the input container */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-transparent z-20">
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/20">
                  {content.trim().startsWith('http') ? 'LINK MODE' : 'TEXT MODE'}
                </div>
                {content.length > 0 && (
                  <span className="text-[10px] text-slate-400 animate-in fade-in slide-in-from-left-2">
                    {content.length} chars
                  </span>
                )}
              </div>

              <Button
                type="submit"
                disabled={!content.trim()}
                className="rounded-xl px-6 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 group/btn"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wide">Generate</span>
                  <ArrowUp className="size-4 group-hover/btn:-rotate-45 transition-transform duration-300" />
                </div>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
