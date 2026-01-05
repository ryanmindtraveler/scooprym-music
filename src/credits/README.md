# Credits 积分系统 (src/credits)

## 1. 概述
`src/credits` 模块负责管理项目的虚拟货币（积分）系统。它不仅包含简单的余额加减，还实现了一套复杂的基于 **FIFO (先进先出)** 的消耗与过期逻辑，确保不同来源的积分（如充值积分、赠送积分）能按预定规则正确核销。

## 2. 核心逻辑与文件

### 💰 2.1 积分消费与管理 (`credits.ts`)
处理日常的积分查询与核销请求。
- **FIFO 消耗机制**: 调用 `consumeCredits` 时，系统会优先消耗最早过期的积分记录。
- **余额验证**: `hasEnoughCredits` 用于在执行 AI 任务前进行预检。
- **事务安全**: 所有积分变动均通过数据库事务确保数据一致性，并在 `creditTransaction` 表中留下详细审计追踪。

### 🚚 2.2 批量分发与过期处理 (`distribute.ts`)
设计用于定时任务 (Cron Job) 的大规模数据处理脚本。
- **自动分发**: `distributeCreditsToAllUsers` 根据用户订阅计划（免费、年度、终身）定时发放月度积分。
- **过期清理**: `batchProcessExpiredCredits` 扫描并清理已过期的剩余积分，并记录过期日志。
- **性能优化**: 采用 `Batch` 处理模式（每 100 用户一包），支持大规模用户基数下的积分结算。

### 📋 2.3 数据协议 (`types.ts`)
定义了系统支持的交易类型 (`CREDIT_TRANSACTION_TYPE`)：
- `REGISTER_GIFT`: 注册赠送。
- `MONTHLY_REFRESH`: 免费计划月度刷新。
- `PURCHASE_PACKAGE`: 购买积分包。
- `SUBSCRIPTION_RENEWAL`: 订阅续费。
- `USAGE`: 功能消耗扣费。
- `EXPIRE`: 逾期失效。

## 3. 访问入口 (Contextual Wrappers)
- **`server.ts`**: 服务器端专用导出，包含数据库修改权限的函数。
- **`client.ts`**: 封装了一些轻量级的客户端状态查询逻辑（通常用于 UI 状态同步）。

## 4. 集成准则
1. **扣费原则**: 凡是消耗 AI 算力（音乐、封面生成）的操作，必须先调用 `consumeCredits`。
2. **过期配置**: 积分包的过期天数配置位于 `CreditPackage` 的 `expireDays` 字段中，默认为永久有效（undefined）。
3. **日志关联**: 充值相关的积分变动应关联 `paymentId`，以便于财务对账。

## 5. 开发建议
- 避免直接操作 `userCredit` 表的 `currentCredits` 字段，始终使用 `addCredits` 或 `consumeCredits` 封装函数，以保证交易流水 (Transaction History) 的同步生成。
