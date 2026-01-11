/**
 * @file stream-cache.ts
 * @description In-memory buffer for active audio streams.
 * Supports multiple simultaneous listeners by replaying cached chunks.
 */

type StreamListener = (chunk: Uint8Array | null) => void;

type StreamEntry = {
  dataParts: Uint8Array[];
  listeners: Set<StreamListener>;
  isFinished: boolean;
};

const streamCache = new Map<string, StreamEntry>();

export function createStreamEntry(id: string) {
  const entry: StreamEntry = {
    dataParts: [],
    listeners: new Set(),
    isFinished: false,
  };

  streamCache.set(id, entry);

  // Auto-cleanup after 10 minutes
  setTimeout(
    () => {
      streamCache.delete(id);
    },
    10 * 60 * 1000
  );

  return entry;
}

export function pushToStream(id: string, chunk: Uint8Array) {
  const entry = streamCache.get(id);
  if (entry) {
    entry.dataParts.push(chunk);
    entry.listeners.forEach((listener) => listener(chunk));
  }
}

export function finishStream(id: string) {
  const entry = streamCache.get(id);
  if (entry) {
    entry.isFinished = true;
    entry.listeners.forEach((listener) => listener(null)); // null signal for EOF
    entry.listeners.clear();
  }
}

/**
 * Creates a new ReadableStream that replays history and subscribes to future chunks.
 */
export function getStreamResponse(id: string): Response | null {
  const entry = streamCache.get(id);
  if (!entry) return null;

  let listener: StreamListener;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Replay history
      for (const part of entry.dataParts) {
        controller.enqueue(part);
      }

      if (entry.isFinished) {
        controller.close();
        return;
      }

      // 2. Subscribe to live updates
      listener = (chunk) => {
        if (chunk === null) {
          controller.close();
        } else {
          controller.enqueue(chunk);
        }
      };

      entry.listeners.add(listener);
    },
    cancel() {
      if (listener) {
        entry.listeners.delete(listener);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
