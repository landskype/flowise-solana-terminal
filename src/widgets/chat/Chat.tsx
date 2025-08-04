/*
 * Chat.tsx
 * Main chat container for the Matrix terminal UI.
 * Handles message state, typing effect, auto-scroll, and input.
 */

import React, { useState, useRef, useEffect } from 'react';
import '@/shared/ui/Chat.css';
import ChatHeader from '@/shared/ui/ChatHeader';
import ChatMessages from './ChatMessages';
import AgentSelector from '@/shared/ui/AgentSelector';
import AgentInfo from '@/shared/ui/AgentInfo';
import LogViewer from '@/shared/ui/LogViewer';
import type { FlowiseAgent } from '@/shared/types/flowise';
import type { LogEntry } from '@/shared/ui/LogViewer';
import type { ToolEvent as ToolEventType } from '@/entities/chat/ToolEvent';
import {
  setLogCallback,
  logInfo,
  logSuccess,
  logError,
  logAgentSelection,
} from '@/shared/lib/logger';
import { checkFlowiseSSESupport, testSSEConnection } from '@/shared/lib/flowiseApi';
import {
  initializeFlowiseClient,
  sendPredictionWithSDK,
  deployAgentWithSDK,
} from '@/shared/lib/flowiseSdk';

const AUTOSCROLL_THRESHOLD = 40; // px from bottom to trigger auto-scroll
const ERROR_MESSAGE =
  'Sorry, something went wrong while processing your message.';

/**
 * Generates a unique id for each message.
 */
function uniqueId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

/**
 * Message object for chat history.
 */
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  toolEvents?: ToolEventType[];
  contentBlocks?: Array<{
    type: 'text' | 'tool';
    content: string | ToolEventType;
    timestamp: Date;
  }>;
}

/**
 * Main chat component for the terminal UI.
 * Manages message state, typing animation, and input.
 */
