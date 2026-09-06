import {
  IMAGE_FALLBACK_MODEL,
  MINIMAX_MUSIC_MODEL,
  NANO_BANANA_IMAGE_MODEL,
  OPENROUTER_TEXT_FALLBACK_MODELS,
  OPENROUTER_TEXT_MODEL,
  QWEN_IMAGE_PRO_MODEL,
  SEEDREAM_IMAGE_PRO_MODEL,
} from '@/ai/config/models';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Boxes,
  CheckCircle2,
  Clock3,
  Cpu,
  Radio,
  Route,
  Server,
  Sparkles,
  TriangleAlert,
  Zap,
} from 'lucide-react';

type ModelMetric = {
  provider: string;
  model: string;
  total: number;
  completed: number;
  failed: number;
  averageDurationMs: number;
  lastSeenAt: string | null;
};

type QueueMetric = { queued: number; processing: number; failed: number; stale: number };

type InfrastructureOverview = {
  models: ModelMetric[];
  qstash: {
    configured: boolean;
    reachable: boolean;
    delivered: number;
    retrying: number;
    failed: number;
    lastDeliveryAt: string | null;
  };
  queues: { music: QueueMetric; radar: QueueMetric };
  costTrackingAvailable: boolean;
};

function successRate(metric?: ModelMetric) {
  if (!metric || metric.total === 0) return '—';
  return `${Math.round((metric.completed / metric.total) * 100)}%`;
}

function duration(metric?: ModelMetric) {
  if (!metric?.averageDurationMs) return '—';
  return metric.averageDurationMs >= 60_000
    ? `${(metric.averageDurationMs / 60_000).toFixed(1)}m`
    : `${(metric.averageDurationMs / 1_000).toFixed(1)}s`;
}

function findMetric(rows: ModelMetric[], model: string) {
  return rows.find((row) => row.model === model);
}

function qstashTime(value: string | null) {
  if (!value) return '暂无成功记录';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function StatusBadge({ metric }: { metric?: ModelMetric }) {
  if (!metric || metric.total === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        <span className="size-1.5 rounded-full bg-slate-400" />
        待调用
      </span>
    );
  }
  if (metric.failed > 0 && metric.completed === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
        <span className="size-1.5 rounded-full bg-destructive animate-ping" />
        异常中断
      </span>
    );
  }
  if (metric.failed > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-500" />
        调用波动
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      正常就绪
    </span>
  );
}

