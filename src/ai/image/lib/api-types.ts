import type { ProviderKey } from './provider-config';

export interface GenerateImageRequest {
  prompt: string;
  provider: ProviderKey;
  modelId: string;
  size?: string;
  aspectRatio?: string;
}

export interface GenerateImageResponse {
  image?: string;
  error?: string;
  provider?: ProviderKey;
  modelId?: string;
  fallbackApplied?: boolean;
}
