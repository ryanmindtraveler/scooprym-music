import createMiddleware from 'next-intl/middleware';
import { getPublicEnglishPath } from './lib/public-routing';
import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE_NAME, routing } from './i18n/routing';
import { DEFAULT_LOGIN_REDIRECT, protectedRoutes, routesNotAllowedByLoggedInUsers } from './routes';

const intlMiddleware = createMiddleware(routing);
const songIntlMiddleware = createMiddleware({
  ...routing,
  locales: [DEFAULT_LOCALE],
  // 歌曲与八卦正文目前只有英文版本，不能向搜索引擎声明不存在的翻译页。
  alternateLinks: false,
});

/**
 * 1. Next.js middleware
 * https://nextjs.org/docs/app/building-your-application/routing/middleware
 *
 * 2. Better Auth middleware
 * https://www.better-auth.com/docs/integrations/next#middleware
 *
 * In Next.js middleware, it's recommended to only check for the existence of a session cookie
 * to handle redirection. To avoid blocking requests by making API or database calls.
 */
export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  console.log('>> middleware start, pathname', nextUrl.pathname);

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_BASE_URL &&
    !nextUrl.pathname.startsWith('/api/')
  ) {
    const canonicalDevUrl = new URL(process.env.NEXT_PUBLIC_BASE_URL);
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
    const requestProto = req.headers.get('x-forwarded-proto') ?? nextUrl.protocol.replace(':', '');

    if (
      requestHost &&
      (requestHost !== canonicalDevUrl.host || requestProto !== canonicalDevUrl.protocol.replace(':', ''))
    ) {
      const redirectUrl = new URL(req.url);
      redirectUrl.protocol = canonicalDevUrl.protocol;
      redirectUrl.host = canonicalDevUrl.host;
      console.log('<< middleware end, redirecting to canonical dev origin:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl, 307);
    }
  }

  // 0. CORS handling for /api/auth routes (Google One Tap / FedCM)
  // This logic must come before intlMiddleware and other checks to intercept API calls correctly.
  if (nextUrl.pathname.startsWith('/api/auth')) {
    const origin = req.headers.get('origin') ?? '';
    console.log('middleware: CORS check', { origin, pathname: nextUrl.pathname });
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://accounts.google.com'];

    // Check if origin is allowed (localhost or production domain)
    // We allow matching origins or vercel preview URLs dynamically for flexibility
    const isAllowed =
      allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin === process.env.NEXT_PUBLIC_APP_URL;

    // Standard CORS headers required for Credentialed requests (no *)
    const corsHeaders = {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers':
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    };

    // Handle Preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return NextResponse.json({}, { status: 200, headers: corsHeaders });
    }

    // Handle actual request
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Force a single canonical origin in production to avoid duplicate URLs
  if (process.env.NODE_ENV === 'production') {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
    const proto = req.headers.get('x-forwarded-proto') ?? nextUrl.protocol.replace(':', '');
    const canonicalHost = 'scooprym.app';
    // 本地生产预览仍应可通过 localhost 访问，便于在真实登录态浏览器中验收。
    const normalizedHost = host.toLowerCase();
    const isLocalHost =
      normalizedHost === 'localhost' ||
      normalizedHost.startsWith('localhost:') ||
      normalizedHost === '127.0.0.1' ||
      normalizedHost.startsWith('127.0.0.1:') ||
      normalizedHost === '[::1]' ||
      normalizedHost.startsWith('[::1]:');

    if (host && !isLocalHost && (host !== canonicalHost || proto !== 'https')) {
      const redirectUrl = new URL(req.url);
      redirectUrl.protocol = 'https:';
      redirectUrl.host = canonicalHost;
      redirectUrl.pathname = getPublicEnglishPath(nextUrl.pathname) ?? nextUrl.pathname;
      console.log('<< middleware end, redirecting to canonical origin:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl, 308);
    }
  }

  const publicPath = getPublicEnglishPath(nextUrl.pathname);
  if (publicPath !== null) {
    if (publicPath !== nextUrl.pathname) {
      const target = new URL(req.url);
      target.pathname = publicPath;
      return NextResponse.redirect(target, 308);
    }
    return songIntlMiddleware(req);
  }

  // Handle internal docs link redirection for internationalization
  // Check if this is a docs page without locale prefix
  if (nextUrl.pathname.startsWith('/docs/') || nextUrl.pathname === '/docs') {
    // Get the user's preferred locale from cookie
    const localeCookie = req.cookies.get(LOCALE_COOKIE_NAME);
    const preferredLocale = localeCookie?.value;

    // If user has a non-default locale preference, redirect to localized version
    if (preferredLocale && preferredLocale !== DEFAULT_LOCALE && LOCALES.includes(preferredLocale)) {
      const localizedPath = `/${preferredLocale}${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      console.log('<< middleware end, redirecting docs link to preferred locale:', localizedPath);
      return NextResponse.redirect(new URL(localizedPath, nextUrl));
    }
  }

  // do not use getSession() here, it will cause error related to edge runtime

  // Check session using cookie instead of making HTTP request to avoid fetch failures
  const sessionCookie =
    req.cookies.get('better-auth.session_token') || req.cookies.get('__Secure-better-auth.session_token');
  const isLoggedIn = !!sessionCookie;
  // console.log('middleware, isLoggedIn', isLoggedIn);

  // Get the pathname of the request (e.g. /zh/dashboard to /dashboard)
  const pathnameWithoutLocale = getPathnameWithoutLocale(nextUrl.pathname, LOCALES);

  // 歌曲搜索落地页只有英文正文；把带非默认语言前缀的重复 URL 合并到唯一英文版本。
  const localePrefix = nextUrl.pathname.split('/')[1];
  if (
    localePrefix &&
    localePrefix !== DEFAULT_LOCALE &&
    LOCALES.includes(localePrefix) &&
    pathnameWithoutLocale.startsWith('/songs/')
  ) {
    const canonicalSongUrl = new URL(`${pathnameWithoutLocale}${nextUrl.search}`, nextUrl);
    return NextResponse.redirect(canonicalSongUrl, 308);
  }

  // If the route can not be accessed by logged in users, redirect if the user is logged in
  if (isLoggedIn) {
    const isNotAllowedRoute = routesNotAllowedByLoggedInUsers.some((route) =>
      new RegExp(`^${route}$`).test(pathnameWithoutLocale)
    );
    if (isNotAllowedRoute) {
      console.log('<< middleware end, not allowed route, already logged in, redirecting to dashboard');
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
  }

  const isProtectedRoute = protectedRoutes.some((route) => new RegExp(`^${route}$`).test(pathnameWithoutLocale));
  // console.log('middleware, isProtectedRoute', isProtectedRoute);

  // If the route is a protected route, redirect to login if user is not logged in
  if (!isLoggedIn && isProtectedRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    console.log('<< middleware end, not logged in, redirecting to login, callbackUrl', callbackUrl);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // Apply intlMiddleware for all routes
  console.log('<< middleware end, applying intlMiddleware');
  return pathnameWithoutLocale.startsWith('/songs/') ? songIntlMiddleware(req) : intlMiddleware(req);
}

/**
 * Get the pathname of the request (e.g. /zh/dashboard to /dashboard)
 */
function getPathnameWithoutLocale(pathname: string, locales: string[]): string {
  const localePattern = new RegExp(`^/(${locales.join('|')})/`);
  return pathname.replace(localePattern, '/');
}

/**
 * Next.js internationalized routing
 * specify the routes the middleware applies to
 *
 * https://next-intl.dev/docs/routing#base-path
 */
export const config = {
  // The `matcher` is relative to the `basePath`
  matcher: [
    // Match all pathnames except for
    // - if they start with `/api`, `/_next` or `/_vercel`
    // - if they contain a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|manifest.webmanifest|.*\\..*).*)',
    // Explicitly include auth API routes for CORS handling
    '/api/auth/:path*',
  ],
};
