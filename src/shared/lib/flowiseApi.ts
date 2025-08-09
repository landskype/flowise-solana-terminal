/*
 * flowiseApi.ts
 * Utility functions for Flowise API integration
 */

import type {
  FlowiseAgent,
  FlowisePredictionRequest,
  FlowisePredictionResponse,
} from '@/shared/types/flowise';
import {
  logApiRequest,
  logApiResponse,
  logFlowiseConnection,
  logAgentFetch,
  logError,
  logInfo,
  logSuccess,
} from './logger';

export interface FlowiseSSEOptions {
  onMessage?: (data: unknown) => void;
  onError?: (error: unknown) => void;
  onComplete?: (finalResponse: FlowisePredictionResponse) => void;
  onStart?: () => void;
}

export interface FlowiseChatMessage {
  role?: string;
  text?: string;
  message?: string;
  content?: string;
  chatId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetches all available chatflows (agents) from Flowise
 */
export const fetchFlowiseAgents = async (
  baseUrl: string,
  apiKey?: string
): Promise<FlowiseAgent[]> => {
  const startTime = Date.now();
  const endpoint = `${baseUrl}/api/v1/chatflows`;

  try {
    logApiRequest('GET', endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const duration = Date.now() - startTime;
    logApiResponse('GET', endpoint, response.status, duration);

    if (!response.ok) {
      logFlowiseConnection(baseUrl, false);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const agents = data.map((flow: Record<string, unknown>) => ({
      id: flow.id,
      name: flow.name || `Agent ${flow.id}`,
      description: flow.description || 'No description available',
      category: flow.category || 'General',
      deployed: flow.deployed || false,
      isPublic: flow.isPublic || false,
      apikeyid: flow.apikeyid,
      chatbotConfig: flow.chatbotConfig,
      speechToText: flow.speechToText,
      followUpPrompts: flow.followUpPrompts,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    }));

    logFlowiseConnection(baseUrl, true);
    logAgentFetch(agents.length, baseUrl);

    return agents;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Failed to fetch Flowise agents', { error, duration, endpoint });
    throw error;
  }
};

/**
 * Sends a prediction request to a specific Flowise agent
 */
export const sendFlowisePrediction = async (
  baseUrl: string,
  agentId: string,
  request: FlowisePredictionRequest,
  apiKey?: string
): Promise<FlowisePredictionResponse> => {
  const startTime = Date.now();
  const endpoint = `${baseUrl}/api/v1/prediction/${agentId}`;

  try {
    logApiRequest('POST', endpoint, agentId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...request,
        ...(request.chatId ? { sessionId: request.chatId } : {}),
      }),
    });

    const duration = Date.now() - startTime;
    logApiResponse('POST', endpoint, response.status, duration, agentId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Failed to send prediction to Flowise', {
      error,
      duration,
      endpoint,
      agentId,
    });
    throw error;
  }
};

/**
 * Sends a prediction request with SSE support for streaming responses
 */
export const sendFlowisePredictionSSE = async (
  baseUrl: string,
  agentId: string,
  request: FlowisePredictionRequest,
  options: FlowiseSSEOptions = {},
  apiKey?: string
): Promise<void> => {
  const startTime = Date.now();
  const endpoint = `${baseUrl}/api/v1/prediction/${agentId}/stream`;

  try {
    logApiRequest('POST', endpoint, agentId);
    logInfo('Starting SSE connection for streaming response');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Requested-With': 'XMLHttpRequest', // Prevent redirect to HTML
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...request,
        ...(request.chatId ? { sessionId: request.chatId } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is HTML (redirected to login page)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(
        'Received HTML instead of SSE data - possible authentication issue'
      );
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let hasReceivedData = false;

    options.onStart?.();
    logInfo('SSE stream reader initialized');

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        logInfo('SSE stream reader finished');
        if (!hasReceivedData) {
          logError('SSE stream finished without receiving any data');
        }
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      hasReceivedData = true;

      logInfo(`Received SSE chunk: ${chunk.length} bytes`);

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        logInfo(`Processing SSE line: "${line}"`);

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          logInfo(`SSE data received: "${data}"`);

          if (data === '[DONE]') {
            logInfo('SSE stream completed');
            options.onComplete?.({
              text: 'Stream completed',
              sessionId: request.sessionId,
            });
            return;
          }

          try {
            const parsedData = JSON.parse(data);
            logInfo('SSE data parsed successfully:', parsedData);
            options.onMessage?.(parsedData);
          } catch (error) {
            logError('Failed to parse SSE data', { data, error });
          }
        } else if (line.trim() && !line.startsWith(':')) {
          // Handle non-data lines (like comments or other SSE fields)
          logInfo(`SSE non-data line: "${line}"`);
        }
      }
    }

    const duration = Date.now() - startTime;
    logApiResponse('POST', endpoint, 200, duration, agentId);
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Failed to establish SSE connection', {
      error,
      duration,
      endpoint,
      agentId,
    });
    options.onError?.(error);
    throw error;
  }
};

/**
 * Validates Flowise URL format
 */
export const validateFlowiseUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Gets the default Flowise URL
 */
export const getDefaultFlowiseUrl = (): string => {
  return 'http://localhost:3000';
};

/**
 * Checks if Flowise supports SSE streaming
 */
export const checkFlowiseSSESupport = async (
  baseUrl: string,
  apiKey?: string
): Promise<boolean> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Try to fetch chatflows to check if server is reachable
    const response = await fetch(`${baseUrl}/api/v1/chatflows`, {
      method: 'GET',
      headers,
    });

    // If server responds, assume SSE is supported (most Flowise instances support it)
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Tests SSE connectivity with a simple request
 */
