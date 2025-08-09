/*
 * flowise.ts
 * Type definitions for Flowise API
 */

export interface FlowiseAgent {
  id: string;
  name: string;
  description?: string;
  category?: string;
  deployed?: boolean;
  isPublic?: boolean;
  apikeyid?: string;
  chatbotConfig?: unknown;
  speechToText?: unknown;
  followUpPrompts?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowisePredictionRequest {
  question: string;
  overrideConfig?: unknown;
  socketIOClientId?: string;
  sessionId?: string;
  // Use to persist conversation context; we will key this by wallet public key
  // and agent. Flowise API accepts chatId for reusing the same chat session.
  chatId?: string;
}

export interface FlowisePredictionResponse {
  text?: string;
  response?: string;
  error?: string;
  sourceDocuments?: unknown[];
  usedTools?: unknown[];
  chatId?: string;
  sessionId?: string;
}
