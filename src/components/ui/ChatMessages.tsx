/*
 * ChatMessages.tsx
 * Terminal-style chat message list with markdown support and code copy feature.
 * Part of the Matrix terminal chat UI.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import '../styles/Chat.css';
import {
  TERMINAL_PROMPT_USER,
  TERMINAL_PROMPT_AGENT,
  TERMINAL_FONT,
  TERMINAL_GREEN,
  TERMINAL_BG,
} from '../theme';
import { markdownComponents } from './markdownConfig';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
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
}) => (
  <div
    className='w-full flex items-baseline message px-2'
    style={{
      fontFamily: TERMINAL_FONT,
      color: TERMINAL_GREEN,
      background: TERMINAL_BG,
      minHeight: '2.2em',
      lineHeight: '2.2em',
      marginBottom: '0',
    }}
    tabIndex={0}
    aria-label={message.isUser ? 'User message' : 'Agent message'}
    role='listitem'
  >
    <span className='text-xs mr-2' style={{ color: TERMINAL_GREEN }}>
      {message.isUser ? TERMINAL_PROMPT_USER : TERMINAL_PROMPT_AGENT}
    </span>
    <span className='flex-1 text-base whitespace-pre-wrap break-words'>
      <ReactMarkdown components={markdownComponents}>
        {message.text}
      </ReactMarkdown>
      {Boolean(isLastTyping) && <span className='typing-cursor'>|</span>}
    </span>
    <span
      className='text-xs ml-2 opacity-70'
      style={{ minWidth: 60, textAlign: 'right' }}
    >
      {message.timestamp.toLocaleTimeString()}
    </span>
  </div>
);

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  messagesEndRef,
  inputValue,
}) => (
  <div
    className='flex-1 min-h-0 w-full h-full overflow-y-auto overflow-x-hidden px-0 py-2'
    style={{ background: TERMINAL_BG, paddingBottom: 80 }}
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
        className='w-full flex items-baseline message px-2'
        style={{
          fontFamily: TERMINAL_FONT,
          color: TERMINAL_GREEN,
          background: TERMINAL_BG,
          minHeight: '2.2em',
          lineHeight: '2.2em',
          marginBottom: '0',
        }}
      >
        <span className='text-xs mr-2' style={{ color: TERMINAL_GREEN }}>
          {TERMINAL_PROMPT_AGENT}
        </span>
        <span className='flex-1 text-base whitespace-pre-wrap break-words'>
          <span className='typing-cursor'>|</span>
        </span>
      </div>
    )}
    <div ref={messagesEndRef} />
    {/* Terminal input line */}
    {!isLoading && (
      <div
        className='w-full flex items-baseline message px-2'
        style={{
          fontFamily: TERMINAL_FONT,
          color: TERMINAL_GREEN,
          background: TERMINAL_BG,
          minHeight: '2.2em',
          lineHeight: '2.2em',
          marginBottom: '0',
        }}
      >
        <span className='text-xs mr-2' style={{ color: TERMINAL_GREEN }}>
          {TERMINAL_PROMPT_USER}
        </span>
        <span className='flex-1 text-base whitespace-pre-wrap break-words'>
          {inputValue}
          <span className='typing-cursor'>|</span>
        </span>
      </div>
    )}
  </div>
);

export default ChatMessages;
