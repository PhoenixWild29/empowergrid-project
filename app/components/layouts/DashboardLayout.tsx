import { ReactNode } from 'react';

import { AppFooter } from '../navigation/AppFooter';
import { TopNav } from '../navigation/TopNav';
import { DashboardSidebar } from '../navigation/DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className='flex min-h-screen flex-col bg-slate-50 text-gray-900'>
      <TopNav />
      <div className='mx-auto flex w-full flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:max-w-7xl lg:flex-row lg:px-8'>
        <DashboardSidebar className='lg:w-64' />
        <main className='flex-1 space-y-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8'>
          {children}
        </main>
      </div>
      <AppFooter />
    </div>
  );
};
