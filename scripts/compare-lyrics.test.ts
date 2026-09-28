import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';
// @vitest-environment node
// 显式启用才调用真实文本模型；只读取本地审查快照，不写数据库、不生成音频。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvConfig } from '@next/env';
import { expect, it, vi } from 'vitest';
import { LYRIC_EDITOR_CHECKLIST } from '../src/ai/text/lib/lyrics-craft-prompts';
import { LOCAL_REPAIR_EDITOR } from './lyrics-editor-experiment';

// 每个样本独立绑定固定诊断，避免并发对照把另一首的意见传进来。
type EditorExperiment = {
  critique: unknown;
  critiqueText: string;
  variant: 'control' | 'local';
  requests: string[];
  editorContexts: string[];
};
const experimentContext = new AsyncLocalStorage<EditorExperiment>();
const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

vi.mock('ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai')>();
  return {
    ...original,
    generateObject: async (options: Parameters<typeof original.generateObject>[0]) => {
      let request = options;
      const experiment = experimentContext.getStore();
      if (experiment) {
        if (!String(options.prompt).startsWith('Finalize ONE complete song.')) {
          throw new Error('固定编辑实验不允许重新策划或生成初稿');
        }
        experiment.requests.push(fingerprint(options.prompt));
        if (experiment.variant === 'local') {
          if (!options.system?.includes(LYRIC_EDITOR_CHECKLIST)) throw new Error('未找到基线编辑提示词');
          request = { ...options, system: options.system.replace(LYRIC_EDITOR_CHECKLIST, LOCAL_REPAIR_EDITOR) };
        }
        experiment.editorContexts.push(
          fingerprint({
            system: request.system,
            prompt: String(request.prompt).replace(experiment.critiqueText, '<REPLAYED_DIAGNOSIS>'),
            temperature: request.temperature,
            maxOutputTokens: request.maxOutputTokens,
            providerOptions: request.providerOptions,
          })
        );
      }
      const result = await original.generateObject(request);
      const label = process.env.LYRICS_COMPARE_LABEL;
      if (label && /^[a-z0-9-]+$/.test(label)) {
        const root = process.env.LYRICS_COMPARE_DIR || 'F:/CodexHome/audits/lyrics-2026-09-28';
        const output = join(root, label, 'raw');
        mkdirSync(output, { recursive: true });
        writeFileSync(
          join(output, `${crypto.randomUUID()}.json`),
          JSON.stringify({ object: result.object, usage: result.usage, model: result.response.modelId }, null, 2),
          'utf8'
        );
      }
      return result;
    },
  };
});

vi.mock('../src/ai/text/lib/provider-fallback', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    // 对照实验固定主模型，禁止降级混淆结果。
    runWithTextProviderFallback: async ({
      execute,
      attemptTimeoutMs,
      scope,
    }: {
      execute: (provider: string, model: string, signal: AbortSignal) => Promise<unknown>;
      attemptTimeoutMs?: number;
      scope?: string;
    }) => {
      const experiment = experimentContext.getStore();
      if (experiment && scope === 'lyrics-critique') return { object: experiment.critique };
      const { OPENROUTER_TEXT_MODEL } = await import('../src/ai/config/models');
      return execute('openrouter', OPENROUTER_TEXT_MODEL, AbortSignal.timeout(attemptTimeoutMs || 90_000));
    },
  };
});

