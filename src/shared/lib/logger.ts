/*
 * logger.ts
 * Utility for logging events and API requests
 */

import type { LogEntry } from '@/shared/ui/LogViewer';

let logCallback: ((log: LogEntry) => void) | null = null;

export const setLogCallback = (callback: (log: LogEntry) => void) => {
  logCallback = callback;
};

export const generateLogId = (): string => {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
};

export const log = (
  type: LogEntry['type'],
  message: string,
  details?: any,
  options?: {
    agentId?: string;
    agentName?: string;
    endpoint?: string;
    method?: string;
    status?: number;
    duration?: number;
  }
) => {
  const logEntry: LogEntry = {
    id: generateLogId(),
    timestamp: new Date(),
    type,
    message,
    details,
    ...options,
  };

  if (logCallback) {
    logCallback(logEntry);
  }

  // Also log to console for debugging
  const consoleMethod =
    type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
  console[consoleMethod](`[${type.toUpperCase()}] ${message}`, details || '');
};

export const logInfo = (message: string, details?: any) => {
  log('info', message, details);
};

export const logSuccess = (message: string, details?: any) => {
  log('success', message, details);
};

export const logError = (message: string, details?: any) => {
  log('error', message, details);
};

export const logWarning = (message: string, details?: any) => {
  log('warning', message, details);
};

export const logApi = (
  message: string,
  options: {
    agentId?: string;
    agentName?: string;
    endpoint?: string;
    method?: string;
    status?: number;
    duration?: number;
  },
  details?: any
) => {
  log('api', message, details, options);
};

export const logAgentSelection = (agentId: string, agentName: string) => {
  logSuccess(`Agent selected: ${agentName}`, { agentId, agentName });
};

export const logApiRequest = (
  method: string,
  endpoint: string,
  agentId?: string,
  agentName?: string
) => {
  logApi(`${method} request to ${endpoint}`, {
    method,
    endpoint,
    agentId,
    agentName,
  });
};

export const logApiResponse = (
  method: string,
  endpoint: string,
  status: number,
  duration: number,
  agentId?: string,
  agentName?: string
) => {
  const message = `${method} ${endpoint} - ${status}`;
  const type = status >= 200 && status < 300 ? 'success' : 'error';

  log(type, message, undefined, {
    method,
    endpoint,
    status,
    duration,
    agentId,
    agentName,
  });
};

export const logFlowiseConnection = (url: string, success: boolean) => {
  if (success) {
    logSuccess(`Connected to Flowise at ${url}`);
  } else {
    logError(`Failed to connect to Flowise at ${url}`);
  }
};

export const logAgentFetch = (count: number, url: string) => {
  logSuccess(`Fetched ${count} agents from Flowise`, { url, count });
};
