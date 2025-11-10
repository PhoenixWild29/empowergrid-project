import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import {
  useAddMilestoneComment,
  useAssignValidator,
  useUpdateMilestoneStatus,
  useValidatorMilestones,
  useValidatorRoster,
} from '../../hooks/useValidatorHub';
import { relativeTimeFromNow } from '../../utils/time';

const statusLabels: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Awaiting triage', tone: 'bg-slate-100 text-slate-700' },
  IN_REVIEW: { label: 'In review', tone: 'bg-sky-100 text-sky-700' },
  NEEDS_INFO: { label: 'Needs info', tone: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', tone: 'bg-emerald-100 text-emerald-700' },
  FLAGGED: { label: 'Flagged', tone: 'bg-rose-100 text-rose-700' },
};

const priorityTone: Record<string, string> = {
  HIGH: 'border-rose-200 bg-rose-50 text-rose-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  LOW: 'border-slate-200 bg-slate-50 text-slate-600',
};

export default function VerificationHubPage() {
  const { data, isLoading, isError } = useValidatorMilestones();
  const roster = useValidatorRoster();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const updateStatus = useUpdateMilestoneStatus();
  const assignValidator = useAssignValidator();
  const addComment = useAddMilestoneComment();

  const milestones = data?.milestones ?? [];
  const metrics = data?.metrics;

  const selected = useMemo(() => milestones.find(item => item.id === selectedId) ?? null, [milestones, selectedId]);

  const handleStatus = async (status: string, message?: string) => {
    if (!selected) return;
    await updateStatus.mutateAsync({ milestoneId: selected.id, status, comment: message });
  };

  const handleAssignment = async (validatorId: string) => {
    if (!selected) return;
    await assignValidator.mutateAsync({ milestoneId: selected.id, validatorId });
  };

  const handleComment = async (message: string) => {
    if (!selected || !message) return;
    await addComment.mutateAsync({ milestoneId: selected.id, message });
  };

  return (
    <DashboardLayout>
      <div className='space-y-8'>
        <header className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-emerald-600'>Validator operations</p>
            <h1 className='text-3xl font-bold text-slate-900 sm:text-4xl'>Verification hub</h1>
            <p className='mt-2 max-w-2xl text-sm text-slate-600'>Coordinate milestone reviews, keep escrow releases on schedule, and surface risks before they impact investors.</p>
          </div>
          <div className='rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-400/30'>SLA target · 48h</div>
        </header>

        {isLoading && <Skeleton />}{}
        {isError && (
          <div className='rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700'>Failed to load verification data. Please retry shortly.</div>
        )}

        {!isLoading && !isError && metrics && (
          <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <MetricCard label='Awaiting triage' value={metrics.pending} tone='bg-slate-900 text-white' helper='Items still awaiting assignment' />
            <MetricCard label='Active reviews' value={metrics.inReview} tone='bg-sky-900 text-white' helper='Currently being audited' />
            <MetricCard label='Info requests' value={metrics.needsInfo} tone='bg-amber-600 text-white' helper='Waiting on developer response' />
            <MetricCard label='SLA breaches' value={metrics.slaBreaches} tone='bg-rose-600 text-white' helper='Milestones past 48h SLA' />
          </section>
        )}

        <div className='grid gap-6 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1fr)]'>
          <section className='space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <header className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <h2 className='text-lg font-semibold text-slate-900'>Milestone inbox</h2>
                <p className='text-sm text-slate-500'>Click any row to review evidence, add comments, or approve.</p>
              </div>
              <div className='flex flex-wrap gap-2 text-xs font-semibold'>
                <span className='rounded-full bg-slate-100 px-3 py-1 text-slate-600'>In review · {metrics?.inReview ?? 0}</span>
                <span className='rounded-full bg-emerald-100 px-3 py-1 text-emerald-700'>Approved · {metrics?.approved ?? 0}</span>
              </div>
            </header>

            <div className='overflow-hidden rounded-2xl border border-slate-100'>
              <table className='min-w-full divide-y divide-slate-100 text-sm'>
                <thead className='bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  <tr>
                    <th className='px-4 py-3 text-left'>Project</th>
                    <th className='px-4 py-3 text-left'>Milestone</th>
                    <th className='px-4 py-3 text-left'>Status</th>
                    <th className='px-4 py-3 text-left'>Due</th>
                    <th className='px-4 py-3 text-left'>Assigned</th>
                    <th className='px-4 py-3 text-right'>Request</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100 bg-white'>
                  {milestones.map(item => {
                    const status = statusLabels[item.status] ?? statusLabels.PENDING;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={clsx(
                          'cursor-pointer transition hover:bg-emerald-50/60',
                          selectedId === item.id && 'bg-emerald-50/80'
                        )}
                      >
                        <td className='px-4 py-3 font-semibold text-slate-900'>
                          <div>{item.projectName}</div>
                          <div className='text-xs font-normal text-slate-400'>{item.location}</div>
                        </td>
                        <td className='px-4 py-3 text-slate-600'>
                          <div>{item.milestoneName}</div>
                          <div className='text-xs text-slate-400'>${item.requestedAmount.toLocaleString()}</div>
                        </td>
                        <td className='px-4 py-3'>
                          <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-semibold', status.tone)}>
                            {status.label}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-slate-500'>
                          {relativeTimeFromNow(item.targetReleaseAt)}
                          {item.slaHoursRemaining < 0 && <span className='ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700'>SLA</span>}
                        </td>
                        <td className='px-4 py-3 text-slate-500'>
                          {item.assignedValidators.length} validators
                        </td>
                        <td className='px-4 py-3 text-right'>
                          {item.priority && (
                            <span className={clsx('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', priorityTone[item.priority])}>
                              {item.priority.toLowerCase()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {milestones.length === 0 && (
                    <tr>
                      <td className='px-4 py-6 text-center text-slate-500' colSpan={6}>
                        All clear for now—no milestones need review.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className='space-y-4'>
            <ValidatorDetailPanel
              milestone={selected}
              validators={roster.data?.validators ?? []}
              onAssign={handleAssignment}
              onApprove={() => handleStatus('APPROVED', 'Milestone approved and ready for release.')}
              onRequestInfo={message => handleStatus('NEEDS_INFO', message)}
              onFlag={() => handleStatus('FLAGGED', 'Escalated for arbitration review.')}
              onComment={handleComment}
              loading={updateStatus.isLoading || assignValidator.isLoading || addComment.isLoading}
            />

            <section className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
              <h2 className='text-sm font-semibold text-slate-900'>Validator load</h2>
              <ul className='mt-3 space-y-2 text-sm text-slate-600'>
                {(roster.data?.validators ?? []).map(validator => (
                  <li key={validator.id} className='flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2'>
                    <div>
                      <p className='font-semibold text-slate-800'>{validator.name}</p>
                      <p className='text-xs text-slate-500'>{validator.specialties.join(', ')}</p>
                    </div>
                    <div className='text-right text-xs text-slate-500'>
                      <div>{validator.activeAssignments} active</div>
                      <div className='mt-0.5'>{validator.loadPercentage}% load</div>
                    </div>
                  </li>
                ))}
                {roster.isLoading && <li className='h-12 animate-pulse rounded-2xl bg-slate-100' />}
                {roster.isError && <li className='rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700'>Failed to load validator roster.</li>}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, tone, helper }: { label: string; value: number; tone: string; helper: string }) {
  return (
    <div className={clsx('rounded-3xl p-5 shadow-sm transition', tone.includes('bg-') ? tone : 'bg-white text-slate-900')}>
      <p className='text-xs font-semibold uppercase tracking-wide opacity-80'>{label}</p>
      <p className='mt-3 text-3xl font-bold'>{value}</p>
      <p className='mt-2 text-xs opacity-80'>{helper}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className='h-28 animate-pulse rounded-3xl bg-slate-200/60' />
      ))}
    </section>
  );
}

function ValidatorDetailPanel({
  milestone,
  validators,
  onAssign,
  onApprove,
  onRequestInfo,
  onFlag,
  onComment,
  loading,
}: {
  milestone: any;
  validators: any[];
  onAssign: (validatorId: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onRequestInfo: (message: string) => Promise<void>;
  onFlag: () => Promise<void>;
  onComment: (message: string) => Promise<void>;
  loading: boolean;
}) {
  const [note, setNote] = useState('');

  if (!milestone) {
    return (
      <section className='rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-sm text-emerald-700'>
        Select a milestone from the inbox to view evidence, assign validators, and publish a decision.
      </section>
    );
  }

  const status = statusLabels[milestone.status] ?? statusLabels.PENDING;

  return (
    <section className='space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
      <header className='space-y-1'>
        <div className='flex items-center gap-2'>
          <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-semibold', status.tone)}>{status.label}</span>
          <span className={clsx('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', priorityTone[milestone.priority])}>
            {milestone.priority.toLowerCase()} priority
          </span>
        </div>
        <h2 className='text-lg font-semibold text-slate-900'>{milestone.projectName}</h2>
        <p className='text-sm text-slate-600'>{milestone.milestoneName}</p>
        <p className='text-xs text-slate-400'>Requested · ${milestone.requestedAmount.toLocaleString()}</p>
      </header>

      <div className='space-y-3 text-xs text-slate-500'>
        <p>
          Submitted {relativeTimeFromNow(milestone.submittedAt)} · Target release {relativeTimeFromNow(milestone.targetReleaseAt)}
        </p>
        <div className='flex flex-wrap gap-2'>
          {milestone.assignedValidators.map((validatorId: string) => {
            const validator = validators.find(item => item.id === validatorId);
            return (
              <span key={validatorId} className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'>
                {validator?.name ?? validatorId}
              </span>
            );
          })}
        </div>
        {milestone.riskFlags.length > 0 && (
          <div className='rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700'>
            <p className='text-xs font-semibold uppercase tracking-wide'>Risk flags</p>
            <ul className='mt-1 list-disc pl-4'>
              {milestone.riskFlags.map((flag: string) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <section>
        <h3 className='text-sm font-semibold text-slate-900'>Evidence</h3>
        <ul className='mt-2 space-y-2 text-sm'>
          {milestone.evidence.map((item: any) => (
            <li key={item.id} className='flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2 text-slate-600'>
              <span>{item.label}</span>
              {item.url && (
                <a href={item.url} className='text-xs font-semibold text-emerald-600 hover:text-emerald-700' target='_blank' rel='noreferrer'>
                  View
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className='space-y-2'>
        <h3 className='text-sm font-semibold text-slate-900'>Decision log</h3>
        <ul className='space-y-2 text-xs text-slate-500'>
          {milestone.decisionLog.map((entry: any) => (
            <li key={entry.id} className='rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2'>
              <p className='font-semibold text-slate-700'>{entry.actor}</p>
              <p className='mt-0.5 text-slate-600'>{entry.message}</p>
              <p className='mt-1 text-[11px] uppercase tracking-wide text-slate-400'>{relativeTimeFromNow(entry.createdAt)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className='space-y-3'>
        <textarea
          value={note}
          onChange={event => setNote(event.target.value)}
          placeholder='Add validator note or evidence request…'
          rows={3}
          className='w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none'
        />
        <div className='flex flex-wrap gap-2 text-sm'>
          <button
            type='button'
            onClick={() => note && onComment(note).then(() => setNote(''))}
            disabled={!note || loading}
            className='rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60'
          >
            Log note
          </button>
          <button
            type='button'
            onClick={() => onApprove()}
            disabled={loading}
            className='rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300'
          >
            Approve
          </button>
          <button
            type='button'
            onClick={() => note && onRequestInfo(note).then(() => setNote(''))}
            disabled={!note || loading}
            className='rounded-full bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60'
          >
            Request info
          </button>
          <button
            type='button'
            onClick={() => onFlag()}
            disabled={loading}
            className='rounded-full bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300'
          >
            Flag
          </button>
        </div>
      </section>

      <section className='space-y-2'>
        <h3 className='text-sm font-semibold text-slate-900'>Assign additional validator</h3>
        <div className='flex flex-wrap gap-2'>
          {validators
            .filter(validator => !milestone.assignedValidators.includes(validator.id))
            .map(validator => (
              <button
                key={validator.id}
                type='button'
                onClick={() => onAssign(validator.id)}
                disabled={loading}
                className='rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {validator.name}
              </button>
            ))}
        </div>
      </section>
    </section>
  );
}
