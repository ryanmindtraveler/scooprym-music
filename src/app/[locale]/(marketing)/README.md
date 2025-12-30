# 营销页面目录

此目录包含 AI 音乐生成 SaaS 平台的所有面向公众的营销页面。这些页面无需认证即可访问，是新用户的入口点。

## 📁 目录结构

```text
src/app/[locale]/(marketing)/
├── (home)/                    # 首页
│   └── page.tsx              # 主页面
├── pricing/                   # 定价页面
│   └── page.tsx              # 定价方案
├── (legal)/                   # 法律页面
│   ├── layout.tsx            # 法律页面布局
│   ├── loading.tsx           # 加载状态
│   ├── privacy/              # 隐私政策
│   ├── terms/                # 服务条款
│   └── cookie/               # Cookie 政策
├── (pages)/                   # 静态信息页面
│   ├── layout.tsx            # 页面布局
│   ├── loading.tsx           # 加载状态
│   ├── about/                # 关于我们
│   ├── contact/              # 联系页面
│   ├── changelog/            # 更新日志
│   ├── roadmap/              # 产品路线图
│   ├── waitlist/             # 等待列表
│   ├── magicui/              # UI 组件演示
│   └── test/                 # 测试页面
├── ai/                       # AI 功能演示
│   ├── layout.tsx            # AI 页面布局
│   ├── loading.tsx           # 加载状态
│   ├── audio/                # 音频生成
│   ├── chat/                 # 聊天功能
│   ├── image/                # 图片生成
│   ├── text/                 # 文本生成
│   └── video/                # 视频生成
├── blog/                     # 博客系统
│   ├── (blog)/               # 博客主目录
│   │   ├── layout.tsx        # 博客布局
│   │   ├── loading.tsx       # 加载状态
│   │   ├── page.tsx          # 博客主页
│   │   ├── category/[slug]/  # 博客分类
│   │   └── page/[page]/      # 博客分页
│   └── [...slug]/            # 博客文章详情
├── layout.tsx                # 营销页面布局
└── README.md                 # 本文件
```

## 🎯 页面描述

### 🏠 `/(home)` - 首页

**目的**: 展示核心产品功能和价值主张的主页面

- **HeroSection**: 主要价值主张和行动号召
- **MusicGeneratorSection**: 实时音乐生成演示
- **GallerySection**: AI 生成音乐作品展示
- **Features3Section**: 产品功能亮点
- **PricingSection**: 定价方案概览
- **FaqSection**: 常见问题解答

### 💰 `/pricing` - 定价页面

**目的**: 详细的定价方案和功能比较

- **PricingTable**: 不同订阅层级的比较
- **FaqSection**: 定价相关问题

### ⚖️ `/(legal)` - 法律页面

**目的**: 法律合规和政策页面

- **隐私政策**: 用户数据保护政策
- **服务条款**: 平台使用条款
- **Cookie 政策**: Cookie 使用信息
- **布局**: 使用专用的 `LegalLayout` 保持样式一致性

### 📄 `/(pages)` - 静态信息页面

**目的**: 公司信息和产品相关内容

- **关于我们**: 创始人信息和联系方式
- **联系页面**: 用户反馈和联系方式
- **更新日志**: 产品版本更新
- **产品路线图**: 未来开发计划
- **等待列表**: 产品测试版或新功能等待列表

### 🤖 `/ai` - AI 功能演示

**目的**: 展示平台的各种 AI 能力

- **音频生成**: AI 音乐生成演示
- **聊天功能**: 智能对话演示
- **图片生成**: 专辑封面生成演示
- **文本生成**: 歌词创作演示
- **视频生成**: 视频内容生成演示

### 📝 `/blog` - 博客系统

**目的**: 内容营销和产品更新平台

- **分类支持**: 按主题组织的博客文章
- **分页**: 文章列表分页
- **动态路由**: 支持任意 URL 路径的博客文章
- **完整系统**: 包含文章详情、分类、分页

## 🎨 布局系统

### 主布局 (`layout.tsx`)

- **导航**: 响应式导航，带滚动效果
- **页脚**: 统一页脚信息
- **响应式**: 适配各种屏幕尺寸

### 法律页面布局 (`(legal)/layout.tsx`)

- **专用容器**: 为法律页面优化的布局
- **样式优化**: 针对长文本阅读优化的排版

### 页面布局 (`(pages)/layout.tsx`)

- **基础布局**: 提供统一的页面容器
- **简洁设计**: 专注于内容呈现

## 🌍 国际化支持

所有页面都支持多语言环境：

- **英语 (en)**: 国际用户
- **中文 (zh)**: 中文用户
- **动态路由**: 通过 `[locale]` 参数切换语言

## 🔧 开发指南

### 添加新页面

1. 在适当的目录中创建 `page.tsx` 文件
2. 遵循现有的页面结构和命名约定
3. 添加必要的元数据生成函数
4. 确保国际化支持

### 页面元数据

每个页面应包含 `generateMetadata` 函数：

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  // 返回页面特定的元数据
}
```

### 组件使用

- 使用 `@/components/blocks/` 中的区块组件
- 遵循现有的样式和交互模式
- 确保响应式设计

## 📊 SEO 优化

- 为每个页面配置完整的元数据
- 使用 `constructMetadata` 工具函数
- 支持 Open Graph 和 Twitter Cards
- 自动生成规范的 URL 结构

## 🚀 性能考虑

- 使用 Next.js 15 App Router
- 支持服务端渲染 (SSR)
- 实现适当的加载状态
- 优化图片和资源加载

---

**维护说明**: 此目录包含所有面向用户的营销页面。任何修改都应考虑用户体验和 SEO 影响。
