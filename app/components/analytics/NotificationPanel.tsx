import { useState } from 'react';
import clsx from 'clsx';
import { useActivityStream } from '../../hooks/useActivityStream';
import { groupActivityByDay, sortBySeverity } from '../../lib/analytics/activity';
import ActivityStream from './ActivityStream';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'funding', label: 'Funding' },
  { id: 'milestone', label: 'Operations' },
  { id: 'governance', label: 'Governance' },
  { id: 'impact', label: 'Impact' },
];

export function NotificationPanel() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data, isLoading } = useActivityStream(category === 'all' ? undefined : category);

  const events = (data?.pages ?? []).flatMap(page => page.events ?? []);
  const grouped = groupActivityByDay(sortBySeverity(events));

  return (
    <aside className='rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-800/10'>
      <header className='flex items-center justify-between'>
        <h2 className='text-base font-semibold text-slate-900'>Notifications</h2>
        <span className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>Live</span>
      </header>

      <nav className='mt-4 flex flex-wrap gap-2 text-xs font-semibold'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type='button'
            onClick={() => setCategory(tab.id === 'all' ? undefined : tab.id)}
            className={clsx(
              'rounded-full px-3 py-1 transition',
              category === tab.id || (!category && tab.id === 'all')
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className='mt-4 max-h-[28rem] overflow-y-auto pr-1'>
        {isLoading ? (
          <ul className='space-y-3'>
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className='h-20 animate-pulse rounded-2xl bg-slate-100' />
            ))}
          </ul>
        ) : (
          <ActivityStream groups={grouped} />
        )}
      </div>
    </aside>
  );
}

export default NotificationPanel;