const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    '1323ab8f-7677-4623-b327-fabb67019498'
  );
  const [selectedAgent, setSelectedAgent] = useState<FlowiseAgent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [apiKey, setApiKey] = useState(
    'Tgd8mkfU6mLlRq89uQg4R0-3pW_wCzt83Yg93hacfCs'
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [sseSupported, setSseSupported] = useState(false);
  const [useSSE, setUseSSE] = useState(true); // Enable SSE by default for streaming
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLength = useRef(messages.length);

  // Initialize logging system and check SSE support
  useEffect(() => {
    setLogCallback((logEntry) => {
      setLogs((prev) => [...prev, logEntry]);
    });

    logInfo('Chat application started');

    // Initialize Flowise SDK
    const initSDK = async () => {
      try {
        const initialized = initializeFlowiseClient(
          'http://localhost:3000',
          apiKey
        );
        if (initialized) {
          logInfo('Flowise SDK initialized successfully');
        }
      } catch (error) {
        logError('Failed to initialize Flowise SDK', { error });
      }
    };

    initSDK();

    // Check if Flowise supports SSE
    const checkSSE = async () => {
      try {
        const supported = await checkFlowiseSSESupport(
          'http://localhost:3000',
          apiKey
        );
        setSseSupported(supported);
        logInfo(`SSE support: ${supported ? 'Available' : 'Not available'}`);

        // Test SSE connectivity if supported
        if (supported) {
          const testResult = await testSSEConnection(
            'http://localhost:3000',
            selectedAgentId,
            apiKey
          );
          logInfo(`SSE connectivity test: ${testResult ? 'Passed' : 'Failed'}`);
        }
      } catch (error) {
        logError('Failed to check SSE support', { error });
        setSseSupported(false);
      }
    };

    checkSSE();
  }, [apiKey]);

  // Устанавливаем агента по умолчанию при инициализации
  useEffect(() => {
    if (selectedAgentId && !selectedAgent) {
      // Создаем временный объект агента для отображения
      const defaultAgent: FlowiseAgent = {
        id: selectedAgentId,
        name: 'Loading...', // Временное имя
        deployed: false,
        category: 'default',
        description: 'Default agent',
      };
      setSelectedAgent(defaultAgent);
      setIsConnected(true);
      logInfo('Default agent set', { agentId: selectedAgentId });

      // Проверяем реальный статус деплоя для временного агента
      checkAgentDeploymentStatus(selectedAgentId).then((isDeployed) => {
        setSelectedAgent((prev) =>
          prev ? { ...prev, deployed: isDeployed } : null
        );
        logInfo('Temporary agent deployment status checked', {
          agentId: selectedAgentId,
          isDeployed,
        });
      });
    }
  }, [selectedAgentId, selectedAgent]);

  // Автоматическая периодическая проверка статуса деплоя
  useEffect(() => {
    if (!selectedAgent || !selectedAgentId) return;

    const checkDeploymentInterval = setInterval(async () => {
      const isActuallyDeployed = await checkAgentDeploymentStatus(
        selectedAgentId
      );
      if (isActuallyDeployed !== selectedAgent.deployed) {
        setSelectedAgent((prev) =>
          prev ? { ...prev, deployed: isActuallyDeployed } : null
        );
        logInfo('Agent deployment status auto-updated', {
          agentId: selectedAgentId,
          wasDeployed: selectedAgent.deployed,
          isActuallyDeployed,
        });
      }
    }, 30000); // Проверяем каждые 30 секунд

    return () => clearInterval(checkDeploymentInterval);
  }, [selectedAgent, selectedAgentId]);

  /**
   * Appends a message and clears any previous typing effect.
   */
  function appendMessageClearingTyping(newMsg: Message) {
    setMessages((prev) => [
      ...prev.map((msg) => (msg.isTyping ? { ...msg, isTyping: false } : msg)),
      newMsg,
    ]);
  }

  // Auto-scrolls to bottom only when a new message is added (not on every typing effect character)
  useEffect(() => {
    if (autoScroll && messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages, autoScroll]);

  // Tracks user scroll position to enable/disable auto-scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      setAutoScroll(
        scrollHeight - scrollTop - clientHeight < AUTOSCROLL_THRESHOLD
      );
    };
    const ref = messagesContainerRef.current;
    if (ref) ref.addEventListener('scroll', handleScroll);
    return () => {
      if (ref) ref.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * Sends a user message to the backend and handles the response.
   * Ensures only one message can have isTyping: true at a time.
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: uniqueId(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };
    appendMessageClearingTyping(userMessage);
    setInputValue('');

    const botMessage: Message = {
      id: uniqueId(),
      text: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: false, // No typing effect
    };
    appendMessageClearingTyping(botMessage);

    try {
      if (useSSE && sseSupported) {
        // Use SDK with streaming
        try {
          await queryWithSDKStreaming({ question: inputValue }, botMessage.id);
        } catch (sdkError) {
          logError('SDK streaming failed, falling back to regular API', {
            sdkError,
          });
          // Fallback to regular API
          const response = await query({ question: inputValue });
          const fullText = response.text || response.response || ERROR_MESSAGE;

          // Create contentBlocks for fallback response
          const contentBlocks = [
            {
              type: 'text' as const,
              content: fullText,
              timestamp: new Date(),
            },
          ];

          // Update message directly without typing effect
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessage.id
                ? { ...msg, text: fullText, isTyping: false, contentBlocks }
                : msg
            )
          );
        }
      } else {
        // Use SDK without streaming
        try {
          const response = await sendPredictionWithSDK(
            selectedAgentId,
            inputValue,
            false // no streaming
          );
          const fullText = response.text || ERROR_MESSAGE;

          // Create contentBlocks for non-streaming response
          const contentBlocks = [
            {
              type: 'text' as const,
              content: fullText,
              timestamp: new Date(),
            },
          ];

          // Update message directly without typing effect
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessage.id
                ? { ...msg, text: fullText, isTyping: false, contentBlocks }
                : msg
            )
          );
        } catch (sdkError) {
          logError('SDK failed, falling back to regular API', { sdkError });
          // Fallback to regular API
          const response = await query({ question: inputValue });
          const fullText = response.text || response.response || ERROR_MESSAGE;

          // Create contentBlocks for API response
          const contentBlocks = [
            {
              type: 'text' as const,
              content: fullText,
              timestamp: new Date(),
            },
          ];

          // Update message directly without typing effect
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessage.id
                ? { ...msg, text: fullText, isTyping: false, contentBlocks }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error:', error);

      // Create contentBlocks for error message
      const contentBlocks = [
        {
          type: 'text' as const,
          content: ERROR_MESSAGE,
          timestamp: new Date(),
        },
      ];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessage.id
            ? { ...msg, text: ERROR_MESSAGE, isTyping: false, contentBlocks }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Checks if an agent is deployed by making a test request
   */
  const checkAgentDeploymentStatus = async (
    agentId: string
  ): Promise<boolean> => {
    try {
      // Попробуем сделать тестовый запрос к агенту
      const testResponse = await fetch(
        `http://localhost:3000/api/v1/prediction/${agentId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ question: 'test' }),
        }
      );

      // Если получаем ответ (даже с ошибкой), значит агент деплоен
      return testResponse.status !== 404;
    } catch (error) {
      // Если получаем ошибку сети, считаем что агент не деплоен
      logError('Failed to check agent deployment status', { error, agentId });
      return false;
    }
  };

  /**
   * Handles agent selection from AgentSelector
   */
  const handleAgentSelect = async (
    agentId: string,
    agentName: string,
    agentData?: FlowiseAgent
  ) => {
    setSelectedAgentId(agentId);
    setSelectedAgent(agentData || null);
    setIsConnected(true);
    logAgentSelection(agentId, agentName);

    // Если у нас есть данные агента, обновляем информацию
    if (agentData) {
      logInfo('Agent selected with full data', {
        agentId,
        agentName,
        deployed: agentData.deployed,
      });

      // Проверяем реальный статус деплоя
      const isActuallyDeployed = await checkAgentDeploymentStatus(agentId);
      if (isActuallyDeployed !== agentData.deployed) {
        setSelectedAgent((prev) =>
          prev ? { ...prev, deployed: isActuallyDeployed } : null
        );
        logInfo('Agent deployment status updated', {
          agentId,
          wasDeployed: agentData.deployed,
          isActuallyDeployed,
        });
      }
    }
  };

  /**
   * Deploys the selected agent
   */
  const handleDeployAgent = async () => {
    if (!selectedAgent) return;

    logInfo('Attempting to deploy agent', { agentId: selectedAgent.id });

    const success = await deployAgentWithSDK(
      selectedAgent.id,
      'http://localhost:3000',
      apiKey
    );

    if (success) {
      // Update the agent's deployment status
      setSelectedAgent((prev) => (prev ? { ...prev, deployed: true } : null));
      logSuccess('Agent deployed successfully');

      // Show success message
      const successMessage: Message = {
        id: uniqueId(),
        text: 'info: Agent deployed successfully! You can now send messages.',
        isUser: false,
        timestamp: new Date(),
      };
      appendMessageClearingTyping(successMessage);
    } else {
      logError('Failed to deploy agent');

      // Show error message
      const errorMessage: Message = {
        id: uniqueId(),
        text: 'info: Failed to deploy agent. Please try again or deploy manually in Flowise.',
        isUser: false,
        timestamp: new Date(),
      };
      appendMessageClearingTyping(errorMessage);
    }
  };

  /**
   * Sends a message using SDK with streaming
   */
  const queryWithSDKStreaming = async (
    data: { question: string },
    messageId: string
  ) => {
    let fullResponse = '';
    let currentTextBlock = '';
    const contentBlocks: Array<{
      type: 'text' | 'tool';
      content: string | ToolEventType;
      timestamp: Date;
    }> = [];

    try {
      const completion = await sendPredictionWithSDK(
        selectedAgentId,
        data.question,
        true // streaming
      );

      // Type assertion for async generator
      const stream = completion as AsyncGenerator<string, void, unknown>;

      for await (const chunk of stream) {
        // Выводим raw данные в консоль
        console.log('=== RAW STREAM CHUNK ===');
        console.log('Type:', typeof chunk);
        console.log('Value:', chunk);
        console.log('Stringified:', JSON.stringify(chunk, null, 2));
        console.log('========================');

        // Handle different chunk formats
        let textChunk = '';
        let hasToolEvent = false;

        if (typeof chunk === 'string') {
          textChunk = chunk;
        } else if (chunk && typeof chunk === 'object') {
          // Extract text from object
          const obj = chunk as Record<string, unknown>;

          // Обрабатываем события инструментов
          if (obj.event === 'calledTools' && obj.data) {
            hasToolEvent = true;

            // Если есть накопленный текст, добавляем его как блок
            if (currentTextBlock) {
              contentBlocks.push({
                type: 'text',
                content: currentTextBlock,
                timestamp: new Date(),
              });
              currentTextBlock = '';
            }

            try {
              const toolCalls = JSON.parse(String(obj.data));
              if (Array.isArray(toolCalls)) {
                toolCalls.forEach((toolCall, index) => {
                  const toolEvent: ToolEventType = {
                    id: `${messageId}-called-${index}`,
                    type: 'calledTools',
                    toolName: toolCall.name,
                    toolInput: toolCall.args,
                    timestamp: new Date(),
                  };
                  contentBlocks.push({
                    type: 'tool',
                    content: toolEvent,
                    timestamp: new Date(),
                  });
                });
              }
            } catch (error) {
              console.error('Failed to parse calledTools data:', error);
            }
          } else if (obj.event === 'usedTools' && obj.data) {
            hasToolEvent = true;

            // Если есть накопленный текст, добавляем его как блок
            if (currentTextBlock) {
              contentBlocks.push({
                type: 'text',
                content: currentTextBlock,
                timestamp: new Date(),
              });
              currentTextBlock = '';
            }

            try {
              const usedTools = Array.isArray(obj.data) ? obj.data : [obj.data];
              usedTools.forEach((usedTool, index) => {
                const toolEvent: ToolEventType = {
                  id: `${messageId}-used-${index}`,
                  type: 'usedTools',
                  toolName: usedTool.tool,
                  toolInput: usedTool.toolInput,
                  toolOutput: usedTool.toolOutput,
                  timestamp: new Date(),
                };
                contentBlocks.push({
                  type: 'tool',
                  content: toolEvent,
                  timestamp: new Date(),
                });
              });
            } catch (error) {
              console.error('Failed to parse usedTools data:', error);
            }
          }

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
          textChunk.includes('"event":"usedTools"') ||
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

        // Накопляем текст в текущем блоке
        if (textChunk && !hasToolEvent) {
          currentTextBlock += textChunk;
        }

        fullResponse += textChunk;

        // Update the message in real-time without typing effect
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  text: fullResponse,
                  isTyping: false,
                  contentBlocks: [
                    ...contentBlocks,
                    ...(currentTextBlock
                      ? [
                          {
                            type: 'text' as const,
                            content: currentTextBlock,
                            timestamp: new Date(),
                          },
                        ]
                      : []),
                  ],
                }
              : msg
          )
        );
      }

      // Mark as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isTyping: false } : msg
        )
      );

      return { text: fullResponse };
    } catch (error) {
      logError('Failed to send message via SDK streaming', { error });
      throw error;
    }
  };

  /**
   * Sends a user message to the backend and handles the response.
   */
  const query = async (data: { question: string }) => {
    const startTime = Date.now();
    const endpoint = `http://localhost:3000/api/v1/prediction/${selectedAgentId}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const duration = Date.now() - startTime;
      const status = response.status;

      if (status >= 200 && status < 300) {
        logSuccess(`Message sent successfully`, { duration, status });
      } else {
        logError(`Message failed with status ${status}`, { duration, status });
      }

      const result = await response.json();

      // Выводим raw данные в консоль
      console.log('=== RAW API RESPONSE ===');
      console.log('Type:', typeof result);
      console.log('Value:', result);
      console.log('Stringified:', JSON.stringify(result, null, 2));
      console.log('========================');

      // Проверяем, есть ли информация об использованных инструментах
      if (result.usedTools && Array.isArray(result.usedTools)) {
        console.log('=== TOOLS USED IN API RESPONSE ===');
        result.usedTools.forEach(
          (tool: Record<string, unknown>, index: number) => {
            console.log(`Tool ${index + 1}:`, tool);
          }
        );
        console.log('==================================');
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('Failed to send message', { error, duration });
      throw error;
    }
  };

  // TODO: Add error boundary, loading indicator improvements, and better accessibility.

  return (
    <div
      className='w-full h-screen min-h-screen bg-black text-[#00ff41] font-[Fira_Mono,Consolas,monospace] relative overflow-hidden flex flex-col'
      data-terminal='true'
    >
      <header
        role='banner'
        aria-label='Matrix Terminal Header'
        data-terminal-header='true'
        className='shrink-0'
      >
        <ChatHeader />
      </header>
      <div
        className='flex flex-col flex-1 min-h-0 w-full'
        style={{ height: '100%' }}
      >
        {/* Agent Selector */}
        <AgentSelector
          onAgentSelect={handleAgentSelect}
          currentAgentId={selectedAgentId}
          apiKey={apiKey}
          setApiKey={setApiKey}
          useSSE={useSSE}
          setUseSSE={setUseSSE}
          sseSupported={sseSupported}
        />

        {/* Agent Info */}
        <AgentInfo
          agent={selectedAgent}
          isConnected={isConnected}
          selectedAgentId={selectedAgentId}
          onDeployAgent={handleDeployAgent}
        />

        <main
          role='main'
          aria-label='Matrix Chat'
          data-terminal-chat='true'
          className='flex-1 min-h-0 w-full overflow-y-auto relative'
          ref={messagesContainerRef}
          tabIndex={0}
          onClick={() => inputRef.current && inputRef.current.focus()}
        >
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSend={handleSendMessage}
          />
          <input
            ref={inputRef}
            type='text'
            aria-label='Terminal input'
            autoFocus
            tabIndex={0}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            style={{
              opacity: 0,
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '2.2em',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />
        </main>
      </div>

      {/* Log Viewer */}
      <LogViewer
        logs={logs}
        isVisible={isLogVisible}
        onToggle={() => setIsLogVisible(!isLogVisible)}
        onClearLogs={() => setLogs([])}
      />
    </div>
  );
};

export default Chat;
