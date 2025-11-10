import Link from 'next/link';

const footerLinks = [
  { label: 'Terms of Use', href: '/help/legal/terms' },
  { label: 'Privacy', href: '/help/legal/privacy' },
  { label: 'Transparency Reports', href: '/transparency' },
  { label: 'Carbon Accounting', href: '/impact/carbon-methodology' },
  { label: 'API Docs', href: '/docs/api' },
  { label: 'GitHub', href: 'https://github.com/PhoenixWild29/empowergrid-project', external: true },
  { label: 'Careers', href: '/careers' },
];

export const AppFooter = () => {
  return (
    <footer className='border-t border-emerald-100 bg-white/90 py-6 backdrop-blur'>
      <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-600 sm:flex-row sm:px-6 lg:px-8'>
        <p className='text-center sm:text-left'>
          © {new Date().getFullYear()} EmpowerGrid. Community-owned renewable energy funding.
        </p>
        <nav className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2' aria-label='Footer'>
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className='transition hover:text-emerald-700'
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};
