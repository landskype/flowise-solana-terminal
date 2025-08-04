/*
 * WalletInfo.tsx
 * Wallet information display component
 */

import React from 'react';
import type { FC } from 'react';
import { useWallet } from '@/shared/lib/useWallet';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletDisconnectButton } from './WalletDisconnectButton';

interface WalletInfoProps {
  className?: string;
  showConnectButton?: boolean;
  showDisconnectButton?: boolean;
}

export const WalletInfo: FC<WalletInfoProps> = ({
  className = '',
  showConnectButton = true,
  showDisconnectButton = true,
}) => {
  const { user, isConnected, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500'></div>
        <span className='text-sm text-gray-600'>Connecting...</span>
      </div>
    );
  }

  if (!isConnected || !user) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className='text-sm text-gray-600'>Wallet not connected</div>
        {showConnectButton && <WalletConnectButton />}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className='flex flex-col'>
        <div className='text-sm font-medium text-gray-900'>
          Connected Wallet
        </div>
        <div className='text-xs text-gray-500 font-mono'>{user.address}</div>
      </div>
      <div className='flex items-center space-x-2'>
        {showConnectButton && <WalletConnectButton />}
        {showDisconnectButton && <WalletDisconnectButton />}
      </div>
    </div>
  );
};