it.skipIf(!process.env.LYRICS_COMPARE_LABEL)(
  '同新闻、固定模型的真实歌词对照（可选重新策划）',
  async () => {
    loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
    const { generateLyrics } = await import('../src/ai/text/lib/generation');
    const { OPENROUTER_TEXT_MODEL } = await import('../src/ai/config/models');
    const root = process.env.LYRICS_COMPARE_DIR || 'F:/CodexHome/audits/lyrics-2026-09-28';
    const label = process.env.LYRICS_COMPARE_LABEL!;
    if (!/^[a-z0-9-]+$/.test(label)) throw new Error('对照标签只能使用小写字母、数字和连字符');
    const context = JSON.parse(readFileSync(join(root, 'context.json'), 'utf8'));
    const allSongs = JSON.parse(readFileSync(join(root, 'songs.json'), 'utf8'));
    const songs = process.env.LYRICS_COMPARE_IDS
      ? allSongs.filter((song: { id: string }) => process.env.LYRICS_COMPARE_IDS!.split(',').includes(song.id))
      : allSongs;
    const output = join(root, label);
    mkdirSync(output, { recursive: true });
    console.info('对照管线已载入', { label, model: OPENROUTER_TEXT_MODEL, count: songs.length });
    let index = 0;
    const failures: string[] = [];
    await Promise.all(
      Array.from({ length: 2 }, async () => {
        while (index < songs.length) {
          const song = songs[index++];
          const run = context.runs.find((item: any) => item.song_id === song.id);
          const steps = context.steps.filter((item: any) => item.run_id === run.id);
          const plan = steps.find((item: any) => item.stage === 'planning_lyrics')?.output_metadata;
          const analysis = steps.find((item: any) => item.stage === 'analyzing_source')?.output_metadata;
          const checkpoints: Record<string, unknown> = {};
          try {
            if (!plan || !analysis?.source) throw new Error('缺少历史策划或来源快照');
            const resumeLabel = process.env.LYRICS_COMPARE_RESUME_LABEL;
            if (resumeLabel && !/^[a-z0-9-]+$/.test(resumeLabel)) throw new Error('恢复标签格式无效');
            if (resumeLabel && process.env.LYRICS_COMPARE_REPLAN === '1')
              throw new Error('重新策划和恢复检查点不能同时启用');
            const savedRun = resumeLabel
              ? JSON.parse(readFileSync(join(root, resumeLabel, `${song.id}.json`), 'utf8'))
              : undefined;
            const savedCheckpoints = savedRun?.checkpoints;
            const savedDraft = savedCheckpoints?.drafting_lyrics;
            const requestedVariant = process.env.LYRICS_EDITOR_VARIANT;
            const variant =
              requestedVariant === 'control' ? 'control' : requestedVariant === 'local' ? 'local' : undefined;
            if (requestedVariant && !variant) throw new Error('未知编辑实验版本');
            const critiqueLabel = process.env.LYRICS_CRITIQUE_LABEL;
            if (critiqueLabel && (!variant || !/^[a-z0-9-]+$/.test(critiqueLabel))) {
              throw new Error('诊断重放标签无效或未指定固定编辑实验');
            }
            const critiqueRun = critiqueLabel
              ? JSON.parse(readFileSync(join(root, critiqueLabel, `${song.id}.json`), 'utf8'))
              : savedRun;
            if (
              critiqueLabel &&
              (!savedRun?.result?.workshop?.drafts?.[0]?.lyrics ||
                savedRun.result.workshop.drafts[0].lyrics !== critiqueRun?.result?.workshop?.drafts?.[0]?.lyrics)
            ) {
              throw new Error('诊断对应的初稿不一致');
            }
            const fixedCritique = critiqueRun?.checkpoints?.editing_lyrics?.critique;
            if (
              variant &&
              (!savedDraft || !fixedCritique || critiqueRun.checkpoints.editing_lyrics.critiqueUnavailable)
            ) {
              throw new Error('固定编辑实验需要已保存的初稿和可用诊断');
            }
            const experiment: EditorExperiment | undefined = variant
              ? {
                  critique: fixedCritique,
                  critiqueText: JSON.stringify(fixedCritique.issues),
                  variant,
                  requests: [],
                  editorContexts: [],
                }
              : undefined;
            const generate = () =>
              generateLyrics({
                provider: 'openrouter',
                preparedSource: analysis.source,
                sourceMode: 'link',
                directionPrompt: run.direction_prompt,
                resumeCheckpoints:
                  process.env.LYRICS_COMPARE_REPLAN === '1'
                    ? undefined
                    : {
                        planning_lyrics: savedCheckpoints?.planning_lyrics || plan,
                        ...(savedDraft ? { drafting_lyrics: savedDraft } : {}),
                      },
                onCheckpoint: async (stage, metadata) => {
                  checkpoints[stage] = metadata;
                },
              });
            const result = experiment ? await experimentContext.run(experiment, generate) : await generate();
            if (experiment) expect(experiment.requests).toHaveLength(1);
            writeFileSync(
              join(output, `${song.id}.json`),
              JSON.stringify(
                {
                  originalTitle: song.title,
                  model: OPENROUTER_TEXT_MODEL,
                  label,
                  resumedFrom: resumeLabel,
                  replanned: process.env.LYRICS_COMPARE_REPLAN === '1',
                  experiment: experiment
                    ? {
                        variant,
                        critiqueLabel: critiqueLabel || resumeLabel,
                        draftHash: fingerprint(savedDraft),
                        critiqueHash: fingerprint(fixedCritique),
                        editInputHashes: experiment.requests,
                        nonCritiqueInputHashes: experiment.editorContexts,
                      }
                    : undefined,
                  result: { title: result.title, lyrics: result.lyrics, workshop: result.workshop },
                  checkpoints,
                },
                null,
                2
              ),
              'utf8'
            );
            console.info('对照完成', song.title, result.workshop.qualityGate.passed);
          } catch (error) {
            failures.push(song.title);
            // 不记录供应商错误正文，避免泄漏请求、来源或凭据。
            writeFileSync(
              join(output, `${song.id}.json`),
              JSON.stringify(
                {
                  originalTitle: song.title,
                  model: OPENROUTER_TEXT_MODEL,
                  label,
                  error: error instanceof Error ? error.name : 'UnknownError',
                  // 只保存错误分类关键词，不输出可能含请求内容或凭据的完整消息。
                  diagnosticCategories:
                    error instanceof Error
                      ? error.message.match(
                          /fetch|network|timeout|JSON|response|socket|quota|credit|rate.limit|ECONNRESET|terminated|parse|schema|aborted|Unexpected/gi
                        )
                      : undefined,
                  causeName: error instanceof Error && error.cause instanceof Error ? error.cause.name : undefined,
                  finishReason:
                    error && typeof error === 'object' && 'finishReason' in error ? error.finishReason : undefined,
                  statusCode:
                    error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined,
                  validation: error && typeof error === 'object' && 'issues' in error ? error.issues : undefined,
                  checkpoints,
                },
                null,
                2
              ),
              'utf8'
            );
            console.info('对照失败', song.title);
          }
        }
      })
    );
    expect(failures).toEqual([]);
  },
  1_200_000
);
