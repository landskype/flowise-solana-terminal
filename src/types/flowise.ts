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
  chatbotConfig?: any;
  speechToText?: any;
  followUpPrompts?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowisePredictionRequest {
  question: string;
  overrideConfig?: any;
  socketIOClientId?: string;
}

export interface FlowisePredictionResponse {
  text?: string;
  response?: string;
  error?: string;
  sourceDocuments?: any[];
  usedTools?: any[];
  chatId?: string;
}
