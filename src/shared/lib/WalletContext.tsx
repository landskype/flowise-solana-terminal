/*
 * WalletContext.tsx
 * Wallet context provider for global wallet state management
 */

import React, { createContext, useContext, FC, ReactNode } from 'react';
import { useWallet } from './useWallet';
import type { WalletUser } from '@/shared/types/wallet';

interface WalletContextType {
  user: WalletUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  availableWallets: any[];
  selectedWallet: any;
  connect: (walletName: string) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  const walletState = useWallet();

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error(
      'useWalletContext must be used within a WalletContextProvider'
    );
  }
  return context;
};
