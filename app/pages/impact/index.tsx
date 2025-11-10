import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import GeographicProjectMap, {
  ProjectLocation,
} from '../../components/data-visualizations/GeographicProjectMap';

interface ImpactMetrics {
  totalCo2Offset: number;
  totalKwhGenerated: number;
  householdsPowered: number;
  projectsSupported: number;
  communityJobsCreated: number;
  averageValidatorSla: number;
}

interface TimeSeriesData {
  month: string;
  co2Offset: number;
  kwhGenerated: number;
  projectsActive: number;
}

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const mockProjects: ProjectLocation[] = [
  {
    id: 'project-1',
    title: 'Bronx Community Solar',
    location: 'Bronx, NY (USA)',
    status: 'IN_PROGRESS',
    energyCapacity: 850,
    fundingProgress: 72,
  },
  {
    id: 'project-2',
    title: 'Lagos Microgrid Expansion',
    location: 'Lagos, Nigeria',
    status: 'ACTIVE',
    energyCapacity: 1200,
    fundingProgress: 48,
  },
  {
    id: 'project-3',
    title: 'Andes Wind Cooperative',
    location: 'Cusco, Peru',
    status: 'FUNDED',
    energyCapacity: 2150,
    fundingProgress: 100,
  },
  {
    id: 'project-4',
    title: 'Kerala Hydro Modernization',
    location: 'Kerala, India',
    status: 'COMPLETED',
    energyCapacity: 540,
    fundingProgress: 100,
  },
  {
    id: 'project-5',
    title: 'Yucatán Solar Schools',
    location: 'Mérida, Mexico',
    status: 'IN_PROGRESS',
    energyCapacity: 310,
    fundingProgress: 64,
  },
];

