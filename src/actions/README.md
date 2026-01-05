# Actions (服务器动作)

## 概述
此目录包含所有 Next.js 15 的服务器端操作（Server Actions），按功能模块进行组织。所有操作均遵循安全性、类型安全和高性能的最佳实践。

## 目录结构与功能模块

### 💰 1. 支付与财务 (Billing & Payments)
处理 Stripe 集成、订阅管理和购买流程。
- **`billing/create-checkout-session.ts`**: 创建标准订阅计划的 Stripe 支付会话。
- **`billing/create-credit-checkout-session.ts`**: 创建一次性积分包购买的支付会话。
- **`billing/create-customer-portal-session.ts`**: 生成用户管理订阅（如取消、更换卡片）的 Stripe Portal 链接。
- **`billing/check-payment-completion.ts`**: 验证特定支付会话是否已成功完成。

### 💎 2. 积分系统 (Credits System)
管理用户账户的虚拟积分余额。
- **`billing/consume-credits.ts`**: 在用户执行 AI 生成等操作时扣除积分。
- **`billing/get-credit-balance.ts`**: 实时查询用户当前的积分余额。
- **`billing/get-credit-stats.ts`**: 获取用户积分消耗的历史统计数据。
- **`billing/get-credit-transactions.ts`**: 分页获取积分充值与消耗的详细流水。

### 👤 3. 用户与计划 (Users & Plans)
管理用户状态和订阅方案。
- **`billing/get-current-plan.ts`**: 解析并返回用户当前所处的订阅等级（Free/Pro/Lifetime）。
- **`admin/get-users.ts`**: 管理员获取系统的用户列表。

### 🔐 4. 管理员功能 (Admin Functions)
仅限具有 `admin` 角色的用户调用的维护操作。
- **`admin/get-admin-songs.ts`**: 后台管理端分页获取、搜索和筛选所有生成的歌曲。
- **`admin/update-song-publish.ts`**: 审核歌曲，控制歌曲是否在公共首页/营销页展示。

### 📧 5. 营销与互动 (Marketing & Interaction)
处理邮件订阅和联系表单。
- **`newsletter/subscribe-newsletter.ts`**: 将邮箱添加到 Resend 订阅名单。
- **`newsletter/unsubscribe-newsletter.ts`**: 从 Resend 订阅名单中移除。
- **`newsletter/check-newsletter-status.ts`**: 查询特定用户是否已订阅。
- **`contact/send-message.ts`**: 处理并发送联系表单中的用户消息。

### 🛡️ 6. 安全与校验 (Security & Validation)
系统安全增强。
- **`security/validate-captcha.ts`**: 对抗机器人，验证 Cloudflare Turnstile 或相关 Captcha。

## 开发准则
- **声明**: 所有文件顶部必须包含 `"use server";` 指令。
- **安全性**: 使用 `next-safe-action` 封装大部分 Action，确保输入校验。
- **权限**: 敏感操作需调用 `auth.api.getSession` 验证用户身份或角色。
- **缓存**: 在执行写操作后，适当调用 `revalidatePath` 或 `revalidateTag` 更新前台显示。
- **目录规范**: 请将新 Action 存放在对应的模块子目录中，不要直接丢在根目录下。
