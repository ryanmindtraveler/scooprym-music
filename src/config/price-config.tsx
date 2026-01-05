'use client';

import type { PricePlan } from '@/payment';
import { useTranslations } from 'next-intl';
import { websiteConfig } from './website';

/**
 * Get price plans with translations for client components
 *
 * NOTICE: This function should only be used in client components.
 * If you need to get the price plans in server components, use getAllPricePlans instead.
 * Use this function when showing the pricing table or the billing card to the user.
 *
 * docs:
 * https://scooprym.com/docs/config/price
 *
 * @returns The price plans with translated content
 */
export function usePricePlans(): Record<string, PricePlan> {
  const t = useTranslations('PricePlans');
  const priceConfig = websiteConfig.price;
  const plans: Record<string, PricePlan> = {};

  // Add translated content to each plan
  const freePlan = priceConfig.plans.free;
  if (freePlan) {
    plans.free = {
      ...freePlan,
      name: t('free.name'),
      description: t('free.description'),
      features: [
        t('free.features.feature-1'),
        t('free.features.feature-2'),
        t('free.features.feature-3'),
        t('free.features.feature-4'),
        t('free.features.feature-5'),
      ],
      limits: [t('free.limits.limit-1'), t('free.limits.limit-2'), t('free.limits.limit-3')],
    };
  }

  // Basic plan
  const basicPlan = priceConfig.plans.basic;
  if (basicPlan) {
    plans.basic = {
      ...basicPlan,
      name: t('basic.name'),
      description: t('basic.description'),
      features: [
        t('basic.features.feature-1'),
        t('basic.features.feature-2'),
        t('basic.features.feature-3'),
        t('basic.features.feature-4'),
        t('basic.features.feature-5'),
      ],
      limits: [t('basic.limits.limit-1'), t('basic.limits.limit-2')],
    };
  }

  // Advanced plan
  const advancedPlan = priceConfig.plans.advanced;
  if (advancedPlan) {
    plans.advanced = {
      ...advancedPlan,
      name: t('advanced.name'),
      description: t('advanced.description'),
      features: [
        t('advanced.features.feature-1'),
        t('advanced.features.feature-2'),
        t('advanced.features.feature-3'),
        t('advanced.features.feature-4'),
        t('advanced.features.feature-5'),
        t('advanced.features.feature-6'),
      ],
      limits: [t('advanced.limits.limit-1'), t('advanced.limits.limit-2')],
    };
  }

  // Backward-compat: still support legacy `pro` if present
  // const proPlan = priceConfig.plans.pro;
  // if (proPlan) {
  //   plans.pro = {
  //     ...proPlan,
  //     name: t('pro.name'),
  //     description: t('pro.description'),
  //     features: [
  //       t('pro.features.feature-1'),
  //       t('pro.features.feature-2'),
  //       t('pro.features.feature-3'),
  //       t('pro.features.feature-4'),
  //       t('pro.features.feature-5'),
  //     ],
  //     limits: [t('pro.limits.limit-1'), t('pro.limits.limit-2')],
  //   };
  // }

  const lifetimePlan = priceConfig.plans.lifetime;
  if (lifetimePlan) {
    plans.lifetime = {
      ...lifetimePlan,
      name: t('lifetime.name'),
      description: t('lifetime.description'),
      features: [
        t('lifetime.features.feature-1'),
        t('lifetime.features.feature-2'),
        t('lifetime.features.feature-3'),
        t('lifetime.features.feature-4'),
        t('lifetime.features.feature-5'),
        t('lifetime.features.feature-6'),
        t('lifetime.features.feature-7'),
      ],
      limits: [],
    };
  }

  return plans;
}
