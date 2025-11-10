import { useMemo, useState } from 'react';
import { useTransactionFeedback } from '../../contexts/TransactionFeedbackContext';

const statusClassMap: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  error: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const statusLabelMap: Record<string, string> = {
  pending: 'Pending',
  success: 'Confirmed',
  error: 'Failed',
};

export default function TransactionFeedbackPanel() {
  const { transactions, removeTransaction, clearTransactions } = useTransactionFeedback();
  const [expanded, setExpanded] = useState(false);

  const visibleTransactions = useMemo(() => transactions.slice(0, expanded ? transactions.length : 3), [transactions, expanded]);
  const hasMore = transactions.length > visibleTransactions.length;

  if (transactions.length === 0) {
    return null;
  }

  return (
    <aside className='fixed bottom-6 right-6 z-40 w-80 max-w-full rounded-3xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-100/80'>
      <div className='flex items-center justify-between border-b border-slate-200 px-4 py-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Transaction Center</p>
          <p className='text-xs text-slate-400'>{transactions.length} {transactions.length === 1 ? 'activity' : 'activities'}</p>
        </div>
        <button
          type='button'
          onClick={clearTransactions}
          className='text-xs font-semibold text-emerald-600 hover:text-emerald-700'
        >
          Clear
        </button>
      </div>

      <ul className='max-h-72 space-y-3 overflow-y-auto px-4 py-3'>
        {visibleTransactions.map(transaction => (
          <li key={transaction.id} className='rounded-2xl border border-slate-100 p-3'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-sm font-semibold text-slate-800'>{transaction.title}</p>
                {transaction.description && <p className='mt-1 text-xs text-slate-500'>{transaction.description}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusClassMap[transaction.status]}`}>
                {statusLabelMap[transaction.status]}
              </span>
            </div>
            <div className='mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400'>
              <span>{new Date(transaction.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <div className='flex items-center gap-2'>
                {transaction.explorerUrl && (
                  <a
                    href={transaction.explorerUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='font-semibold text-emerald-600 hover:text-emerald-700'
                  >
                    View
                  </a>
                )}
                <button
                  type='button'
                  onClick={() => removeTransaction(transaction.id)}
                  className='font-semibold text-slate-400 hover:text-slate-600'
                >
                  Dismiss
                </button>
              </div>
            </div>
            {transaction.error && (
              <p className='mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600'>
                {transaction.error}
              </p>
            )}
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type='button'
          onClick={() => setExpanded(prev => !prev)}
          className='w-full border-t border-slate-200 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50'
        >
          {expanded ? 'Show less' : `Show ${transactions.length - visibleTransactions.length} more`}
        </button>
      )}
    </aside>
  );
}
