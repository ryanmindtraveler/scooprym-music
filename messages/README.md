# 国际化语言包目录 (Internationalization - i18n)

该目录存放项目各语言版本的**翻译文案 (Dictionary)**，由 `next-intl` 框架驱动。

## 🌐 核心功能

本项目支持多语言展示，所有的 UI 文本（按钮、标题、提示语）都不会硬编码在 TSX 文件中，而是通过引用这里的 JSON 键值对来实现动态切换。

## 📁 语言文件清单

- **`en.json`**: 英文语言包（基础版本）。
- **`zh.json`**: 中文语言包。

## 🛠️ 如何添加新文案

### 1. 在 JSON 中定义
在对应的语言文件中找到相关模块（如 `Common` 或 `Dashboard`），按照键值对格式添加：
```json
// zh.json
{
  "Create": {
    "title": "开始创作",
    "button": "生成音乐"
  }
}
```

### 2. 在代码中使用
使用 `useTranslations` 钩子来读取文案：
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('Create');
return <button>{t('button')}</button>; // 输出：生成音乐
```

## ⚠️ 开发注意事项

- **键名同步**：请确保 `en.json` 和 `zh.json` 之间的结构和键名（Key）保持完全同步，否则切换语言时可能会出现文案缺失。
- **动态占位符**：支持使用 `{name}` 格式的占位符来注入动态变量。
- **命名规范**：建议使用大写字母开头的模块名作为根键（如 `Auth`, `Dashboard`），子键采用 `camelCase` 驼峰命名。
