'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePricePlans } from '@/config/price-config';
import { cn } from '@/lib/utils';
import { PaymentTypes, type PlanInterval, PlanIntervals, type PricePlan } from '@/payment';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PricingCard } from './pricing-card';

interface PricingTableProps {
  metadata?: Record<string, string>;
  currentPlan?: PricePlan | null;
  className?: string;
}

/**
 * 定价表组件
 *
 * 1. 显示所有定价方案，对于订阅方案提供周期选择标签，
 *    免费方案和一次性购买方案始终显示
 * 2. 如果方案被禁用，则不会在定价表中显示
 * 3. 如果价格被禁用，则不会在定价表中显示
 */
export function PricingTable({ metadata, currentPlan, className }: PricingTableProps) {
  const [interval, setInterval] = useState<PlanInterval>(PlanIntervals.MONTH);

  // 获取带有翻译内容的价格方案
  const pricePlans = usePricePlans();
  const plans = Object.values(pricePlans);

  // 高亮方案的状态（默认为热门方案或第一个方案）
  const [highlightedPlanId, setHighlightedPlanId] = useState<string | null>(() => {
    const popularPlan = Object.values(pricePlans).find((p) => p.popular);
    return popularPlan?.id || Object.keys(pricePlans)[0] || null;
  });

  // 用于比较的当前方案ID
  const currentPlanId = currentPlan?.id || null;

  // 将方案过滤为免费、订阅和一次性方案
  const freePlans = plans.filter((plan) => plan.isFree && !plan.disabled);

  const subscriptionPlans = plans.filter(
    (plan) =>
      !plan.isFree &&
      !plan.disabled &&
      plan.prices.some((price) => !price.disabled && price.type === PaymentTypes.SUBSCRIPTION)
  );

  const oneTimePlans = plans.filter(
    (plan) =>
      !plan.isFree &&
      !plan.disabled &&
      plan.prices.some((price) => !price.disabled && price.type === PaymentTypes.ONE_TIME)
  );

  // 检查是否有任何方案有月付选项
  const hasMonthlyOption = subscriptionPlans.some((plan) =>
    plan.prices.some((price) => price.type === PaymentTypes.SUBSCRIPTION && price.interval === PlanIntervals.MONTH)
  );

  // 检查是否有任何方案有年付选项
  const hasYearlyOption = subscriptionPlans.some((plan) =>
    plan.prices.some((price) => price.type === PaymentTypes.SUBSCRIPTION && price.interval === PlanIntervals.YEAR)
  );

  const handleIntervalChange = (value: string) => {
    setInterval(value as PlanInterval);
  };

  return (
    <div className={cn('flex flex-col gap-12', className)}>
      {/* 如果有订阅方案，显示周期切换 */}
      {(hasMonthlyOption || hasYearlyOption) && subscriptionPlans.length > 0 && (
        <div className="flex justify-center">
          <ToggleGroup
            size="sm"
            type="single"
            value={interval}
            onValueChange={(value) => value && handleIntervalChange(value)}
            className="border rounded-lg p-1"
          >
            {hasMonthlyOption && (
              <ToggleGroupItem
                value="month"
                className={cn(
                  'px-3 py-0 cursor-pointer text-sm rounded-md',
                  'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                )}
              >
                Monthly
              </ToggleGroupItem>
            )}
            {hasYearlyOption && (
              <ToggleGroupItem
                value="year"
                className={cn(
                  'px-3 py-0 cursor-pointer text-sm rounded-md',
                  'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                )}
              >
                Yearly
              </ToggleGroupItem>
            )}
          </ToggleGroup>
        </div>
      )}

      {/* 计算可见方案的总数 */}
      {(() => {
        const totalVisiblePlans = freePlans.length + subscriptionPlans.length + oneTimePlans.length;
        return (
          <div
            onMouseLeave={() => {
              const popularPlan = Object.values(pricePlans).find((p) => p.popular);
              setHighlightedPlanId(popularPlan?.id || Object.keys(pricePlans)[0] || null);
            }}
            className={cn(
              'grid gap-8',
              // 处理任意数量卡片的通用解决方案
              totalVisiblePlans === 1 && 'grid-cols-1 max-w-md mx-auto w-full',
              totalVisiblePlans === 2 && 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto w-full',
              totalVisiblePlans >= 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {/* 渲染免费方案（始终可见） */}
            {freePlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                metadata={metadata}
                isCurrentPlan={currentPlanId === plan.id}
                isHighlighted={highlightedPlanId === plan.id}
                onHover={setHighlightedPlanId}
              />
            ))}

            {/* 渲染带有选定周期的订阅方案 */}
            {subscriptionPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                interval={interval}
                paymentType={PaymentTypes.SUBSCRIPTION}
                metadata={metadata}
                isCurrentPlan={currentPlanId === plan.id}
                isHighlighted={highlightedPlanId === plan.id}
                onHover={setHighlightedPlanId}
              />
            ))}

            {/* 渲染一次性方案（始终可见） */}
            {oneTimePlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                paymentType={PaymentTypes.ONE_TIME}
                metadata={metadata}
                isCurrentPlan={currentPlanId === plan.id}
                isHighlighted={highlightedPlanId === plan.id}
                onHover={setHighlightedPlanId}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
