import Layout from '../components/Layout';

export default function CareersPage() {
  return (
    <Layout>
      <div className='space-y-6'>
        <header className='space-y-2'>
          <p className='text-sm font-semibold uppercase tracking-wide text-emerald-600'>Join the team</p>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Careers at EmpowerGrid</h1>
          <p className='text-sm text-gray-600'>Help us build a transparent funding network for community-owned renewable energy.</p>
        </header>
        <p className='text-sm text-gray-600'>We’re not hiring right now, but we regularly collaborate with designers, smart contract engineers, and community organizers. Check back soon or email talent@empowergrid.com.</p>
      </div>
    </Layout>
  );
}
