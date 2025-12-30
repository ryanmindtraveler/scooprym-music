# Analytics 分析模块

## 概述

分析工具集成目录，支持多个分析提供商。该模块为 Scooprym Music AI 音乐生成平台提供全面的用户行为追踪、性能监控和业务分析功能。

## 核心特性

- **多提供商支持** - 集成 10+ 主流分析工具
- **隐私友好** - 符合 GDPR 和隐私法规的分析方案
- **智能加载** - 仅在生产环境启用分析脚本
- **类型安全** - 完整的 TypeScript 支持
- **模块化设计** - 每个提供商独立封装，便于维护

## 文件结构说明

### 核心入口文件

#### `analytics.tsx`
**功能**: 分析组件统一入口
- 聚合所有分析提供商组件
- 仅在生产环境加载分析脚本
- 通过环境变量控制各提供商启用状态
- 集成 Vercel Analytics 和 Speed Insights

**关键逻辑**:
- 检查 `process.env.NODE_ENV !== 'production'` 控制开发环境禁用
- 通过 `websiteConfig.analytics` 配置控制 Vercel 相关功能

### 主流分析提供商

#### `google-analytics.tsx`
**功能**: Google Analytics 4 (GA4) 集成
- 使用 `@next/third-parties/google` 官方集成
- 支持 GA4 测量 ID (`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`)
- 自动页面浏览追踪和事件追踪

**环境变量**: `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`

#### `posthog-analytics.tsx`
**功能**: PostHog 产品分析平台
- 提供 `PostHogProvider` 包装器组件
- 支持用户会话追踪和功能使用分析
- 自动捕获页面浏览和用户交互

**环境变量**:
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

#### `umami-analytics.tsx`
**功能**: Umami 开源分析工具
- 轻量级、隐私友好的替代方案
- 支持自定义事件和指标追踪
- 自托管友好，数据完全可控

**环境变量**:
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- `NEXT_PUBLIC_UMAMI_SCRIPT`

#### `plausible-analytics.tsx`
**功能**: Plausible 轻量级分析
- 专注于隐私保护的简单分析
- 无 cookies，符合 GDPR
- 支持 404 错误页面追踪

**环境变量**:
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- `NEXT_PUBLIC_PLAUSIBLE_SCRIPT`

### 专业分析工具

#### `ahrefs-analytics.tsx`
**功能**: Ahrefs 网站分析
- 专注于 SEO 和流量分析
- 提供关键词排名和反向链接数据
- 竞争对手分析功能

**环境变量**: `NEXT_PUBLIC_AHREFS_WEBSITE_ID`

#### `clarity-analytics.tsx`
**功能**: Microsoft Clarity 用户体验分析
- 会话录制和热力图功能
- 用户行为分析和转化漏斗
- 免费使用，无数据限制

**环境变量**: `NEXT_PUBLIC_CLARITY_PROJECT_ID`

#### `data-fast-analytics.tsx`
**功能**: DataFast 实时分析
- 专注于实时数据分析和可视化
- 支持自定义仪表板和报告
- 高性能数据处理

**环境变量**:
- `NEXT_PUBLIC_DATAFAST_DOMAIN`
- `NEXT_PUBLIC_DATAFAST_WEBSITE_ID`

#### `open-panel-analytics.tsx`
**功能**: OpenPanel 开源分析
- 完全开源的替代方案
- 支持屏幕浏览追踪和属性追踪
- 外链点击追踪功能

**环境变量**: `NEXT_PUBLIC_OPENPANEL_CLIENT_ID`

#### `seline-analytics.tsx`
**功能**: Seline 商业智能分析
- 专注于电商和 SaaS 业务分析
- 集成 Stripe 支付数据分析
- 转化率优化和收入追踪

**环境变量**: `NEXT_PUBLIC_SELINE_TOKEN`

## 配置说明

### 环境变量配置

每个分析提供商需要配置相应的环境变量：

```bash
# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Umami
NEXT_PUBLIC_UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_UMAMI_SCRIPT=https://analytics.example.com/script.js

# 其他提供商...
```

### 网站配置

在 `src/config/website.tsx` 中配置：

```typescript
analytics: {
  enableVercelAnalytics: false,  // Vercel Analytics
  enableSpeedInsights: false,    // Vercel Speed Insights
}
```

## 使用方式

### 1. 基础使用

在应用的根布局中引入分析组件：

```tsx
import { Analytics } from '@/analytics/analytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. 条件启用特定提供商

通过环境变量控制各分析提供商的启用：

```bash
# 启用 Google Analytics
export NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# 禁用其他提供商（不设置对应环境变量）
# export NEXT_PUBLIC_POSTHOG_KEY=
```

### 3. 自定义事件追踪

对于支持自定义事件的提供商（如 PostHog、Google Analytics）：

```tsx
// 在组件中使用
import { usePostHog } from 'posthog-js/react';

function MusicGenerationButton() {
  const posthog = usePostHog();
  
  const handleGenerate = () => {
    // 追踪音乐生成事件
    posthog?.capture('music_generated', {
      genre: 'hip-hop',
      duration: '3:45',
      credits_used: 1
    });
  };
  
  return <button onClick={handleGenerate}>生成音乐</button>;
}
```

## 开发指南

### 添加新的分析提供商

1. 在 `src/analytics/` 目录创建新的组件文件
2. 遵循现有组件的模式：
   - 仅在生产环境启用
   - 检查必要的环境变量
   - 使用适当的 Script 加载策略
3. 在 `analytics.tsx` 中导入并添加到返回组件中

### 性能优化

- 所有分析脚本都使用 `defer` 或 `async` 属性
- 仅在需要时加载分析脚本
- 考虑使用动态导入减少初始包大小

### 隐私合规

- 确保符合 GDPR、CCPA 等隐私法规
- 提供用户选择退出分析的机制
- 避免收集不必要的个人身份信息

## 故障排除

### 常见问题

1. **分析数据不显示**
   - 检查环境变量是否正确设置
   - 确认 `NODE_ENV=production`
   - 验证分析提供商的控制台配置

2. **开发环境出现分析脚本**
   - 检查 `NODE_ENV` 环境变量
   - 确保开发环境未设置生产环境变量

3. **性能影响**
   - 考虑减少启用的分析提供商数量
   - 使用更轻量级的分析方案
   - 实现懒加载策略

## 相关文档

- [MkSaaS 分析文档](https://mksaas.com/docs/analytics)
- [Next.js 第三方库优化](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries)
- [各分析提供商官方文档]

---

**注意**: 在生产环境部署前，请确保已配置所有必要的环境变量，并测试分析数据的正确收集。