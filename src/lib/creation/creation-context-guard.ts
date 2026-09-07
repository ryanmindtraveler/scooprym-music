/** 导入新闻期间及之后，历史队列只能同步列表，不能自动接管工作台。 */
export function canRestoreQueueStage(initialRestore: boolean, hasImportedSource: boolean) {
  return initialRestore && !hasImportedSource;
}

/** 异步恢复结果必须仍属于当前工作流，且没有待处理的新闻导入。 */
export function canResumeCreationWorkflow(
  requestedRunId: string,
  currentRunId: string | null,
  hasPendingSource: boolean
) {
  return !hasPendingSource && requestedRunId === currentRunId;
}
