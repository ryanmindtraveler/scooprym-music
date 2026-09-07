/**
 * Simple logger utility to control output based on environment.
 *
 * Usage:
 * import { Logger } from '@/lib/infrastructure/logger';
 *
 * Logger.debug('User details', { userId: '123' }); // Only prints in development
 * Logger.info('Server started'); // Prints everywhere
 * Logger.error('Database connection failed', error); // Prints everywhere
 */
export const Logger = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },

  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};
