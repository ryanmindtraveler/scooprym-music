'use client';

import { FaqJsonLd } from '@/components/seo/json-ld';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BadgeHelp, Sparkles } from 'lucide-react';

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
      className="relative z-20 scroll-mt-20 overflow-hidden bg-[#fffdf8] px-4 py-20 text-[#201a29] md:px-6 md:py-28 2xl:px-8"
    >
      <FaqJsonLd items={faqItems} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.24] [background-image:radial-gradient(rgba(32,26,41,0.18)_0.65px,transparent_0.65px)] [background-size:7px_7px]"
      />

      <div className="relative z-10 mx-auto grid max-w-[1760px] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#201a29]/12 bg-[#fff258] px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#201a29] shadow-xs">
            <Sparkles className="size-3.5" />
            Before You Ask
          </div>
          <h2 className="mt-5 text-5xl font-black leading-none tracking-tight md:text-7xl">FAQ</h2>
          <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-[#545064] md:text-lg">
            Clear answers about stories, songs, voting, comments, and submissions.
          </p>

          <div className="mt-8 max-w-md rounded-2xl border border-sky-200/80 bg-gradient-to-br from-[#e9faff] to-[#f2fafd] p-6 shadow-[0_14px_36px_rgba(32,26,41,0.06)] dark:bg-sky-950/40 dark:border-sky-800/40">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#d80d63] shadow-xs">
                <BadgeHelp className="size-6" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">Got Questions?</span>
            </div>
            <p className="mt-3.5 text-sm font-bold leading-relaxed text-[#353143]">
              Still curious? Send your question directly to{' '}
              <a
                className="font-extrabold text-[#d80d63] underline decoration-[#ef287c] decoration-2 underline-offset-4 hover:text-[#b90851]"
                href="mailto:support@scooprym.app"
              >
                support@scooprym.app
              </a>
              .
            </p>
          </div>
        </header>

        <Accordion type="single" collapsible className="space-y-3.5">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="overflow-hidden rounded-2xl border border-[#201a29]/12 bg-white/80 px-6 shadow-[0_12px_32px_rgba(32,26,41,0.04)] backdrop-blur-md transition-all duration-300 data-[state=open]:border-[#ef287c]/50 data-[state=open]:bg-gradient-to-r data-[state=open]:from-[#fff4f8] data-[state=open]:to-[#fff9fb] data-[state=open]:shadow-[0_16px_40px_rgba(239,40,124,0.1)] md:px-8"
            >
              <AccordionTrigger className="py-5 text-left text-lg font-black leading-snug tracking-tight text-[#201a29] transition-colors hover:no-underline hover:text-[#d80d63] md:py-6 md:text-xl">
                <span className="flex items-center gap-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-[#d80d63] dark:bg-pink-950/60 dark:text-pink-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pl-11 pr-4 text-base font-medium leading-relaxed text-[#545064]">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
