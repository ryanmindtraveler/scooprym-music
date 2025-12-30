# 静态资源目录 (Static Assets)

`public/` 目录存放所有不需要经过 Next.js 编译处理的**静态资源**。

当项目部署后，该目录下的所有文件都可以通过根路径 `/` 直接访问。

## 📁 目录结构说明

- **品牌标识与图标**:
  - `logo.png` / `logo-dark.png`: 项目的核心 Logo。
  - `favicon.ico` / `favicon-*.png`: 浏览器标签页图标。
  - `apple-touch-icon.png`: iOS 设备的主屏幕图标。
- **`svg/`**: 存放矢量图形（图标、插图等）。建议使用 SVG 以保证在高分辨率屏幕下的清晰度。
- **`images/`**: 存放通用的静态图片（如背景图、宣传海报等）。
- **`blocks/`**: 可能存放一些特定的 UI 区块预览图或静态模板资源。
- **`og.png`**: Open Graph 图片，用于在社交媒体分享链接时显示的预览图。
- **`noise.png`**: 用于 UI 设计中的噪点背景纹理。

## 🛠️ 如何在代码中引用

在 React 组件或 CSS 中引用这些资源时，请**不要**包含 `public` 路径，直接从根路径 `/` 开始即可。

### 示例 1: 在 TSX 中使用
```tsx
import Image from 'next/image';

<Image src="/logo.png" alt="Logo" width={100} height={40} />
```

### 示例 2: 在 CSS/Tailwind 中使用
```css
.hero-section {
  background-image: url('/noise.png');
}
```

## ⚠️ 注意事项

1. **命名规范**: 尽量使用小写字母和连字符 (`kebab-case.png`)，避免使用空格。
2. **性能优化**:
   - 对于大型图片，建议在放入此目录前通过工具进行压缩。
   - 尽量使用 Next.js 的 `<Image />` 组件来加载此目录下的非矢量图片。
3. **安全性**: 放在这里的所有文件都是公开可访问的，**切勿**将敏感文件（如日志、私钥、配置备份）存放在此。
