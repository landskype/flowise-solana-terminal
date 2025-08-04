/*
 * ChatHeader.tsx
 * Header for the Matrix terminal chat UI.
 */

import React from 'react';
import { TERMINAL_FONT, TERMINAL_GREEN, TERMINAL_GREEN_FADED } from '../theme';

/**
 * Renders the terminal-style header with Matrix branding.
 */
const ChatHeader: React.FC = () => (
  <header
    className='w-full bg-black border-b-2 border-[#00ff41] text-center py-6 px-0 select-none'
    style={{ letterSpacing: '2px', fontFamily: TERMINAL_FONT }}
  >
    <h2
      className='text-xl font-bold m-0'
      style={{ color: TERMINAL_GREEN, fontFamily: TERMINAL_FONT }}
    >
      ai-terminal-v0.5
    </h2>
    <p
      className='text-base mt-1 mb-0'
      style={{ color: TERMINAL_GREEN_FADED, fontFamily: TERMINAL_FONT }}
    >
      user@root
    </p>
  </header>
);

export default ChatHeader;
