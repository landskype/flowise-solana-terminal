/*
 * ChatMessages.tsx
 * Terminal-style chat message list with markdown support and code copy feature.
 * Part of the Matrix terminal chat UI.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import '@/shared/ui/Chat.css';
import { TERMINAL_PROMPT_USER, TERMINAL_PROMPT_AGENT } from '@/shared/config/theme';
import { markdownComponents } from '@/shared/ui/markdownConfig';
import ToolEvent from '@/entities/chat/ToolEvent';
import type { ToolEvent as ToolEventType } from '@/entities/chat/ToolEvent';

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

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputValue: string;
  setInputValue: (val: string) => void;
  handleSend: () => void;
}

interface ChatMessageItemProps {
  message: Message;
  isLastTyping: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isLastTyping,
}) => {
  // Если есть contentBlocks, отображаем их в хронологическом порядке
  if (message.contentBlocks && message.contentBlocks.length > 0) {
    return (
      <div className='w-full' style={{ width: '100%', maxWidth: '100%' }}>
        <div
          className='w-full flex items-baseline message px-2 min-h-[2.2em] leading-[2.2em] mb-0 font-terminal text-terminal-green bg-terminal-bg'
          style={{ width: '100%', maxWidth: '100%' }}
          tabIndex={0}
          aria-label={message.isUser ? 'User message' : 'Agent message'}
          role='listitem'
        >
          <span className='text-xs mr-2 text-terminal-green'>
            {message.isUser ? TERMINAL_PROMPT_USER : TERMINAL_PROMPT_AGENT}
          </span>
          <div
            className='flex-1 text-base whitespace-pre-wrap break-words text-terminal-green prose prose-invert max-w-none'
            style={{ width: '100%', maxWidth: '100%' }}
          >
            {/* Отображаем contentBlocks в хронологическом порядке */}
            {message.contentBlocks.map((block, index) => (
              <React.Fragment key={`${message.id}-block-${index}`}>
                {block.type === 'text' ? (
                  <ReactMarkdown components={markdownComponents}>
                    {block.content as string}
                  </ReactMarkdown>
                ) : (
                  <div className='ml-4'>
                    <ToolEvent event={block.content as ToolEventType} />
                  </div>
                )}
              </React.Fragment>
            ))}
            {Boolean(isLastTyping) && (
              <span className='typing-cursor animate-blink'>|</span>
            )}
          </div>
          <span className='text-xs ml-2 opacity-70 min-w-[60px] text-right'>
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  }

  // Fallback для старых сообщений без contentBlocks
  return (
    <div className='w-full' style={{ width: '100%', maxWidth: '100%' }}>
      <div
        className='w-full flex items-baseline message px-2 min-h-[2.2em] leading-[2.2em] mb-0 font-terminal text-terminal-green bg-terminal-bg'
        style={{ width: '100%', maxWidth: '100%' }}
        tabIndex={0}
        aria-label={message.isUser ? 'User message' : 'Agent message'}
        role='listitem'
      >
        <span className='text-xs mr-2 text-terminal-green'>
          {message.isUser ? TERMINAL_PROMPT_USER : TERMINAL_PROMPT_AGENT}
        </span>
        <div
          className='flex-1 text-base whitespace-pre-wrap break-words text-terminal-green prose prose-invert max-w-none'
          style={{ width: '100%', maxWidth: '100%' }}
        >
          <ReactMarkdown components={markdownComponents}>
            {message.text}
          </ReactMarkdown>
          {Boolean(isLastTyping) && (
            <span className='typing-cursor animate-blink'>|</span>
          )}
        </div>
        <span className='text-xs ml-2 opacity-70 min-w-[60px] text-right'>
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>

      {/* Отображение событий инструментов */}
      {message.toolEvents && message.toolEvents.length > 0 && (
        <div className='ml-4'>
          {message.toolEvents.map((toolEvent) => (
            <ToolEvent key={toolEvent.id} event={toolEvent} />
          ))}
        </div>
      )}
    </div>
  );
};

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  messagesEndRef,
  inputValue,
}) => (
  <div
    className='flex-1 min-h-0 w-full h-full overflow-y-auto overflow-x-hidden px-0 py-2 bg-terminal-bg pb-20'
    style={{ width: '100%', maxWidth: '100%' }}
    aria-live='polite'
    aria-label='Chat messages'
    role='list'
  >
    {messages.map((message, idx) => (
      <ChatMessageItem
        key={message.id}
        message={message}
        isLastTyping={Boolean(
          isLoading &&
            !message.isUser &&
            message.isTyping === true &&
            idx === messages.length - 1
        )}
      />
    ))}
    {isLoading && (
      <div
        className='w-full flex items-baseline message px-2 min-h-[2.2em] leading-[2.2em] mb-0 font-terminal text-terminal-green bg-terminal-bg'
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <span className='text-xs mr-2 text-terminal-green'>
          {TERMINAL_PROMPT_AGENT}
        </span>
        <span
          className='flex-1 text-base whitespace-pre-wrap break-words text-terminal-green'
          style={{ width: '100%', maxWidth: '100%' }}
        >
          <span className='typing-cursor animate-blink'>|</span>
        </span>
      </div>
    )}
    <div ref={messagesEndRef} />
    {/* Terminal input line */}
    {!isLoading && (
      <div
        className='w-full flex items-baseline message px-2 min-h-[2.2em] leading-[2.2em] mb-0 font-terminal text-terminal-green bg-terminal-bg'
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <span className='text-xs mr-2 text-terminal-green'>
          {TERMINAL_PROMPT_USER}
        </span>
        <span
          className='flex-1 text-base whitespace-pre-wrap break-words text-terminal-green'
          style={{ width: '100%', maxWidth: '100%' }}
        >
          {inputValue}
          <span className='typing-cursor animate-blink'>|</span>
        </span>
      </div>
    )}
  </div>
);

export default ChatMessages;
