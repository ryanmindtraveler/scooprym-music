// 导入类型定义和AI图像生成相关库
import type { GenerateImageRequest } from '@/ai/image/lib/api-types';
import type { ProviderKey } from '@/ai/image/lib/provider-config';
import { createFal } from '@ai-sdk/fal';
import { fireworks } from '@ai-sdk/fireworks';
import { openai } from '@ai-sdk/openai';
import { replicate } from '@ai-sdk/replicate';
import { type ImageModel, experimental_generateImage as generateImage } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * 请求超时时间（毫秒）
 * 设置为略低于运行时的最大执行时间，以便优雅地终止请求
 */
const TIMEOUT_MILLIS = 55 * 1000;

// 默认图像尺寸和宽高比常量
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_ASPECT_RATIO = '1:1';

// 初始化Fal AI客户端
const fal = createFal({
  apiKey: process.env.FAL_API_KEY,
});

/**
 * 提供商配置接口
 * - createImageModel: 创建图像模型的工厂函数
 * - dimensionFormat: 尺寸格式（size表示具体尺寸，aspectRatio表示宽高比）
 */
interface ProviderConfig {
  createImageModel: (modelId: string) => ImageModel;
  dimensionFormat: 'size' | 'aspectRatio';
}

/**
 * AI提供商配置映射
 * 定义了每个提供商的具体参数和行为
 */
const providerConfig: Record<ProviderKey, ProviderConfig> = {
  openai: {
    createImageModel: openai.image, // 使用OpenAI的图像模型
    dimensionFormat: 'size', // OpenAI使用具体尺寸（如1024x1024）
  },
  fireworks: {
    createImageModel: fireworks.image, // 使用Fireworks的图像模型
    dimensionFormat: 'aspectRatio', // Fireworks使用宽高比
  },
  replicate: {
    createImageModel: replicate.image, // 使用Replicate的图像模型
    dimensionFormat: 'size',
  },
  fal: {
    createImageModel: fal.image, // 使用Fal的图像模型
    dimensionFormat: 'size',
  },
};

/**
 * 超时包装函数
 * 确保Promise在指定时间内完成，否则抛出超时错误
 * @param promise - 要包装的Promise
 * @param timeoutMillis - 超时时间（毫秒）
 * @returns 带超时控制的Promise
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMillis: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Image generation timed out')), timeoutMillis)),
  ]);
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider, size, aspectRatio } = (await req.json()) as GenerateImageRequest;

    // 获取对应提供商的配置，默认为 openai
    const config = providerConfig[provider || 'openai'];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // 根据配置决定使用 size 还是 aspectRatio
    // 如果是 size 格式，使用请求传入的 size 或默认值
    // 如果是 aspectRatio 格式，使用请求传入的 input.aspectRatio (假设映射逻辑) 或默认
    // 这里简化逻辑：如果是 aspectRatio 格式，传递 aspectRatio 参数；否则传递 size 参数

    // 注意：ai sdk 的 generateImage 接受 options
    // 我们需要根据不同模型的要求构造 options

    const options: any = {
      model: config.createImageModel(provider === 'openai' ? 'dall-e-3' : 'flux-schnell'), // 示例模型ID，实际应动态获取
      prompt,
    };

    if (config.dimensionFormat === 'size') {
      options.size = size || DEFAULT_IMAGE_SIZE;
    } else {
      options.aspectRatio = aspectRatio || DEFAULT_ASPECT_RATIO;
    }

    const { image } = await withTimeout(generateImage(options), TIMEOUT_MILLIS);

    return NextResponse.json({
      success: true,
      image: image.base64, // 或 url，取决于返回结构
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
