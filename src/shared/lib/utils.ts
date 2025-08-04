/*
 * utils.ts
 * Utility functions for the application
 */

import React from 'react';

/**
 * Recursively extracts all text from React children (for code copy logic).
 */
export function extractTextFromChildren(children: React.ReactNode): string {
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (typeof children === 'string') return children;
  if (
    React.isValidElement(children) &&
    children.props &&
    typeof children.props === 'object' &&
    'children' in children.props
  ) {
    return extractTextFromChildren(
      (children.props as { children?: React.ReactNode }).children
    );
  }
  return '';
}

// Default prompt when wallet is not connected
const DEFAULT_TERMINAL_PROMPT = 'user@root:~$';

/**
 * Get wallet address prompt for terminal
 * @param walletAddress - Wallet address to display
 * @returns Formatted terminal prompt with wallet address
 */
export const getWalletPrompt = (walletAddress?: string): string => {
  if (!walletAddress) {
    return DEFAULT_TERMINAL_PROMPT;
  }

  // Truncate address to show first 4 and last 4 characters
  const truncatedAddress = `${walletAddress.slice(
    0,
    4
  )}...${walletAddress.slice(-4)}`;
  return `${truncatedAddress}@solana:~$`;
};

/**
 * Format wallet address for display
 * @param address - Full wallet address
 * @param startChars - Number of characters to show at start
 * @param endChars - Number of characters to show at end
 * @returns Formatted wallet address
 */
export const formatWalletAddress = (
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string => {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
