import type { Locale } from 'next-intl';

/**
 * 订阅计划的周期类型
 */
export type PlanInterval = PlanIntervals.MONTH | PlanIntervals.YEAR;

export enum PlanIntervals {
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * 支付类型（订阅或一次性）
 */
export type PaymentType = PaymentTypes.SUBSCRIPTION | PaymentTypes.ONE_TIME;

export enum PaymentTypes {
  SUBSCRIPTION = 'subscription',  // Regular recurring subscription
  ONE_TIME = 'one_time',          // One-time payment
}

/**
 * 支付场景（终身、积分、订阅）
 */
export type PaymentScene = PaymentScenes.LIFETIME | PaymentScenes.CREDIT | PaymentScenes.SUBSCRIPTION;

export enum PaymentScenes {
  LIFETIME = 'lifetime',      // Lifetime plan purchase
  CREDIT = 'credit',          // Credit package purchase
  SUBSCRIPTION = 'subscription', // Regular subscription
}

/**
 * 支付或订阅的状态
 */
export type PaymentStatus =
  | 'active'                         // Subscription is active
  | 'canceled'                       // Subscription has been canceled
  | 'incomplete'                     // Payment not completed
  | 'incomplete_expired'             // Payment not completed and expired
  | 'past_due'                       // Payment is past due
  | 'paused'                         // Subscription is paused
  | 'trialing'                       // In trial period
  | 'unpaid'                         // Payment failed
  | 'completed'                      // One-time payment completed
  | 'processing'                     // Payment is processing
  | 'failed';                        // Payment failed

/**
 * 计划的价格定义
 */
export interface Price {
  type: PaymentType;                 // Type of payment (subscription or one_time)
  priceId: string;                   // Stripe price ID (not product id)
  amount: number;                    // Price amount in currency units (dollars, euros, etc.)
  currency: string;                  // Currency code (e.g., USD)
  interval?: PlanInterval;           // Billing interval for recurring payments
  trialPeriodDays?: number;          // Free trial period in days
  allowPromotionCode?: boolean;      // Whether to allow promotion code for this price
  disabled?: boolean;                // Whether to disable this price in UI
}

/**
 * 计划的积分配置
 */
export interface Credits {
  enable: boolean;                   // Whether to enable credits for this plan
  amount: number;                    // Number of credits provided per month
  expireDays?: number;               // Number of days until credits expire, undefined means no expiration
}

/**
 * 价格计划定义
 *
 * 1. 何时禁用计划？
 * 当计划不再可用，但应为已购买的现有用户保留时，否则他们在账单页面看不到该计划。
 *
 * 2. 何时禁用价格？
 * 当价格不再可用，但应为已购买的现有用户保留时，否则他们在账单页面看不到该价格。
 */
export interface PricePlan {
  id: string;                        // Unique identifier for the plan
  name?: string;                     // Display name of the plan
  description?: string;              // Description of the plan features
  features?: string[];               // List of features included in this plan
  limits?: string[];                 // List of limits for this plan
  prices: Price[];                   // Available prices for this plan
  isFree: boolean;                   // Whether this is a free plan
  isLifetime: boolean;               // Whether this is a lifetime plan
  popular?: boolean;                 // Whether to mark this plan as popular in UI
  disabled?: boolean;                // Whether to disable this plan in UI
  credits?: Credits;                 // Credits configuration for this plan
}

/**
 * 客户数据
 */
export interface Customer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * 订阅数据
 */
export interface Subscription {
  id: string;
  customerId: string;
  status: PaymentStatus;
  priceId: string;
  type: PaymentType;
  interval?: PlanInterval;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStartDate?: Date;
  trialEndDate?: Date;
  createdAt: Date;
}

/**
 * 支付数据
 */
export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  metadata?: Record<string, string>;
}

/**
 * 创建结账会话的参数
 */
export interface CreateCheckoutParams {
  planId: string;
  priceId: string;
  customerEmail: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  locale?: Locale;
}

/**
 * 创建积分结账会话的参数
 */
export interface CreateCreditCheckoutParams {
  packageId: string;
  priceId: string;
  customerEmail: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  locale?: Locale;
}

/**
 * 创建结账会话的结果
 */
export interface CheckoutResult {
  url: string;
  id: string;
}

/**
 * 创建客户门户的参数
 */
export interface CreatePortalParams {
  customerId: string;
  returnUrl?: string;
  locale?: Locale;
}

/**
 * 创建客户门户的结果
 */
export interface PortalResult {
  url: string;
}

/**
 * 获取客户订阅的参数
 */
export interface getSubscriptionsParams {
  userId: string;
}

/**
 * 支付提供商接口
 */
export interface PaymentProvider {
  /**
   * Create a checkout session
   */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;

  /**
   * Create a credit checkout session
   */
  createCreditCheckout(params: CreateCreditCheckoutParams): Promise<CheckoutResult>;

  /**
   * Create a customer portal session
   */
  createCustomerPortal(params: CreatePortalParams): Promise<PortalResult>;

  /**
   * Handle webhook events
   */
  handleWebhookEvent(payload: string, signature: string): Promise<void>;

  /**
   * Create a customer
   */
  createCustomer(email: string, name?: string): Promise<string>;
}
