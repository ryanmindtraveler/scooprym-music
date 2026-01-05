# Hooks (自定义钩子)

## 1. 概述
`src/hooks` 目录包含项目中所有的自定义 React Hooks。这些钩子封装了复杂的状态管理、异步请求逻辑以及副作用处理，旨在提高代码的可读性、复用性及类型安全性。

## 2. 核心分类与说明

### 🛡️ 2.1 认证与权限 (`/auth`)
管理用户身份、会话及访问控制。
- `use-auth.ts`: 核心认证逻辑，处理登录、登出等动作。
- `use-current-user.ts`: 快捷获取当前登录用户的详细信息。
- `use-permission.ts`: 细粒度的权限校验（如判断是否为 admin）。
- `use-session.ts`: 管理 Better Auth 提供的原始会话状态。

### 💳 2.2 财务与积分 (`/billing`)
处理 SaaS 模式下的支付、订阅与虚拟货币逻辑。
- `use-credits.ts`: 实时监听积分余额变化，处理积分相关的业务校验。
- `use-payment.ts`: 处理充值、订阅跳转及支付意向。
- `use-payment-completion.ts`: 监听支付回调状态，配合 UI 显示支付结果。

### 🎵 2.3 音乐与业务 (`/songs`)
针对音乐核心业务的功能封装。
- `use-song-like.ts`: 处理收藏/取消收藏歌曲。
- `use-play-count.ts`: 统计歌曲播放次数，触发后台记录。

### 🖥️ 2.4 UI 交互与工具 (`/ui`)
增强前端交互体验的工具类钩子。
- `use-toast.ts`: 系统弹窗通知控制中心 (基于 shadcn/ui)。
- `use-media-query.ts` / `use-mobile.ts`: 响应式断点检测与移动端判定。
- `use-clipboard.ts`: 提供简单的一键复制功能。
- `use-image-colors.ts`: 动态分析封面图颜色，用于同步 UI 主题色。
- `use-scroll.ts` / `use-mounted.ts`: 处理滚动位置监听及客户端挂载安全检查。

### ⚙️ 2.5 管理系统 (`/admin`)
进阶管理面板专用的 Hooks。
- `use-admin-songs.ts`: 管理员歌曲审核与列表操作。
- `use-users.ts`: 管理员对全站用户的查询与状态修改。

### ✉️ 2.6 其他 (`/newsletter`)
- `use-newsletter.ts`: 异步处理邮件订阅逻辑。

## 3. 开发规范
- **类型优先**: 所有 Hook 及其返回值必须明确 TypeScript 类型定义。
- **副作用清理**: 涉及事件监听 (如 `use-scroll`) 或定时器的 Hook，必须在 `useEffect` 的返回函数中进行清理。
- **避免臃肿**: 如果一个 Hook 超过 200 行，建议考虑拆分为更小的逻辑单元。
- **依赖管理**: 确保 `useCallback` 和 `useMemo` 的依赖数组定义准确，避免引起不必要的重新渲染。

## 4. 目录入口
每个子目录中的 Hooks 通常作为独立文件导出，通过 `@/hooks/[dir]/[filename]` 进行引用。
