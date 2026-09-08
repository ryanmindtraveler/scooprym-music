import { getWorkerUrl, qstash } from '@/lib/infrastructure/queue';

/** 仅在恢复点落库后投递下一阶段；投递失败由当前消息重试安全接续。 */
export async function enqueueMusicContinuation(songId: string, attemptId: string, stage: string) {
  return qstash.publishJSON({
    url: getWorkerUrl('/api/worker/generate-music'),
    body: { songId, attemptId },
    deduplicationId: `scooprym-music-${attemptId}-${stage}`,
    flowControl: { key: 'scooprym-music-production', parallelism: 2 },
    retries: 3,
  });
}
