import { env } from '../config/env';

/**
 * A simple logger utility. 
 * Can be easily swapped with Winston or Pino in the future without breaking the API.
 */
export const logger = {
    info: (message: string, meta?: any) => {
        if (env.LOG_LEVEL !== 'error' && env.LOG_LEVEL !== 'warn') {
            console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
        }
    },
    warn: (message: string, meta?: any) => {
        if (env.LOG_LEVEL !== 'error') {
            console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
        }
    },
    error: (message: string, meta?: any) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
    },
    debug: (message: string, meta?: any) => {
        if (env.LOG_LEVEL === 'debug') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
        }
    }
};
