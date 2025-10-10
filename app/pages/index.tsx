import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import idl from '../../idl/empower_grid.json';

// Use a valid placeholder program ID (system program)
const getProgramId = () => {
  try {
    if (process.env.NEXT_PUBLIC_PROGRAM_ID && process.env.NEXT_PUBLIC_PROGRAM_ID.length > 0) {
      return new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
    }
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_PROGRAM_ID, using default');
  }
  return new PublicKey('11111111111111111111111111111111');
};

const PROGRAM_ID = getProgramId();

interface Project {
  id: number;
  name: string;
  description: string;
  fundedAmount: number;
  kwhTotal: number;
  co2Total: number;
  numMilestones: number;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [connection] = useState(
    () => new Connection(clusterApiUrl('devnet'), 'confirmed')
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const provider = new anchor.AnchorProvider(connection, {} as any, {});
      const program = new anchor.Program(idl as any, PROGRAM_ID, provider);

      // In a real implementation, you'd need to track all project PDAs
      // For now, we'll show a placeholder
      setProjects([]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900'>EmpowerGRID</h1>
          <p className='mt-2 text-lg text-gray-600'>
            Community-funded renewable energy projects on Solana
          </p>
        </div>

        <div className='mb-8'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
            Active Projects
          </h2>

          {loading ? (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto'></div>
              <p className='mt-4 text-gray-600'>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-lg shadow'>
              <div className='text-gray-400 text-6xl mb-4'>⚡</div>
              <h3 className='text-xl font-medium text-gray-900 mb-2'>
                No projects yet
              </h3>
              <p className='text-gray-600 mb-6'>
                Be the first to create a renewable energy project!
              </p>
              <Link
                href='/create-project'
                className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'
              >
                Create Your First Project
              </Link>
            </div>
          ) : (
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
