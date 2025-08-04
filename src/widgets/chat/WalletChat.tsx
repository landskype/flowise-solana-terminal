/*
 * WalletChat.tsx
 * Wallet-aware chat component that integrates wallet functionality
 */

import React from 'react';
import type { FC } from 'react';
import {
  WalletGuard,
  WalletStatus,
  WalletDisconnectButton,
  WalletConnectButton,
} from '@/shared/ui';
import { useWalletContext } from '@/shared/lib/WalletContext';
import Chat from './Chat';
import ChatHeader from '@/shared/ui/ChatHeader';

interface WalletChatProps {
  className?: string;
}

export const WalletChat: FC<WalletChatProps> = ({ className = '' }) => {
  const { user, isConnected } = useWalletContext();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat with wallet guard */}
      <WalletGuard
        fallback={
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Connect Your Wallet
              </h2>
              <p className='text-gray-600 mb-4'>
                Connect your Solana wallet to start chatting with AI agents.
              </p>
              <WalletConnectButton />
            </div>
          </div>
        }
      >
        <Chat />
      </WalletGuard>
    </div>
  );
};
