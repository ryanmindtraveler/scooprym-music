// ... imports kept same or added as needed
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/auth/use-current-user';
import { useMounted } from '@/hooks/ui/use-mounted';
import { useLocalePathname } from '@/i18n/navigation';
import { formatPrice } from '@/lib/formatter';
import { cn } from '@/lib/utils';
import {
  type PaymentType,
  PaymentTypes,
  type PlanInterval,
  PlanIntervals,
  type Price,
  type PricePlan,
} from '@/payment';
import { Check, CheckCircleIcon, Sparkles, XCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LoginWrapper } from '../auth/login-wrapper';
import { Badge } from '../ui/badge';
import { CheckoutButton } from './create-checkout-button';

interface PricingCardProps {
  plan: PricePlan;
  interval?: PlanInterval; // 'month' or 'year'
  paymentType?: PaymentType; // 'subscription' or 'one_time'
  metadata?: Record<string, string>;
  className?: string;
  isCurrentPlan?: boolean;
  isHighlighted?: boolean;
  onHover?: (planId: string) => void;
}

/**
 * 根据选择的周期和支付类型获取相应的价格对象
 * @param plan 价格方案
 * @param interval 选择的周期（月付或年付）
 * @param paymentType 支付类型（订阅或一次性）
 * @returns 价格对象，如果未找到则返回 undefined
 */
function getPriceForPlan(plan: PricePlan, interval?: PlanInterval, paymentType?: PaymentType): Price | undefined {
  if (plan.isFree) {
    // 免费方案没有价格
    return undefined;
  }

  // 非免费方案必须有价格
  return plan.prices.find((price) => {
    if (paymentType === PaymentTypes.ONE_TIME) {
      return price.type === PaymentTypes.ONE_TIME;
    }
    return price.type === PaymentTypes.SUBSCRIPTION && price.interval === interval;
  });
}

/**
 * 定价卡片组件
 *
 * 显示带有功能和操作按钮的单个定价方案
 */
