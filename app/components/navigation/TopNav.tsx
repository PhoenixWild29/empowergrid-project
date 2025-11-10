import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Bell, Languages } from 'lucide-react';
import clsx from 'clsx';

import WalletConnect from '../WalletConnect';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface NavItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Marketplace', href: '/projects/discover' },
  { label: 'Impact Dashboard', href: '/impact' },
  { label: 'For Developers', href: '/developers' },
  { label: 'Governance', href: '/governance' },
  { label: 'Help', href: '/help' },
];

const LanguageSelector = () => {
  const [language, setLanguage] = useState('en');

  return (
    <label className='relative inline-flex items-center text-sm text-gray-600'>
      <span className='sr-only'>Select language</span>
      <Languages className='mr-2 h-4 w-4 text-emerald-600' aria-hidden='true' />
      <select
        aria-label='Language selector'
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className='rounded-md border border-gray-200 bg-white py-1 pl-2 pr-6 text-sm font-medium text-gray-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200'
      >
        <option value='en'>EN</option>
        <option value='es'>ES</option>
        <option value='fr'>FR</option>
      </select>
    </label>
  );
};

// NotificationButton is now replaced by NotificationCenter component

const ProfileLink = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Link
        href='/register'
        className='rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50'
      >
        Join EmpowerGrid
      </Link>
    );
  }

  const isProfileRoute = router.pathname.startsWith('/profile');

  return (
    <Link
      href='/profile'
      className={clsx(
        'rounded-full px-4 py-2 text-sm font-semibold transition',
        isProfileRoute
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
          : 'bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50'
      )}
    >
      My Profile
    </Link>
  );
};

export const TopNav = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPath = router.pathname;

  const primaryNavItems = useMemo(
    () => PRIMARY_NAV.filter((item) => (item.requiresAuth ? isAuthenticated : true)),
    [isAuthenticated]
  );

  const handleNavClick = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const renderNavLink = (item: NavItem, variant: 'desktop' | 'mobile') => {
    const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

    const baseClasses =
      variant === 'desktop'
        ? 'relative px-3 py-2 text-sm font-semibold transition'
        : 'block rounded-md px-3 py-2 text-base font-semibold';

    const activeClasses =
      variant === 'desktop'
        ? 'text-emerald-700 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-600'
        : 'bg-emerald-50 text-emerald-700';

    const inactiveClasses =
      variant === 'desktop'
        ? 'text-gray-600 hover:text-emerald-600'
        : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700';

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={clsx(baseClasses, isActive ? activeClasses : inactiveClasses)}
        aria-current={isActive ? 'page' : undefined}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header className='sticky top-0 z-40 bg-white/90 shadow-sm backdrop-blur'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-8'>
          <Link href='/' className='flex items-center gap-3'>
            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-200'>
              EG
            </span>
            <span className='hidden flex-col text-left lg:flex'>
              <span className='text-sm font-semibold uppercase tracking-wide text-emerald-700'>EmpowerGrid</span>
              <span className='text-xs text-gray-500'>Community-Powered Renewable Energy</span>
            </span>
          </Link>

          <nav className='hidden items-center gap-2 lg:flex' aria-label='Primary'>
            {primaryNavItems.map((item) => renderNavLink(item, 'desktop'))}
          </nav>
        </div>

        <div className='hidden items-center gap-3 lg:flex'>
          <LanguageSelector />
          <NotificationCenter />
          <ProfileLink isAuthenticated={isAuthenticated} />
          <div className='pl-3'>
            <WalletConnect />
          </div>
        </div>

        <button
          type='button'
          className='inline-flex items-center justify-center rounded-md border border-emerald-200 bg-white p-2 text-emerald-600 transition hover:bg-emerald-50 lg:hidden'
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls='mobile-navigation'
        >
          <span className='sr-only'>Toggle navigation</span>
          {mobileOpen ? <X className='h-5 w-5' aria-hidden='true' /> : <Menu className='h-5 w-5' aria-hidden='true' />}
        </button>
      </div>

      {mobileOpen && (
        <div id='mobile-navigation' className='border-t border-gray-200 bg-white px-4 pb-6 pt-4 shadow-lg lg:hidden'>
          <nav className='space-y-1' aria-label='Mobile Primary'>
            {primaryNavItems.map((item) => renderNavLink(item, 'mobile'))}
          </nav>
          <div className='mt-6 space-y-3'>
            <LanguageSelector />
            <div className='flex items-center justify-between'>
              <NotificationCenter />
              <ProfileLink isAuthenticated={isAuthenticated} />
            </div>
            <div className='pt-2'>
              <WalletConnect />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
