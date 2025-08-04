/*
 * WalletConnectButton.tsx
 * Wallet connection button component
 */

import React, { FC } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@/shared/lib/useWallet';

interface WalletConnectButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const WalletConnectButton: FC<WalletConnectButtonProps> = ({
  className = '',
  children,
}) => {
  const { setVisible } = useWalletModal();
  const { isConnected, user, disconnect } = useWallet();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const getButtonText = () => {
    if (isConnected && user) {
      // Show truncated address
      const address = user.address;
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    return children || 'Connect Wallet';
  };

  return (
    <button
      onClick={handleClick}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${
          isConnected
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
        ${className}
      `}
    >
      {getButtonText()}
    </button>
  );
};
