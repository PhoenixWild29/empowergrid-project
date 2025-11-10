import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { EscrowConfig } from '../../lib/services/escrowConfigStore';

interface FetchState {
  loading: boolean;
  error?: string;
}

interface BalanceState {
  solBalanceLamports?: number;
  usdcBalance?: number;
  fetchedAt?: string;
  error?: string;
}

const DEFAULT_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';

export default function EscrowAdminPage() {
  const [config, setConfig] = useState<EscrowConfig | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>({ loading: true });
  const [saving, setSaving] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [balanceState, setBalanceState] = useState<BalanceState>({});
  const [formState, setFormState] = useState({
    solEscrowAddress: '',
    usdcMintAddress: '',
    usdcEscrowAccount: '',
    usdcDecimals: 6,
  });

  const explorerBase = process.env.NEXT_PUBLIC_SOLANA_EXPLORER || 'https://explorer.solana.com/address';

  const loadConfig = async () => {
    setFetchState({ loading: true });
    try {
      const res = await fetch('/api/admin/escrow');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load config');
      setConfig(data.config);
      setFormState({
        solEscrowAddress: data.config.solEscrowAddress || '',
        usdcMintAddress: data.config.usdcMintAddress || '',
        usdcEscrowAccount: data.config.usdcEscrowAccount || '',
        usdcDecimals: data.config.usdcDecimals || 6,
      });
      setFetchState({ loading: false });
    } catch (error: any) {
      setFetchState({ loading: false, error: error?.message || 'Unable to load configuration' });
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'usdcDecimals' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { 'x-admin-key': adminKey } : {}),
        },
        body: JSON.stringify(formState),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update configuration');
      setConfig(data.config);
      setBalanceState({});
    } catch (error: any) {
      alert(error?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const fetchOnChainStatus = async () => {
    if (!formState.solEscrowAddress) {
      setBalanceState({ error: 'Provide a SOL escrow address to fetch balances.' });
      return;
    }
    setBalanceState({});
    try {
      const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl(DEFAULT_CLUSTER as any);
      const connection = new Connection(endpoint, 'confirmed');
      const solPublicKey = new PublicKey(formState.solEscrowAddress);
      const solBalanceLamports = await connection.getBalance(solPublicKey);

      let usdcBalance: number | undefined;
      if (formState.usdcEscrowAccount) {
        try {
          const tokenAccountPubkey = new PublicKey(formState.usdcEscrowAccount);
          const tokenBalance = await connection.getTokenAccountBalance(tokenAccountPubkey);
          usdcBalance = Number(tokenBalance.value.uiAmountString ?? tokenBalance.value.uiAmount ?? 0);
        } catch (tokenError) {
          console.warn('[escrow-admin] Unable to fetch USDC token balance', tokenError);
        }
      }

      setBalanceState({
        solBalanceLamports,
        usdcBalance,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[escrow-admin] fetch on-chain status failed', error);
      setBalanceState({ error: error?.message || 'Failed to fetch on-chain data' });
    }
  };

  const solBalanceFormatted = useMemo(() => {
    if (balanceState.solBalanceLamports == null) return undefined;
    return balanceState.solBalanceLamports / 1_000_000_000;
  }, [balanceState.solBalanceLamports]);

  return (
    <>
      <Head>
        <title>Escrow Configuration · Admin</title>
      </Head>
      <div className='mx-auto max-w-4xl space-y-8 px-6 py-10'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold text-slate-900'>Escrow Configuration</h1>
          <p className='text-sm text-slate-600'>Manage native SOL and USDC escrow addresses, and monitor on-chain balances.</p>
        </header>

        {fetchState.loading && (
          <div className='rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm'>
            Loading configuration…
          </div>
        )}

        {fetchState.error && (
          <div className='rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm'>
            {fetchState.error}
          </div>
        )}

        {!fetchState.loading && config && (
          <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                Admin API key
                <input
                  type='password'
                  value={adminKey}
                  onChange={event => setAdminKey(event.target.value)}
                  className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200'
                  placeholder='Optional header for protected environments'
                />
              </label>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                SOL escrow address
                <input
                  type='text'
                  name='solEscrowAddress'
                  value={formState.solEscrowAddress}
                  onChange={handleChange}
                  placeholder='Enter Solana public key'
                  className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200'
                />
              </label>
              <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                USDC mint address
                <input
                  type='text'
                  name='usdcMintAddress'
                  value={formState.usdcMintAddress}
                  onChange={handleChange}
                  placeholder='Optional mint address'
                  className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200'
                />
              </label>
              <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                USDC escrow token account
                <input
                  type='text'
                  name='usdcEscrowAccount'
                  value={formState.usdcEscrowAccount}
                  onChange={handleChange}
                  placeholder='Optional token account address'
                  className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200'
                />
              </label>
              <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                USDC decimals
                <input
                  type='number'
                  name='usdcDecimals'
                  min={0}
                  max={12}
                  value={formState.usdcDecimals}
                  onChange={handleChange}
                  className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200'
                />
              </label>
            </div>

            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={handleSave}
                disabled={saving}
                className='inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-emerald-300'
              >
                <ShieldCheckIcon className='h-4 w-4' />
                {saving ? 'Saving…' : 'Save configuration'}
              </button>
              <button
                type='button'
                onClick={fetchOnChainStatus}
                className='inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800'
              >
                <ArrowPathIcon className='h-4 w-4' />
                Refresh on-chain status
              </button>
              <button
                type='button'
                onClick={loadConfig}
                className='inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800'
              >
                Reload defaults
              </button>
            </div>

            <section className='space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700'>
              <header className='flex items-center justify-between'>
                <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>On-chain status</h2>
                {balanceState.fetchedAt && (
                  <span className='text-xs text-slate-400'>Updated {new Date(balanceState.fetchedAt).toLocaleString()}</span>
                )}
              </header>
              {balanceState.error && (
                <p className='rounded-2xl bg-rose-50 px-3 py-2 text-rose-600'>{balanceState.error}</p>
              )}
              {!balanceState.error && (
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='rounded-2xl bg-white px-4 py-3 shadow-sm'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>SOL escrow balance</p>
                    <p className='mt-1 text-base font-semibold text-slate-900'>
                      {solBalanceFormatted != null ? `${solBalanceFormatted.toFixed(4)} SOL` : '—'}
                    </p>
                    {formState.solEscrowAddress && (
                      <a
                        href={`${explorerBase}/${formState.solEscrowAddress}?cluster=${DEFAULT_CLUSTER}`}
                        className='text-xs font-semibold text-emerald-600 hover:text-emerald-700'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        View on explorer
                      </a>
                    )}
                  </div>
                  <div className='rounded-2xl bg-white px-4 py-3 shadow-sm'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>USDC escrow balance</p>
                    <p className='mt-1 text-base font-semibold text-slate-900'>
                      {balanceState.usdcBalance != null ? `${balanceState.usdcBalance.toFixed(2)} USDC` : '—'}
                    </p>
                    {formState.usdcEscrowAccount && (
                      <a
                        href={`${explorerBase}/${formState.usdcEscrowAccount}?cluster=${DEFAULT_CLUSTER}`}
                        className='text-xs font-semibold text-emerald-600 hover:text-emerald-700'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        View token account
                      </a>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className='rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-600'>
              <p className='mb-2 font-semibold text-slate-700'>Environment variables</p>
              <p>Changing configuration via this dashboard updates the runtime store. Update your environment variables for persistence:</p>
              <ul className='mt-2 list-disc space-y-1 pl-5'>
                <li><code>NEXT_PUBLIC_ESCROW_WALLET</code></li>
                <li><code>NEXT_PUBLIC_USDC_MINT</code></li>
                <li><code>NEXT_PUBLIC_ESCROW_USDC_ACCOUNT</code></li>
                <li><code>NEXT_PUBLIC_USDC_DECIMALS</code></li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
