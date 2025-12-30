'use client';

import { LoginWrapper } from '@/components/auth/login-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/auth/use-current-user';
import { useMounted } from '@/hooks/ui/use-mounted';
import { LocaleLink } from '@/i18n/navigation';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { ArrowUpRight, Mic, Sparkles, Wand2 } from 'lucide-react';
import { AnimatePresence, type Variants, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

const contentTypes: string[] = ['News Farce', 'Hot Gossip', 'WTF Society'];

const musicStyles: string[] = [
  '#Trap',
  '#Satirical',
  '#ParodyRap',
  '#MemeEnergy',
  '#Banger',
  '#Catchy',
  '#BoldAttitude',
  '#Absurd',
];

// Micro-motion Variants
const blobVariant: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.5, 0.3],
    transition: {
      duration: 8,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'easeInOut',
    },
  },
};

const stickerVariant: Variants = {
  hover: {
    rotate: [0, -10, 10, -5, 5, 0],
    scale: 1.1,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

const tagItemVariant: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export function MusicGeneratorBlock() {
  const [newsContent, setNewsContent] = useState('');
  const [selectedContentType, setSelectedContentType] = useState(contentTypes[0]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([musicStyles[0]]);
  const mounted = useMounted();
  const currentUser = useCurrentUser();
  const locale = useLocale();

  const handleStyleToggle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const generateUrl = getUrlWithLocale(
    `${Routes.Create}?content=${encodeURIComponent(newsContent)}&style=${encodeURIComponent(selectedStyles.join(','))}&autoGenerate=true`,
    locale
  );

  const colors = [
    'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-200',
    'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200',
    'bg-green-100 hover:bg-green-200 text-green-700 border-green-200',
    'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200',
    'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200',
    'bg-pink-100 hover:bg-pink-200 text-pink-700 border-pink-200',
  ];

  const selectedColors = [
    'bg-yellow-500 border-yellow-600 text-white shadow-yellow-200',
    'bg-purple-500 border-purple-600 text-white shadow-purple-200',
    'bg-green-500 border-green-600 text-white shadow-green-200',
    'bg-blue-500 border-blue-600 text-white shadow-blue-200',
    'bg-orange-500 border-orange-600 text-white shadow-orange-200',
    'bg-pink-500 border-pink-600 text-white shadow-pink-200',
  ];

  const buttonClass = "w-full py-4 text-xl font-black tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all duration-300 transform active:scale-95 shadow-lg relative overflow-hidden group";
  const buttonContent = (
     <>
        <span className="relative z-10 flex items-center gap-2">
            <Sparkles className="size-5 animate-pulse" />
            GENERATE TRACK
            <ArrowUpRight className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </span>
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
     </>
  );

  return (
    <section className="relative w-full max-w-5xl mx-auto p-4 md:p-8">
       <div className="relative bg-white rounded-[3rem] shadow-2xl border-4 border-slate-900 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
          {/* Left Panel: Inputs */}
          <div className="flex-1 p-8 md:p-12 flex flex-col relative z-10 bg-white">
            <div className="mb-6">
                 <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 mb-2 transform -rotate-1">
                    Quick <span className="text-indigo-600">Cook</span>
                 </h2>
                 <p className="text-slate-500 font-bold tracking-wide">Turn anything into a banger in seconds.</p>
            </div>

            {/* Type Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {contentTypes.map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedContentType(type)}
                        className={cn(
                            "px-4 py-2 rounded-full font-bold text-sm border-2 transition-all duration-200",
                            selectedContentType === type
                                ? "bg-slate-900 text-white border-slate-900 shadow-lg transform -rotate-2"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                        )}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Main Input */}
            <div className="relative group mb-6 flex-1 min-h-[160px]">
                <div className="absolute inset-0 bg-indigo-500 rounded-2xl translate-x-1 translate-y-1 transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
                <Textarea
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    placeholder="Paste a link, a tweet, or just rant about your day..."
                    className="relative w-full h-full bg-white border-2 border-slate-900 rounded-2xl p-6 text-lg font-medium resize-none focus:ring-0 focus:border-indigo-600 focus:shadow-none placeholder:text-slate-300"
                />
            </div>

             {/* Generate Button */}
             <div className="mt-auto">
                 {mounted && currentUser ? (
                      <LocaleLink href={generateUrl} onClick={(e) => {
                          if (!newsContent.trim()) {
                              e.preventDefault();
                              toast.error('Please enter some content to generate music!');
                          }
                      }}>
                           <Button className={cn(buttonClass, "bg-indigo-600 hover:bg-indigo-700 text-white")}>
                               {buttonContent}
                           </Button>
                      </LocaleLink>
                 ) : (
                      <LoginWrapper mode="modal">
                          <Button className={cn(buttonClass, "bg-slate-900 hover:bg-slate-800 text-white")}>
                               {buttonContent}
                          </Button>
                      </LoginWrapper>
                 )}
             </div>
          </div>

          {/* Right Panel: Vibe Selector */}
          <div className="w-full md:w-[40%] bg-slate-50 border-t-4 md:border-t-0 md:border-l-4 border-slate-900 p-8 flex flex-col relative overflow-hidden">
               {/* Decorative Blobs */}
               <motion.div variants={blobVariant} animate="animate" className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl pointer-events-none opacity-50" />
               <motion.div variants={blobVariant} animate="animate" className="absolute bottom-10 left-10 w-40 h-40 bg-pink-300 rounded-full blur-3xl pointer-events-none opacity-50" />

               <h3 className="text-xl font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                   <Wand2 className="size-5" /> Select Vibe
               </h3>

               <div className="flex flex-wrap gap-2.5 relative z-10">
                   {musicStyles.map((style, i) => {
                       const isSelected = selectedStyles.includes(style);
                       const colorClass = colors[i % colors.length];
                       const selectedColorClass = selectedColors[i % selectedColors.length];

                       return (
                           <motion.button
                               key={style}
                               variants={tagItemVariant}
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                               onClick={() => handleStyleToggle(style)}
                               className={cn(
                                   "px-4 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 border-2",
                                   isSelected
                                       ? cn(selectedColorClass, "shadow-md scale-105")
                                       : cn(colorClass, "border-transparent hover:border-black/10")
                               )}
                           >
                               {style}
                           </motion.button>
                       );
                   })}
               </div>

                {/* Sticker */}
               <motion.div
                   variants={stickerVariant}
                   whileHover="hover"
                   className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12"
               >
                   <div className="w-20 h-20 bg-yellow-400 rounded-full border-4 border-black flex items-center justify-center font-black text-2xl transform rotate-12 shadow-lg">
                       🔥
                   </div>
               </motion.div>
          </div>
       </div>
    </section>
  );
}
