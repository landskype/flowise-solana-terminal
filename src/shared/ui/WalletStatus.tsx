/*
 * WalletStatus.tsx
 * Wallet status component for displaying connection and balance
 */

import React, { FC, useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWalletContext } from '@/shared/lib/WalletContext';

interface WalletStatusProps {
  className?: string;
}

export const WalletStatus: FC<WalletStatusProps> = ({ className = '' }) => {
  const { user, isConnected } = useWalletContext();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !user?.publicKey) {
        setBalance(null);
        return;
      }

      try {
        setLoading(true);
        const balance = await connection.getBalance(user.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [isConnected, user?.publicKey, connection]);

  if (!isConnected || !user) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <div className='flex items-center space-x-1'>
        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
        <span className='text-gray-600'>Connected</span>
      </div>
      {balance !== null && (
        <div className='text-gray-500'>
          {loading ? (
            <span>Loading...</span>
          ) : (
            <span>{balance.toFixed(4)} SOL</span>
          )}
        </div>
      )}
    </div>
  );
};
