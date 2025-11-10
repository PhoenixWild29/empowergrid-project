import { ReactNode } from 'react';

import { AppFooter } from './navigation/AppFooter';
import { TopNav } from './navigation/TopNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className='flex min-h-screen flex-col bg-slate-50 text-gray-900'>
      <TopNav />
      <main className='mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8'>
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
