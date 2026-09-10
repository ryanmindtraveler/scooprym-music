import { Receiver } from '@upstash/qstash';

/** 高频调度复用现有 QStash 签名，校验正文与目标地址，禁止跨接口重放。 */
export function withScheduledRequest(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const signature = request.headers.get('upstash-signature');
    if (!signature) return Response.json({ error: 'Unauthorized' }, { status: 403 });
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (!currentSigningKey || !nextSigningKey) {
      return Response.json({ error: 'Schedule verification is not configured' }, { status: 503 });
    }
    try {
      const receiver = new Receiver({ currentSigningKey, nextSigningKey });
      await receiver.verify({ signature, body: await request.clone().text(), url: request.url });
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    return handler(request);
  };
}
