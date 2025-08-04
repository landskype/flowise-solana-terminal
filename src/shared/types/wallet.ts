/*
 * wallet.ts
 * Type definitions for Solana wallet authentication
 */

import type { PublicKey } from '@solana/web3.js';

export interface WalletUser {
  publicKey: PublicKey;
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
}

export interface WalletAuthState {
  user: WalletUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface WalletConnectionConfig {
  network: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';
  autoConnect: boolean;
  commitment: 'processed' | 'confirmed' | 'finalized';
}
