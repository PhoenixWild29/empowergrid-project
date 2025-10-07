import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { PhantomWallet } from '../types/api';

declare global {
  interface Window {
    solana?: PhantomWallet;
  }
}

export default function WalletConnect() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { handleError } = useErrorHandler();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    checkWalletConnection();

    // Listen for wallet changes
    if (window.solana) {
      window.solana.on('connect', handleWalletConnect);
      window.solana.on('disconnect', handleWalletDisconnect);
    }

    return () => {
      if (window.solana) {
        window.solana.off('connect', handleWalletConnect);
        window.solana.off('disconnect', handleWalletDisconnect);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        // Check if we have an authenticated user with a wallet
        // The auth context will handle restoring the session
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleWalletConnect = async (publicKey: PublicKey) => {
    try {
      // When wallet connects, authenticate the user
      await login(publicKey);
    } catch (error) {
      handleError(error, 'Failed to authenticate with wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      await logout();
    } catch (error) {
      handleError(error, 'Failed to logout');
    }
  };

  const connectWallet = async () => {
    try {
      setConnecting(true);
      if (!window.solana) {
        alert('Phantom wallet not found. Please install Phantom wallet.');
        return;
      }

      if (!window.solana.isPhantom) {
        alert('Please use Phantom wallet.');
        return;
      }

      // This will trigger the 'connect' event which calls handleWalletConnect
      await window.solana.connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      handleError(error, 'Failed to connect wallet');
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
      }
      // This will trigger the 'disconnect' event which calls handleWalletDisconnect
    } catch (error) {
      handleError(error, 'Failed to disconnect wallet');
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className='flex items-center space-x-4'>
        <div className='text-right'>
          <div className='text-sm font-medium text-gray-900'>
            {user.username ||
              `User_${user.walletAddress.toString().slice(0, 8)}`}
          </div>
          <div className='text-xs text-gray-500'>
            {user.walletAddress.toString().slice(0, 4)}...
            {user.walletAddress.toString().slice(-4)}
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium'
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      className='bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md text-sm font-medium'
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
