import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { handleGenerateMusicWorker } from './handler';

export const maxDuration = 300;

export const POST = verifySignatureAppRouter(handleGenerateMusicWorker);
