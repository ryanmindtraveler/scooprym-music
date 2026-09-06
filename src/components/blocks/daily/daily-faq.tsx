'use client';

import { FaqJsonLd } from '@/components/seo/json-ld';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BadgeHelp, HelpCircle, Mail, MessageSquare, Sparkles } from 'lucide-react';

const faqItems = [
  {
    id: 'what-is-scooprym',
    question: 'What is ScoopRYM?',
    answer:
      'ScoopRYM turns publicly reported headlines, celebrity drama, internet chaos, and viral moments into original AI-generated meme songs. Each Drop pairs the story with a song made for listening, reacting, and sharing.',
    icon: 'music',
  },
  {
    id: 'news-report',
    question: 'Is ScoopRYM a news source?',
    answer:
      'No. ScoopRYM is entertainment and musical commentary, not a substitute for original reporting. Story summaries may be condensed, so use “Read source” on each Drop for the publisher’s full context.',
    icon: 'newspaper',
  },
  {
    id: 'story-selection',
    question: 'How does a story become a Drop?',
    answer:
      'Our Story Radar surfaces recent public reports. Editors shortlist stories that fit ScoopRYM, and signed-in listeners can vote for up to three topics each day. Votes guide the desk, but editors make the final call.',
    icon: 'search',
  },
  {
    id: 'new-drops',
    question: 'When are new songs published?',
    answer:
      'There is no fixed daily quota. A new Drop goes live after its source is reviewed and the song is ready. Today’s Drops shows the newest releases, Gallery holds the archive, and Weekly Hits ranks actual plays from the last seven days.',
    icon: 'calendar-clock',
  },
  {
    id: 'submit-story',
    question: 'Can I suggest a story?',
    answer:
      'Yes. In “Send a Story,” add a public link, a short explanation, or both. At least one is required, explanations are limited to 280 characters, and each visitor can send up to five tips a day. Every tip is reviewed, but a submission is not guaranteed to become a Drop.',
    icon: 'send',
  },
  {
    id: 'reactions-and-comments',
    question: 'Can I react or leave a comment?',
    answer:
      'Anyone can react to a Drop. Signed-in listeners can also post comments of up to 280 characters and review them later in Dashboard. Links, contact details, advertising, and self-promotion are not allowed in comments.',
    icon: 'message-circle',
  },
  {
    id: 'share-and-affiliation',
    question: 'Can I share the songs?',
    answer:
      'Yes. Use the share control on a Drop to send its ScoopRYM link. Unless explicitly stated, ScoopRYM is not affiliated with or endorsed by the people featured in a story or song.',
    icon: 'share-2',
  },
];

export function DailyFaqSection() {
  return (
    <section
      id="faq"
      className="relative z-20 scroll-mt-20 overflow-hidden bg-linear-to-b from-[#faf8f4] via-[#f7f3ed] to-[#f2ece3] px-4 py-20 text-[#1a1523] md:px-8 md:py-28 2xl:px-12 dark:from-[#0e0c15] dark:via-[#110f1a] dark:to-[#0b0a10] dark:text-[#fffdf8]"
    >
      <FaqJsonLd items={faqItems} />

      {/* Decorative ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/4 size-[480px] rounded-full bg-pink-400/10 blur-[120px] dark:bg-pink-600/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-1/4 size-[480px] rounded-full bg-cyan-400/10 blur-[120px] dark:bg-cyan-600/10"
      />

      <div className="relative z-10 mx-auto grid max-w-[1760px] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        {/* Left Column: Heading & Contact Card */}
        <header className="lg:sticky lg:top-28 lg:self-start space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1523] bg-[#ffe600] px-4 py-1 text-xs font-black uppercase tracking-wider text-[#1a1523] shadow-[2.5px_2.5px_0_#1a1523] dark:border-white/20 dark:shadow-[2.5px_2.5px_0_rgba(255,255,255,0.2)]">
            <Sparkles className="size-3.5 text-[#d80d63]" />
            Everything You Need To Know
          </div>

          <div>
            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl text-[#1a1523] dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3.5 max-w-md text-base sm:text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              Clear answers about stories, meme songs, community voting, comments, and submissions.
            </p>
          </div>

          {/* Need help contact box */}
          <div className="rounded-4xl border-2 border-[#1a1523] bg-linear-to-br from-white via-pink-50/50 to-amber-50/50 p-6.5 shadow-[5px_6px_0_#1a1523] backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/90 dark:from-zinc-900 dark:to-zinc-800 dark:shadow-[5px_6px_0_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl border-2 border-[#1a1523] bg-[#ffe600] text-[#1a1523] shadow-[2px_2px_0_#1a1523]">
                <BadgeHelp className="size-6 text-[#d80d63]" />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Still Got Questions?
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Our editorial desk is here to help
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              Curious about partnerships or have a story lead? Reach out directly to our team:
            </p>

            <a
              href="mailto:support@scooprym.app"
              className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-[#1a1523] bg-[#1a1523] px-5 py-2.5 text-xs font-black text-white shadow-[2.5px_2.5px_0_#d80d63] transition-transform hover:-translate-y-0.5 hover:bg-[#d80d63] active:translate-y-0 dark:border-white dark:bg-white dark:text-[#1a1523] dark:hover:bg-[#d80d63] dark:hover:text-white"
            >
              <Mail className="size-3.5" />
              support@scooprym.app
            </a>
          </div>
        </header>

        {/* Right Column: Accordion Items */}
        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="group/faq overflow-hidden rounded-[1.75rem] border-2 border-[#1a1523]/15 bg-white/90 px-6 shadow-[0_8px_24px_rgba(32,26,41,0.04)] backdrop-blur-md transition-all duration-300 hover:border-[#d80d63]/50 hover:shadow-[0_12px_32px_rgba(216,13,99,0.08)] data-[state=open]:border-2 data-[state=open]:border-[#1a1523] data-[state=open]:bg-linear-to-r data-[state=open]:from-pink-50/70 data-[state=open]:via-white data-[state=open]:to-amber-50/40 data-[state=open]:shadow-[4px_5px_0_#1a1523] md:px-8 dark:border-white/10 dark:bg-[#161422]/90 dark:data-[state=open]:border-white/25 dark:data-[state=open]:from-pink-950/30 dark:data-[state=open]:via-[#161422] dark:data-[state=open]:shadow-[4px_5px_0_rgba(255,255,255,0.15)]"
            >
              <AccordionTrigger className="py-5 text-left text-base sm:text-lg font-black leading-snug tracking-tight text-[#1a1523] transition-colors hover:no-underline hover:text-[#d80d63] md:py-6 md:text-xl dark:text-slate-100">
                <span className="flex items-center gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#1a1523]/15 bg-pink-100/80 font-mono text-xs font-black text-[#d80d63] transition-all group-hover/faq:border-[#d80d63] group-hover/faq:bg-[#d80d63] group-hover/faq:text-white dark:border-white/10 dark:bg-pink-950/60 dark:text-pink-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{item.question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pl-12 pr-4 text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4.5 dark:border-white/5 dark:bg-white/5">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
