import Link from 'next/link';
import { lamportsToSol, calculateFundingProgress } from '../types';

interface Project {
  id: number;
  name: string;
  description: string;
  fundedAmount: number;
  kwhTotal: number;
  co2Total: number;
  numMilestones: number;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Calculate funding progress based on funded amount vs target (assuming 1 SOL per milestone)
  const fundingProgress = calculateFundingProgress(
    project.fundedAmount,
    project.numMilestones,
    1_000_000_000 // 1 SOL in lamports per milestone
  );

  return (
    <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
      <div className='flex justify-between items-start mb-4'>
        <h3 className='text-xl font-semibold text-gray-900 mb-2'>
          {project.name}
        </h3>
        <span className='bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full'>
          Active
        </span>
      </div>

      <p className='text-gray-600 mb-4 line-clamp-3'>{project.description}</p>

      <div className='space-y-3 mb-4'>
        <div className='flex justify-between text-sm'>
          <span className='text-gray-500'>Funding Progress</span>
          <span className='font-medium'>{fundingProgress.toFixed(1)}%</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-green-600 h-2 rounded-full'
            style={{ width: `${Math.min(fundingProgress, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {lamportsToSol(project.fundedAmount).toFixed(2)}
          </div>
          <div className='text-xs text-gray-500'>SOL Funded</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-blue-600'>
            {project.kwhTotal}
          </div>
          <div className='text-xs text-gray-500'>kWh Generated</div>
        </div>
      </div>

      <div className='flex justify-between items-center'>
        <div className='text-sm text-gray-500'>
          CO₂ Saved: {project.co2Total} kg
        </div>
        <Link
          href={`/projects/${project.id}`}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors text-sm'
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