function QueueCard({
  name,
  data,
  icon: Icon,
}: { name: string; data: QueueMetric; icon: React.ComponentType<{ className?: string }> }) {
  const isHealthy = data.failed === 0 && data.stale === 0;
  return (
    <div className="rounded-xl border bg-card/80 p-3.5 shadow-2xs backdrop-blur-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-3.5" />
          </span>
          <p className="text-xs font-bold text-foreground">{name}</p>
        </div>
        <Badge
          variant="outline"
          className={
            isHealthy
              ? 'border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-[10px] font-bold text-destructive'
          }
        >
          {isHealthy ? '队列畅通' : '积压异常'}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
        {[
          { label: '等待', value: data.queued, highlight: false },
          { label: '执行中', value: data.processing, highlight: data.processing > 0 },
          { label: '失败', value: data.failed, highlight: data.failed > 0, isDanger: true },
          { label: '超时', value: data.stale, highlight: data.stale > 0, isWarning: true },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-muted/40 p-1.5">
            <p
              className={`text-sm font-black tabular-nums ${
                item.isDanger && item.value > 0
                  ? 'text-destructive'
                  : item.isWarning && item.value > 0
                    ? 'text-amber-600'
                    : item.highlight
                      ? 'text-pink-600'
                      : 'text-foreground'
              }`}
            >
              {item.value}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InfrastructureHealth({ data }: { data: InfrastructureOverview }) {
  const configuredModels = [
    { use: '歌词/新闻分析', route: '主通道', provider: 'OpenRouter', id: OPENROUTER_TEXT_MODEL },
    ...OPENROUTER_TEXT_FALLBACK_MODELS.map((id, index) => ({
      use: '歌词/新闻分析',
      route: `备用 ${index + 1}`,
      provider: 'OpenRouter',
      id,
    })),
    { use: '歌曲专辑封面', route: '主通道', provider: 'OpenRouter', id: QWEN_IMAGE_PRO_MODEL },
    { use: '歌曲专辑封面', route: '备用 1', provider: 'OpenRouter', id: NANO_BANANA_IMAGE_MODEL },
    { use: '歌曲专辑封面', route: '备用 2', provider: 'OpenRouter', id: SEEDREAM_IMAGE_PRO_MODEL },
    { use: '歌曲专辑封面', route: '最终备用', provider: 'OpenRouter', id: IMAGE_FALLBACK_MODEL },
    { use: 'AI 音乐生成', route: '官方直连', provider: 'MiniMax', id: MINIMAX_MUSIC_MODEL },
  ];
  const configuredIds = new Set(configuredModels.map((model) => model.id));
  const modelRows = [
    ...configuredModels,
    ...data.models
      .filter((metric) => !configuredIds.has(metric.model))
      .map((metric) => ({
        use: '未归类服务',
        route: '扩展路由',
        provider: metric.provider,
        id: metric.model,
      })),
  ];

  return (
    <div className="space-y-4">
      {/* 队列与调度总览 */}
      <section className="overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-2xs">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Boxes className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold leading-none text-foreground">QStash 调度与任务队列</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">任务调度投递状态与数据库作业实时对照</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              !data.qstash.configured || !data.qstash.reachable
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            }
          >
            {!data.qstash.configured ? '未启用 QStash' : data.qstash.reachable ? 'QStash 连通' : '调度不可达'}
          </Badge>
        </header>

        <div className="grid gap-3.5 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <QueueCard name="热点雷达与选材" data={data.queues.radar} icon={Sparkles} />
          <QueueCard name="AI 音乐合成任务" data={data.queues.music} icon={Zap} />

          {/* QStash 投递统计 */}
          <div className="rounded-xl border bg-card/80 p-3.5 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Server className="size-3.5" />
                </span>
                <p className="text-xs font-bold text-foreground">24h 调度投递</p>
              </div>
              <Clock3 className="size-3.5 text-muted-foreground" />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg bg-muted/40 p-1.5">
                <p className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {data.qstash.delivered}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">已送达</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-1.5">
                <p className="text-sm font-black tabular-nums text-amber-600 dark:text-amber-400">
                  {data.qstash.retrying}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">重试中</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-1.5">
                <p className="text-sm font-black tabular-nums text-destructive">{data.qstash.failed}</p>
                <p className="text-[10px] font-medium text-muted-foreground">已失败</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground truncate">
              最近成功: {qstashTime(data.qstash.lastDeliveryAt)}
            </p>
          </div>
        </div>
      </section>

      {/* AI 模型网关与路由健康矩阵 */}
      <section className="overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-2xs">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Cpu className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold leading-none text-foreground">AI 模型网关运行矩阵</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">基于最近 24 小时真实创作工作流状态</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-bold">
              <Route className="mr-1 size-3" /> OpenRouter 网关
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-bold">
              <Radio className="mr-1 size-3" /> MiniMax 直连
            </Badge>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-xs">
            <thead className="border-b bg-muted/20 text-left font-bold text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">用途 / 路由通道</th>
                <th className="px-3 py-2.5">模型标识</th>
                <th className="px-3 py-2.5">运行状态</th>
                <th className="px-3 py-2.5">成功率</th>
                <th className="px-3 py-2.5">平均延时</th>
                <th className="px-4 py-2.5 text-right">24h 调用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {modelRows.map((model) => {
                const metric = findMetric(data.models, model.id);
                return (
                  <tr key={model.id} className="transition-colors hover:bg-muted/15">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-foreground">{model.use}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {model.provider} ·{' '}
                        <span className="font-semibold text-pink-600 dark:text-pink-400">{model.route}</span>
                      </p>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{model.id}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge metric={metric} />
                    </td>
                    <td className="px-3 py-2.5 font-bold tabular-nums text-foreground">{successRate(metric)}</td>
                    <td className="px-3 py-2.5 font-medium tabular-nums text-muted-foreground">{duration(metric)}</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-foreground">
                      {metric?.total || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
