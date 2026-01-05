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
    <div className="w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      {/* Top Banner / Header with Gradient */}
      <div className="h-12 bg-linear-to-r from-violet-600 via-fuchsia-600 to-pink-600 flex items-center justify-between px-5">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="size-5" />
          <span className="font-bold text-lg tracking-wide">Quick Generate Music</span>
        </div>

        {/* Decorative 'Tabs' on the right similar to reference */}
        <div className="flex items-center gap-6 text-white/80 text-xs font-medium">
          <div className="flex items-center gap-1.5 cursor-not-allowed opacity-60">
            <span className="text-base">📰</span>
            <span>News to Song</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-not-allowed opacity-60">
            <span className="text-base">📝</span>
            <span>Lyrics to Song</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-not-allowed opacity-60">
            <span className="text-base">💡</span>
            <span>Idea to Song</span>
          </div>
        </div>
      </div>

      {/* Main Input Area */}
      {/* Main Input Area */}
      <form onSubmit={handleSubmit} className="p-5 relative flex flex-col">
        <Textarea
          name="content"
          placeholder="Describe the vibe, topic, or paste a link to generate music..."
          className="w-full h-[100px] overflow-y-auto border-none shadow-none resize-none text-lg md:text-xl text-slate-700 focus-visible:ring-0 p-2 placeholder:text-slate-300 bg-transparent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        {/* Bottom Actions */}
        <div className="w-full flex justify-end mt-6">
          <Button
            type="submit"
            size="lg"
            disabled={!content.trim()}
            className="rounded-full px-8 py-3 bg-linear-to-r from-violet-600 to-pink-600 text-white text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Sparkles className="mr-2 size-5" />
            Generate Music
          </Button>
        </div>
      </form>
    </div>
  );
}
