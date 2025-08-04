/*
 * WalletHeader.tsx
 * Wallet header component for displaying wallet status
 */

import React from 'react';
import type { FC } from 'react';
import { WalletInfo } from './WalletInfo';

interface WalletHeaderProps {
  className?: string;
}

export const WalletHeader: FC<WalletHeaderProps> = ({ className = '' }) => {
  return (
    <div
      className={`flex justify-between items-center p-4 bg-gray-50 border-b ${className}`}
    >
      <div className='flex items-center space-x-4'>
        <h1 className='text-xl font-bold text-gray-900'>Solana Chat</h1>
      </div>
      <WalletInfo />
    </div>
  );
};
