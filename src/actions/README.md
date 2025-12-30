# Actions

## 概述
服务器动作（Server Actions）目录，包含所有 Next.js 15 的服务器端操作。

## 主要功能模块

### 支付相关
- `create-checkout-session.ts` - 创建 Stripe 支付会话
- `create-credit-checkout-session.ts` - 创建积分购买支付会话
- `create-customer-portal-session.ts` - 创建客户门户会话
- `check-payment-completion.ts` - 检查支付完成状态

### 积分系统
- `consume-credits.ts` - 消费用户积分
- `get-credit-balance.ts` - 获取用户积分余额
- `get-credit-stats.ts` - 获取积分统计信息
- `get-credit-transactions.ts` - 获取积分交易记录

### 用户管理
- `get-users.ts` - 获取用户列表
- `get-current-plan.ts` - 获取用户当前订阅计划

### 邮件订阅
- `subscribe-newsletter.ts` - 订阅新闻通讯
- `unsubscribe-newsletter.ts` - 取消订阅新闻通讯
- `check-newsletter-status.ts` - 检查订阅状态

### 其他功能
- `send-message.ts` - 发送消息
- `validate-captcha.ts` - 验证验证码

## 使用说明
- 所有文件都使用 `"use server"` 指令
- 使用 `next-safe-action` 进行安全的表单提交
- 遵循 Next.js 15 的服务器动作最佳实践