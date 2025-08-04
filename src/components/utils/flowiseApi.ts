/*
 * flowiseApi.ts
 * Utility functions for Flowise API integration
 */

import type {
  FlowiseAgent,
  FlowisePredictionRequest,
  FlowisePredictionResponse,
} from '../../types/flowise';
import {
  logApiRequest,
  logApiResponse,
  logFlowiseConnection,
  logAgentFetch,
  logError,
} from './logger';

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
    const agents = data.map((flow: any) => ({
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
      body: JSON.stringify(request),
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
