'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { websiteConfig } from '@/config/website';
import { useCurrentPlan } from '@/hooks/billing/use-payment';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { Crown, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function UpgradeCard() {
  if (!websiteConfig.features.enableUpgradeCard) {
    return null;
  }

  const t = useTranslations('Dashboard.upgrade');
  const [mounted, setMounted] = useState(false);
  const { data: session } = authClient.useSession();
  const { data: paymentData, isLoading } = useCurrentPlan(session?.user?.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show the upgrade card if the user has a lifetime membership or a subscription
  const isMember = paymentData?.currentPlan?.isLifetime || !!paymentData?.subscription;

  // Ensure the upgrade card is only shown when the data is loaded
  if (!mounted || isLoading || !paymentData) {
    return null;
  }

  // If the user is a member, don't show the upgrade card
  if (isMember) {
    return null;
  }

  return (
    <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Crown className="size-12 -rotate-12" />
      </div>
      <CardHeader className="gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-wide">
          <Sparkles className="size-4 text-primary fill-primary animate-pulse" />
          {t('title')}
        </CardTitle>
        <CardDescription className="font-medium text-foreground/80">{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="cursor-pointer w-full shadow-md font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02]"
          size="sm"
          asChild
        >
          <LocaleLink href={Routes.SettingsBilling}>{t('button')}</LocaleLink>
        </Button>
      </CardContent>
    </Card>
  );
}
