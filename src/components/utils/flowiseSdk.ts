/*
 * flowiseSdk.ts
 * Integration with official Flowise SDK
 */

import { FlowiseClient } from 'flowise-sdk';
import type { FlowiseAgent } from '../../types/flowise';
import {
  logInfo,
  logSuccess,
  logError,
  logApiRequest,
  logApiResponse,
} from './logger';

let flowiseClient: FlowiseClient | null = null;

/**
 * Initialize Flowise client
 */
export const initializeFlowiseClient = (baseUrl: string, apiKey?: string) => {
  try {
    flowiseClient = new FlowiseClient({ baseUrl, apiKey });
    logSuccess('Flowise SDK client initialized', { baseUrl });
    return true;
  } catch (error) {
    logError('Failed to initialize Flowise SDK client', { error, baseUrl });
    return false;
  }
};

/**
 * Get Flowise client instance
 */
export const getFlowiseClient = (): FlowiseClient | null => {
  return flowiseClient;
};

/**
 * Fetch all available chatflows (agents) using SDK
 */
export const fetchAgentsWithSDK = async (
  baseUrl: string,
  apiKey?: string
): Promise<FlowiseAgent[]> => {
  try {
    // Initialize client if not already done
    if (!flowiseClient) {
      initializeFlowiseClient(baseUrl, apiKey);
    }

    // Note: The SDK doesn't have a direct method to fetch chatflows
    // We'll still use our existing API call for this
    const response = await fetch(`${baseUrl}/api/v1/chatflows`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const agents = data.map((flow: Record<string, unknown>) => ({
      id: flow.id as string,
      name: (flow.name as string) || `Agent ${flow.id}`,
      description: (flow.description as string) || 'No description available',
      category: (flow.category as string) || 'General',
      deployed: (flow.deployed as boolean) || false,
      isPublic: (flow.isPublic as boolean) || false,
      apikeyid: flow.apikeyid as string,
      chatbotConfig: flow.chatbotConfig,
      speechToText: flow.speechToText,
      followUpPrompts: flow.followUpPrompts,
      createdAt: flow.createdAt as string,
      updatedAt: flow.updatedAt as string,
    }));

    logSuccess('Fetched agents using SDK', { count: agents.length });
    return agents;
  } catch (error) {
    logError('Failed to fetch agents with SDK', { error });
    throw error;
  }
};

/**
 * Send prediction using SDK with streaming support
 */
export const sendPredictionWithSDK = async (
  chatflowId: string,
  question: string,
  streaming: boolean = true
) => {
  if (!flowiseClient) {
    throw new Error('Flowise client not initialized');
  }

  const startTime = Date.now();
  logApiRequest('SDK', `prediction/${chatflowId}`, chatflowId);
  logInfo('SDK prediction parameters', { chatflowId, question, streaming });

  try {
    const completion = await flowiseClient.createPrediction({
      chatflowId,
      question,
      streaming,
    });

    logInfo('SDK createPrediction successful', { streaming });

    if (streaming) {
      // Return async generator for streaming
      return completion;
    } else {
      // For non-streaming, collect all chunks
      let fullResponse = '';
      const stream = completion as AsyncGenerator<string, void, unknown>;

      for await (const chunk of stream) {
        // Handle different chunk formats
        let textChunk = '';
        if (typeof chunk === 'string') {
          textChunk = chunk;
        } else if (chunk && typeof chunk === 'object') {
          // Extract text from object
          const obj = chunk as Record<string, unknown>;
          if ('text' in obj) {
            textChunk = String(obj.text);
          } else if ('response' in obj) {
            textChunk = String(obj.response);
          } else if ('message' in obj) {
            textChunk = String(obj.message);
          } else {
            // Try to stringify the object
            textChunk = JSON.stringify(chunk);
          }
        } else {
          textChunk = String(chunk);
        }

        // Filter out non-text events from Flowise
        if (
          textChunk.includes('"event":"token"') ||
          textChunk.includes('"event":"agentFlowEvent"') ||
          textChunk.includes('"event":"nextAgentFlow"') ||
          textChunk.includes('"event":"agentFlowExecutedData"') ||
          textChunk.includes('"event":"calledTools"') ||
          textChunk.includes('"event":"usageMetadata"') ||
          textChunk.includes('"event":"metadata"') ||
          textChunk.includes('"event":"end"')
        ) {
          // Try to extract text from token events
          try {
            const parsed = JSON.parse(textChunk);
            if (parsed.event === 'token' && parsed.data) {
              textChunk = String(parsed.data);
            } else {
              // Skip non-token events
              textChunk = '';
            }
          } catch {
            // If it's not valid JSON, skip it
            textChunk = '';
          }
        }

        fullResponse += textChunk;
        logInfo('SDK chunk received', { chunk, textChunk, fullResponse });
      }

      const duration = Date.now() - startTime;
      logApiResponse(
        'SDK',
        `prediction/${chatflowId}`,
        200,
        duration,
        chatflowId
      );

      return { text: fullResponse };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Failed to send prediction with SDK', {
      error,
      duration,
      chatflowId,
      question,
      streaming,
    });
    throw error;
  }
};

/**
 * Deploy agent using SDK
 */
export const deployAgentWithSDK = async (
  chatflowId: string,
  baseUrl: string,
  apiKey?: string
): Promise<boolean> => {
  try {
    logApiRequest(
      'POST',
      `${baseUrl}/api/v1/chatflows/${chatflowId}/deploy`,
      chatflowId
    );

    const response = await fetch(
      `${baseUrl}/api/v1/chatflows/${chatflowId}/deploy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        },
      }
    );

    const duration = Date.now();
    logApiResponse(
      'POST',
      `${baseUrl}/api/v1/chatflows/${chatflowId}/deploy`,
      response.status,
      duration,
      chatflowId
    );

    if (!response.ok) {
      logError('Failed to deploy agent with SDK', { status: response.status });
      return false;
    }

    logSuccess('Agent deployed successfully with SDK');
    return true;
  } catch (error) {
    logError('Failed to deploy agent with SDK', { error, chatflowId });
    return false;
  }
};
