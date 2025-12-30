import FaqSection from '@/components/blocks/faqs/faqs';
import Container from '@/components/layout/container';
import { PricingTable } from '@/components/pricing/pricing-table';
import { Zap } from 'lucide-react';

export default async function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

        <Container className="relative z-10 max-w-6xl px-4 flex flex-col gap-16">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              PLANS & <span className="text-primary">PRICING</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple pricing. No hidden fees. Cancel anytime.
              <br />
              <span className="text-accent font-bold">Get 10 free credits every month.</span>
            </p>
          </div>

          <PricingTable />

          <div className="mt-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold uppercase tracking-wide">FAQ</h2>
            </div>
            <FaqSection />
          </div>
        </Container>
      </section>
    </div>
  );
}
