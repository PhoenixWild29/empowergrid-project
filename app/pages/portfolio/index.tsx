import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Investment {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  expectedYield: number;
  impactScore: number;
  co2Offset: number;
  householdsPowered: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING';
  nextMilestone?: string;
  milestoneDueDate?: string;
  milestoneStatus?: 'ON_TRACK' | 'AT_RISK' | 'COMPLETED';
  timeline?: Array<{ month: string; value: number }>;
}

interface PortfolioResponse {
  success: boolean;
  investments: Investment[];
  activity?: any[];
}

export default function PortfolioPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/portfolio');
        const data: PortfolioResponse = await response.json();
        if (data.success) {
          setInvestments(data.investments || []);
          setActivity(data.activity || []);
        }
      } catch (error) {
        console.error('[Portfolio] load error', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const totals = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const estimatedValue = investments.reduce(
      (sum, inv) => sum + inv.amount * (1 + inv.expectedYield / 100),
      0
    );
    const totalReturn = estimatedValue - totalInvested;
    const impactCo2 = investments.reduce((sum, inv) => sum + inv.co2Offset, 0);
    const impactHouseholds = investments.reduce(
      (sum, inv) => sum + inv.householdsPowered,
      0
    );

    return {
      totalInvested,
      estimatedValue,
      totalReturn,
      returnPercentage: totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0,
      impactCo2,
      impactHouseholds,
    };
  }, [investments]);

  const returnTrends = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    return months.map((month, index) => ({
      month,
      value: totals.totalInvested > 0 ? totals.totalInvested * 0.1 + index * 1500 : 0,
    }));
  }, [totals.totalInvested]);

  const milestoneFeed = useMemo(() => {
    return investments
      .filter(inv => inv.nextMilestone)
      .slice(0, 6)
      .map(inv => ({
        projectName: inv.projectName,
        milestone: inv.nextMilestone,
        dueDate: inv.milestoneDueDate,
        status: inv.milestoneStatus ?? 'ON_TRACK',
      }));
  }, [investments]);

  return (
    <DashboardLayout>
      <div className='space-y-10'>
        {isLoading && (
          <div className='grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='h-10 animate-pulse rounded-2xl bg-slate-100' />
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className='h-24 animate-pulse rounded-3xl bg-slate-100' />
              ))}
            </div>
          </div>
        )}
        <header className='space-y-3 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-sky-500 p-8 text-white shadow-lg'>
          <div className='text-xs font-semibold uppercase tracking-wide text-emerald-100'>
            Portfolio overview
          </div>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Impact & financial performance</h1>
          <p className='max-w-2xl text-sm text-emerald-50/90'>Track how your investments perform financially while delivering measurable community and environmental benefits.</p>
        </header>

        <section className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
          <SummaryTile label='Total invested' value={formatCurrency(totals.totalInvested)} trend='+8.4% YTD' />
          <SummaryTile label='Estimated value' value={formatCurrency(totals.estimatedValue)} trend='+$12.4k expected' />
          <SummaryTile
            label='Impact
