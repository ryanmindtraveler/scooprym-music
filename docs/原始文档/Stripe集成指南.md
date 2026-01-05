# 如何优雅地实现 Stripe 支付集成

> [!NOTE]
> **说明**
> 本文档基于业内资深开发者的经验总结，旨在解决 Stripe 集成中常见的“状态同步”难题。虽然 Stripe 官方在不断优化，但目前这仍然是在 SaaS 应用中设置支付的最佳实践。

我也曾多次配置 Stripe，过程通常并不愉快。Stripe 最大的问题在于它会在你的代码库中引入“分裂的大脑”：当客户结账时，购买状态存在于 Stripe 中，而你被期望通过 Webhook 在自己的数据库中跟踪购买。

Stripe 有超过 250 种事件类型，它们的数据量不同，到达顺序无法保证，且不应被完全信任。很容易出现 Stripe 中支付失败但应用中显示“已订阅”的情况。

为了避免这种糟糕的竞态条件，我的核心方案是：**一个简单的 `syncStripeDataToKV(customerId: string)` 函数，用于同步指定客户的所有 Stripe 数据到你的存储中。**

## 核心流程

即使你不完全照搬代码，也请阅读这个流程。跳过其中任何一步都会让未来的维护变得异常困难：

1. **前端**：“订阅”按钮点击时调用 `generate-stripe-checkout` 接口。
2. **后端**：在 Stripe 中创建客户（Customer）。
3. **后端**：在存储中绑定 Stripe 的 `customerId` 和你应用的 `userId`。
4. **后端**：为用户创建“结账会话”（Checkout Session），将返回 URL 设置为应用中的 `/success` 路由。
5. **用户**：完成支付，由 Stripe 重定向回 `/success`。
6. **前端**：加载时触发后端的成功后同步函数（API 或 Server Action）。
7. **后端**：使用 `userId` 获取 `customerId`，并调用 `syncStripeDataToKV`。
8. **后台/Webhook**：针对[所有相关事件](#我追踪的事件)，调用 `syncStripeDataToKV`。

## 关键点说明

### 结账流程
核心是在开始结账前**务必先定义好客户**。不要依赖结账时的临时客户。

### `syncStripeDataToKV` 函数
该函数从 Stripe 获取最新的订阅数据，并将其状态完整持久化到你的数据库或 Key-Value 存储中。它既被 `/success` 端点调用，也被 Webhook 处理器调用。

### `/success` 端点
用户在结账后返回的页面。主动调用同步函数可以防止 Webhook 延迟导致的页面显示延迟。

### Webhook 处理器
推荐捕获所有与订阅生命周期相关的事件（创建、更新、删除、逾期、恢复等），并在每个事件中触发一次数据同步。

## 我追踪的常见事件
- `checkout.session.completed`
- `customer.subscription.created/updated/deleted`
- `invoice.paid/payment_failed`
- `payment_intent.succeeded/payment_failed`

## 专业建议
- **禁用 "Cash App Pay"**：其撤销率通常极高。
- **启用 "Limit customers to one subscription"**：防止用户开启多个并行订阅的隐蔽设置。

## 总结
虽然这不能解决所有问题（如免费试用管理、配额追踪等），但这套方案能极大地减少因 Stripe 状态不一致导致的线上 Bug。
