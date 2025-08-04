/*
 * solana.ts
 * Solana configuration
 */

import { clusterApiUrl } from '@solana/web3.js';

export const SOLANA_CONFIG = {
  // Use devnet for development
  network: 'devnet' as const,
  endpoint: clusterApiUrl('devnet'),
  commitment: 'confirmed' as const,
  autoConnect: true,
} as const;

export const WALLET_ADAPTER_CONFIG = {
  wallets: [
    // Supported wallets
    'phantom',
    'solflare',
  ],
  autoConnect: true,
  onError: (error: Error) => {
    console.error('Wallet adapter error:', error);
  },
} as const;