export const testSSEConnection = async (
  baseUrl: string,
  agentId: string,
  apiKey?: string
): Promise<boolean> => {
  try {
    logInfo('Testing SSE connection', { baseUrl, agentId });

    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Use HEAD request to check if SSE endpoint exists without creating a chat
    const response = await fetch(
      `${baseUrl}/api/v1/prediction/${agentId}/stream`,
      {
        method: 'HEAD',
        headers,
      }
    );

    if (!response.ok) {
      logError('SSE test failed', { status: response.status });
      return false;
    }

    // Check if response supports SSE
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      logError('SSE test failed - endpoint returns HTML instead of SSE');
      return false;
    }

    logInfo('SSE endpoint test successful');
    return true;
  } catch (error) {
    logError('SSE test failed', { error });
    return false;
  }
};

/**
 * Deploys an agent in Flowise
 */
export const deployFlowiseAgent = async (
  baseUrl: string,
  agentId: string,
  apiKey?: string
): Promise<boolean> => {
  const startTime = Date.now();
  const endpoint = `${baseUrl}/api/v1/chatflows/${agentId}/deploy`;

  try {
    logApiRequest('POST', endpoint, agentId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
    });

    const duration = Date.now() - startTime;
    logApiResponse('POST', endpoint, response.status, duration, agentId);

    if (!response.ok) {
      logError('Failed to deploy agent', { status: response.status });
      return false;
    }

    logSuccess('Agent deployed successfully');
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Failed to deploy agent', { error, duration, endpoint, agentId });
    return false;
  }
};

/**
 * Fetch chat history for a given chatflow (agent) and chatId
 */
export const fetchFlowiseChatHistory = async (
  baseUrl: string,
  agentId: string,
  chatId: string,
  apiKey?: string
): Promise<FlowiseChatMessage[]> => {
  const endpoint = `${baseUrl}/api/v1/chatmessage/${agentId}?chatId=${encodeURIComponent(
    chatId
  )}`;
  try {
    logApiRequest('GET', endpoint, agentId);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(endpoint, { method: 'GET', headers });
    logApiResponse('GET', endpoint, response.status, 0, agentId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as unknown;
    if (Array.isArray(data)) {
      return data as FlowiseChatMessage[];
    }
    // Some instances return an object with data/messages field
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as FlowiseChatMessage[];
    if (Array.isArray(obj.messages))
      return obj.messages as FlowiseChatMessage[];
    return [];
  } catch (error) {
    logError('Failed to fetch Flowise chat history', {
      error,
      endpoint,
      agentId,
    });
    return [];
  }
};

/**
 * Delete chat history for a given chatflow (agent) and chatId
 */
export const deleteFlowiseChat = async (
  baseUrl: string,
  agentId: string,
  chatId: string,
  apiKey?: string
): Promise<boolean> => {
  const endpoint = `${baseUrl}/api/v1/chatmessage/${agentId}?chatId=${encodeURIComponent(
    chatId
  )}`;
  try {
    logApiRequest('DELETE', endpoint, agentId);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const response = await fetch(endpoint, { method: 'DELETE', headers });
    logApiResponse('DELETE', endpoint, response.status, 0, agentId);
    return response.ok;
  } catch (error) {
    logError('Failed to delete Flowise chat', { error, endpoint, agentId });
    return false;
  }
};

/**
 * Fetch all messages for an agent (no chatId), then group by chatId to build session list
 */
export interface FlowiseChatSessionSummary {
  chatId: string;
  lastText?: string;
  lastAt?: string;
  count: number;
}

export const listFlowiseChatSessions = async (
  baseUrl: string,
  agentId: string,
  apiKey?: string
): Promise<FlowiseChatSessionSummary[]> => {
  const endpoint = `${baseUrl}/api/v1/chatmessage/${agentId}`;
  try {
    logApiRequest('GET', endpoint, agentId);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const response = await fetch(endpoint, { method: 'GET', headers });
    logApiResponse('GET', endpoint, response.status, 0, agentId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as unknown;

    const isRecord = (val: unknown): val is Record<string, unknown> =>
      typeof val === 'object' && val !== null && !Array.isArray(val);

    const coerceMessages = (val: unknown): FlowiseChatMessage[] => {
      if (Array.isArray(val)) return val as FlowiseChatMessage[];
      if (isRecord(val)) {
        const maybeData = val['data'];
        const maybeMessages = val['messages'];
        if (Array.isArray(maybeData)) return maybeData as FlowiseChatMessage[];
        if (Array.isArray(maybeMessages))
          return maybeMessages as FlowiseChatMessage[];
      }
      return [];
    };

    const messages: FlowiseChatMessage[] = coerceMessages(data);

    const map = new Map<string, FlowiseChatSessionSummary>();
    for (const m of messages) {
      const id = String(m.chatId || '');
      if (!id) continue;
      const prev = map.get(id);
      const created = m.createdAt || m.updatedAt || new Date().toISOString();
      const text = (m.text || m.message || m.content || '') as string;
      if (!prev) {
        map.set(id, { chatId: id, lastText: text, lastAt: created, count: 1 });
      } else {
        prev.count += 1;
        if (!prev.lastAt || new Date(created) > new Date(prev.lastAt)) {
          prev.lastAt = created;
          if (text) prev.lastText = text;
        }
      }
    }
    // Sort by lastAt desc
    return Array.from(map.values()).sort((a, b) => {
      const atA = a.lastAt ? new Date(a.lastAt).getTime() : 0;
      const atB = b.lastAt ? new Date(b.lastAt).getTime() : 0;
      return atB - atA;
    });
  } catch (error) {
    logError('Failed to list Flowise chat sessions', {
      error,
      endpoint,
      agentId,
    });
    return [];
  }
};
