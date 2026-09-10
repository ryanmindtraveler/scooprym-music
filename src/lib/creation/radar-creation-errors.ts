/** 已明确需要修改输入或权限的错误，不重复占用队列。供应商故障仍可恢复。 */
export function isTerminalRadarCreationError(error: unknown) {
  const candidate = error as { statusCode?: number; message?: string } | null;
  return (
    candidate?.statusCode === 422 ||
    candidate?.statusCode === 403 ||
    candidate?.message === 'No configured text model provider is available'
  );
}
