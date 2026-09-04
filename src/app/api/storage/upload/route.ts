import { MAX_FILE_SIZE } from '@/lib/constants';
import { getRateLimiter } from '@/lib/ratelimit';
import { getSession } from '@/lib/server';
import { uploadFile } from '@/storage';
import { StorageError } from '@/storage/types';
import { type NextRequest, NextResponse } from 'next/server';

const IMAGE_SIGNATURES = [
  {
    mime: 'image/jpeg',
    extension: 'jpg',
    matches: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    mime: 'image/png',
    extension: 'png',
    matches: (buffer: Buffer) =>
      buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    extension: 'webp',
    matches: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rateLimit = await getRateLimiter().limit(`storage-upload:${session.user.id}`);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many upload requests' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > MAX_FILE_SIZE) {
      // console.log('uploadFile, file size exceeds the server limit', file.size);
      return NextResponse.json({ error: 'File size exceeds the server limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = IMAGE_SIGNATURES.find((signature) => signature.matches(buffer));
    if (!detectedType || detectedType.mime !== file.type) {
      return NextResponse.json({ error: 'File content does not match a supported image type' }, { status: 400 });
    }

    // 存储目录与扩展名完全由服务端决定，避免客户端构造任意对象路径。
    const result = await uploadFile(
      buffer,
      `upload.${detectedType.extension}`,
      detectedType.mime,
      `admin-uploads/${session.user.id}`
    );

    // console.log('uploadFile, result', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading file:', error);

    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Something went wrong while uploading the file' }, { status: 500 });
  }
}

// Increase the body size limit for file uploads (default is 4MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  // For Next.js 13+ App Router, use maxDuration instead
  maxDuration: 30, // 30 seconds timeout
};
