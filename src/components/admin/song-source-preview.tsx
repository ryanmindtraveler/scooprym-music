import type { SongItem } from '@/app/[locale]/(protected)/dashboard/mysongs/types';
import { getSourceUrl } from '@/lib/urls/source-url';
import { AlertCircle, ExternalLink, Globe } from 'lucide-react';

/**
 * 歌曲来源属性定义（对应 SongItem 中的来源字段）
 */
interface SongSourcePreviewProps {
  item: Pick<SongItem, 'newsSummary' | 'sourceText' | 'sourceUrl'>;
}

/**
 * 从 URL 中提取可读的主机名/域名，去除 www 前缀
 */
function extractHostname(href?: string): string | null {
  if (!href) {
    return null;
  }

  try {
    const parsed = new URL(href);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

/**
 * 紧凑型歌曲原始新闻与材料预览组件
 * 供管理员在歌曲列表中快速辨识源新闻，并打开原始报道。
 */
export function SongSourcePreview({ item }: SongSourcePreviewProps) {
  const safeHref = getSourceUrl(item.sourceUrl);
  const domain = extractHostname(safeHref);

  const summary = item.newsSummary?.trim() || null;
  const sourceText = item.sourceText?.trim() || null;
  const sourceHeadline = sourceText?.match(/(?:^|\n)Title:\s*([^\r\n]+)/i)?.[1]?.trim() || null;

  const hasAnySource = Boolean(safeHref || summary || sourceHeadline);

  // 全部字段缺失时的空状态
  if (!hasAnySource) {
    return (
      <div className="flex items-center gap-1.5 py-0.5 text-xs text-slate-400 dark:text-slate-500">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span>No source story attached</span>
      </div>
    );
  }

  return (
    <div className="min-w-0 text-xs text-slate-700 dark:text-slate-200">
      {/* 头部：来源标签、来源域名与原始报道外链 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1">
        <div className="flex items-center gap-1.5 min-w-0 text-slate-500 dark:text-slate-400">
          <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="font-medium text-slate-600 dark:text-slate-300 shrink-0">Source story</span>

          {domain ? (
            <span
              className="truncate text-slate-400 dark:text-slate-500 text-[11px] max-w-[160px] sm:max-w-[220px]"
              title={domain}
            >
              ({domain})
            </span>
          ) : null}
        </div>

        <div className="shrink-0">
          {safeHref ? (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded px-1 py-0.5 transition-colors"
              title={`Open original article on ${domain || 'source website'}`}
              aria-label={`Open original article on ${domain || 'source website'}`}
            >
              <span>Open original</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-[11px] select-none">No original link</span>
          )}
        </div>
      </div>

      {/* 原始报道标题与编辑摘要分开呈现，避免把摘要误称为原文。 */}
      {sourceHeadline && (
        <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {sourceHeadline}
        </p>
      )}
      {summary ? (
        <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed break-words font-normal">
          <span className="font-medium">Summary: </span>
          {summary}
        </p>
      ) : null}
    </div>
  );
}
