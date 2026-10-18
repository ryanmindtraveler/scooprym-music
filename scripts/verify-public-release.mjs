import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import ts from 'typescript';

// 固定入口必须独立请求：只遍历 sitemap 会把“入口和 sitemap 一起被回退”误判为通过。
// 全程匿名、只读，不读取环境变量或数据库，不下载音频，不触发播放和生成。
const CONCURRENCY = 3;
const MAX_GALLERY_PAGES = 100;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const retiredPages = [
  '/features/gossip-roast',
  '/blog',
  '/blog/category/test',
  '/changelog',
  '/docs',
  '/docs/intro',
  '/waitlist',
  '/roadmap',
  '/ai/text',
  '/ai/chat',
  '/ai/image',
  '/ai/audio',
  '/ai/video',
  '/magicui',
  '/blocks/features',
  '/preview/features/one',
  '/zh/docs',
  '/en/roadmap',
];
const retiredApis = ['/api/chat', '/api/analyze-content', '/api/search', '/api/generate/image'];

function parseOrigin(value) {
  assert(value && !/\s/.test(value), 'origin 必须是完整站点地址，不能包含空白');
  const url = new URL(value);
  assert(['http:', 'https:'].includes(url.protocol), 'origin 只允许 HTTP 或 HTTPS');
  assert(!url.username && !url.password, 'origin 不允许携带凭据');
  assert(url.pathname === '/' && !url.search && !url.hash, 'origin 不允许携带路径、查询参数或片段');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const local = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  assert(
    local || (!isIP(hostname) && hostname.includes('.') && !hostname.endsWith('.')),
    'origin 主机必须是公开域名或本地回环地址'
  );
  assert(url.protocol === 'https:' || local, '非本地站点必须使用 HTTPS');
  return url.origin;
}

// 用语法树读取纯内容常量，不执行应用模块，避免意外引入服务端凭据和数据库。
async function readConstant(relativePath, name) {
  const sourcePath = fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
  const source = ts.createSourceFile(sourcePath, await readFile(sourcePath, 'utf8'), ts.ScriptTarget.Latest, true);
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
        return declaration.initializer;
      }
    }
  }
  throw new Error(`内容配置缺失：${relativePath} 中的 ${name}`);
}

function stringLiteral(node) {
  assert(node && ts.isStringLiteral(node), '内容配置必须使用显式字符串');
  return node.text;
}

async function readReleaseManifest() {
  const topicsNode = await readConstant('src/lib/internet-lore/topics.ts', 'internetLoreTopics');
  assert(ts.isArrayLiteralExpression(topicsNode), '专题配置必须是数组');
  const topics = topicsNode.elements.map((node) => {
    assert(ts.isObjectLiteralExpression(node), '专题配置必须是显式对象');
    const slug = node.properties.find(
      (property) => ts.isPropertyAssignment(property) && property.name.getText() === 'slug'
    );
    return stringLiteral(slug?.initializer);
  });
  assert(topics.length === 6 && new Set(topics).size === 6, '发布基线应包含 6 个互不重复的专题');
  assert(
    topics.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)),
    '专题 slug 格式异常'
  );
  const catalog = await readConstant('src/lib/internet-lore/song-catalog.ts', 'historicalLoreSongIds');
  assert(ts.isObjectLiteralExpression(catalog), '原始歌曲清单必须是显式对象');
  const songsByTopic = {};
  for (const property of catalog.properties) {
    assert(
      ts.isPropertyAssignment(property) && ts.isArrayLiteralExpression(property.initializer),
      '原始歌曲清单格式异常'
    );
    const slug = stringLiteral(property.name);
    assert(topics.includes(slug), `歌曲清单引用未知专题：${slug}`);
    songsByTopic[slug] = property.initializer.elements.map(stringLiteral);
  }
  assert(
    topics.every((slug) => Object.hasOwn(songsByTopic, slug)),
    '歌曲清单缺少专题'
  );
  const songIds = Object.values(songsByTopic).flat();
  assert(songIds.length === 9 && new Set(songIds).size === 9, '发布基线应包含 9 首互不重复的原始 Lore 歌曲');
  assert(
    songIds.every((id) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)),
    '原始歌曲 ID 格式异常'
  );
  return { topics, songsByTopic, songIds };
}

async function mapLimit(items, callback) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (cursor < items.length) await callback(items[cursor++]);
    })
  );
}

async function readBody(response) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder('utf-8');
  let size = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      assert(size <= MAX_BODY_BYTES, '响应正文超过 8 MiB，已停止读取');
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
  }
}

