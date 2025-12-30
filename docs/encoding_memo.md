# 避免文件编码问题备忘录 (Encoding Best Practices)

## 问题描述
在 Windows 环境下进行开发时，可能会遇到 "stream did not contain valid UTF-8" 错误，导致构建失败，或者代码中的中文注释和 Emoji 变成乱码（Mojibake）。

## 原因分析
这个问题通常由以下操作导致：
1.  **PowerShell 重定向/写入**：默认情况下，Windows PowerShell 可能会使用系统默认编码（如 GBK/CP936）而不是 UTF-8 来读取或写入文件。当使用 `>` 重定向或 `Set-Content`（未指定编码）处理包含中文/Emoji 的文件时，文件会被破坏。
2.  **不兼容的脚本**：自定义的 Node.js 或 Python 脚本在读写文件时，如果没有显式指定 `'utf-8'` 编码，可能会在 Windows 上出现不一致的行为。
3.  **编辑器设置**：虽然 VS Code 默认是 UTF-8，但如果文件已经被外部工具修改为 GBK，VS Code 可能会尝试以 GBK 打开，再次保存时可能会加剧损坏。

## 预防措施

### 1. 脚本编写规范
在编写维护脚本（如批量替换、重构代码）时，务必显式指定编码：

**Node.js:**
```javascript
// ✅ 正确
const content = fs.readFileSync(filePath, 'utf-8');
fs.writeFileSync(filePath, newContent, 'utf-8');
```

**PowerShell:**
```powershell
# ✅ 正确
Set-Content -Path $File -Value $Content -Encoding UTF8
```
*注意：避免直接使用 `>` 重定向符号处理非纯 ASCII 文件。*

### 2. VS Code 配置
确保 VS Code 全局配置中强制使用 UTF-8：
*   `Files: Encoding` -> `utf8`
*   `Files: Auto Guess Encoding` -> `false` (建议关闭，避免误判)

### 3. Git 配置 (.gitattributes)
在项目根目录的 `.gitattributes` 文件中强制指定文本文件行为，防止行尾符号（CRLF vs LF）混合导致的潜在问题：
```
* text=auto eol=lf
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.json text eol=lf
```

## 修复方法
一旦发现文件损坏（乱码）：
1.  **不要直接保存**：如果这时候保存，可能会把乱码永久固化。
2.  **查看历史**：使用 Git 历史 (`git diff`) 查看最近的修改，确认是在哪一步被破坏的。
3.  **重置文件**：`git checkout -- path/to/file` 恢复到上一个正常版本。
4.  **手动重建**：如果没有版本控制，需要彻底删除文件后，用正确的 UTF-8 编码重新创建并写入内容。
