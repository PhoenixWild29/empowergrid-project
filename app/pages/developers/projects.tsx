import Link from 'next/link';

import { DashboardLayout } from '../../components/layouts/DashboardLayout';

const developerProjects = [
  {
    id: 'dev-project-1',
    name: 'Bronx Community Solar',
    status: 'Fundraising',
    fundingProgress: 72,
    nextMilestone: 'Panel delivery verification — due 14 Jun',
  },
  {
    id: 'dev-project-2',
    name: 'Yucatán Solar Schools',
    status: 'Awaiting verification',
    fundingProgress: 64,
    nextMilestone: 'Training documentation upload',
  },
  {
    id: 'dev-project-3',
    name: 'Lagos Microgrid Expansion',
    status: 'In escrow review',
    fundingProgress: 48,
    nextMilestone: 'Battery storage installation inspection',
  },
];

export default function DeveloperProjectsPage() {
  return (
    <DashboardLayout>
      <div className='space-y-8'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>My projects</h1>
          <p className='max-w-2xl text-sm text-gray-600'>Monitor fundraising, milestone verification, and escrow releases for every project you steward.</p>
          <Link
            href='/projects/create-enhanced'
            className='inline-flex w-fit items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700'
          >
            Create new project
          </Link>
        </header>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {developerProjects.map(project => (
            <article key={project.id} className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
              <h2 className='text-lg font-semibold text-gray-900'>{project.name}</h2>
              <p className='mt-1 text-sm font-medium text-emerald-700'>{project.status}</p>
              <div className='mt-4'>
                <div className='flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-600'>
                  <span>Funding progress</span>
                  <span>{project.fundingProgress}%</span>
                </div>
                <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-100'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all'
                    style={{ width: ${project.fundingProgress}% }}
                  />
                </div>
              </div>
              <p className='mt-4 text-sm text-gray-600'>{project.nextMilestone}</p>
              <div className='mt-6 flex gap-3'>
                <Link
                  href={/projects/}
                  className='rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'
                >
                  View project
                </Link>
                <Link
                  href='/developers/verification'
                  className='rounded-full border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50'
                >
                  Submit milestone
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
