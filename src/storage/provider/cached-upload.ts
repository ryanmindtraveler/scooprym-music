import { AwsClient } from 'aws4fetch';
import type { StorageConfig } from '../types';

/** 为不可变对象签入缓存元数据，沿用现有 S3/R2 凭据与调用方重试策略。 */
export function uploadCachedObject(
  config: StorageConfig,
  key: string,
  body: Buffer | string,
  contentType: string,
  cacheControl: string,
  timeoutMs = 120_000
) {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    service: 's3',
    retries: 0,
  });
  return client.fetch(
    `${config.endpoint?.replace(/\/$/, '')}/${config.bucketName}/${key.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'Cache-Control': cacheControl },
      body: typeof body === 'string' ? body : Uint8Array.from(body).buffer,
      signal: AbortSignal.timeout(timeoutMs),
    }
  );
}
