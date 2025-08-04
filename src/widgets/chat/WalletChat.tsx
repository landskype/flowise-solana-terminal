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
      {/* Original ChatHeader */}
      <ChatHeader />

      {/* Wallet status bar when connected */}
      {isConnected && user && (
        <div className='flex items-center justify-between p-2 bg-gray-50 border-b'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm text-gray-600'>Wallet:</span>
            <span className='text-sm font-mono text-gray-800'>
              {user.address.slice(0, 8)}...{user.address.slice(-8)}
            </span>
          </div>
          <div className='flex items-center space-x-2'>
            <WalletStatus />
            <WalletDisconnectButton />
          </div>
        </div>
      )}

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
