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
import {
  checkFlowiseSSESupport,
  testSSEConnection,
} from '@/shared/lib/flowiseApi';
import {
  initializeFlowiseClient,
  sendPredictionWithSDK,
  deployAgentWithSDK,
} from '@/shared/lib/flowiseSdk';
import { useWalletContext } from '@/shared/lib/WalletContext';
import {
  deleteFlowiseChat,
  fetchFlowiseChatHistory,
  listFlowiseChatSessions,
} from '@/shared/lib/flowiseApi';
import type { FlowiseChatSessionSummary } from '@/shared/lib/flowiseApi';

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
  const { user } = useWalletContext();
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [chatMessagesLoaded, setChatMessagesLoaded] = useState(false);
  const [chatIdInput, setChatIdInput] = useState('');
  const [sessions, setSessions] = useState<FlowiseChatSessionSummary[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [flowiseUrl, setFlowiseUrl] = useState('http://localhost:3000');
  const [sessionsRefreshKey, setSessionsRefreshKey] = useState(0);

  // React to wallet changes; clear chat state but do not force chatId
  useEffect(() => {
    const walletAddress = user?.address;
    if (!walletAddress) {
      setChatId(undefined);
      setChatMessagesLoaded(false);
      return;
    }
    setChatMessagesLoaded(false);
  }, [user?.address]);

  // Initialize logging system and check SSE support
  useEffect(() => {
    setLogCallback((logEntry) => {
      setLogs((prev) => [...prev, logEntry]);
    });

    logInfo('Chat application started');

    // Initialize Flowise SDK
    const initSDK = async () => {
      try {
        const initialized = initializeFlowiseClient(flowiseUrl, apiKey);
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
        const supported = await checkFlowiseSSESupport(flowiseUrl, apiKey);
        setSseSupported(supported);
        logInfo(`SSE support: ${supported ? 'Available' : 'Not available'}`);

        // Test SSE connectivity if supported
        if (supported) {
          const testResult = await testSSEConnection(
            flowiseUrl,
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
  }, [apiKey, flowiseUrl, selectedAgentId]);

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
          const response = await query({ question: inputValue, chatId });
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
            false, // no streaming
            chatId
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
          const response = await query({ question: inputValue, chatId });
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
      // Use HEAD request to check if agent endpoint exists without creating a chat
      const testResponse = await fetch(
        `${flowiseUrl}/api/v1/prediction/${agentId}`,
        {
          method: 'HEAD',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      // If we get a response (even with error), the agent is deployed
      return testResponse.status !== 404;
    } catch (error) {
      // If we get a network error, consider agent not deployed
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
    setChatMessagesLoaded(false);

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
  // Load chat history when agent and chatId are available and not yet loaded
  useEffect(() => {
    const loadHistory = async () => {
      if (!chatId || !selectedAgentId || chatMessagesLoaded === true) return;
      try {
        const history = await fetchFlowiseChatHistory(
          flowiseUrl,
          selectedAgentId,
          chatId,
          apiKey
        );
        if (history && history.length > 0) {
          const parsed = history.map((h, idx) => {
            const isUser = (h.role || '').toLowerCase() === 'user';
            const content = (h.text || h.message || h.content || '') as string;
            return {
              id: uniqueId() + '-' + idx,
              text: content,
              isUser,
              timestamp: new Date(h.createdAt || Date.now()),
            } as Message;
          });
          setMessages(parsed);
        } else {
          setMessages([]);
        }
      } catch (e) {
        logError('Failed to load chat history', e);
      } finally {
        setChatMessagesLoaded(true);
      }
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, selectedAgentId, apiKey]);

  // Load available sessions for current agent (filtered by wallet address)
  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedAgentId) return;
      const list = await listFlowiseChatSessions(
        flowiseUrl,
        selectedAgentId,
        apiKey
      );
      const filtered = user?.address
        ? list.filter((s) => s.chatId.startsWith(user.address))
        : list;
      setSessions(filtered);
      // Auto-select the newest chat if none selected yet
      if (!chatId && filtered.length > 0) {
        setChatId(filtered[0].chatId);
        setChatMessagesLoaded(false);
      }
    };
    loadSessions();
  }, [
    selectedAgentId,
    apiKey,
    showSessions,
    user?.address,
    flowiseUrl,
    sessionsRefreshKey,
    chatId,
  ]);

  const handleNewChat = async () => {
    if (!user?.address) return;
    // Start a fresh server-side session by using a new sessionId distinct from base wallet id
    const newId = `${user.address}:${Date.now().toString(36)}`;
    setChatId(newId);
    setMessages([]);
    setChatMessagesLoaded(true); // empty chat
    logInfo('New chat created', { chatId: newId, agentId: selectedAgentId });
  };

  const handleDeleteChat = async () => {
    if (!chatId || !selectedAgentId) return;
    const ok = await deleteFlowiseChat(
      flowiseUrl,
      selectedAgentId,
      chatId,
      apiKey
    );
    if (ok) {
      logSuccess('Chat deleted', { chatId });
      setMessages([]);
      setChatMessagesLoaded(true);
    } else {
      logError('Failed to delete chat', { chatId });
    }
  };

  const handleLoadChat = () => {
    if (!chatIdInput.trim()) return;
    setChatId(chatIdInput.trim());
    setChatMessagesLoaded(false);
    setMessages([]);
    logInfo('Load chat requested', {
      chatId: chatIdInput.trim(),
      agentId: selectedAgentId,
    });
  };

  /**
   * Deploys the selected agent
   */
  const handleDeployAgent = async () => {
    if (!selectedAgent) return;

    logInfo('Attempting to deploy agent', { agentId: selectedAgent.id });

    const success = await deployAgentWithSDK(
      selectedAgent.id,
      flowiseUrl,
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
        true, // streaming
        chatId
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
  const query = async (data: { question: string; chatId?: string }) => {
    const startTime = Date.now();
    const endpoint = `${flowiseUrl}/api/v1/prediction/${selectedAgentId}`;

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
        body: JSON.stringify({
          ...data,
          ...(data.chatId ? { sessionId: data.chatId } : {}),
        }),
      });

      const duration = Date.now() - startTime;
      const status = response.status;

      if (status >= 200 && status < 300) {
        logSuccess(`Message sent successfully`, { duration, status });
      } else {
        logError(`Message failed with status ${status}`, { duration, status });
      }

      const result = await response.json();

      // If server returns a chatId, keep it for subsequent requests
      if (result && result.chatId && result.chatId !== chatId) {
        setChatId(String(result.chatId));
      }

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
          onFlowiseUrlChange={setFlowiseUrl}
        />

        {/* Agent Info */}
        <AgentInfo
          agent={selectedAgent}
          isConnected={isConnected}
          selectedAgentId={selectedAgentId}
          onDeployAgent={handleDeployAgent}
        />

        {/* Chat Controls (terminal style) */}
        <div className='w-full bg-black border-b border-[#00ff41] p-2 flex items-center gap-2'>
          <button
            className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
            onClick={handleNewChat}
            title='Start a new chat session'
          >
            new_chat
          </button>
          <button
            className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
            onClick={handleDeleteChat}
            disabled={!chatId}
            title='Delete current chat session'
          >
            delete_chat
          </button>
          <button
            className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
            onClick={() => setShowSessions((v) => !v)}
            title='Toggle sessions list'
          >
            list_chats
          </button>
          <button
            className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
            onClick={() => setSessionsRefreshKey((x) => x + 1)}
            title='Refresh sessions'
          >
            refresh_chats
          </button>
          {/* Manual selector removed as requested */}
          <input
            type='text'
            value={chatIdInput}
            onChange={(e) => setChatIdInput(e.target.value)}
            placeholder='enter chatId'
            className='flex-1 bg-black text-[#00ff41] border border-[#00ff41] px-2 py-1 text-xs font-mono'
            autoComplete='off'
          />
          <button
            className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
            onClick={handleLoadChat}
            title='Load chat by id'
          >
            load_chat
          </button>
          <span className='text-xs text-[#00ff41] opacity-70 ml-auto flex items-center gap-2'>
            <span>chatId: {chatId || '—'}</span>
            <button
              className='bg-black text-[#00ff41] border border-[#00ff41] px-2 py-0.5 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
              onClick={async () => {
                if (!chatId) return;
                try {
                  await navigator.clipboard.writeText(chatId);
                  logSuccess('Chat ID copied to clipboard');
                } catch (e) {
                  logError('Failed to copy Chat ID', e);
                }
              }}
              disabled={!chatId}
              title='Copy chatId'
            >
              copy_id
            </button>
          </span>
        </div>

        {showSessions && (
          <div className='w-full bg-black border-b border-[#00ff41] p-2'>
            {sessions.length === 0 ? (
              <div className='text-xs text-[#00ff41] opacity-70'>no chats</div>
            ) : (
              <div className='space-y-1'>
                {sessions.map((s) => (
                  <div
                    key={s.chatId}
                    className='flex items-center gap-2 text-xs'
                  >
                    <button
                      className='bg-black text-[#00ff41] border border-[#00ff41] px-2 py-0.5 font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
                      onClick={() => {
                        setChatId(s.chatId);
                        setChatMessagesLoaded(false);
                        setMessages([]);
                      }}
                      title='Open chat'
                    >
                      open
                    </button>
                    <button
                      className='bg-black text-red-400 border border-red-400 px-2 py-0.5 font-mono hover:bg-red-400 hover:text-black transition-colors'
                      onClick={async () => {
                        const ok = await deleteFlowiseChat(
                          'http://localhost:3000',
                          selectedAgentId,
                          s.chatId,
                          apiKey
                        );
                        if (ok) {
                          setSessions((prev) =>
                            prev.filter((x) => x.chatId !== s.chatId)
                          );
                          if (chatId === s.chatId) {
                            setMessages([]);
                          }
                        }
                      }}
                      title='Delete chat'
                    >
                      del
                    </button>
                    <span className='text-[#00ff41] break-all'>{s.chatId}</span>
                    <span className='text-[#00ff41] opacity-60'>
                      {s.lastAt ? new Date(s.lastAt).toLocaleString() : ''}
                    </span>
                    <span className='text-[#00ff41] opacity-60'>
                      ({s.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
