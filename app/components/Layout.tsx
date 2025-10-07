import Link from 'next/link';
import { ReactNode } from 'react';
import WalletConnect from './WalletConnect';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link href='/' className='text-xl font-bold text-green-600'>
                EmpowerGRID
              </Link>
            </div>
            <div className='flex items-center space-x-4'>
              <Link href='/' className='text-gray-700 hover:text-gray-900'>
                Projects
              </Link>
              <Link
                href='/dashboard'
                className='text-gray-700 hover:text-gray-900'
              >
                Dashboard
              </Link>
              {isAuthenticated && (
                <Link
                  href='/profile'
                  className='text-gray-700 hover:text-gray-900'
                >
                  Profile
                </Link>
              )}
              <Link
                href='/create-project'
                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium'
              >
                Create Project
              </Link>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
