/*
 * Chat.tsx
 * Main chat container for the Matrix terminal UI.
 * Handles message state, typing effect, auto-scroll, and input.
 */

import React, { useState, useRef, useEffect } from 'react';
import '../styles/Chat.css';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import AgentSelector from './AgentSelector';
import AgentInfo from './AgentInfo';
import LogViewer from './LogViewer';
import type { FlowiseAgent } from '../../types/flowise';
import type { LogEntry } from './LogViewer';
import {
  setLogCallback,
  logInfo,
  logSuccess,
  logError,
  logAgentSelection,
} from '../utils/logger';

const AUTOSCROLL_THRESHOLD = 40; // px from bottom to trigger auto-scroll
const TYPING_INTERVAL = 30; // ms per character for typing effect
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
}

/**
 * Main chat component for the terminal UI.
 * Manages message state, typing animation, and input.
 */
const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(
    '/api/v1/prediction/1323ab8f-7677-4623-b327-fabb67019498'
  );
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLength = useRef(messages.length);

  // Initialize logging system
  useEffect(() => {
    setLogCallback((logEntry) => {
      setLogs((prev) => [...prev, logEntry]);
    });

    logInfo('Chat application started');
  }, []);

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
    try {
      const response = await query({ question: inputValue });
      const botMessage: Message = {
        id: uniqueId(),
        text: '',
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
      };
      appendMessageClearingTyping(botMessage);
      const fullText = response.text || response.response || ERROR_MESSAGE;
      typeMessage(botMessage.id, fullText);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: uniqueId(),
        text: ERROR_MESSAGE,
        isUser: false,
        timestamp: new Date(),
      };
      appendMessageClearingTyping(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Animates the agent's message as a typing effect.
   * Only updates the relevant message's isTyping state.
   */
  const typeMessage = (messageId: string, fullText: string) => {
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                text: fullText.slice(0, currentIndex),
                isTyping: currentIndex < fullText.length,
              }
            : msg
        )
      );
      if (currentIndex++ >= fullText.length) {
        clearInterval(typeInterval);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isTyping: false } : msg
          )
        );
      }
    }, TYPING_INTERVAL);
  };

  /**
   * Skips the typing effect for a message.
   */
  const skipTyping = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              isTyping: false,
            }
          : msg
      )
    );
  };

  /**
   * Handles agent selection from AgentSelector
   */
  const handleAgentSelect = (
    agentId: string,
    agentName: string,
    agentData?: FlowiseAgent
  ) => {
    setSelectedAgentId(agentId);
    setSelectedAgent(agentData || null);
    setApiEndpoint(`/api/v1/prediction/${agentId}`);
    setIsConnected(true);
    logAgentSelection(agentId, agentName);
  };

  /**
   * Sends a user message to the backend and handles the response.
   */
  const query = async (data: { question: string }) => {
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(apiEndpoint, {
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
        />

        {/* Agent Info */}
        <AgentInfo agent={selectedAgent} isConnected={isConnected} />

        {/* API Configuration */}
        <div className='w-full bg-black border-b border-[#00ff41] p-2 flex items-center gap-2'>
          <label htmlFor='api-endpoint' className='text-xs text-[#00ff41] mr-2'>
            API Endpoint:
          </label>
          <input
            id='api-endpoint'
            type='text'
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            className='flex-1 bg-black text-[#00ff41] border border-[#00ff41] px-2 py-1 text-xs font-mono always-focus'
            style={{ minWidth: 200 }}
            autoComplete='off'
          />
          <label htmlFor='chat-api-key' className='text-xs text-[#00ff41] mr-2'>
            API Key:
          </label>
          <input
            id='chat-api-key'
            type='password'
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className='flex-1 bg-black text-[#00ff41] border border-[#00ff41] px-2 py-1 text-xs font-mono'
            placeholder='Enter API key'
            autoComplete='off'
          />
        </div>
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
            skipTyping={skipTyping}
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
      />
    </div>
  );
};

export default Chat;
