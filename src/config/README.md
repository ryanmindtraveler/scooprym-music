# 应用配置中心 (Application Configuration)

`src/config/` 目录是项目的**控制面板**。它采用了一种“核心配置 + 视图映射”的架构，确保你只需要在一个地方修改参数，全站的逻辑和 UI 都会同步更新。

---

## 🛠️ 核心架构逻辑

这里的配置分为两个层次：

### 1. 核心源配置 (`website.tsx`)
这是项目的**总闸门**。它是一个纯粹的数据文件，定义了：
- **云服务开关**：是否启用 Stripe（支付）、Resend（邮件）、S3（存储）。
- **硬核参数**：Stripe 的 `Price ID`、各套餐包含的积分数量、SEO 元数据。
- **功能开关**：是否允许用户修改头像、是否启用 Google 登录等。
- **i18n 基础**：定义默认语言以及支持的语种。

### 2. UI 适配器 (`*-config.tsx`)
这些文件是**连接配置与界面**的桥梁（通常包含 React Hooks 或函数）。它们的作用是将 `website.tsx` 中的原始数据与语言包 (i18n) 结合起来。
- **`price-config.tsx`**: 读取 `website.tsx` 里的价格，结合 `zh.json` 里的描述文字，生成前端展示用的定价表对象。
- **`navbar-config.tsx` / `sidebar-config.tsx`**: 定义导航栏和侧边栏的链接、图标、以及它们是否受登录保护。
- **`social-config.tsx`**: 统一管理底部或个人资料页的社交媒体链接。
- **`credits-config.tsx`**: 定义积分充值包的展示逻辑。

---

## 📁 文件说明清单

- **`website.tsx`**: **[修改频率最高]**。修改任何第三方密钥、套餐金额、SEO 基础信息请来这里。
- **`price-config.tsx`**: 管理订阅套餐展示的文字描述。
- **`credits-config.tsx`**: 管理单笔积分购买包的展示视图。
- **`navbar-config.tsx` / `footer-config.tsx`**: 控制顶部导航详情和页脚链接。
- **`sidebar-config.tsx`**: 定义控制台（Dashboard）左侧菜单的顺序、图标和分组。
- **`avatar-config.tsx`**: 配置用户默认头像或头像生成的预设参数。
- **`social-config.tsx`**: 维护全站统一的社交媒体入口。

---

## 💡 给开发者的建议

1. **先改配置，再写代码**：如果你要增加一个新功能入口（比如“AI 视频”），应该先在 `website.tsx` 里定义它的开关，在 `sidebar-config.tsx` 增加菜单项，最后再去 `app/` 下写页面。
2. **避免路径硬编码**：在编写 `navbar-config.tsx` 等文件时，请配合 `src/routes.ts` 使用路由常量，确保路径变更时一改全改。
3. **i18n 隔离**：不要在 `website.tsx` 里写中文或英文描述，那里只存 ID 和数字；所有的翻译应在对应的 `config` 适配器中通过 `useTranslations` 钩子注入。
