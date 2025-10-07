// React hook for wallet management

import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { WalletInfo, PhantomWallet } from '../types';

declare global {
  interface Window {
    solana?: PhantomWallet;
  }
}

export const useWallet = () => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: '',
    connected: false,
    connecting: false,
  });

  useEffect(() => {
    checkWalletConnection();

    // Listen for wallet events
    if (window.solana) {
      window.solana.on('connect', handleConnect);
      window.solana.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.solana) {
        window.solana.off('connect', handleConnect);
        window.solana.off('disconnect', handleDisconnect);
      }
    };
  }, []);

  const checkWalletConnection = useCallback(async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        // Check if already connected
        // Note: This is a simplified check
        setWalletInfo(prev => ({ ...prev, connected: false }));
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }, []);

  const handleConnect = useCallback((publicKey: PublicKey) => {
    setWalletInfo({
      address: publicKey.toString(),
      connected: true,
      connecting: false,
    });
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletInfo({
      address: '',
      connected: false,
      connecting: false,
    });
  }, []);

  const connect = useCallback(async () => {
    try {
      setWalletInfo(prev => ({ ...prev, connecting: true }));

      if (!window.solana) {
        throw new Error(
          'Phantom wallet not found. Please install Phantom wallet.'
        );
      }

      if (!window.solana.isPhantom) {
        throw new Error('Please use Phantom wallet.');
      }

      const response = await window.solana.connect();
      // handleConnect will be called by the event listener
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletInfo(prev => ({ ...prev, connecting: false }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
      }
      // handleDisconnect will be called by the event listener
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }, []);

  return {
    ...walletInfo,
    connect,
    disconnect,
    publicKey: walletInfo.connected ? new PublicKey(walletInfo.address) : null,
  };
};
