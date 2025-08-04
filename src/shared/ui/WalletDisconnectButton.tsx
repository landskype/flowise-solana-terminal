/*
 * WalletDisconnectButton.tsx
 * Wallet disconnect button component
 */

import React, { FC } from 'react';
import { useWallet } from '@/shared/lib/useWallet';

interface WalletDisconnectButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const WalletDisconnectButton: FC<WalletDisconnectButtonProps> = ({
  className = '',
  children,
}) => {
  const { isConnected, disconnect } = useWallet();

  const handleDisconnect = () => {
    disconnect();
  };

  if (!isConnected) {
    return null;
  }

  return (
    <button
      onClick={handleDisconnect}
      className={`
        px-3 py-1.5 rounded-md font-medium transition-all duration-200
        bg-red-500 hover:bg-red-600 text-white text-sm
        ${className}
      `}
      title="Disconnect wallet"
    >
      {children || 'Disconnect'}
    </button>
  );
}; 