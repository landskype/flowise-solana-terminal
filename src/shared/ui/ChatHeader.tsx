/*
 * ChatHeader.tsx
 * Chat header component with Matrix terminal styling
 */

import React from 'react';
import type { FC } from 'react';
import {
  TERMINAL_FONT,
  TERMINAL_GREEN,
  TERMINAL_GREEN_FADED,
} from '@/shared/config/theme';
import { useWalletContext } from '@/shared/lib/WalletContext';
import { getWalletPrompt } from '@/shared/lib/utils';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletDisconnectButton } from './WalletDisconnectButton';

const ChatHeader: FC = () => {
  const { user, isConnected } = useWalletContext();
  const walletPrompt = getWalletPrompt(user?.address);

  return (
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
      <div className='flex items-center justify-center space-x-4 mt-1'>
        <p
          className='text-base mb-0'
          style={{ color: TERMINAL_GREEN_FADED, fontFamily: TERMINAL_FONT }}
        >
          {walletPrompt}
        </p>
        {!isConnected ? (
          <WalletConnectButton className='text-xs px-2 py-1 bg-transparent border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black'>
            Connect
          </WalletConnectButton>
        ) : (
          <WalletDisconnectButton className='text-xs px-2 py-1 bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'>
            Disconnect
          </WalletDisconnectButton>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
