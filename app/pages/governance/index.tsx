import Link from 'next/link';
import clsx from 'clsx';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useGovernanceConsole } from '../../hooks/useGovernanceConsole';
import { relativeTimeFromNow } from '../../utils/time';

const statusColors: Record<string, string> = {
  ACTIVE: 'border-sky-200 bg-sky-50 text-sky-700',
  PASSED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-600',
  QUEUED: 'border-amber-200 bg-amber-50 text-amber-700',
};

export default function GovernanceConsolePage() {
  const { data, isLoading, isError } = useGovernanceConsole();
  const proposals = data?.proposals ?? [];
  const metrics = data?.metrics;

  const grouped = proposals.reduce<Record<string, typeof proposals>>((acc, proposal) => {
    const bucket = acc[proposal.status] ?? [];
    bucket.push(proposal);
    acc[proposal.status] = bucket;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className='space-y-8'>
        <header className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-emerald-600'>Collective decisions</p>
            <h1 className='text-3xl font-bold text-slate-900 sm:text-4xl'>Governance console</h1>
            <p className='mt-2 max-w-2xl text-sm text-slate-600'>Track proposal health, guide validators through votes, and ensure treasury moves only with quorum.</p>
          </div>
          <Link
            href='/governance/proposals/create'
            className='rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700'
          >
            Create proposal
          </Link>
        </header>

        {isLoading && <LoadingSkeleton />}
        {isError && (
          <div className='rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700'>Failed to load governance data.</div>
        )}

        {!isLoading && !isError && metrics && (
          <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <HealthCard label='Active proposals' value={metrics.active} tone='bg-sky-900 text-white' helper='Currently in voting window' />
            <HealthCard label='Passed this quarter' value={metrics.passed} tone='bg-emerald-600 text-white' helper='Completed with quorum' />
            <HealthCard label='Failed proposals' value={metrics.failed} tone='bg-rose-600 text-white' helper='Closed without quorum' />
            <HealthCard label='Avg participation' value={`${metrics.participationRate}%`} tone='bg-slate-900 text-white' helper='Relative to quorum requirement' />
          </section>
        )}

        <section className='grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]'>
          <div className='space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <header className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <h2 className='text-lg font-semibold text-slate-900'>Proposal board</h2>
                <p className='text-sm text-slate-500'>Move proposals across stages as quorum is met.</p>
              </div>
            </header>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {['ACTIVE', 'PASSED', 'FAILED'].map(status => (
                <BoardColumn key={status} status={status} proposals={grouped[status] ?? []} />
              ))}
            </div>
          </div>

          <aside className='space-y-4'>
            <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
              <h2 className='text-sm font-semibold text-slate-900'>Upcoming deadlines</h2>
              <ul className='mt-3 space-y-3 text-sm text-slate-600'>
                {proposals
                  .filter(proposal => proposal.status === 'ACTIVE')
                  .sort((a, b) => new Date(a.votingEndsAt).getTime() - new Date(b.votingEndsAt).getTime())
                  .slice(0, 5)
                  .map(proposal => (
                    <li key={proposal.id} className='rounded-2xl border border-slate-100 px-3 py-2'>
                      <p className='font-semibold text-slate-800'>{proposal.title}</p>
                      <p className='text-xs text-slate-500'>Ends {relativeTimeFromNow(proposal.votingEndsAt)}</p>
                    </li>
                  ))}
                {proposals.filter(proposal => proposal.status === 'ACTIVE').length === 0 && (
                  <li className='rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs text-slate-500'>No active deadlines yet.</li>
                )}
              </ul>
            </section>

            <section className='rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-700 shadow-sm'>
              <h2 className='text-sm font-semibold text-emerald-900'>Governance health checklist</h2>
              <ul className='mt-3 list-disc pl-4'>
                <li>Ensure quorum > 80% on active proposals.</li>
                <li>Pair validators with community observers for emergency actions.</li>
                <li>Audit treasury disbursements weekly during high activity.</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}

function HealthCard({ label, value, tone, helper }: { label: string; value: number | string; tone: string; helper: string }) {
  return (
    <div className={clsx('rounded-3xl p-5 shadow-sm', tone)}>
      <p className='text-xs font-semibold uppercase tracking-wide opacity-80'>{label}</p>
      <p className='mt-3 text-3xl font-bold'>{value}</p>
      <p className='mt-2 text-xs opacity-80'>{helper}</p>
    </div>
  );
}

function BoardColumn({ status, proposals }: { status: string; proposals: any[] }) {
  return (
    <div className='space-y-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4'>
      <h3 className='text-sm font-semibold text-slate-700'>{status.toLowerCase()}</h3>
      {proposals.length === 0 && <p className='text-xs text-slate-400'>No proposals in this stage.</p>}
      {proposals.map(proposal => (
        <article key={proposal.id} className='space-y-2 rounded-2xl border border-slate-100 bg-white p-3 text-sm shadow-sm'>
          <p className='font-semibold text-slate-900'>{proposal.title}</p>
          <p className='text-xs text-slate-500'>{proposal.proposalType.toLowerCase().replace('_', ' ')}</p>
          <div className='flex flex-wrap items-center gap-2 text-xs'>
            <span className={clsx('rounded-full border px-3 py-1 font-semibold', statusColors[proposal.status] ?? statusColors.ACTIVE)}>
              {proposal.status.toLowerCase()}
            </span>
            <span className='rounded-full bg-slate-100 px-3 py-1 text-slate-600'>Votes · {proposal.voteStats?.totalVotes ?? 0}</span>
          </div>
          <Link href={`/governance/proposals/${proposal.id}`} className='text-xs font-semibold text-emerald-600 hover:text-emerald-700'>View details</Link>
        </article>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className='h-28 animate-pulse rounded-3xl bg-slate-200/70' />
      ))}
    </section>
  );
}