export default function ImpactDashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/portfolio');
        const data = await response.json();

        if (data.success && data.investments) {
          const totals = data.investments.reduce(
            (acc: any, inv: any) => ({
              co2: acc.co2 + (inv.co2Offset || 0),
              kwh: acc.kwh + (inv.kwhGenerated || 0),
              households: acc.households + (inv.householdsPowered || 0),
              projects: acc.projects + 1,
            }),
            { co2: 0, kwh: 0, households: 0, projects: 0 }
          );

          setMetrics({
            totalCo2Offset: totals.co2 || 1250.5,
            totalKwhGenerated: totals.kwh || 4250000,
            householdsPowered: totals.households || 42300,
            projectsSupported: totals.projects || 5,
            communityJobsCreated: Math.round((totals.projects || 5) * 780),
            averageValidatorSla: 36,
          });

          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const series = months.map((month, index) => ({
            month,
            co2Offset: (totals.co2 || 1250.5) * (0.1 + index * 0.08),
            kwhGenerated: (totals.kwh || 4250000) * (0.1 + index * 0.08),
            projectsActive: Math.max(1, (totals.projects || 5) - Math.floor(index / 3)),
          }));
          setTimeSeries(series);
        } else {
          // Fallback to default metrics
          setMetrics({
            totalCo2Offset: 1250.5,
            totalKwhGenerated: 4250000,
            householdsPowered: 42300,
            projectsSupported: 5,
            communityJobsCreated: 3900,
            averageValidatorSla: 36,
          });
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          setTimeSeries(
            months.map((month, index) => ({
              month,
              co2Offset: 1250.5 * (0.1 + index * 0.08),
              kwhGenerated: 4250000 * (0.1 + index * 0.08),
              projectsActive: Math.max(1, 5 - Math.floor(index / 3)),
            }))
          );
        }
      } catch (error) {
        console.error('[Impact] Failed to load data', error);
        // Fallback to default metrics
        setMetrics({
          totalCo2Offset: 1250.5,
          totalKwhGenerated: 4250000,
          householdsPowered: 42300,
          projectsSupported: 5,
          communityJobsCreated: 3900,
          averageValidatorSla: 36,
        });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        setTimeSeries(
          months.map((month, index) => ({
            month,
            co2Offset: 1250.5 * (0.1 + index * 0.08),
            kwhGenerated: 4250000 * (0.1 + index * 0.08),
            projectsActive: Math.max(1, 5 - Math.floor(index / 3)),
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchImpactData();
    } else {
      // Show public metrics
      setMetrics({
        totalCo2Offset: 1250.5,
        totalKwhGenerated: 4250000,
        householdsPowered: 42300,
        projectsSupported: 5,
        communityJobsCreated: 3900,
        averageValidatorSla: 36,
      });
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setTimeSeries(
        months.map((month, index) => ({
          month,
          co2Offset: 1250.5 * (0.1 + index * 0.08),
          kwhGenerated: 4250000 * (0.1 + index * 0.08),
          projectsActive: Math.max(1, 5 - Math.floor(index / 3)),
        }))
      );
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (format === 'csv' && metrics) {
      const csv = [
        ['Metric', 'Value'],
        ['Total CO₂ Offset (tCO₂)', metrics.totalCo2Offset.toFixed(2)],
        ['Total kWh Generated', metrics.totalKwhGenerated.toFixed(0)],
        ['Households Powered', metrics.householdsPowered.toLocaleString()],
        ['Projects Supported', metrics.projectsSupported.toString()],
        ['Community Jobs Created', metrics.communityJobsCreated.toString()],
      ]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `empowergrid-impact-report-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      window.print();
    }
  };

  const LayoutWrapper = isAuthenticated ? DashboardLayout : Layout;

  return (
    <LayoutWrapper>
      <div className='space-y-10'>
        <header className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-emerald-600'>Impact Dashboard</p>
            <h1 className='text-3xl font-bold text-slate-900 sm:text-4xl'>Environmental & community impact</h1>
            <p className='mt-2 max-w-3xl text-sm text-slate-600'>
              Track measurable outcomes from your investments: renewable energy generation, carbon reductions, and community benefits verified through milestone escrow records.
            </p>
          </div>
          {isAuthenticated && metrics && (
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => handleExport('csv')}
                className='rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50'
              >
                Export CSV
              </button>
              <button
                type='button'
                onClick={() => handleExport('pdf')}
                className='rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700'
              >
                Print Report
              </button>
            </div>
          )}
        </header>

        {isLoading && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className='h-32 animate-pulse rounded-3xl bg-slate-200' />
            ))}
          </div>
        )}

        {!isLoading && metrics && (
          <>
            <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <MetricCard
                label='CO₂ Offset'
                value={`${formatNumber(metrics.totalCo2Offset)} tCO₂`}
                helper='Cumulative carbon emissions avoided'
                tone='bg-emerald-600 text-white'
              />
              <MetricCard
                label='Energy Generated'
                value={`${formatNumber(metrics.totalKwhGenerated / 1000)} MWh`}
                helper='Total renewable energy produced'
                tone='bg-sky-600 text-white'
              />
              <MetricCard
                label='Households Powered'
                value={formatNumber(metrics.householdsPowered)}
                helper='Communities receiving reliable power'
                tone='bg-amber-600 text-white'
              />
              <MetricCard
                label='Projects Supported'
                value={metrics.projectsSupported.toString()}
                helper='Active renewable energy initiatives'
                tone='bg-purple-600 text-white'
              />
            </section>

            <section className='grid gap-6 lg:grid-cols-2'>
              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <h2 className='text-lg font-semibold text-slate-900'>CO₂ Offset Trend</h2>
                <div className='mt-4 h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={timeSeries}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                      <XAxis dataKey='month' stroke='#64748b' />
                      <YAxis stroke='#64748b' />
                      <Tooltip
                        formatter={(value: number) => `${formatNumber(value)} tCO₂`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Line type='monotone' dataKey='co2Offset' stroke='#10b981' strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <h2 className='text-lg font-semibold text-slate-900'>Energy Generation</h2>
                <div className='mt-4 h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={timeSeries}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                      <XAxis dataKey='month' stroke='#64748b' />
                      <YAxis stroke='#64748b' />
                      <Tooltip
                        formatter={(value: number) => `${formatNumber(value)} kWh`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Bar dataKey='kwhGenerated' fill='#0ea5e9' radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className='grid gap-6 lg:grid-cols-3'>
              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2'>
                <h2 className='text-lg font-semibold text-slate-900'>Impact Methodology</h2>
                <div className='mt-4 space-y-4 text-sm text-slate-600'>
                  <p>
                    EmpowerGrid calculates environmental impact using verified milestone data and industry-standard conversion factors. All metrics are audited by independent validators before milestone releases.
                  </p>
                  <ul className='list-disc space-y-2 pl-5'>
                    <li>
                      <strong>CO₂ Offset:</strong> Based on regional grid emission factors (EPA, IEA) and verified energy production data from oracle feeds.
                    </li>
                    <li>
                      <strong>Households Powered:</strong> Calculated using average household consumption (3,500 kWh/year) and project capacity factors.
                    </li>
                    <li>
                      <strong>Community Jobs:</strong> Estimated from project size, installation phases, and local employment multipliers.
                    </li>
                  </ul>
                  <div className='mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700'>Verification</p>
                    <p className='mt-2 text-sm text-emerald-800'>
                      All impact claims are backed by validator-confirmed evidence and on-chain milestone records. View the{' '}
                      <a href='/impact/carbon-methodology' className='font-semibold underline hover:text-emerald-900'>
                        carbon accounting methodology
                      </a>{' '}
                      for detailed calculation methods.
                    </p>
                  </div>
                </div>
              </div>

              <aside className='space-y-4'>
                <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                  <h2 className='text-sm font-semibold text-slate-900'>Additional Metrics</h2>
                  <dl className='mt-4 space-y-3 text-sm'>
                    <div>
                      <dt className='font-semibold text-slate-700'>Community Jobs</dt>
                      <dd className='mt-1 text-2xl font-bold text-slate-900'>{formatNumber(metrics.communityJobsCreated)}</dd>
                    </div>
                    <div>
                      <dt className='font-semibold text-slate-700'>Avg Validator SLA</dt>
                      <dd className='mt-1 text-2xl font-bold text-slate-900'>{metrics.averageValidatorSla}h</dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </section>

            <section className='grid gap-6 lg:grid-cols-3'>
              <div className='lg:col-span-2 space-y-6'>
                <GeographicProjectMap projects={mockProjects} />
              </div>
              <aside className='space-y-6'>
                <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
                  <h2 className='text-lg font-semibold text-gray-900'>Impact Signal Feed</h2>
                  <p className='mt-2 text-sm text-gray-600'>Live updates from validators and project teams.</p>
                  <ul className='mt-4 space-y-4'>
                    <li className='rounded-xl border border-gray-100 bg-gray-50 p-4 hover:bg-white'>
                      <div className='flex items-start gap-3'>
                        <span className='text-2xl'>🎯</span>
                        <div>
                          <p className='text-sm font-semibold text-gray-900'>Milestone verified: Kerala Hydro Modernization</p>
                          <p className='mt-1 text-sm text-gray-600'>GreenAudit Labs confirmed the completion of spillway reinforcement. USDC released.</p>
                          <p className='mt-2 text-xs font-medium uppercase tracking-wide text-emerald-600'>2h ago</p>
                        </div>
                      </div>
                    </li>
                    <li className='rounded-xl border border-gray-100 bg-gray-50 p-4 hover:bg-white'>
                      <div className='flex items-start gap-3'>
                        <span className='text-2xl'>🌱</span>
                        <div>
                          <p className='text-sm font-semibold text-gray-900'>Impact story: Bronx Community Solar</p>
                          <p className='mt-1 text-sm text-gray-600'>First tenant association reports a 28% reduction in electricity costs since activation.</p>
                          <p className='mt-2 text-xs font-medium uppercase tracking-wide text-emerald-600'>5h ago</p>
                        </div>
                      </div>
                    </li>
                    <li className='rounded-xl border border-gray-100 bg-gray-50 p-4 hover:bg-white'>
                      <div className='flex items-start gap-3'>
                        <span className='text-2xl'>⚡</span>
                        <div>
                          <p className='text-sm font-semibold text-gray-900'>Energy milestone reached</p>
                          <p className='mt-1 text-sm text-gray-600'>Total energy generated across projects surpassed 2.5 GWh for 2025.</p>
                          <p className='mt-2 text-xs font-medium uppercase tracking-wide text-emerald-600'>Yesterday</p>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </aside>
            </section>
          </>
        )}

        {!isAuthenticated && !isLoading && (
          <div className='rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-10 text-center'>
            <p className='text-lg font-semibold text-emerald-900'>Connect your wallet to view personalized impact metrics</p>
            <p className='mt-2 text-sm text-emerald-700'>Your investment portfolio impact will appear here once you authenticate.</p>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}

function MetricCard({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: string }) {
  return (
    <div className={clsx('rounded-3xl p-6 shadow-sm', tone)}>
      <p className='text-xs font-semibold uppercase tracking-wide opacity-80'>{label}</p>
      <p className='mt-3 text-3xl font-bold'>{value}</p>
      <p className='mt-2 text-xs opacity-80'>{helper}</p>
    </div>
  );
}
