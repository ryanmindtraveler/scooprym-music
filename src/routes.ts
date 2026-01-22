import { websiteConfig } from './config/website';

/**
 * 应用程序的所有路由路径枚举定义
 * 统一管理路由可以避免在代码中硬编码路径，方便维护
 */
export enum Routes {
  // 根路径
  Root = '/',
  // 首页展示作品的 Gallery 锚点
  Gallery = '/#gallery',

  // --- 营销页路由 (Marketing Pages) ---
  FAQ = '/#faqs', // 常见问题 (首页锚点)
  Features = '/#features', // 功能介绍 (首页锚点)
  Pricing = '/#pricing', // 价格方案 (Homepage anchor)
  Blog = '/blog', // 博客文章
  Docs = '/docs', // 帮助文档中心
  About = '/about', // 关于我们
  Contact = '/contact', // 联系我们
  Waitlist = '/waitlist', // 候补名单
  Changelog = '/changelog', // 更新日志
  Roadmap = '/roadmap', // 项目路线图
  CookiePolicy = '/cookie', // Cookie 政策
  PrivacyPolicy = '/privacy', // 隐私政策
  TermsOfService = '/terms', // 服务条款

  // --- 身份认证路由 (Auth Routes) ---
  Login = '/auth/login', // 登录页
  Register = '/auth/register', // 注册页
  AuthError = '/auth/error', // 认证错误提示页
  ForgotPassword = '/auth/forgot-password', // 找回密码
  ResetPassword = '/auth/reset-password', // 重置密码

  // --- 用户控制台 & 受保护路由 (Dashboard & Protected Routes) ---
  Home = '/home', // 登录后的个人主页 (Quick Cook)
  Dashboard = '/dashboard', // 数据统计后台
  Create = '/create', // 核心功能：音乐创作工作室 (Studio)
  MySongs = '/mysongs', // 个人作品库 (Library)
  DashboardCreate = '/dashboard/create', // 控制台内的创作入口
  AdminUsers = '/admin/users', // 管理员用户管理页
  AdminSongs = '/admin/songs', // 管理员歌曲发布页
  SettingsProfile = '/settings/profile', // 个人资料设置
  SettingsBilling = '/settings/billing', // 账单/订阅管理
  SettingsCredits = '/settings/credits', // 积分充值/消费明细
  SettingsSecurity = '/settings/security', // 账号安全设置
  SettingsNotifications = '/settings/notifications', // 通知首选项设置

  // --- 支付流程 (Payment Processing) ---
  Payment = '/payment', // 支付收银台

  // --- AI 实验功能路由 (AI Sandbox/Playground) ---
  AIText = '/ai/text', // 文本生成实验室
  AIImage = '/ai/image', // 图像生成实验室
  AIChat = '/ai/chat', // AI 聊天实验室
  AIVideo = '/ai/video', // 视频生成实验室
  AIAudio = '/ai/audio', // 音频处理实验室

  // --- UI 组件区块展示路由 (Blocks Showcase - 仅供开发参考) ---
  MagicuiBlocks = '/magicui',
  HeroBlocks = '/blocks/hero-section',
  LogoCloudBlocks = '/blocks/logo-cloud',
  FeaturesBlocks = '/blocks/features',
  IntegrationsBlocks = '/blocks/integrations',
  ContentBlocks = '/blocks/content',
  StatsBlocks = '/blocks/stats',
  TeamBlocks = '/blocks/team',
  TestimonialsBlocks = '/blocks/testimonials',
  CallToActionBlocks = '/blocks/call-to-action',
  FooterBlocks = '/blocks/footer',
  PricingBlocks = '/blocks/pricing',
  ComparatorBlocks = '/blocks/comparator',
  FAQBlocks = '/blocks/faqs',
  LoginBlocks = '/blocks/login',
  SignupBlocks = '/blocks/sign-up',
  ForgotPasswordBlocks = '/blocks/forgot-password',
  ContactBlocks = '/blocks/contact',
}

/**
 * 已登录用户禁止访问的路由清单
 * (例如：用户已经登录后，不应该再看到登录和注册页面)
 */
export const routesNotAllowedByLoggedInUsers = [Routes.Login, Routes.Register];

/**
 * 受保护的路由清单
 * 这里的路由在中间件 (middleware.ts) 中会被校验认证状态
 * 只有登录用户才能访问，未登录用户将被重定向至登录页
 */
export const protectedRoutes = [
  Routes.Home,
  Routes.Dashboard,
  Routes.Create,
  Routes.MySongs,
  Routes.DashboardCreate,
  Routes.AdminUsers,
  Routes.AdminSongs,
  Routes.SettingsProfile,
  Routes.SettingsBilling,
  Routes.SettingsCredits,
  Routes.SettingsSecurity,
  Routes.SettingsNotifications,
  Routes.Payment,
];

/**
 * 登录成功后的默认跳转路径
 * 优先读取网站配置文件，否则默认跳转至 /home
 */
export const DEFAULT_LOGIN_REDIRECT = websiteConfig.routes.defaultLoginRedirect ?? Routes.Home;
