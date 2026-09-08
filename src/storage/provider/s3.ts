import { randomUUID } from 'crypto';
import { s3mini } from 's3mini';
import { storageConfig } from '../config/storage-config';
import {
  ConfigurationError,
  type StorageConfig,
  StorageError,
  type StorageProvider,
  UploadError,
  type UploadFileParams,
  type UploadFileResult,
} from '../types';

/**
 * Amazon S3 storage provider implementation using s3mini
 *
 * docs:
 * https://mksaas.com/docs/storage
 *
 * This provider works with Amazon S3 and compatible services like Cloudflare R2
 * using s3mini for better Cloudflare Workers compatibility
 * https://github.com/good-lly/s3mini
 * https://developers.cloudflare.com/r2/
 */
export class S3Provider implements StorageProvider {
  private config: StorageConfig;
  private s3Client: s3mini | null = null;

  constructor(config: StorageConfig = storageConfig) {
    this.config = config;
  }

  /**
   * Get the provider name
   */
  public getProviderName(): string {
    return 'S3';
  }

  /**
   * Get the S3 client instance
   */
  private getS3Client(requestTimeoutMs?: number): s3mini {
    if (this.s3Client && !requestTimeoutMs) {
      return this.s3Client;
    }

    const { region, endpoint, accessKeyId, secretAccessKey, bucketName } = this.config;

    if (!region) {
      throw new ConfigurationError('Storage region is not configured');
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new ConfigurationError('Storage credentials are not configured');
    }

    if (!endpoint) {
      throw new ConfigurationError('Storage endpoint is required for s3mini');
    }

    if (!bucketName) {
      throw new ConfigurationError('Storage bucket name is not configured');
    }

    // s3mini client configuration
    // The bucket name needs to be included in the endpoint URL for s3mini
    const endpointWithBucket = `${endpoint.replace(/\/$/, '')}/${bucketName}`;

    const client = new s3mini({
      accessKeyId,
      secretAccessKey,
      endpoint: endpointWithBucket,
      region,
      requestAbortTimeout: requestTimeoutMs ?? 120_000,
    });

    if (!requestTimeoutMs) this.s3Client = client;
    return client;
  }

  /**
   * Generate a unique filename with the original extension
   */
  private generateUniqueFilename(originalFilename: string): string {
    const extension = originalFilename.split('.').pop() || '';
    const uuid = randomUUID();
    return `${uuid}${extension ? `.${extension}` : ''}`;
  }

  /**
   * Upload a file to S3
   */
  public async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    try {
      const { file, filename, contentType, folder } = params;
      const s3 = this.getS3Client(params.requestTimeoutMs);
      const { bucketName } = this.config;

      const uniqueFilename = this.generateUniqueFilename(filename);
      const key = params.objectKey || (folder ? `${folder}/${uniqueFilename}` : uniqueFilename);

      // Convert Blob to Buffer if needed
      let fileContent: Buffer | string;
      if (file instanceof Blob) {
        fileContent = Buffer.from(await file.arrayBuffer());
      } else {
        fileContent = file;
      }

      // Upload the file using s3mini
      // 一次上传的所有重试使用相同 key 与文件内容，避免断连后产生多份对象或重复生成封面。
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await s3.putObject(key, fileContent, contentType);
          if (!response.ok) {
            throw Object.assign(new UploadError(`Storage upload returned HTTP ${response.status}`), {
              statusCode: response.status,
            });
          }
          break;
        } catch (error) {
          const candidate = error as { statusCode?: number; status?: number };
          const status = candidate.statusCode ?? candidate.status;
          const message = error instanceof Error ? error.message : '';
          const retryable = status
            ? status === 408 || status === 429 || status >= 500
            : /fetch failed|other side closed|socket|timeout|timed out|abort|econnreset|network/i.test(message);
          if (!retryable || attempt === 3) throw error;
          console.warn(`[storage] Upload interrupted; retrying the same object (${attempt}/3).`);
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }

      // Generate the URL
      const { publicUrl } = this.config;
      let url: string;

      if (publicUrl) {
        // Use custom domain if provided
        url = `${publicUrl.replace(/\/$/, '')}/${key}`;
        // console.log('uploadFile, public url', url);
      } else {
        // For s3mini, we construct the URL manually
        // Since bucket is included in endpoint, we just append the key
        const baseUrl = this.config.endpoint?.replace(/\/$/, '') || '';
        url = `${baseUrl}/${bucketName}/${key}`;
        // console.log('uploadFile, constructed url', url);
      }

      return { url, key };
    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('uploadFile, configuration error', error);
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error occurred during file upload';
      const cause = error as { cause?: { code?: unknown }; code?: unknown };
      const code = cause.cause?.code ?? cause.code;
      const diagnostic = typeof code === 'string' && /^[A-Z0-9_]+$/.test(code) ? ` (${code})` : '';
      console.error('uploadFile, error', message + diagnostic);
      throw new UploadError(message + diagnostic);
    }
  }

  /**
   * Delete a file from S3
   */
  public async deleteFile(key: string): Promise<void> {
    try {
      const s3 = this.getS3Client();

      const wasDeleted = await s3.deleteObject(key);

      if (!wasDeleted) {
        console.warn(`File with key ${key} was not found or could not be deleted`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred during file deletion';
      console.error('deleteFile, error', message);
      throw new StorageError(message);
    }
  }
}
