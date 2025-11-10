/**
 * Project Details Page
 * 
 * WO-68: Project Details Dashboard with Tabbed Navigation
 * Main entry point for detailed project view
 * 
 * Features:
 * - Comprehensive project overview
 * - Tabbed navigation (Overview, Technical, Financial, Updates)
 * - Breadcrumb navigation
 * - Loading and error states
 * - Responsive design
 */

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight, Leaf, MapPin, ShieldCheck, Wallet2 } from 'lucide-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

import Layout from '../../../components/Layout';
import MilestoneTimeline, {
  MilestoneItem,
} from '../../../components/data-visualizations/MilestoneTimeline';
import RecommendedForYou from '../../../components/recommendations/RecommendedForYou';
import { SimilarProjects } from '../../../components/recommendations';
import { useTransactionFeedback } from '../../../contexts/TransactionFeedbackContext';
import { useToast } from '../../../components/ToastContainer';

interface ProjectData {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  location: string;
  tags: string[];
  targetAmount: number;
  currentAmount: number;
  fundingProgress: number;
  energyCapacity: number | null;
  milestoneCount: number;
  milestoneProgress?: number;
  completedMilestones?: number;
  images: string[];
  videoUrl?: string | null;
  creator: {
    id: string;
    username: string;
    reputation: number;
    verified: boolean;
    bio?: string | null;
    website?: string | null;
  };
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'REJECTED';
    targetAmount: number;
    dueDate: string;
    completedAt?: string | null;
  }>;
  fundings: Array<{
    amount: number;
    createdAt: string;
    funder: {
      username: string;
      reputation: number;
    };
  }>;
  comments?: any[];
  updates?: any[];
  counts?: {
    fundings: number;
    milestones: number;
    comments: number;
    updates: number;
  };
  totalEnergyProduced?: number;
  verifiedEnergyProduced?: number;
  averageFundingAmount?: number;
  fundingVelocity?: number;
  daysSinceCreation?: number;
  daysUntilCompletion?: number;
  completionPercentage?: number;
  annualYield?: number;
  co2Offset?: number;
  householdsPowered?: number;
  escrowAddress?: string;
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investing, setInvesting] = useState(false);
  const { trackTransaction } = useTransactionFeedback();
  const toast = useToast();

  const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT;
  const usdcEscrowAccount = process.env.NEXT_PUBLIC_ESCROW_USDC_ACCOUNT;
  const usdcDecimals = Number(process.env.NEXT_PUBLIC_USDC_DECIMALS ?? 6);
  const usdcEnabled = Boolean(usdcMint && usdcEscrowAccount);
  const [asset, setAsset] = useState<'sol' | 'usdc'>(usdcEnabled ? 'sol' : 'sol');

  useEffect(() => {
    if (!usdcEnabled && asset === 'usdc') {
      setAsset('sol');
    }
  }, [usdcEnabled, asset]);

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/projects/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found');
            return;
          }
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        if (data.success) {
          setProject(data.project);
        } else {
          throw new Error(data.message || 'Failed to load project');
        }
      } catch (err) {
        console.error('[ProjectDetails] fetch error', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const milestoneItems: MilestoneItem[] = useMemo(() => {
    if (!project?.milestones) return [];
    return project.milestones.map(milestone => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      status: milestone.status,
      targetAmount: milestone.targetAmount,
      dueDate: milestone.dueDate,
      completedAt: milestone.completedAt || undefined,
    }));
  }, [project?.milestones]);

  const fundingProgress = project?.fundingProgress ?? 0;
  const milestoneProgress = project?.milestoneProgress ??
    (project?.milestones && project.milestones.length > 0
      ? (project.milestones.filter(m => ['RELEASED', 'COMPLETED', 'APPROVED', 'VERIFIED'].includes(m.status)).length /
          project.milestones.length) * 100
      : 0);

  const energyCapacity = project?.energyCapacity ?? 0;
  const annualYield = project?.annualYield ?? Number((5 + Math.min(fundingProgress / 12, 4)).toFixed(1));
  const co2Offset = project?.co2Offset ?? Math.round(((energyCapacity || 1) * 1.25 + fundingProgress / 10) * 10) / 10;
  const householdsPowered = project?.householdsPowered ?? Math.round((energyCapacity || 0.75) * 320 + fundingProgress * 2);

  const targetAmountCurrency = project ? project.targetAmount / 100 : 0;
  const currentAmountCurrency = project ? project.currentAmount / 100 : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  const explorerBase = process.env.NEXT_PUBLIC_SOLANA_EXPLORER || 'https://explorer.solana.com/tx';

  const breadcrumb = [
    { label: 'Marketplace', href: '/projects/discover' },
    { label: project?.category || 'Impact Sector', href: `/projects/discover?category=${project?.category ?? ''}` },
    { label: project?.title || 'Project details', href: '#' },
  ];

  const handleInvestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;

    const form = event.currentTarget;
    const amountField = form.elements.namedItem('amount') as HTMLInputElement | null;
    const amountValue = amountField ? Number(amountField.value) : 0;

    if (!amountValue || Number.isNaN(amountValue) || amountValue <= 0) {
      toast.warning('Enter a valid amount to invest.');
      return;
    }

    setInvesting(true);

    const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';
    const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl(cluster as any);

    try {
      if (typeof window === 'undefined' || !window.solana) {
        toast.error('Connect your Solana wallet to invest. Running a simulation instead.');
        await trackTransaction({
          title: asset === 'usdc' ? 'USDC deposit (simulation)' : 'Escrow deposit (simulation)',
          description: `${amountValue.toFixed(asset === 'usdc' ? 2 : 3)} ${asset.toUpperCase()} simulated`,
          simulate: true,
          successDelayMs: 1500,
        });
        form.reset();
        return;
      }

      const provider = window.solana;
      if (!provider.publicKey) {
        await provider.connect();
      }

      const connection = new Connection(endpoint, 'confirmed');
      const fromPubkey: PublicKey = provider.publicKey;

      const sendSignature = async (transaction: Transaction): Promise<string> => {
        let signature: string | undefined;
        if (typeof provider.signAndSendTransaction === 'function') {
          const result = await provider.signAndSendTransaction(transaction);
          signature = typeof result === 'string' ? result : result?.signature;
        } else if (typeof provider.sendTransaction === 'function') {
          signature = await provider.sendTransaction(transaction, connection);
        } else {
          throw new Error('Wallet adapter does not support sending transactions.');
        }

        if (!signature) {
          throw new Error('Wallet did not return a transaction signature.');
        }

        return signature;
      };

      if (asset === 'usdc') {
        if (!usdcEnabled || !usdcMint || !usdcEscrowAccount) {
          toast.warning('USDC configuration missing. Running a simulation instead.');
          await trackTransaction({
            title: 'USDC deposit (simulation)',
            description: `${amountValue.toFixed(2)} USDC simulated`,
            simulate: true,
            successDelayMs: 1500,
          });
          form.reset();
          setAsset('sol');
          setInvesting(false);
          return;
        }

        const mintPubkey = new PublicKey(usdcMint);
        const escrowTokenAccountPubkey = new PublicKey(usdcEscrowAccount);
        const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
        const latestBlockhash = await connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: fromPubkey,
          recentBlockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });

        const fromTokenAccountInfo = await connection.getAccountInfo(fromTokenAccount);
        if (!fromTokenAccountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(fromPubkey, fromTokenAccount, fromPubkey, mintPubkey)
          );
        }

        const multiplier = Math.pow(10, usdcDecimals);
        const amountInUnits = BigInt(Math.round(amountValue * multiplier));
        if (amountInUnits <= 0n) {
          throw new Error('Amount too small for USDC transfer.');
        }

        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            escrowTokenAccountPubkey,
            fromPubkey,
            amountInUnits
          )
        );

        const signature = await sendSignature(transaction);
        const explorerUrl = `${explorerBase}/${signature}?cluster=${cluster}`;

        await trackTransaction({
          title: 'USDC deposit',
          description: `${amountValue.toFixed(2)} USDC sent to escrow`,
          signature,
          connection,
          explorerUrl,
        });

        form.reset();
      } else {
        const escrowAddress = project.escrowAddress || process.env.NEXT_PUBLIC_ESCROW_WALLET;
        if (!escrowAddress) {
          toast.warning('Escrow address not configured. Running a simulation instead.');
          await trackTransaction({
            title: 'Escrow deposit (simulation)',
            description: `${amountValue.toFixed(3)} SOL simulated`,
            simulate: true,
            successDelayMs: 1500,
          });
          form.reset();
          return;
        }

        const escrowPubkey = new PublicKey(escrowAddress);
        const lamports = Math.round(amountValue * LAMPORTS_PER_SOL);
        if (lamports <= 0) {
          throw new Error('Calculated lamport amount invalid.');
        }

        const latestBlockhash = await connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: fromPubkey,
          recentBlockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });

        transaction.add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey: escrowPubkey,
            lamports,
          })
        );

        const signature = await sendSignature(transaction);
        const explorerUrl = `${explorerBase}/${signature}?cluster=${cluster}`;

        await trackTransaction({
          title: 'Escrow deposit',
          description: `${amountValue.toFixed(3)} SOL locked in escrow`,
          signature,
          connection,
          explorerUrl,
        });

        form.reset();
      }
    } catch (err: any) {
      console.error('[ProjectDetails] investment failed', err);
      toast.error('Deposit failed', err?.message || 'Unable to submit transaction.');
    } finally {
      setInvesting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className='space-y-6 py-12'>
          <div className='h-64 animate-pulse rounded-4xl bg-emerald-100/50' />
          <div className='grid gap-4 lg:grid-cols-3'>
            <div className='col-span-2 space-y-4'>
              <div className='h-40 animate-pulse rounded-3xl bg-white shadow-sm' />
              <div className='h-96 animate-pulse rounded-3xl bg-white shadow-sm' />
            </div>
            <div className='h-[32rem] animate-pulse rounded-3xl bg-white shadow-sm' />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className='py-16'>
          <div className='mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-emerald-50/60 p-10 text-center shadow-sm'>
            <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
              <ShieldCheck className='h-8 w-8' aria-hidden='true' />
            </div>
            <h1 className='text-2xl font-semibold text-slate-900'>We couldn’t find that project</h1>
            <p className='mt-3 text-sm text-slate-600'>
              {error || 'The project may have been removed or is not yet public. Explore other impact projects instead.'}
            </p>
            <div className='mt-6'>
              <Link
                href='/projects/discover'
                className='inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700'
              >
                Browse projects
                <ArrowRight className='h-4 w-4' aria-hidden='true' />
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='space-y-12 pb-14'>
        <nav className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700'>
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.label} className='flex items-center gap-2'>
              {index > 0 && <span className='text-emerald-400'>/</span>}
              <Link href={crumb.href} className='hover:text-emerald-500'>
                {crumb.label}
              </Link>
            </span>
          ))}
        </nav>

        <section className='relative overflow-hidden rounded-4xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-sky-500 px-8 py-12 text-white shadow-xl sm:px-12'>
          <div className='absolute inset-0 bg-[url("/images/grid-light.svg")] bg-cover bg-center opacity-20' aria-hidden='true' />
          <div className='relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between'>
            <div className='max-w-2xl space-y-4'>
              <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-50 ring-1 ring-white/30'>
                {project.category}
              </span>
              <h1 className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>
                {project.title}
              </h1>
              <p className='text-sm leading-6 text-emerald-50/90 sm:text-base'>
                {project.description}
              </p>
              <div className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-50 ring-1 ring-white/30'>
                <MapPin className='h-3.5 w-3.5 text-emerald-100' aria-hidden='true' />
                {project.location || 'Global impact'}
              </div>
            </div>
            <dl className='grid w-full max-w-md grid-cols-2 gap-6 rounded-4xl bg-white/10 p-6 text-left text-sm font-medium text-emerald-50 lg:w-auto lg:grid-cols-1'>
              <div>
                <dt className='text-emerald-50/70'>Funding progress</dt>
                <dd className='mt-1 text-3xl font-semibold'>{fundingProgress.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className='text-emerald-50/70'>Milestones verified</dt>
                <dd className='mt-1 text-3xl font-semibold'>
                  {project.completedMilestones ?? 0}/{project.milestoneCount}
                </dd>
              </div>
              <div>
                <dt className='text-emerald-50/70'>Estimated yield</dt>
                <dd className='mt-1 text-3xl font-semibold'>{annualYield.toFixed(1)}%</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className='grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]'>
          <section className='space-y-8'>
            <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8'>
              <header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h2 className='text-xl font-semibold text-slate-900'>Milestone escrow tracker</h2>
                  <p className='text-sm text-slate-500'>Funds are held in escrow and only released once independent validators confirm milestone delivery.</p>
                </div>
                <div className='flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600'>
                  <span className='font-semibold text-slate-800'>{milestoneProgress.toFixed(1)}%</span>
                  <span>of milestones verified</span>
                </div>
              </header>
              <div className='mt-6'>
                <MilestoneTimeline milestones={milestoneItems} />
              </div>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>Funding status</h3>
                <dl className='mt-4 space-y-3 text-sm text-slate-600'>
                  <div className='flex items-center justify-between'>
                    <dt>Raised to date</dt>
                    <dd className='font-semibold text-slate-900'>{formatCurrency(currentAmountCurrency)}</dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt>Funding goal</dt>
                    <dd className='font-semibold text-slate-900'>{formatCurrency(targetAmountCurrency)}</dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt>Backers</dt>
                    <dd className='font-semibold text-slate-900'>{project.fundings.length ?? 0}</dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt>Funding velocity</dt>
                    <dd className='font-semibold text-slate-900'>{(project.fundingVelocity ?? 0).toFixed(2)} USDC/day</dd>
                  </div>
                </dl>
              </div>
              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>Impact highlights</h3>
                <dl className='mt-4 space-y-3 text-sm text-slate-600'>
                  <div className='flex items-center justify-between'>
                    <dt>Estimated CO₂ offset</dt>
                    <dd className='inline-flex items-center gap-1.5 font-semibold text-emerald-700'>
                      <Leaf className='h-4 w-4' aria-hidden='true' />
                      {co2Offset.toFixed(1)} tCO₂/year
                    </dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt>Households powered</dt>
                    <dd className='font-semibold text-slate-900'>{householdsPowered.toLocaleString()}</dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt>Total energy (reported)</dt>
                    <dd className='font-semibold text-slate-900'>
                      {(project.totalEnergyProduced ?? 0).toLocaleString()} kWh
                    </dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt>Verified energy</dt>
                    <dd className='font-semibold text-slate-900'>
                      {(project.verifiedEnergyProduced ?? 0).toLocaleString()} kWh
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <article className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8'>
              <h2 className='text-xl font-semibold text-slate-900'>About the developer</h2>
              <p className='mt-3 text-sm text-slate-600'>
                {project.creator.bio ?? 'Developer biography information will appear here once provided.'}
              </p>
              <dl className='mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2'>
                <div>
                  <dt className='font-semibold text-slate-500'>Lead organization</dt>
                  <dd className='mt-1 text-slate-900'>{project.creator.username}</dd>
                </div>
                <div>
                  <dt className='font-semibold text-slate-500'>Reputation score</dt>
                  <dd className='mt-1 text-slate-900'>{project.creator.reputation}</dd>
                </div>
                <div>
                  <dt className='font-semibold text-slate-500'>Verified developer</dt>
                  <dd className='mt-1 inline-flex items-center gap-1 text-emerald-700'>
                    <ShieldCheck className='h-4 w-4' aria-hidden='true' />
                    {project.creator.verified ? 'Yes' : 'Pending verification'}
                  </dd>
                </div>
                <div>
                  <dt className='font-semibold text-slate-500'>Website</dt>
                  <dd className='mt-1'>
                    {project.creator.website ? (
                      <a className='text-emerald-600 hover:text-emerald-700' href={project.creator.website} target='_blank' rel='noopener noreferrer'>
                        {project.creator.website}
                      </a>
                    ) : (
                      <span className='text-slate-500'>Not provided</span>
                    )}
                  </dd>
                </div>
              </dl>
            </article>

            <div>
              <RecommendedForYou limit={3} />
            </div>
          </section>

          <aside className='space-y-6'>
            <div className='rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8'>
              <header className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
                  <Wallet2 className='h-5 w-5' aria-hidden='true' />
                </div>
                <div>
                  <h3 className='text-base font-semibold text-slate-900'>Invest in this project</h3>
                  <p className='text-xs text-slate-500'>Funds held in escrow until validators certify milestones.</p>
                </div>
              </header>
              <form className='mt-4 space-y-4' onSubmit={handleInvestSubmit}>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Asset</p>
                  <div role='radiogroup' className='mt-2 flex gap-2'>
                    <button
                      type='button'
                      onClick={() => setAsset('sol')}
                      className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        asset === 'sol'
                          ? 'border-emerald-200 bg-white text-emerald-700 shadow-sm'
                          : 'border-transparent bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                      }`}
                      aria-pressed={asset === 'sol'}
                    >
                      SOL
                    </button>
                    {usdcEnabled && (
                      <button
                        type='button'
                        onClick={() => setAsset('usdc')}
                        className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          asset === 'usdc'
                            ? 'border-emerald-200 bg-white text-emerald-700 shadow-sm'
                            : 'border-transparent bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                        }`}
                        aria-pressed={asset === 'usdc'}
                      >
                        USDC
                      </button>
                    )}
                  </div>
                </div>
                <label className='block text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Investment amount ({asset.toUpperCase()})
                  <input
                    key={asset}
                    type='number'
                    name='amount'
                    min={asset === 'sol' ? 0.01 : 0.01}
                    step={asset === 'sol' ? 0.01 : 0.01}
                    defaultValue={asset === 'sol' ? 0.25 : 10}
                    className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 ring-emerald-200 focus:border-emerald-400 focus:outline-none focus:ring-2'
                  />
                </label>
                <div className='rounded-2xl bg-slate-50 p-4 text-xs text-slate-600'>
                  <p className='font-semibold text-slate-800'>Estimated returns</p>
                  <p className='mt-1'>
                    {annualYield.toFixed(1)}% APY · Potential impact: {householdsPowered.toLocaleString()} households powered, {co2Offset.toFixed(1)} tCO₂ saved annually.
                  </p>
                </div>
                <button
                  type='submit'
                  disabled={investing}
                  className='flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:bg-emerald-300'
                >
                  {investing ? 'Processing…' : `Invest ${asset.toUpperCase()}`}
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </button>
                <p className='text-[11px] text-slate-500'>No gas fees on deposit. Funds released only when milestone verification is approved.</p>
              </form>
            </div>

            <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
              <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>Funding timeline</h3>
              <ul className='mt-4 space-y-3 text-xs text-slate-600'>
                {project.fundings.slice(0, 5).map(funding => (
                  <li key={`${funding.funder.username}-${funding.createdAt}`} className='flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3'>
                    <span className='font-medium text-slate-800'>{funding.funder.username}</span>
                    <span>{new Date(funding.createdAt).toLocaleDateString()}</span>
                    <span className='font-semibold text-emerald-700'>
                      {formatCurrency(funding.amount / 100)}
                    </span>
                  </li>
                ))}
                {project.fundings.length === 0 && <li>No funding transactions yet.</li>}
              </ul>
            </div>
          </aside>
        </div>

        <section className='space-y-6'>
          <SimilarProjects projectId={project.id} />
        </section>
      </div>
    </Layout>
  );
}

