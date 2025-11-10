import Layout from '../../../components/Layout';

export default function PrivacyPage() {
  return (
    <Layout>
      <article className='space-y-6'>
        <header className='space-y-2'>
          <p className='text-sm font-semibold uppercase tracking-wide text-emerald-600'>Legal</p>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Privacy policy</h1>
          <p className='text-sm text-gray-600'>Updated November 8, 2025</p>
        </header>
        <p className='text-sm text-gray-600'>EmpowerGrid collects only the information needed to run milestone escrow, fulfill regulatory requirements, and deliver impact reporting. Wallet addresses are pseudonymous and never sold. A full privacy policy will be published here with data retention timelines and user rights.</p>
      </article>
    </Layout>
  );
}
