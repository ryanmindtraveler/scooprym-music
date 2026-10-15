import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * https://nextjs.org/docs/app/api-reference/config/next-config-js
 */
const nextConfig: NextConfig = {
  // 等待 metadata 完成路由判定，避免歌曲 404/永久跳转被提前发送的 200 响应掩盖。
  htmlLimitedBots: /.*/,
  // Docker standalone output
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),

  /* config options here */
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:asset(logo-[a-z0-9-]+\\.(?:webp|png))',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tabler/icons-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@radix-ui/react-icons',
      '@base-ui-components/react',
      '@ai-sdk/react',
      'fumadocs-ui',
      'shiki',
      'canvas-confetti',
      '@stripe/stripe-js',
      'better-auth',
    ],
  },

  // https://nextjs.org/docs/architecture/nextjs-compiler#remove-console
  // Remove all console.* calls in production only
  compiler: {
    // removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    // 统一输出 WebP，减少同一封面的格式变体和首次转换开销。
    formats: ['image/webp'],
    unoptimized: false,
    minimumCacheTTL: 604800,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: 'html.tailus.io',
      },
      {
        protocol: 'https',
        hostname: 'service.firecrawl.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-da185f9718944b91aa9d4c36ffd8f99d.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-558ae62feb9549c698dfd1e37dca33c7.r2.dev',
      },
    ],
  },
};

/**
 * You can specify the path to the request config file or use the default one (@/i18n/request.ts)
 *
 * https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#next-config
 */
const withNextIntl = createNextIntlPlugin();

/**
 * https://fumadocs.dev/docs/ui/manual-installation
 * https://fumadocs.dev/docs/mdx/plugin
 */
const withMDX = createMDX();

const finalConfig = withMDX(withNextIntl(nextConfig));

// Hack: Remove legacy `turbopack` key injected by fumadocs/next-intl if present
// Next.js 15.2.1 throws a warning for this unrecognized key
if ('turbopack' in finalConfig) {
  // biome-ignore lint/performance/noDelete: needed to remove invalid config key
  delete finalConfig.turbopack;
}

export default finalConfig;
