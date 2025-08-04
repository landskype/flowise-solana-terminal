/*
 * ChatMessages.tsx
 * Chat messages display component with Matrix terminal styling
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { TERMINAL_PROMPT_AGENT } from '@/shared/config/theme';
import { markdownComponents } from '@/shared/ui/markdownConfig';
import ToolEvent from '@/entities/chat/ToolEvent';
import { useWalletContext } from '@/shared/lib/WalletContext';
import { getWalletPrompt } from '@/shared/lib/utils';
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
  const { user } = useWalletContext();
  const walletPrompt = getWalletPrompt(user?.address);

  // New message format with contentBlocks
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
            {message.isUser ? walletPrompt : TERMINAL_PROMPT_AGENT}
          </span>
          <div
            className='flex-1 text-base whitespace-pre-wrap break-words text-terminal-green prose prose-invert max-w-none'
            style={{ width: '100%', maxWidth: '100%' }}
          >
            {/* Display contentBlocks in chronological order */}
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

  // Fallback for old messages without contentBlocks
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
          {message.isUser ? walletPrompt : TERMINAL_PROMPT_AGENT}
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

      {/* Display tool events */}
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
}) => {
  const { user } = useWalletContext();
  const walletPrompt = getWalletPrompt(user?.address);

  return (
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
            {walletPrompt}
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
};

export default ChatMessages;
