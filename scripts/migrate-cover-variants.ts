import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';

// 仅从当前公开页面收集封面，不查询或改写数据库，不覆盖、删除原图。
async function main() {
  loadEnvConfig(process.cwd(), true);
  const { createCoverVariants } = await import('../src/lib/creation/optimize-cover');
  const { uploadCoverVariants } = await import('../src/lib/creation/upload-cover-variants');
  const { COVER_CACHE_CONTROL } = await import('../src/lib/images/cover-variants');
  const { storageConfig } = await import('../src/storage/config/storage-config');
  const { uploadCachedObject } = await import('../src/storage/provider/cached-upload');
  const apply = process.argv.includes('--apply');
  const directory = 'F:/CodexHome/audits/image-2026-10-15/migration';
  await mkdir(directory, { recursive: true });
  const configuredOrigin = new URL(process.env.STORAGE_PUBLIC_URL || '').origin;
  const manifestPath = path.resolve('src/lib/images/cover-manifest.json');
  const manifest: Record<string, string> = JSON.parse(await readFile(manifestPath, 'utf8'));
  const urls = new Set<string>();
  for (const page of ['/', '/songs', '/songs?page=2']) {
    const response = await fetch(`https://scooprym.app${page}`, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`公开页面不可访问：${page} HTTP ${response.status}`);
    const html = await response.text();
    for (const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
      const src = match[1].replaceAll('&amp;', '&');
      if (!src.startsWith('https:')) continue;
      const url = new URL(src);
      if (url.hostname.endsWith('.r2.dev') && url.pathname.startsWith('/song-covers/')) {
        if (url.origin !== configuredOrigin) throw new Error('公开封面与当前存储环境不一致，已停止。');
        urls.add(src);
      }
    }
  }
  const results: Record<string, unknown>[] = [];
  let failures = 0;
  const limitOption = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitOption ? Number(limitOption.split('=')[1]) : urls.size;
  if (!Number.isInteger(limit) || limit < 1) throw new Error('迁移数量必须是正整数。');
  const selected = [...urls].slice(0, limit);
  for (const url of selected) {
    try {
      const cachePath = path.join(directory, `${createHash('sha256').update(url).digest('hex')}.image`);
      let buffer: Buffer;
      try {
        buffer = await readFile(cachePath);
      } catch {
        const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`原图 HTTP ${response.status}`);
        buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(cachePath, buffer);
      }
      const variants = await createCoverVariants(buffer);
      let mainUrl = manifest[url];
      if (apply && !mainUrl) {
        const asset = await uploadCoverVariants(
          buffer,
          'song-covers/optimized',
          async (file, _name, mime, _folder, options) => {
            const key = options!.objectKey!;
            const body = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
            const response = await uploadCachedObject(storageConfig, key, body, mime, COVER_CACHE_CONTROL, 20_000);
            if (!response.ok) throw new Error(`上传 HTTP ${response.status}`);
            return { key, url: `${configuredOrigin}/${key}` };
          }
        );
        mainUrl = asset.url;
        // 所有尺寸均可访问且缓存元数据正确后，才写入前端映射。
        for (const image of variants) {
          const variantUrl = mainUrl.replace(/w\d+\.webp$/, `w${image.dimensions.width}.webp`);
          const response = await fetch(variantUrl, { method: 'HEAD', signal: AbortSignal.timeout(20_000) });
          if (!response.ok || response.headers.get('cache-control') !== COVER_CACHE_CONTROL) {
            throw new Error(`派生图校验失败 HTTP ${response.status}`);
          }
        }
        manifest[url] = mainUrl;
        await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
        await rename(`${manifestPath}.tmp`, manifestPath);
      }
      results.push({
        url,
        originalBytes: buffer.length,
        variants: variants.map((image) => ({ ...image.dimensions, bytes: image.buffer.length })),
        mainUrl,
      });
      console.log(
        `封面处理 ${results.length}/${selected.length}：${buffer.length} → ${variants.at(-1)?.buffer.length} 字节`
      );
    } catch (error) {
      failures += 1;
      results.push({ url, error: error instanceof Error ? error.message : '未知错误' });
      console.error(`封面处理失败 ${results.length}/${selected.length}`);
    }
  }
  const report = {
    checkedAt: new Date().toISOString(),
    apply,
    sourceCount: urls.size,
    count: selected.length,
    failures,
    results,
  };
  await writeFile(
    path.join(directory, apply ? 'applied.json' : 'preview.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );
  console.log(JSON.stringify({ apply, count: selected.length, failures }));
  if (failures) process.exitCode = 1;
}

main().catch(async (error) => {
  await mkdir('F:/CodexHome/audits/image-2026-10-15/migration', { recursive: true });
  await writeFile(
    'F:/CodexHome/audits/image-2026-10-15/migration/error.txt',
    error instanceof Error ? error.stack || error.message : String(error),
    'utf8'
  );
  console.error('封面迁移未完成，请检查存储配置、网络和本地报告；原图及歌曲数据未改动。');
  process.exitCode = 1;
});
