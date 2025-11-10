import { useEffect, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';

const PHANTOM_DOWNLOAD_URL = 'https://phantom.app/download';

const STATUS_CLASSNAMES: Record<string, string> = {
  ready: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  action: 'bg-amber-50 text-amber-700 ring-amber-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  offline: 'bg-rose-50 text-rose-700 ring-rose-200',
  checking: 'bg-slate-100 text-slate-600 ring-slate-200',
};

type StatusState = 'ready' | 'action' | 'warning' | 'offline' | 'checking';

type StatusItem = {
  id: string;
  label: string;
  state: StatusState;
  message: string;
};

declare global {
  interface Window {
    solana?: any;
  }
}

export default function WalletConnect() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { handleError } = useErrorHandler();

  const [connecting, setConnecting] = useState(false);
  const [hasPhantom, setHasPhantom] = useState<boolean | null>(null);
  const [networkStatus, setNetworkStatus] = useState<StatusState>('checking');
  const [networkMessage, setNetworkMessage] = useState('Checking RPC health…');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [rpcDetails, setRpcDetails] = useState<{ endpoint?: string; version?: string; latencyMs?: number }>({});

  const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('wallet-advanced-open');
    if (stored) {
      setAdvancedOpen(stored === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('wallet-advanced-open', advancedOpen ? 'true' : 'false');
  }, [advancedOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const phantomDetected = Boolean(window.solana?.isPhantom);
    setHasPhantom(phantomDetected);

    const runNetworkProbe = async () => {
      if (isTestEnv) {
        setNetworkStatus('ready');
        setNetworkMessage('Test environment – skipping RPC probe');
        setRpcDetails({ endpoint: 'mock://test-environment' });
        return;
      }
      try {
        const { Connection, clusterApiUrl } = await import('@solana/web3.js');
        const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet');
        const connection = new Connection(endpoint, 'confirmed');
        const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const version = await connection.getVersion();
        const latency = typeof performance !== 'undefined' ? Math.round(performance.now() - start) : 0;
        setRpcDetails({ endpoint, version: version['solana-core'], latencyMs: latency });
        setNetworkStatus(latency > 1200 ? 'warning' : 'ready');
        setNetworkMessage(latency > 1200 ? `RPC responding slowly (${latency}ms)` : `RPC healthy (${version['solana-core']})`);
      } catch (error) {
        console.error('[wallet] RPC probe failed', error);
        setNetworkStatus('offline');
        setNetworkMessage('Unable to reach RPC endpoint');
      }
    };

    runNetworkProbe();

    if (phantomDetected && window.solana) {
      window.solana.on('connect', handleWalletConnect);
      window.solana.on('disconnect', handleWalletDisconnect);
    }

    return () => {
      if (typeof window !== 'undefined' && window.solana) {
        window.solana.off?.('connect', handleWalletConnect);
        window.solana.off?.('disconnect', handleWalletDisconnect);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusItems: StatusItem[] = useMemo(() => {
    const extensionState: StatusItem = {
      id: 'extension',
      label: 'Wallet extension',
      state: hasPhantom ? 'ready' : hasPhantom === false ? 'action' : 'checking',
      message: hasPhantom ? 'Phantom detected' : hasPhantom === false ? 'Install Phantom to continue' : 'Scanning…',
    };

    const authState: StatusItem = {
      id: 'authentication',
      label: 'Authentication',
      state: isAuthenticated ? 'ready' : 'action',
      message: isAuthenticated && user?.walletAddress ? `${user.walletAddress.toString().slice(0, 4)}…${user.walletAddress.toString().slice(-4)}` : 'Connect your wallet to authenticate',
    };

    const networkState: StatusItem = {
      id: 'network',
      label: 'Solana network',
      state: networkStatus,
      message: networkMessage,
    };

    return [extensionState, networkState, authState];
  }, [hasPhantom, isAuthenticated, networkMessage, networkStatus, user]);

  const handleWalletConnect = async (publicKey: PublicKey) => {
    try {
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
      if (typeof window === 'undefined') return;
      if (!window.solana || !window.solana.isPhantom) {
        window.open(PHANTOM_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
        return;
      }

      setConnecting(true);
      await window.solana.connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      handleError(error, 'Failed to connect wallet');
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.solana?.disconnect) {
        await window.solana.disconnect();
      }
    } catch (error) {
      handleError(error, 'Failed to disconnect wallet');
    }
  };

  const renderStatusItem = (status: StatusItem) => (
    <div key={status.id} className={`flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-medium ring-1 ${STATUS_CLASSNAMES[status.state]}`}> 
      <span className='mr-2'>{status.label}</span>
      <span className='truncate text-right'>{status.message}</span>
    </div>
  );

  const renderAdvancedDetails = () => {
    if (!advancedOpen) return null;

    return (
      <div className='mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600'>
        <div className='flex justify-between'><span className='font-semibold text-slate-500'>RPC endpoint</span><span className='truncate'>{rpcDetails.endpoint || '—'}</span></div>
        <div className='flex justify-between'><span className='font-semibold text-slate-500'>RPC version</span><span>{rpcDetails.version || '—'}</span></div>
        <div className='flex justify-between'><span className='font-semibold text-slate-500'>Latency</span><span>{rpcDetails.latencyMs != null ? `${rpcDetails.latencyMs} ms` : '—'}</span></div>
        <div className='flex justify-between'><span className='font-semibold text-slate-500'>Environment</span><span>{process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV}</span></div>
        {user?.walletAddress && (
          <div className='flex justify-between'><span className='font-semibold text-slate-500'>Wallet address</span><span>{user.walletAddress.toString()}</span></div>
        )}
      </div>
    );
  };

  const renderActionButton = () => {
    if (isAuthenticated && user) {
      return (
        <button
          onClick={disconnectWallet}
          className='rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700'
        >
          Disconnect
        </button>
      );
    }

    if (hasPhantom === false) {
      return (
        <button
          onClick={() => window.open(PHANTOM_DOWNLOAD_URL, '_blank', 'noopener,noreferrer')}
          className='rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700'
        >
          Install Phantom
        </button>
      );
    }

    return (
      <button
        onClick={connectWallet}
        disabled={connecting}
        className='rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-emerald-300'
      >
        {connecting ? 'Connecting…' : 'Connect wallet'}
      </button>
    );
  };

  const renderChecklist = () => {
    if (hasPhantom !== false) return null;

    return (
      <ol className='mt-4 space-y-2 text-xs text-slate-600'>
        <li><strong className='font-semibold text-slate-700'>Step 1.</strong> Install Phantom for your browser via the official store.</li>
        <li><strong className='font-semibold text-slate-700'>Step 2.</strong> Pin the extension and complete the onboarding flow.</li>
        <li><strong className='font-semibold text-slate-700'>Step 3.</strong> Return here and select “Connect wallet”.</li>
      </ol>
    );
  };

  return (
    <div className='w-full rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex-1'>
          <p className='text-xs font-semibold uppercase tracking-wide text-emerald-600'>Wallet readiness</p>
          <div className='mt-3 grid gap-2 sm:max-w-lg'>
            {statusItems.map(renderStatusItem)}
          </div>
        </div>
        <div className='flex flex-col items-stretch gap-2 sm:w-auto'>{renderActionButton()}</div>
      </div>

      {renderChecklist()}

      <div className='mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500'>
        <button
          type='button'
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className='font-semibold text-emerald-600 hover:text-emerald-700'
        >
          {advancedOpen ? 'Hide advanced details' : 'Show advanced details'}
        </button>
        <button
          type='button'
          onClick={() => {
            setNetworkStatus('checking');
            setNetworkMessage('Rechecking RPC health…');
            (async () => {
              if (isTestEnv) {
                setTimeout(() => {
                  setNetworkStatus('ready');
                  setNetworkMessage('Test environment – skipping RPC probe');
                }, 100);
                return;
              }
              try {
                const { Connection, clusterApiUrl } = await import('@solana/web3.js');
                const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet');
                const connection = new Connection(endpoint, 'confirmed');
                const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
                const version = await connection.getVersion();
                const latency = typeof performance !== 'undefined' ? Math.round(performance.now() - start) : 0;
                setRpcDetails({ endpoint, version: version['solana-core'], latencyMs: latency });
                setNetworkStatus(latency > 1200 ? 'warning' : 'ready');
                setNetworkMessage(latency > 1200 ? `RPC responding slowly (${latency}ms)` : `RPC healthy (${version['solana-core']})`);
              } catch (error) {
                console.error('[wallet] manual RPC probe failed', error);
                setNetworkStatus('offline');
                setNetworkMessage('Unable to reach RPC endpoint');
              }
            })();
          }}
          className='rounded-full border border-emerald-200 px-3 py-1 font-semibold text-emerald-600 hover:border-emerald-300 hover:text-emerald-700'
        >
          Retry health check
        </button>
      </div>

      {renderAdvancedDetails()}
    </div>
  );
}
