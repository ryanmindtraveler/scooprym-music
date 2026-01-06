# 💳 Stripe 支付功能完整测试方案 (Complete Payment Testing Guide)

本指南将帮助您在本地环境 (Windows/Localhost) 完整测试 Stripe 支付流程，涵盖从用户支付到后台数据更新的全链路。

---

## 🛠️ 第一步：环境准备 (Prerequisites)

### 1. 确保 Stripe CLI 已安装
Stripe CLI 是本地接收 Webhook 通知的唯一可靠工具。
*   **检查是否已安装**:
    在终端运行：
    ```powershell
    stripe --version
    ```
*   **如果没有安装**:
    由于您是 Windows 环境，推荐使用 `scoop` (如果已安装) 或下载 `.exe`。
    *   **Scoop**: `scoop install stripe`
    *   **Direct**: [下载 Stripe CLI for Windows](https://github.com/stripe/stripe-cli/releases/latest) (下载 windows zip，解压 exe 到项目根目录或 PATH 中)。

### 2. 登录 Stripe
在项目根目录运行：
```powershell
stripe login
```
按提示在浏览器中通过身份验证。

---

## 🔗 第二步：配置 Webhook 监听 (Critical Setup)

这是\*\*最关键\*\*的一步。本地开发环境无法直接接收 Stripe 的公网请求，必须通过 CLI 转发。

1.  **启动监听**:
    在**新的终端窗口**中运行以下命令：
    ```powershell
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    ```

2.  **获取 Webhook Secret**:
    终端会显示类似如下的输出：
    > Ready! Your webhook signing secret is **whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx**

3.  **更新环境变量 (.env.local)**:
    <span style="color:red">⚠️ 必须执行此步，否则支付会成功但数据库不会更新！</span>

    复制上面的 `whsec_...` 密钥，打开您的 `.env.local` 文件，更新：
    ```env
    STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```
    *(保存文件后，请**重启**您的 Next.js 开发服务器 `npm run dev` 以加载新变量)*

---

## 💸 第三步：执行支付测试 (Make a Payment)

1.  **访问定价页面**:
    在浏览器打开 [http://localhost:3000/pricing](http://localhost:3000/pricing)。
    *(请确保您已登录测试账号)*

2.  **选择套餐**:
    点击任一 "Subscribe" 或 "Buy" 按钮。

3.  **填写测试卡号**:
    您将被重定向到 Stripe 托管的支付页面（测试模式）。
    请使用 Stripe 官方测试卡号：
    *   **卡号**: `4242 4242 4242 4242`
    *   **过期日期**: 任意未来日期 (e.g., `12/30`)
    *   **CVC**: 任意 3 位数 (e.g., `123`)
    *   **邮编**: 任意 (e.g., `10001`)

4.  **完成支付**:
    点击支付按钮。成功后您应被重定向回网站的 "Success" 页面。

---

## ✅ 第四步：验证结果 (Verification)

### 1. 验证 Webhook 接收
回到运行 `stripe listen` 的终端窗口，您应该看到一连串 `200 OK` 响应：
```
2026-01-06 11:15:00   --> checkout.session.completed [evt_...]
2026-01-06 11:15:00  <--  [200] POST http://localhost:3000/api/webhooks/stripe
2026-01-06 11:15:01   --> invoice.paid [evt_...]
2026-01-06 11:15:01  <--  [200] POST http://localhost:3000/api/webhooks/stripe
```
如果您看到 `400` 或 `500` 错误，请检查 `STRIPE_WEBHOOK_SECRET` 是否正确配置。

### 2. 验证 Admin Dashboard (最直观)
访问 [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)。
您应该看到：
*   **Total Revenue**: 金额增加了。
*   **Active Subscriptions**: 数量增加了 (+1)。
*   **Transaction List**: 列表中出现了刚才的交易记录。
*   **Growth**: 由于这是“第一笔”有效交易，您可能会看到 `+XX new` 或具体的增长百分比。

---

## ❓ 常见问题排查 (Troubleshooting)

*   **支付成功了，但 Dashboard 没变？**
    *   检查 `stripe listen` 终端是否有报错。
    *   确认 `.env.local` 里的 `STRIPE_WEBHOOK_SECRET` 是否与当前 `listen` 会话的输出**完全一致**（每次重新运行 listen 可能会变，除非您指定了 `--load-from-webhooks-api`）。
    *   确认修改 `.env` 后是否重启了 `npm run dev`。

*   **Stripe 页面提示 API Key 错误？**
    *   检查 `.env.local` 里的 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 和 `STRIPE_SECRET_KEY` 是否是 **Test Mode** 的密钥（通常以 `pk_test_` 和 `sk_test_` 开头）。
