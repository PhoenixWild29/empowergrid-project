import Link from 'next/link';
import clsx from 'clsx';
import type { RecommendationCard } from '../../types/analytics';

const toneByCategory: Record<string, string> = {
  investor: 'border-emerald-200 bg-emerald-50/60 text-emerald-800',
  developer: 'border-sky-200 bg-sky-50/60 text-sky-800',
  validator: 'border-purple-200 bg-purple-50/60 text-purple-800',
};

export function RecommendationRail({ cards }: { cards: RecommendationCard[] }) {
  if (!cards || cards.length === 0) {
    return (
      <section className='rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm'>
        No recommendations just yet—complete more actions to tune the experience.
      </section>
    );
  }

  return (
    <section className='space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
      <header className='flex items-center justify-between'>
        <h2 className='text-base font-semibold text-slate-900'>Suggested next steps</h2>
        <span className='text-xs text-slate-500'>Curated from activity & preferences</span>
      </header>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {cards.map(card => (
          <article
            key={card.id}
            className={clsx(
              'flex h-full flex-col justify-between rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
              toneByCategory[card.category] ?? 'border-slate-200 bg-slate-50/60'
            )}
          >
            <div>
              <span className='text-xs font-semibold uppercase tracking-wide opacity-80'>{card.category}</span>
              <h3 className='mt-2 text-sm font-semibold'>{card.title}</h3>
              <p className='mt-2 text-sm opacity-90'>{card.summary}</p>
            </div>
            <div className='mt-4 flex items-center justify-between text-xs opacity-70'>
              <span>Confidence {(card.score * 100).toFixed(0)}%</span>
              <Link
                href={card.href}
                className='inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white'
              >
                {card.actionLabel}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RecommendationRail;
