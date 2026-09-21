import { PaymentTypes, PlanIntervals } from '@/payment/types';
import type { WebsiteConfig } from '@/types';

/**
 * 网站配置（无翻译）
 *
 * 文档:
 * https://scooprym.com/docs/config/website
 */
export const websiteConfig: WebsiteConfig = {
  ui: {
    theme: {
      defaultTheme: 'default',
      enableSwitch: true,
    },
    mode: {
      defaultMode: 'light',
      enableSwitch: true,
    },
  },
  metadata: {
    images: {
      ogImage: '/og.png',
      logoLight: '/logo.png',
      logoDark: '/logo-dark.png',
    },
    social: {
      // github: 'https://github.com/MkSaaSHQ',
      // twitter: 'https://mksaas.link/twitter',
      // blueSky: 'https://mksaas.link/bsky',
      // discord: 'https://mksaas.link/discord',
      // mastodon: 'https://mksaas.link/mastodon',
      // linkedin: 'https://mksaas.link/linkedin',
      // youtube: 'https://mksaas.link/youtube',
    },
  },
  features: {
    enableUpgradeCard: false,
    enableUpdateAvatar: true,
    enableAffonsoAffiliate: false,
    enablePromotekitAffiliate: false,
    enableDatafastRevenueTrack: false,
    enableCrispChat: process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true',
    enableTurnstileCaptcha: process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true',
  },
  routes: {
    defaultLoginRedirect: '/dashboard',
  },
  analytics: {
    enableVercelAnalytics: false,
    enableSpeedInsights: false,
  },
  auth: {
    enableGoogleLogin: true,
    enableGithubLogin: false,
    enableCredentialLogin: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: {
        flag: '🇺🇸',
        name: 'English',
        hreflang: 'en',
      },
      zh: {
        flag: '🇨🇳',
        name: '中文',
        hreflang: 'zh-CN',
      },
    },
  },
  blog: {
    enable: false,
    paginationSize: 6,
    relatedPostsSize: 3,
  },
  docs: {
    enable: false,
  },
  mail: {
    provider: 'resend',
    fromEmail: 'Scooprym Music <support@scooprym.app>',
    supportEmail: 'support@scooprym.app',
  },
  newsletter: {
    enable: true,
    provider: 'resend',
    autoSubscribeAfterSignUp: true,
  },
  storage: {
    enable: true,
    provider: 's3',
  },
  payment: {
    provider: 'stripe',
  },
  price: {
    plans: {
      free: {
        id: 'free',
        prices: [],
        isFree: true,
        isLifetime: false,
        credits: {
          enable: true,
          amount: 10,
          expireDays: 30,
        },
      },
      basic: {
        id: 'basic',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY!,
            amount: 900,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY!,
            amount: 9600, // $8/month effective, billed yearly
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        popular: true,
        credits: {
          enable: true,
          amount: 200,
          expireDays: 30,
        },
      },
      advanced: {
        id: 'advanced',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVANCED_MONTHLY!,
            amount: 1990,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVANCED_YEARLY!,
            amount: 21600, // $18/month effective, billed yearly
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        credits: {
          enable: true,
          amount: 500,
          expireDays: 30,
        },
      },
      // lifetime: {
      //   id: 'lifetime',
      //   prices: [
      //     {
      //       type: PaymentTypes.ONE_TIME,
      //       priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME!,
      //       amount: 19900,
      //       currency: 'USD',
      //       allowPromotionCode: true,
      //     },
      //   ],
      //   isFree: false,
      //   isLifetime: true,
      //   credits: {
      //     enable: true,
      //     amount: 1000,
      //     expireDays: 30,
      //   },
      // },
    },
  },
  credits: {
    enableCredits: true,
    enablePackagesForFreePlan: false,
    registerGiftCredits: {
      enable: true,
      amount: 4,
      expireDays: 30,
    },
    packages: {
      // basic: {
      //   id: 'basic',
      //   popular: false,
      //   amount: 100,
      //   expireDays: 30,
      //   price: {
      //     priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_BASIC!,
      //     amount: 990,
      //     currency: 'USD',
      //     allowPromotionCode: true,
      //   },
      // },
      // standard: {
      //   id: 'standard',
      //   popular: true,
      //   amount: 200,
      //   expireDays: 30,
      //   price: {
      //     priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STANDARD!,
      //     amount: 1490,
      //     currency: 'USD',
      //     allowPromotionCode: true,
      //   },
      // },
      // premium: {
      //   id: 'premium',
      //   popular: false,
      //   amount: 500,
      //   expireDays: 30,
      //   price: {
      //     priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_PREMIUM!,
      //     amount: 3990,
      //     currency: 'USD',
      //     allowPromotionCode: true,
      //   },
      // },
      // enterprise: {
      //   id: 'enterprise',
      //   popular: false,
      //   amount: 1000,
      //   expireDays: 30,
      //   price: {
      //     priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_ENTERPRISE!,
      //     amount: 6990,
      //     currency: 'USD',
      //     allowPromotionCode: true,
      //   },
      // },
    },
  },
};
