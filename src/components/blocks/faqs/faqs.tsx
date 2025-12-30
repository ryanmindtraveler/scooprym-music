'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';

type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
};

export default function FaqSection() {
  const locale = useLocale();
  // const t = useTranslations('HomePage.faqs');

  const faqItems: FAQItem[] = [
    {
      id: 'item-1',
      icon: 'calendar-clock',
      question: 'How long does it take to generate a song?',
      answer: 'Usually under 2 minutes. Our AI is fast!',
    },
    {
      id: 'item-2',
      icon: 'wallet',
      question: 'Can I use the music commercially?',
      answer: 'Yes, with our Pro plan you get full commercial rights.',
    },
    {
      id: 'item-3',
      icon: 'refresh-cw',
      question: 'What happens to my credits if generation fails?',
      answer: 'Credits are automatically refunded for any failed generations.',
    },
    {
      id: 'item-4',
      icon: 'hand-coins',
      question: 'Can I edit the lyrics?',
      answer: 'Yes, you can edit lyrics before finalizing the track.',
    },
    {
      id: 'item-5',
      icon: 'mail',
      question: 'Do I own the copyright?',
      answer: 'You own the copyright to the lyrics you input. The music composition rights depend on your plan.',
    },
  ];

  return (
    <section id="faqs" className="relative px-4 py-32 overflow-hidden bg-[#ee7752]">
      {/* Background - Fluid Mesh */}
      <div className="absolute inset-0 z-0 opacity-90">
        <div
          className="absolute inset-0 animate-gradient-xy"
          style={{
            background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
          }}
        />

        <div className="absolute inset-0 bg-white/20 backdrop-blur-[50px]" />
      </div>

      <div className="mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block bg-white/40 backdrop-blur-md px-4 py-1 rounded-full shadow-sm border border-white/50"
          >
            <span className="font-bold tracking-widest text-white text-xs shadow-black/10 drop-shadow-sm">
              Need Help?
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-md"
          >
            FAQ
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-white/90 max-w-2xl mx-auto drop-shadow-sm"
          >
            Got questions? We've got answers. No BS.
          </motion.p>
        </div>

        <div className="mx-auto max-w-3xl mt-12 space-y-4">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem
                  value={item.id}
                  className="border-none bg-white/70 backdrop-blur-xl rounded-[24px] px-6 py-2 shadow-sm hover:bg-white/90 hover:shadow-md transition-all duration-300"
                >
                  <AccordionTrigger className="text-lg md:text-xl font-bold text-gray-800 hover:no-underline hover:text-pink-600 transition-colors py-4 text-left">
                    <span className="flex items-center gap-3">
                      <HelpCircle className="size-5 text-pink-500 shrink-0" />
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-base md:text-lg text-gray-600 pb-4 pl-8 leading-relaxed font-medium">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
