/*
 * useWallet.ts
 * Custom hook for Solana wallet management
 */

import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import type { WalletUser } from '@/shared/types/wallet';

export const useWallet = () => {
  const {
    publicKey,
    connecting,
    connected,
    disconnecting,
    select,
    wallet,
    wallets,
    disconnect,
  } = useSolanaWallet();

  // Create wallet user object
  const user: WalletUser | null = useMemo(() => {
    if (!publicKey) return null;

    return {
      publicKey,
      address: publicKey.toBase58(),
      isConnected: connected,
      isConnecting: connecting,
      isDisconnected: !connected,
    };
  }, [publicKey, connected, connecting]);

  // Wallet connection state
  const isAuthenticated = connected;
  const isLoading = connecting || disconnecting;
  const availableWallets = wallets;

  return {
    // User state
    user,
    isAuthenticated,
    isLoading,

    // Available wallets
    availableWallets,
    selectedWallet: wallet,

    // Actions
    connect: select,
    disconnect,

    // Connection state
    isConnected: connected,
    isConnecting: connecting,
    isDisconnecting: disconnecting,
  };
};