export function PricingCard({
  plan,
  interval,
  paymentType,
  metadata,
  className,
  isCurrentPlan = false,
  isHighlighted = false,
  onHover,
}: PricingCardProps) {
  const price = getPriceForPlan(plan, interval, paymentType);
  const currentUser = useCurrentUser();
  const currentPath = useLocalePathname();
  const mounted = useMounted();

  // 生成格式化的价格和价格标签
  let formattedPrice = '';
  let priceLabel = '';
  let originalPrice = '';

  if (plan.isFree) {
    formattedPrice = 'Free';
  } else if (price && price.amount > 0) {
    // 价格可用
    if (interval === PlanIntervals.YEAR && paymentType === PaymentTypes.SUBSCRIPTION) {
      formattedPrice = formatPrice(price.amount / 12, price.currency);
      priceLabel = '/month';

      const monthlyPrice = getPriceForPlan(plan, PlanIntervals.MONTH, PaymentTypes.SUBSCRIPTION);
      if (monthlyPrice) {
        originalPrice = formatPrice(monthlyPrice.amount, monthlyPrice.currency);
      }
    } else {
      formattedPrice = formatPrice(price.amount, price.currency);
      if (interval === PlanIntervals.MONTH) {
        priceLabel = '/month';
      } else if (interval === PlanIntervals.YEAR) {
        priceLabel = '/year';
      }
    }
  } else {
    formattedPrice = 'Not Available';
  }

  // 检查方案是否非免费且有价格
  const isPaidPlan = !plan.isFree && !!price;
  // 检查方案是否有试用期，且试用期大于0
  const hasTrialPeriod = price?.trialPeriodDays && price.trialPeriodDays > 0;

  return (
    <Card
      onMouseEnter={() => onHover?.(plan.id)}
      className={cn(
        'flex flex-col h-full overflow-hidden transition-all duration-300 rounded-[2.5rem] group relative border-2',
        isHighlighted
          ? 'border-purple-500 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 shadow-[0_20px_50px_-12px_rgba(168,85,247,0.4)] scale-105 z-10'
          : 'border-transparent bg-white/60 backdrop-blur-md shadow-xl hover:bg-white/80',
        isCurrentPlan && !isHighlighted && 'border-purple-200',
        className
      )}
    >
      {/* Badge: Keep explicitly on "Popular" items, OR should it move with highlight?
          User said "Colorful UI to switch". Badge says "Most Popular".
          "Most Popular" is a fact about the plan, not the state.
          So we KEEP the badge on plan.popular, but visual emphasis on Highlight.
       */}
      {plan.popular && (
        <div className="absolute top-6 right-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30">
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-cyan-100 text-cyan-700 border border-cyan-200">
            Current Plan
          </span>
        </div>
      )}

      <CardHeader className="p-8 pb-4">
        <CardTitle>
          <div className="flex flex-col gap-4">
            {/* Icon/Brand Element */}
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner',
                isHighlighted ? 'bg-black text-white' : 'bg-white text-black'
              )}
            >
              {isHighlighted ? (
                <Sparkles className="w-6 h-6 animate-pulse" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-current" />
              )}
            </div>

            <h3 className="font-black text-3xl tracking-tight text-slate-900">{plan.name}</h3>
          </div>
        </CardTitle>

        {/* Price Display */}
        <div className="flex items-baseline gap-1 mt-6">
          {originalPrice && <span className="text-lg font-bold text-slate-400 line-through mr-2">{originalPrice}</span>}
          <span className="text-5xl font-black tracking-tighter text-slate-900">{formattedPrice}</span>
          {priceLabel && <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{priceLabel}</span>}
        </div>

        <CardDescription className="mt-4">
          <p className="text-slate-600 font-medium leading-relaxed">{plan.description}</p>
        </CardDescription>

        {/* Action Buttons */}
        <div className="mt-8">
          {plan.isFree ? (
            mounted && currentUser ? (
              <Button
                variant="outline"
                className="w-full rounded-2xl border-2 border-slate-200 bg-transparent text-slate-900 hover:bg-slate-50 hover:border-slate-300 font-bold text-lg h-14 transition-all"
              >
                Get Started
              </Button>
            ) : (
              <LoginWrapper mode="modal" asChild callbackUrl={currentPath}>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-transparent text-slate-900 hover:bg-slate-50 hover:border-slate-300 font-bold text-lg h-14 transition-all"
                >
                  Get Started
                </Button>
              </LoginWrapper>
            )
          ) : isCurrentPlan ? (
            <Button
              disabled
              className="w-full rounded-2xl bg-slate-100 text-slate-400 font-bold h-14 cursor-not-allowed"
            >
              Current Plan
            </Button>
          ) : isPaidPlan ? (
            mounted && currentUser ? (
              <CheckoutButton
                userId={currentUser.id}
                planId={plan.id}
                priceId={price.priceId}
                metadata={metadata}
                className={cn(
                  'w-full rounded-2xl font-black text-lg h-14 transition-all hover:scale-[1.02] active:scale-[0.98]',
                  isHighlighted
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                {plan.isLifetime ? 'Get Lifetime Access' : 'Get Started'}
              </CheckoutButton>
            ) : (
              <LoginWrapper mode="modal" asChild callbackUrl={currentPath}>
                <Button
                  className={cn(
                    'w-full rounded-2xl font-black text-lg h-14 transition-all hover:scale-[1.02] active:scale-[0.98]',
                    isHighlighted
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  )}
                >
                  Get Started
                </Button>
              </LoginWrapper>
            )
          ) : (
            <Button disabled className="w-full rounded-2xl bg-slate-100 text-slate-400 font-bold h-14">
              Not Available
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-0">
        <div className="h-px w-full bg-slate-100 my-6" />

        {/* Trial Badge */}
        {hasTrialPeriod && (
          <div className="mb-6">
            <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-emerald-100 text-emerald-700">
              {`${price?.trialPeriodDays} Days Free`}
            </span>
          </div>
        )}

        {/* 功能列表 */}
        <ul className="space-y-4">
          {plan.features?.map((feature, i) => (
            <li key={i} className="flex items-start gap-3.5 group/item">
              <div
                className={cn(
                  'mt-0.5 rounded-full p-0.5 transition-colors',
                  isHighlighted
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                    : 'bg-slate-200 group-hover/item:bg-slate-900'
                )}
              >
                <Check className="size-3 text-white stroke-[3px]" />
              </div>
              <span className="text-slate-700 font-medium text-sm leading-snug">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Limits List */}
        <ul className="space-y-4 mt-4 pt-4 border-t border-dashed border-slate-100">
          {plan.limits?.map((limit, i) => (
            <li key={i} className="flex items-start gap-3.5 opacity-50">
              <XCircleIcon className="size-4 shrink-0 text-slate-400" />
              <span className="font-medium text-sm text-slate-500">{limit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
