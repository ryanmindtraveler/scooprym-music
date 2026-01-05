# Components (组件库)

## 概述
`src/components` 是项目的前端 UI 核心，包含从基础原子组件到大型页面区块的所有 React 组件。项目采用了高度组合化的架构，集成了多个先进的动画与特效组件库。

## 组件分类

### 🏗️ 1. 基础 UI 组件 (Base UI)
底层的通用组件，主要基于 Radix UI 和 Tailwind CSS。
- **`ui/`**: 核心原子组件（Button, Input, Dialog 等），基于 **shadcn/ui** 规范。
- **`shared/`**: 跨模块共享的通用 UI 片段（包含原 `ai-elements` 的交互组件）。
- **`icons/`**: 自定义 SVG 图标库。
- **`providers/`**: 全局状态、主题和 Context 提供者。
- **`layout/`**: 全局导航、页眉、页脚及通用的页面包装器。

### 🎸 2. 核心业务组件 (Core Business)
支撑音乐生成 SaaS 核心流程的专用组件。
- **`create/`**: **音乐实验室/工作室**。包含歌词编辑器 (`lyrics-display.tsx`)、创作表单 (`create-music-form.tsx`) 和沉浸式体验组件。
- **`songs/`**: **作品管理**。歌曲详情展示 (`song-detail-client.tsx`)、歌曲列表行及关联动作。
- **`player/`**: **音乐播放器**。包含全局播放器控制栏 (`global-player.tsx`) 和增强型播放器界面。
- **`visualizer/`**: 音乐频谱/视觉化效果。

### 🎨 3. 专题与特效库 (Specialized Libraries)
集成的高级特效组件库，用于提升整体视觉冲击力。
- **`magicui/`**: 丰富的交互特效、边框动画和背景效果。
- **`tailark/`**: 预设的主题化精美组件库。
- **`animate-ui/`**: 专注于页面元素入场与过渡动画。
- **`glitch-ui/`**: 故障艺术风格驱动的视觉组件。
- **`diceui/`**: 辅助 UI 组件补充。

### 🧱 4. 页面区块 (Page Blocks)
由原子组件组合而成的业务大块，常用于营销页和着陆页。
- **`blocks/`**: 通用的营销区块（Hero 英雄区, Features 功能特性, Testimonials 用户评价, FAQs 等）。
- **`home/`**: 首页特定的展示逻辑。
- **`pricing/`**: 独立的定价方案展示与选择逻辑。
- **`premium/`**: 会员/高级功能专属引导组件。

### 🛠️ 5. 功能模块组件 (Functional Modules)
按业务领域划分的支撑组件。
- **`admin/`**: 后台管理系统组件（用户列表、歌曲审核等）。
- **`auth/`**: 登录、注册、找回密码及社交登录组件。
- **`settings/`**: 个人资料、偏好设置和账户管理。
- **`payment/`**: 支付流程配套组件。
- **`newsletter/`**: 邮件订阅引导与管理。
- **`blog/` / `docs/` / `changelog/`**: 配合 Fumadocs 使用的内容展示组件。
- **`affiliate/`**: 联盟推广系统。
- **`waitlist/`**: 产品内测等待名单逻辑。

## 开发与使用建议
1. **优先使用 `ui/`**: 构建新功能时，首先查看 `ui/` 是否有现成的原子组件。
2. **特效适度**: `magicui` 等特效库非常强大，但建议仅在关键视觉节点（如 Hero 区、生成成功等）使用，避免过度动画导致加载压力。
3. **业务解耦**: 具有复杂逻辑的组件（如 `create/` 下的组件）应尽量将业务逻辑抽离至 Hooks 或 Actions。
4. **响应式**: 所有新增组件必须确保在移动端具有良好的展示效果（Tailwind `sm:`, `md:`, `lg:` 修饰符）。
