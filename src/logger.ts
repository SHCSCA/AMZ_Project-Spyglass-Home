export interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 500;

function push(entry: LogEntry) {
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
  if (entry.level === 'error') {
    // eslint-disable-next-line no-console
    console.error('[LOG]', entry.message, entry.context || '');
  } else {
    // eslint-disable-next-line no-console
    console.log('[LOG]', entry.message, entry.context || '');
  }
}

export function logInfo(message: string, context?: Record<string, any>) {
  push({ ts: new Date().toISOString(), level: 'info', message, context });
}
export function logWarn(message: string, context?: Record<string, any>) {
  push({ ts: new Date().toISOString(), level: 'warn', message, context });
}
export function logError(message: string, context?: Record<string, any>) {
  push({ ts: new Date().toISOString(), level: 'error', message, context });
}
export function getLogs() { return [...logs].reverse(); }