async function verifyRelease(origin, manifest) {
  const results = [];
  const pages = new Map();
  const record = (kind, path, issues, extra = {}) => results.push({ kind, path, ...extra, issues });
  const request = async (path, method = 'GET') => {
    const url = new URL(path, origin);
    assert(url.origin === origin && url.pathname.startsWith('/'), '禁止请求站点外地址');
    const response = await fetch(url, {
      method,
      redirect: 'manual',
      credentials: 'omit',
      signal: AbortSignal.timeout(45_000),
      headers: { 'User-Agent': 'ScoopRYM-Public-Release-Check/1.0' },
    });
    return { response, body: await readBody(response) };
  };

  let sitemapUrls = [];
  let canonicalOrigin;
  try {
    const { response, body } = await request('/sitemap.xml');
    assert.equal(response.status, 200, `站点地图返回 HTTP ${response.status}`);
    const xml = load(body, { xmlMode: true });
    sitemapUrls = xml('urlset > url > loc')
      .map((_, element) => xml(element).text().trim())
      .get()
      .map((value) => new URL(value));
    assert(sitemapUrls.length > 0 && sitemapUrls.length <= 5000, '站点地图数量异常或使用了未支持的 sitemap 索引');
    const origins = new Set(sitemapUrls.map((url) => parseOrigin(url.origin)));
    assert.equal(origins.size, 1, '站点地图混用了多个规范域名');
    canonicalOrigin = [...origins][0];
    const required = ['/', '/songs', '/internet-lore', ...manifest.topics.map((slug) => `/internet-lore/${slug}`)];
    const missing = required.filter(
      (path) => !sitemapUrls.some((url) => url.pathname === path && !url.search && !url.hash)
    );
    const retired = sitemapUrls.filter((url) =>
      /^\/(features|blog|docs|ai|pricing|roadmap|waitlist|changelog|magicui|blocks|preview)(\/|$)/.test(url.pathname)
    );
    const issues = [
      ...missing.map((path) => `缺少已发布路由：${path}`),
      ...retired.map((url) => `包含弃用路由：${url.pathname}`),
    ];
    record('sitemap', '/sitemap.xml', issues, { status: response.status, total: sitemapUrls.length, canonicalOrigin });
  } catch (error) {
    record('sitemap', '/sitemap.xml', [error.message]);
  }

  async function checkPage(path, kind = 'page', options = {}) {
    try {
      const { response, body } = await request(path);
      const $ = load(body);
      const issues = [];
      if (response.status !== 200) issues.push(`HTTP ${response.status}，预期直接返回 200`);
      const canonicalLinks = $('link[rel="canonical"]');
      const canonical = canonicalLinks.first().attr('href');
      let normalizedCanonical;
      try {
        normalizedCanonical = canonical ? new URL(canonical).href : undefined;
      } catch {
        // 非法 canonical 由统一比较结果报告，其他页面仍继续验收。
      }
      const expected = canonicalOrigin ? new URL(path, canonicalOrigin).href : undefined;
      if (canonicalLinks.length !== 1 || !normalizedCanonical || !expected || normalizedCanonical !== expected)
        issues.push(`canonical 不自指：${canonical ?? '缺失'}，预期 ${expected ?? '站点地图规范域名不可用'}`);
      if ($('h1').length !== 1 || !$('h1').text().trim()) issues.push('必须有且只有 1 个非空 H1');
      if (!$('title').text().trim()) issues.push('缺少页面标题');
      if (
        /noindex/i.test(
          `${$('meta[name="robots"]').attr('content') ?? ''} ${response.headers.get('x-robots-tag') ?? ''}`
        )
      )
        issues.push('公开页面被禁止索引');
      if (options.excludeLore) {
        for (const id of manifest.songIds) if (body.includes(id)) issues.push(`Gallery 混入原始 Lore 歌曲：${id}`);
      }
      if (
        path === '/' &&
        !$('a')
          .toArray()
          .some((element) => $(element).attr('href') === '/internet-lore')
      )
        issues.push('首页缺少 Internet Lore 入口');
      if (path === '/internet-lore') {
        for (const slug of manifest.topics)
          if (!$(`a[href="/internet-lore/${slug}"]`).length) issues.push(`汇总页缺少专题入口：${slug}`);
      }
      record(kind, path, issues, { status: response.status, canonical, h1: $('h1').text().trim() });
      pages.set(path, { $, body });
      return $;
    } catch (error) {
      record(kind, path, [error.message]);
      return null;
    }
  }

  await mapLimit(
    ['/', '/about', '/contact', '/internet-lore', ...manifest.topics.map((slug) => `/internet-lore/${slug}`)],
    (path) => checkPage(path, 'page', { excludeLore: path === '/' })
  );

  async function resolveLegacySongPath(id) {
    let path = `/songs/${id}`;
    for (let hop = 0; hop < 4; hop++) {
      const { response, body } = await request(path);
      if (response.status === 200) {
        const $ = load(body);
        const href = $('link[rel="canonical"]').attr('href');
        assert(href, 'UUID 歌曲入口缺少 canonical');
        const canonical = new URL(href);
        assert(
          canonical.origin === canonicalOrigin && canonical.pathname === path && !canonical.search && !canonical.hash,
          'UUID 歌曲入口的最终 canonical 不自指'
        );
        assert(
          sitemapUrls.some((url) => url.href === canonical.href),
          '歌曲最终 canonical 缺少 sitemap 入口'
        );
        return path;
      }
      assert([301, 308].includes(response.status), `UUID 歌曲入口返回 HTTP ${response.status}`);
      const location = response.headers.get('location');
      assert(location, 'UUID 歌曲入口跳转缺少 Location');
      const target = new URL(location, origin);
      assert(
        [origin, canonicalOrigin].includes(target.origin) &&
          target.pathname.startsWith('/songs/') &&
          !target.search &&
          !target.hash,
        'UUID 歌曲入口跳转越界'
      );
      path = target.pathname;
    }
    throw new Error('UUID 歌曲入口永久跳转超过 3 次');
  }

  // 从公开 sitemap 找规范歌曲地址，只向传入 origin 请求，绝不跟随其他主机。
  await mapLimit(manifest.songIds, async (id) => {
    const matches = sitemapUrls.filter(
      (url) => url.pathname.startsWith('/songs/') && url.pathname.endsWith(id) && !url.search && !url.hash
    );
    if (matches.length > 1) {
      record('lore-song', id, [`原始歌曲必须恰好有 1 个 sitemap 规范地址，实际 ${matches.length} 个`]);
      return;
    }
    let path;
    try {
      // 歌曲今后分配短 slug 后，旧 UUID 地址应永久跳到新 canonical，不要求 URL 永远带 ID。
      path = matches.length === 1 ? matches[0].pathname : await resolveLegacySongPath(id);
    } catch (error) {
      record('lore-song', id, [error.message]);
      return;
    }
    await checkPage(path, 'lore-song');
    const topic = Object.entries(manifest.songsByTopic).find(([, ids]) => ids.includes(id))?.[0];
    const topicPage = pages.get(`/internet-lore/${topic}`);
    if (
      topicPage &&
      !topicPage
        .$('a')
        .toArray()
        .some((element) => {
          const href = topicPage.$(element).attr('href');
          return href && new URL(href, origin).pathname === path;
        })
    )
      record('lore-song-link', path, [`所属专题 ${topic} 缺少歌曲规范链接`]);
  });

  // 追踪公开分页，不只检查第一页；限定路径和页数，避免循环及意外访问其他接口。
  let galleryBatch = ['/songs'];
  const gallerySeen = new Set();
  while (galleryBatch.length) {
    const discovered = new Set();
    await mapLimit(galleryBatch, async (path) => {
      gallerySeen.add(path);
      const $ = await checkPage(path, 'gallery', { excludeLore: true });
      if (!$) return;
      $('nav[aria-label="Song gallery pages"] a').each((_, element) => {
        const href = $(element).attr('href');
        if (!href) return;
        const url = new URL(href, origin);
        if (
          url.origin !== origin ||
          url.pathname !== '/songs' ||
          url.hash ||
          [...url.searchParams.keys()].some((key) => key !== 'page')
        ) {
          record('gallery-pagination', path, [`分页链接越界：${href}`]);
          return;
        }
        const page = url.searchParams.get('page');
        if (page && (!/^[1-9]\d*$/.test(page) || Number(page) < 2 || Number(page) > MAX_GALLERY_PAGES)) {
          record('gallery-pagination', path, [`分页页码异常或超过 ${MAX_GALLERY_PAGES} 页限制：${href}`]);
          return;
        }
        const next = page ? `/songs?page=${Number(page)}` : '/songs';
        if (!gallerySeen.has(next)) discovered.add(next);
      });
    });
    galleryBatch = [...discovered].filter((path) => !gallerySeen.has(path));
    if (gallerySeen.size + galleryBatch.length > MAX_GALLERY_PAGES) {
      record('gallery-pagination', '/songs', [`分页总数超过 ${MAX_GALLERY_PAGES} 页，停止验收`]);
      break;
    }
  }

  await mapLimit(retiredPages, async (path) => {
    try {
      const { response, body } = await request(path);
      const issues = [];
      if (response.status !== 410) issues.push(`HTTP ${response.status}，预期 410`);
      if (!/\bnoindex\b/i.test(response.headers.get('x-robots-tag') ?? '')) issues.push('缺少 noindex 响应头');
      if (load(body)('link[rel="canonical"]').length) issues.push('弃用页面不应声明 canonical');
      record('retired-page', path, issues, { status: response.status });
    } catch (error) {
      record('retired-page', path, [error.message]);
    }
  });
  // 不发送 POST：若旧生成接口意外恢复，验收也不能实际生成内容。
  await mapLimit(
    retiredApis.flatMap((path) => ['GET', 'OPTIONS'].map((method) => ({ path, method }))),
    async ({ path, method }) => {
      try {
        const { response, body } = await request(path, method);
        const issues = [];
        if (response.status !== 410) issues.push(`HTTP ${response.status}，预期 410`);
        if (!/\bnoindex\b/i.test(response.headers.get('x-robots-tag') ?? '')) issues.push('缺少 noindex 响应头');
        try {
          if (JSON.parse(body).error !== 'This endpoint has been retired.') issues.push('弃用 API 响应内容不符');
        } catch {
          issues.push('弃用 API 未返回有效 JSON');
        }
        record('retired-api', path, issues, { method, status: response.status });
      } catch (error) {
        record('retired-api', path, [error.message], { method });
      }
    }
  );
  try {
    const { response } = await request('/pricing');
    const location = response.headers.get('location');
    const issues = [];
    if (![307, 308].includes(response.status) || !location || new URL(location, origin).pathname !== '/auth/login')
      issues.push('匿名定价页必须通过 307/308 跳转至 /auth/login');
    record('protected-pricing', '/pricing', issues, { status: response.status });
  } catch (error) {
    record('protected-pricing', '/pricing', [error.message]);
  }
  results.sort((a, b) =>
    `${a.kind}:${a.path}:${a.method ?? ''}`.localeCompare(`${b.kind}:${b.path}:${b.method ?? ''}`)
  );
  return { results, galleryPages: gallerySeen.size };
}

