/*
 * WalletTransaction.tsx
 * Wallet transaction component for sending Solana transactions
 */

import React, { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import { useWalletContext } from '@/shared/lib/WalletContext';

interface WalletTransactionProps {
  className?: string;
}

export const WalletTransaction: FC<WalletTransactionProps> = ({
  className = '',
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { user } = useWalletContext();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendTransaction = async () => {
    if (!publicKey || !user) {
      setError('Wallet not connected');
      return;
    }

    if (!recipient || !amount) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate recipient address
      const recipientPubkey = new PublicKey(recipient);

      // Validate amount
      const amountInLamports = parseFloat(amount) * LAMPORTS_PER_SOL;
      if (isNaN(amountInLamports) || amountInLamports <= 0) {
        throw new Error('Invalid amount');
      }

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: amountInLamports,
        })
      );

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(
        signature,
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      setSuccess(`Transaction sent! Signature: ${signature}`);
      setRecipient('');
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <p className='text-gray-600'>
          Connect your wallet to send transactions
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg space-y-4 ${className}`}>
      <h3 className='text-lg font-medium'>Send SOL</h3>

      <div className='space-y-3'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Recipient Address
          </label>
          <input
            type='text'
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder='Enter recipient address'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Amount (SOL)
          </label>
          <input
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder='0.0'
            step='0.000001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
      </div>

      {error && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      {success && (
        <div className='p-3 bg-green-50 border border-green-200 rounded-md'>
          <p className='text-sm text-green-600'>{success}</p>
        </div>
      )}

      <button
        onClick={handleSendTransaction}
        disabled={loading || !recipient || !amount}
        className={`
          w-full px-4 py-2 rounded-md font-medium transition-colors
          ${
            loading || !recipient || !amount
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
        `}
      >
        {loading ? 'Sending...' : 'Send Transaction'}
      </button>
    </div>
  );
};
