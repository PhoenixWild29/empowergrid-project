import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import ProjectStatusCard from '../components/dashboard/ProjectStatusCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
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
  const [filter, setFilter] = useState<
    'all' | 'active' | 'funded' | 'completed'
  >('all');

  // Mock data - in real app, this would fetch from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock projects data
        const mockProjects: ProjectWithMilestones[] = [
          {
            id: 1,
            name: 'Solar Farm Alpha',
            description:
              'Large-scale solar installation in rural Nevada providing clean energy to 500+ homes',
            creator: {} as any, // Mock public key
            governanceAuthority: {} as any,
            oracleAuthority: {} as any,
            vault: {} as any,
            vaultBump: 255,
            fundedAmount: 750000000000, // 750k SOL in lamports
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
            description:
              'Community-owned wind farm project connecting 10 turbines across 200 acres',
            creator: {} as any,
            governanceAuthority: {} as any,
            oracleAuthority: {} as any,
            vault: {} as any,
            vaultBump: 255,
            fundedAmount: 500000000000, // 500k SOL
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
              'Small hydroelectric dam providing sustainable energy to local community',
            creator: {} as any,
            governanceAuthority: {} as any,
            oracleAuthority: {} as any,
            vault: {} as any,
            vaultBump: 255,
            fundedAmount: 250000000000, // 250k SOL
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
    const completedMilestones = project.milestones.filter(
      m => m.released
    ).length;
    const totalMilestones = project.milestones.length;

    switch (filter) {
      case 'active':
        return (
          project.fundedAmount > 0 && completedMilestones < totalMilestones
        );
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
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        filter === value
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <Layout>
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Project Dashboard
            </h1>
            <p className='text-gray-600 mt-2'>
              Monitor renewable energy projects, track funding progress, and
              view platform metrics
            </p>
          </div>

          {/* Platform Metrics */}
          <div className='mb-12'>
            <MetricsOverview />
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12'>
            {/* Projects Section - Takes 2 columns on large screens */}
            <div className='lg:col-span-2'>
              {/* Project Filters */}
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                  Projects
                </h2>
                <div className='flex flex-wrap gap-2'>
                  <FilterButton
                    value='all'
                    label='All Projects'
                    count={projects.length}
                  />
                  <FilterButton
                    value='active'
                    label='Active'
                    count={
                      projects.filter(p => {
                        const completed = p.milestones.filter(
                          m => m.released
                        ).length;
                        return (
                          p.fundedAmount > 0 && completed < p.milestones.length
                        );
                      }).length
                    }
                  />
                  <FilterButton
                    value='funded'
                    label='Recently Funded'
                    count={
                      projects.filter(
                        p =>
                          p.fundedAmount > 0 &&
                          p.milestones.every(m => !m.released)
                      ).length
                    }
                  />
                  <FilterButton
                    value='completed'
                    label='Completed'
                    count={
                      projects.filter(p => p.milestones.every(m => m.released))
                        .length
                    }
                  />
                </div>
              </div>

              {/* Projects Grid */}
              {isLoading ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className='bg-white rounded-lg shadow-md p-6 animate-pulse'
                    >
                      <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                      <div className='h-4 bg-gray-200 rounded w-1/2 mb-4'></div>
                      <div className='h-20 bg-gray-200 rounded mb-4'></div>
                      <div className='h-8 bg-gray-200 rounded'></div>
                    </div>
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className='text-center py-12'>
                  <div className='text-6xl text-gray-300 mb-4'>📊</div>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    No projects found
                  </h3>
                  <p className='text-gray-600'>
                    {filter === 'all'
                      ? 'No projects have been created yet.'
                      : `No projects match the "${filter}" filter.`}
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
            </div>

            {/* Activity Feed - Takes 1 column on large screens */}
            <div className='lg:col-span-1'>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