CO₂ offset'
            value={`${totals.impactCo2.toFixed(1)} tCO₂`}
            trend='Annually avoided'
            variant='impact'
          />
          <SummaryTile
            label='Communities powered'
            value={totals.impactHouseholds.toLocaleString()}
            trend='Households supported'
            variant='impact'
          />
        </section>

        <section className='grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]'>
          <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h2 className='text-lg font-semibold text-slate-900'>Portfolio growth</h2>
                <p className='text-xs text-slate-500'>Historical view of invested capital across EmpowerGrid projects.</p>
              </div>
              <span className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>
                Return {totals.returnPercentage.toFixed(1)}%
              </span>
            </div>
            <div className='mt-6 h-60'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={returnTrends}>
                  <defs>
                    <linearGradient id='colorReturn' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#34d399' stopOpacity={0.85} />
                      <stop offset='95%' stopColor='#c7f9cc' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                  <XAxis dataKey='month' stroke='#94a3b8' />
                  <YAxis stroke='#94a3b8' />
                  <Tooltip />
                  <Area type='monotone' dataKey='value' stroke='#10b981' fill='url(#colorReturn)' strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-slate-900'>Milestone feed</h2>
            <p className='text-xs text-slate-500'>Live updates as validators approve escrow releases.</p>
            <ul className='mt-4 space-y-4 text-sm text-slate-600'>
              {milestoneFeed.length === 0 && <li>No upcoming milestones. New updates will appear here.</li>}
              {milestoneFeed.map(item => (
                <li key={`${item.projectName}-${item.milestone}`} className='rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3'>
                  <p className='font-semibold text-slate-900'>{item.projectName}</p>
                  <p className='text-xs text-slate-500'>Milestone: {item.milestone}</p>
                  <div className='mt-1 flex items-center justify-between text-xs text-slate-500'>
                    <span>Due {item.dueDate ?? 'TBA'}</span>
                    <span className={item.status === 'AT_RISK' ? 'text-amber-600' : item.status === 'COMPLETED' ? 'text-emerald-600' : 'text-emerald-600'}>
                      {item.status === 'AT_RISK' ? 'At risk' : item.status === 'COMPLETED' ? 'Completed' : 'On track'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>Portfolio allocation</h2>
            <p className='text-xs text-slate-500'>Diversification by project lifecycle.</p>
          </div>
          <div className='mt-4 overflow-hidden rounded-2xl border border-slate-100'>
            <table className='min-w-full divide-y divide-slate-100 text-sm text-slate-600'>
              <thead className='bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                <tr>
                  <th className='px-4 py-3 text-left'>Project</th>
                  <th className='px-4 py-3 text-left'>Invested</th>
                  <th className='px-4 py-3 text-left'>Status</th>
                  <th className='px-4 py-3 text-left'>Est. yield</th>
                  <th className='px-4 py-3 text-left'>CO₂ impact</th>
                  <th className='px-4 py-3 text-left'>Next milestone</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => (
                  <tr key={inv.id} className='divide-y divide-slate-50'>
                    <td className='px-4 py-3 font-semibold text-slate-800'>{inv.projectName}</td>
                    <td className='px-4 py-3'>{formatCurrency(inv.amount)}</td>
                    <td className='px-4 py-3'>
                      <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'>
                        {inv.status.toLowerCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className='px-4 py-3'>{inv.expectedYield.toFixed(1)}%</td>
                    <td className='px-4 py-3'>{inv.co2Offset.toFixed(1)} tCO₂</td>
                    <td className='px-4 py-3 text-xs text-slate-500'>{inv.nextMilestone ?? 'TBA'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {investments.length === 0 && (
              <div className='px-4 py-8 text-center text-sm text-slate-500'>No investments yet. Explore the marketplace to fund your first renewable project.</div>
            )}
          </div>
        </section>

        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>Recent activity</h2>
            <p className='text-xs text-slate-500'>Live updates from projects you follow.</p>
          </div>
          <ul className='mt-4 space-y-3 text-sm text-slate-600'>
            {(activity?.length ? activity : createFallbackActivity()).map((item: any) => (
              <li key={item.id} className='flex justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3'>
                <div>
                  <p className='font-semibold text-slate-900'>{item.title}</p>
                  <p className='text-xs text-slate-500'>{item.description}</p>
                </div>
                <span className='text-xs text-slate-400'>
                  {new Date(item.timestamp ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DashboardLayout>
  );
}

interface SummaryTileProps {
  label: string;
  value: string | number;
  trend: string;
  variant?: 'financial' | 'impact';
}

function SummaryTile({ label, value, trend, variant = 'financial' }: SummaryTileProps) {
  return (
    <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
      <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</p>
      <p className='mt-3 text-2xl font-bold text-slate-900'>{value}</p>
      <p className={variant === 'impact' ? 'text-xs text-emerald-600' : 'text-xs text-slate-500'}>{trend}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function createFallbackActivity() {
  return [
    {
      id: 'activity-1',
      title: 'Milestone approved',
      description: 'Solar Farm Alpha milestone 3 released 45,000 USDC from escrow.',
      timestamp: Date.now() - 1000 * 60 * 10,
    },
    {
      id: 'activity-2',
      title: 'Community update',
      description: 'Wind Andes cooperative trained 24 new technicians this week.',
      timestamp: Date.now() - 1000 * 60 * 45,
    },
    {
      id: 'activity-3',
      title: 'Energy metrics',
      description: 'Hydro Kenya generated 18,420 kWh verified by Switchboard oracle feed.',
      timestamp: Date.now() - 1000 * 60 * 90,
    },
  ];
}
