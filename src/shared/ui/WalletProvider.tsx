/*
 * WalletProvider.tsx
 * Wallet provider wrapper component
 */

import React from 'react';
import type { FC, ReactNode } from 'react';
import { SolanaProvider } from '@/app/providers/SolanaProvider';
import { WalletContextProvider } from '@/shared/lib/WalletContext';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  return (
    <SolanaProvider>
      <WalletContextProvider>{children}</WalletContextProvider>
    </SolanaProvider>
  );
};
