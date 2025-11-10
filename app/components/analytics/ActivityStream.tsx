import clsx from 'clsx';
import { relativeTimeFromNow } from '../../utils/time';
import type { ActivityEvent } from '../../types/analytics';
import { formatSeverityLabel } from '../../lib/analytics/activity';

const severityPills: Record<string, string> = {
  info: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-rose-100 text-rose-700',
};

const categoryTone: Record<string, string> = {
  funding: 'border-emerald-200',
  milestone: 'border-sky-200',
  governance: 'border-purple-200',
  impact: 'border-amber-200',
};

export interface ActivityStreamProps {
  groups: Array<{ date: string; events: ActivityEvent[] }>;
}

export function ActivityStream({ groups }: ActivityStreamProps) {
  return (
    <div className='space-y-6'>
      {groups.map(group => (
        <section key={group.date} className='space-y-3'>
          <header className='text-xs font-semibold uppercase tracking-wide text-slate-400'>
            {new Date(group.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </header>
          <div className='space-y-3'>
            {group.events.map(event => (
              <article
                key={event.id}
                className={clsx(
                  'rounded-3xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                  categoryTone[event.category] ?? 'border-slate-200'
                )}
              >
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={clsx(
                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                        severityPills[event.severity] ?? severityPills.info
                      )}
                    >
                      {formatSeverityLabel(event.severity)}
                    </span>
                    <span className='text-xs font-medium uppercase tracking-wide text-slate-400'>
                      {event.category}
                    </span>
                  </div>
                  <span className='text-xs text-slate-400'>{relativeTimeFromNow(event.occurredAt)}</span>
                </div>
                <h3 className='mt-3 text-sm font-semibold text-slate-900'>{event.title}</h3>
                <p className='mt-1 text-sm text-slate-600'>{event.description}</p>
                {event.metadata && (
                  <dl className='mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2'>
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <div key={key} className='rounded-2xl bg-slate-50 px-3 py-2'>
                        <dt className='font-semibold uppercase tracking-wide text-slate-400'>{key}</dt>
                        <dd className='text-slate-600'>{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
      {groups.length === 0 && (
        <div className='rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600'>
          No recent activity yet. Check back after new milestones or governance events occur.
        </div>
      )}
    </div>
  );
}

export default ActivityStream;
