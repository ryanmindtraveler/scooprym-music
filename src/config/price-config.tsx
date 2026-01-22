'use client';

import type { PricePlan } from '@/payment/types';
import { useTranslations } from 'next-intl';
import { websiteConfig } from './website';

/**
 * 获取带有翻译内容的价格方案
 *
 * 注意：此函数仅应在客户端组件中使用。
 * 如果需要在服务端组件中获取价格方案，请改用 getAllPricePlans。
 * 当需要向用户展示价格表或账单卡片时使用此函数。
 *
 * 文档:
 * https://scooprym.com/docs/config/price
 *
 * @returns 带有翻译内容的价格方案
 */
export function usePricePlans(): Record<string, PricePlan> {
  const t = useTranslations('PricePlans');
  const priceConfig = websiteConfig.price;
  const plans: Record<string, PricePlan> = {};

  // 为每个方案添加翻译内容
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

  // 基础版方案
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

  // 高级版方案
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
      limits: [],
    };
  }

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
