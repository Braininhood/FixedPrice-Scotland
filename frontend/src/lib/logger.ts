const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[FixedPrice]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info('[FixedPrice]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[FixedPrice]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[FixedPrice]', ...args);
  },
  apiError: (message: string, error: unknown, context?: Record<string, unknown>) => {
    console.error('[FixedPrice]', message, error, context ?? '');
  },
};
