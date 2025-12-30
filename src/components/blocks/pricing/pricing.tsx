'use client';

import { PricingTable } from '@/components/pricing/pricing-table';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingSection() {
  return (
    <section
      id="pricing"
      // Added z-20 to ensure it sits ON TOP of neighbor sections
      className="relative z-20 px-4 pt-32 pb-32 md:pt-48 md:pb-48 overflow-visible bg-[#ee7752]"
    >
      {/* Universal Fluid Mesh Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-100 animate-gradient-xy"
          style={{
            background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
          }}
        />
      </div>

      {/* Liquid Wave Glass Background Layer */}
      {/* Opacity 80% for Sheer Effect */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-normal"
        style={{
          top: '0',
          bottom: '0',
        }}
      >
        <div className="relative w-full h-full backdrop-blur-3xl">
          {/*
               UPDATED WAVE: Flatter, gentle curve (low amplitude).
               Height reduced: Mobile 40px, Desktop 100px.
            */}

          {/* Top Wave */}
          <div
            className="absolute left-0 w-full overflow-hidden leading-0
                            top-[-39px] h-[40px]
                            md:top-[-99px] md:h-[100px]"
          >
            <svg
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              className="block w-[calc(100%+1.3px)] h-full"
            >
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>

          {/* Middle Block: Solid White */}
          <div className="absolute inset-0 bg-white" />

          {/* Bottom Wave */}
          <div
            className="absolute left-0 w-full overflow-hidden leading-0 transform rotate-180
                            bottom-[-39px] h-[40px]
                            md:bottom-[-99px] md:h-[100px]"
          >
            <svg
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              className="block w-[calc(100%+1.3px)] h-full"
            >
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl px-6 space-y-16">
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm mb-4"
          >
            <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
            <span className="text-sm font-bold tracking-wider text-gray-500">Unlock Full Potential</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter drop-shadow-sm text-gray-900"
          >
            Invest In Your{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-violet-600">Flow</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl font-medium text-gray-600 max-w-2xl mx-auto"
          >
            Choose the plan that fits your hustle. Start for free, upgrade for power.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="p-8 md:p-12 relative overflow-hidden"
        >
          {/* Inner Soft Glow Decor */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-linear-to-b from-white to-transparent opacity-60 pointer-events-none" />
          <PricingTable />
        </motion.div>
      </div>
    </section>
  );
}
