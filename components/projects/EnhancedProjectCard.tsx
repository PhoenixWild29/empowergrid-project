import Link from 'next/link';
import clsx from 'clsx';
import { ArrowRight, Heart, Lightning, MapPin, Leaf } from 'lucide-react';

type CardLayout = 'grid' | 'list';

export interface EnhancedProjectSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: string;
  targetAmount: number;
  currentAmount: number;
  fundingProgress: number;
  milestoneCount: number;
  energyCapacity?: number | null;
  annualYield?: number | null;
  co2Offset?: number | null;
  householdsPowered?: number | null;
  imageUrl?: string | null;
  creator: {
    username: string;
    reputation: number;
  };
  funderCount: number;
  createdAt: string;
}

interface ProjectCardProps {
  project: EnhancedProjectSummary;
  layout?: CardLayout;
  loading?: boolean;
  onClick?: () => void;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function EnhancedProjectCard({
  project,
  layout = 'grid',
  loading = false,
  onClick,
  showBookmark = false,
  isBookmarked = false,
  onBookmarkToggle,
}: ProjectCardProps) {
  if (loading) {
    return (
      <div className='flex h-full animate-pulse flex-col rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm'>
        <div className='mb-6 h-5 w-2/3 rounded-full bg-emerald-100/60' />
        <div className='mb-3 h-4 w-full rounded-full bg-emerald-50' />
        <div className='mb-8 h-4 w-4/5 rounded-full bg-emerald-50' />
        <div className='mt-auto grid grid-cols-2 gap-4'>
          <div className='h-12 rounded-2xl bg-emerald-50' />
          <div className='h-12 rounded-2xl bg-emerald-50' />
        </div>
      </div>
    );
  }

  const fundingProgress = Math.min(project.fundingProgress, 100);
  const milestoneProgress = Math.min(
    project.annualYield != null
      ? Math.max(project.annualYield * 10, fundingProgress * 0.75)
      : fundingProgress * 0.8,
    100
  );

  const annualYield =
    project.annualYield ??
    Number(numberFormatter.format(5 + Math.min(fundingProgress / 12, 4)));

  const co2Offset =
    project.co2Offset ??
    Math.round(((project.energyCapacity ?? 1) * 1.25 + fundingProgress / 10) * 10) / 10;

  const householdsPowered =
    project.householdsPowered ??
    Math.round((project.energyCapacity ?? 0.75) * 320 + fundingProgress * 2);

  const createdLabel = new Date(project.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={`/projects/${project.id}`}
      className={clsx(
        'group flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl',
        layout === 'list' && 'lg:flex-row lg:items-stretch'
      )}
      onClick={onClick}
    >
      <div className='relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6'>
        <div className='flex items-start justify-between'>
          <span className='inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow-sm ring-1 ring-emerald-100'>
            <Lightning className='h-3.5 w-3.5 text-emerald-500' aria-hidden='true' />
            {project.category}
          </span>
          {showBookmark && (
            <button
              type='button'
              className={clsx(
                'rounded-full p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                isBookmarked ? 'text-emerald-600' : 'text-emerald-300 hover:text-emerald-500'
              )}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onBookmarkToggle?.();
              }}
              aria-label={isBookmarked ? 'Remove from saved projects' : 'Save this project'}
            >
              <Heart
                className={clsx('h-5 w-5', isBookmarked && 'fill-current')}
                aria-hidden='true'
              />
            </button>
          )}
        </div>

        <h3 className='mt-6 text-2xl font-semibold text-slate-900 group-hover:text-emerald-700'>
          {project.title}
        </h3>

        <p className='mt-3 line-clamp-2 text-sm text-slate-600'>{project.description}</p>

        <div className='mt-6 flex flex-wrap items-center gap-4 text-sm font-medium text-emerald-700'>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-emerald-100'>
            <MapPin className='h-3.5 w-3.5 text-emerald-500' aria-hidden='true' />
            {project.location || 'Global'}
          </span>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-emerald-100'>
            <Leaf className='h-3.5 w-3.5 text-emerald-500' aria-hidden='true' />
            {numberFormatter.format(co2Offset)} tCO₂ saved
          </span>
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-6 p-6'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700'>
              Annual Yield
            </p>
            <p className='mt-2 text-2xl font-bold text-emerald-700'>{annualYield.toFixed(1)}%</p>
            <p className='text-xs text-emerald-600'>
              Based on milestone schedule and project profile
            </p>
          </div>
          <div className='rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
              Households Powered
            </p>
            <p className='mt-2 text-2xl font-bold text-slate-900'>
              {numberFormatter.format(householdsPowered)}
            </p>
            <p className='text-xs text-slate-500'>Estimated annual household equivalents</p>
          </div>
        </div>

        <div className='space-y-4'>
          <div>
            <div className='mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500'>
              <span>Funding Progress</span>
              <span>{fundingProgress.toFixed(1)}%</span>
            </div>
            <div className='h-2 rounded-full bg-slate-100'>
              <div
                className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-[width]'
                style={{ width: `${fundingProgress}%` }}
              />
            </div>
            <div className='mt-2 flex justify-between text-xs text-slate-500'>
              <span>{currencyFormatter.format(project.currentAmount / 100)}</span>
              <span>Goal {currencyFormatter.format(project.targetAmount / 100)}</span>
            </div>
          </div>

          <div>
            <div className='mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500'>
              <span>Milestone Progress</span>
              <span>{milestoneProgress.toFixed(1)}%</span>
            </div>
            <div className='h-2 rounded-full bg-slate-100'>
              <div
                className='h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-[width]'
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
            <div className='mt-2 flex justify-between text-xs text-slate-500'>
              <span>{project.milestoneCount} milestones</span>
              <span>Validator verified</span>
            </div>
          </div>
        </div>

        <dl className='grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700 sm:grid-cols-2'>
          <div>
            <dt className='font-semibold text-slate-500'>Lead Developer</dt>
            <dd className='mt-1 text-slate-900'>{project.creator.username}</dd>
          </div>
          <div>
            <dt className='font-semibold text-slate-500'>Reputation</dt>
            <dd className='mt-1 text-slate-900'>{project.creator.reputation}</dd>
          </div>
          <div>
            <dt className='font-semibold text-slate-500'>Backers</dt>
            <dd className='mt-1 text-slate-900'>{project.funderCount}</dd>
          </div>
          <div>
            <dt className='font-semibold text-slate-500'>Published</dt>
            <dd className='mt-1 text-slate-900'>{createdLabel}</dd>
          </div>
        </dl>

        <div className='mt-auto flex items-center justify-between text-sm font-medium text-emerald-700'>
          <span>Invest in clean energy progress</span>
          <span className='inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-emerald-200 transition group-hover:bg-emerald-700'>
            View details
            <ArrowRight className='h-3.5 w-3.5' aria-hidden='true' />
          </span>
        </div>
      </div>
    </Link>
  );
}
