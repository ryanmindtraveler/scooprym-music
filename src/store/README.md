# Stores (状态管理)

## 1. 概述
`src/store` 目录使用 **Zustand** 进行全局状态管理。Zustand 因其轻量、高性能且无样板代码的特点，被选为本项目的状态库。

## 2. 核心 Stores
- **`player-store.ts`**: 全局音乐播放器状态。管理当前播放歌曲 (`currentSong`)、播放状态 (`isPlaying`)、播放进度与音量等。支持跨组件（如底部播放条与歌曲列表）的状态同步。
- **`locale-store.ts`**: 语言环境状态。用于客户端组件获取或切换当前语言 (`currentLocale`)，辅助 `next-intl` 实现国际化体验。
- **`create-store.ts`**: 音乐创作状态。管理创作表单的临时数据、生成进度及模式切换。

## 3. 使用规范
- **按需引入**: 尽量使用 Selector 模式来订阅状态，避免不必要的重新渲染。
  ```ts
  const isPlaying = usePlayerStore(state => state.isPlaying); // ✅ Good
  const { isPlaying } = usePlayerStore(); // ⚠️ May cause extra re-renders
  ```
- **单一职责**: 每个 Store 应专注于特定领域的业务逻辑，避免创建上帝对象 (God Store)。
- **持久化**: 如需状态持久化（保存到 localStorage），请使用 Zustand 的 `persist` 中间件。
