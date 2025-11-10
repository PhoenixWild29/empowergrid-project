import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { DashboardLayout } from '../components/layouts/DashboardLayout';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import ProjectStatusCard from '../components/dashboard/ProjectStatusCard';
import NotificationPanel from '../components/analytics/NotificationPanel';
import RecommendationRail from '../components/analytics/RecommendationRail';
import { useRecommendations } from '../hooks/useActivityStream';
import { Project, Milestone } from '../types/program';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface ProjectWithMilestones extends Project {
  milestones: Milestone[];
}

export default function Dashboard() {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [projects, setProjects] = useState<ProjectWithMilestones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'funded' | 'completed'>('all');
  const recommendations = useRecommendations('investor');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1200));

        const mockProjects: ProjectWithMilestones[] = [
          {
            id: 1,
            name: 'Solar Farm Alpha',
            description:
              'Large-scale solar installation in rural Nevada providing clean energy to 500+ homes.',
            creator: {} as any,
            governanceAuthority: {} as any,
            oracleAuthority: {} as any,
            vault: {} as any,
            vaultBump: 255,
            fundedAmount: 750000000000,
            kwhTotal: 2500000,
            co2Total: 1250,
            lastMetricsRoot: new Array(32).fill(0),
            numMilestones: 4,
            milestones: [
              {
                project: {} as any,
                index: 0,
                amountLamports: 200000000000,
                kwhTarget: 500000,
                co2Target: 250,
                payee: {} as any,
                released: true,
              },
              {
                project: {} as any,
                index: 1,
                amountLamports: 200000000000,
                kwhTarget: 750000,
                co2Target: 375,
                payee: {} as any,
                released: true,
              },
              {
                project: {} as any,
                index: 2,
                amountLamports: 200000000000,
                kwhTarget: 1000000,
                co2Target: 500,
                payee: {} as any,
                released: false,
              },
              {
                project: {} as any,
                index: 3,
                amountLamports: 150000000000,
                kwhTarget: 1250000,
                co2Target: 625,
                payee: {} as any,
                released: false,
              },
            ],
          },
          {
            id: 2,
            name: 'Wind Turbine Grid',
            description: 'Community-owned wind farm project connecting 10 turbines across 200 acres.',
            creator: {} as any,
            governanceAuthority: {} as any,
            oracleAuthority: {} as any,
            vault: {} as any,
            vaultBump: 255,
            fundedAmount: 500000000000,
            kwhTotal: 1800000,
            co2Total: 900,
            lastMetricsRoot: new Array(32).fill(0),
            numMilestones: 3,
            milestones: [
              {
                project: {} as any,
                index: 0,
                amountLamports: 200000000000,
                kwhTarget: 600000,
                co2Target: 300,
                payee: {} as any,
                released: true,
              },
              {
                project: {} as any,
                index: 1,
                amountLamports: 200000000000,
                kwhTarget: 900000,
                co2Target: 450,
                payee: {} as any,
                released: true,
              },
              {
                project: {} as any,
                index: 2,
                amountLamports: 100000000000,
                kwhTarget: 1200000,
                co2Target: 600,
                payee: {} as any,
                released: false,
              },
            ],
          },
          {
            id: 3,
            name: 'Hydro Power Station',
            description:
              'Small hydroelectric dam providing resilient energy to a cooperative of 9 villages.',
            creator: {} as any,
            governanceAuthority: {} as any,
            oracleAuthority: {} as any,
            vault: {} as any,
            vaultBump: 255,
            fundedAmount: 250000000000,
            kwhTotal: 800000,
            co2Total: 400,
            lastMetricsRoot: new Array(32).fill(0),
            numMilestones: 2,
            milestones: [
              {
                project: {} as any,
                index: 0,
                amountLamports: 150000000000,
                kwhTarget: 400000,
                co2Target: 200,
                payee: {} as any,
                released: true,
              },
              {
                project: {} as any,
                index: 1,
                amountLamports: 100000000000,
                kwhTarget: 600000,
                co2Target: 300,
                payee: {} as any,
                released: false,
              },
            ],
          },
        ];

        setProjects(mockProjects);
      } catch (error) {
        handleError(error, 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [handleError]);

  const filteredProjects = projects.filter(project => {
    const completedMilestones = project.milestones.filter(m => m.released).length;
    const totalMilestones = project.milestones.length;

    switch (filter) {
      case 'active':
        return project.fundedAmount > 0 && completedMilestones < totalMilestones;
      case 'funded':
        return project.fundedAmount > 0 && completedMilestones === 0;
      case 'completed':
        return completedMilestones === totalMilestones;
      default:
        return true;
    }
  });

  const handleViewProjectDetails = (projectId: number) => {
    router.push(`/projects/${projectId}`);
  };

  const FilterButton = ({
    value,
    label,
    count,
  }: {
    value: typeof filter;
    label: string;
    count: number;
  }) => (
    <button
      onClick={() => setFilter(value)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        filter === value
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <DashboardLayout>
      <div className='space-y-10'>
        <header className='space-y-3'>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Investor Home Overview</h1>
          <p className='max-w-2xl text-base text-gray-600'>Monitor renewable projects, funding momentum, and impact metrics in one place. All metrics update as milestones are verified and funds are released from escrow.</p>
        </header>

        <section>
          <MetricsOverview />
        </section>

        <section className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <article className='lg:col-span-2 space-y-8'>
            <div className='flex flex-wrap items-center gap-3'>
              <h2 className='text-2xl font-semibold text-gray-900'>Projects</h2>
              <div className='flex flex-wrap gap-2'>
                <FilterButton value='all' label='All Projects' count={projects.length} />
                <FilterButton
                  value='active'
                  label='Active'
                  count={
                    projects.filter(project => {
                      const completed = project.milestones.filter(m => m.released).length;
                      return project.fundedAmount > 0 && completed < project.milestones.length;
                    }).length
                  }
                />
                <FilterButton
                  value='funded'
                  label='Recently Funded'
                  count={
                    projects.filter(project => project.fundedAmount > 0 && project.milestones.every(m => !m.released)).length
                  }
                />
                <FilterButton
                  value='completed'
                  label='Completed'
                  count={projects.filter(project => project.milestones.every(m => m.released)).length}
                />
              </div>
            </div>

            {recommendations.isLoading ? (
              <div className='h-28 animate-pulse rounded-3xl bg-slate-100' />
            ) : recommendations.isError ? (
              <div className='rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600'>
                Recommendations unavailable. Please try again later.
              </div>
            ) : (
              <RecommendationRail cards={recommendations.data?.recommendations ?? []} />
            )}

            {isLoading ? (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {[...Array(4)].map((_, index) => (
                  <div key={index} className='h-64 rounded-2xl border border-gray-100 bg-gray-100 animate-pulse' />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className='rounded-3xl border border-dashed border-emerald-200 bg-emerald-50 p-10 text-center'>
                <div className='text-4xl'>📊</div>
                <h3 className='mt-3 text-lg font-semibold text-gray-900'>No projects match this filter yet</h3>
                <p className='mt-2 text-sm text-gray-600'>Try selecting a different filter or explore new opportunities in the marketplace.</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {filteredProjects.map(project => (
                  <ProjectStatusCard
                    key={project.id}
                    project={project}
                    milestones={project.milestones}
                    onViewDetails={handleViewProjectDetails}
                  />
                ))}
              </div>
            )}
          </article>

          <aside className='lg:col-span-1'>
            <NotificationPanel />
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}

