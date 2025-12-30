# Database

## 概述
数据库层目录，包含数据库模式、迁移文件和 ORM 配置。

## 主要文件

### `schema.ts` - 数据库模式
- 完整的数据库表结构定义
- 包含认证、支付、积分等所有表

### `migrations/` - 数据库迁移
- 数据库版本控制
- 模式变更历史

## 数据库技术栈
- **ORM**: Drizzle ORM
- **数据库**: PostgreSQL
- **认证适配器**: Better Auth PostgreSQL 适配器

## 主要数据表

### 认证相关
- 用户表
- 会话表
- 账户表
- 验证令牌表

### 支付相关
- 订阅表
- 支付记录
- 发票表

### 积分相关
- 积分余额
- 积分交易
- 积分计划

### 业务数据
- 歌曲表
- 歌词表
- 用户作品
- 分析数据

## 开发命令
- `pnpm db:generate` - 生成迁移文件
- `pnpm db:migrate` - 应用迁移
- `pnpm db:push` - 直接同步到数据库（开发环境）
- `pnpm db:studio` - 打开 Drizzle Studio