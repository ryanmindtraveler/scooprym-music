export interface ScreeningState {
  token: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  title: string;
  domain: string;
  attemptedAt: string;
  completedAt?: string;
  error?: string;
  reason?: string;
}
