import { describe, expect, it } from 'vitest';
import { canRestoreQueueStage, canResumeCreationWorkflow } from './creation-context-guard';

describe('创作上下文隔离', () => {
  it('新闻导入后，晚到的首次队列恢复不能覆盖工作台', () => {
    expect(canRestoreQueueStage(true, true)).toBe(false);
  });
  it('普通进入仍可恢复历史任务，后续同步不抢占工作台', () => {
    expect(canRestoreQueueStage(true, false)).toBe(true);
    expect(canRestoreQueueStage(false, false)).toBe(false);
  });
  it('有待导入新闻时，不续跑缓存工作流', () => {
    expect(canResumeCreationWorkflow('old', 'old', true)).toBe(false);
  });
  it('导入清空旧工作流后，旧响应失效', () => {
    expect(canResumeCreationWorkflow('old', null, false)).toBe(false);
    expect(canResumeCreationWorkflow('old', 'new', false)).toBe(false);
  });
  it('属于当前新闻的新工作流仍可正常恢复', () => {
    expect(canResumeCreationWorkflow('new', 'new', false)).toBe(true);
  });
});
