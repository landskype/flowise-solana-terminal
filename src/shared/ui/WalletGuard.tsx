/*
 * WalletGuard.tsx
 * Wallet guard component for protecting content that requires wallet connection
 */

import React, { FC, ReactNode } from 'react';
import { useWalletContext } from '@/shared/lib/WalletContext';
import { WalletConnectButton } from './WalletConnectButton';

interface WalletGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export const WalletGuard: FC<WalletGuardProps> = ({
  children,
  fallback,
  className = '',
}) => {
  const { isConnected, isLoading } = useWalletContext();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className='flex items-center space-x-2'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
          <span className='text-gray-600'>Connecting wallet...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}
      >
        <div className='text-center'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Wallet Required
          </h3>
          <p className='text-gray-600 mb-4'>
            Please connect your wallet to access this feature.
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
