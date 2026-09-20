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
  Pricing = '/pricing', // 登录后访问的套餐购买页
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
  Dashboard = '/dashboard', // 普通用户控制台首页
  DashboardComments = '/dashboard/comments', // 当前用户的评论记录
  DashboardVotes = '/dashboard/votes', // 当前用户的热点投票记录
  DashboardSaved = '/dashboard/saved', // 当前用户收藏的歌曲
  AdminDashboard = '/admin/dashboard', // 管理员数据后台
  Create = '/create', // 旧创作入口，仅用于兼容跳转
  AdminCreate = '/admin/create', // 管理员音乐创作工作室
  MySongs = '/dashboard/mysongs', // 个人作品库
  DashboardCreate = '/dashboard/create', // 控制台内的创作入口
  AdminUsers = '/admin/users', // 管理员用户管理页
  AdminSongs = '/admin/songs', // 管理员歌曲发布页
  AdminStoryRadar = '/admin/story-radar', // 管理员热点候选管理页
  AdminComments = '/admin/comments', // 评论举报审核
  SettingsProfile = '/dashboard/settings/profile', // 个人资料设置
  SettingsBilling = '/dashboard/settings/billing', // 账单/订阅管理
  SettingsCredits = '/dashboard/settings/credits', // 积分充值/消费明细
  SettingsSecurity = '/dashboard/settings/security', // 账号安全设置
  SettingsNotifications = '/dashboard/settings/notifications', // 通知首选项设置

  // --- 支付流程 (Payment Processing) ---
  Payment = '/dashboard/payment', // 支付收银台

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
  Routes.Pricing,
  Routes.Dashboard,
  Routes.DashboardComments,
  Routes.DashboardVotes,
  Routes.DashboardSaved,
  Routes.AdminDashboard,
  Routes.Create,
  Routes.AdminCreate,
  Routes.MySongs,
  Routes.DashboardCreate,
  Routes.AdminUsers,
  Routes.AdminSongs,
  Routes.AdminStoryRadar,
  Routes.AdminComments,
  Routes.SettingsProfile,
  Routes.SettingsBilling,
  Routes.SettingsCredits,
  Routes.SettingsSecurity,
  Routes.SettingsNotifications,
  Routes.Payment,
];

/**
 * 登录成功后的默认跳转路径
 * 优先读取网站配置文件，否则默认跳转至 /dashboard
 */
export const DEFAULT_LOGIN_REDIRECT = websiteConfig.routes.defaultLoginRedirect ?? Routes.Dashboard;
