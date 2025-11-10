import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import MilestoneTimeline from '../../components/data-visualizations/MilestoneTimeline';

const mockTimeline = [
  {
    id: 'milestone-1',
    title: 'Feasibility studies complete',
    status: 'RELEASED',
    description: 'Independent engineering report submitted and approved by validators.',
    dueDate: '2025-05-12',
    completedAt: '2025-05-08',
    targetAmount: 150000,
  },
  {
    id: 'milestone-2',
    title: 'Equipment delivery',
    status: 'APPROVED',
    description: 'Panels arriving at staging warehouse with IoT tracking feed.',
    dueDate: '2025-07-01',
    targetAmount: 220000,
  },
  {
    id: 'milestone-3',
    title: 'Installation & commissioning',
    status: 'PENDING',
    description: 'Ground crews scheduled; validators assigned for on-site inspection.',
    dueDate: '2025-09-15',
    targetAmount: 310000,
  },
];

export default function MilestoneUpdatesPage() {
  return (
    <DashboardLayout>
      <div className='space-y-8'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Milestone updates</h1>
          <p className='max-w-2xl text-sm text-gray-600'>Track the verification status of every project you support. Milestones unlock funding only after validators confirm evidence.</p>
        </header>

        <div className='rounded-3xl border border-gray-200 bg-white shadow-sm'>
          <MilestoneTimeline milestones={mockTimeline} />
        </div>
      </div>
    </DashboardLayout>
  );
}
