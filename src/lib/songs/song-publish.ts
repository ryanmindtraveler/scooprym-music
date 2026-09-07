export function isMissingPublishFlagError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('is_published') || message.includes('isPublished');
}