const [originArgument, output, ...extraArguments] = process.argv.slice(2);
const sourceOnly = originArgument === '--source-only';
assert(
  originArgument && (sourceOnly || output) && !extraArguments.length,
  '用法：node scripts/verify-public-release.mjs <origin> <报告.json> 或 --source-only [报告.json]'
);
const origin = sourceOnly ? undefined : parseOrigin(originArgument);
const startedAt = new Date().toISOString();
let report;
try {
  const manifest = await readReleaseManifest();
  if (sourceOnly) {
    // 构建前只校验源码交付物，禁止联网和连接数据库；缺路由时直接阻止发布。
    const routeFiles = [
      'src/app/[locale]/(marketing)/internet-lore/page.tsx',
      'src/app/[locale]/(marketing)/internet-lore/[slug]/page.tsx',
    ];
    await Promise.all(
      routeFiles.map(async (path) => {
        const content = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
        assert(content.trim(), `已发布路由源码为空：${path}`);
      })
    );
    report = {
      passed: true,
      mode: 'source-only',
      startedAt,
      checkedAt: new Date().toISOString(),
      total: manifest.topics.length + manifest.songIds.length + routeFiles.length,
      manifest,
      routeFiles,
      failures: [],
      results: [],
    };
  } else {
    const { results, galleryPages } = await verifyRelease(origin, manifest);
    const failures = results.filter((result) => result.issues.length);
    report = {
      passed: failures.length === 0,
      mode: 'http',
      origin,
      startedAt,
      checkedAt: new Date().toISOString(),
      total: results.length,
      galleryPages,
      manifest,
      failures,
      results,
    };
  }
} catch (error) {
  report = {
    passed: false,
    mode: sourceOnly ? 'source-only' : 'http',
    origin,
    startedAt,
    checkedAt: new Date().toISOString(),
    total: 0,
    failures: [{ kind: 'configuration', issues: [error.message] }],
    results: [],
  };
}
if (output) await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify(
    {
      passed: report.passed,
      mode: report.mode,
      total: report.total,
      galleryPages: report.galleryPages,
      failures: report.failures,
      report: output,
    },
    null,
    2
  )
);
if (!report.passed) process.exitCode = 1;
