import Layout from '../../../components/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <article className='space-y-6'>
        <header className='space-y-2'>
          <p className='text-sm font-semibold uppercase tracking-wide text-emerald-600'>Legal</p>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Terms of use</h1>
          <p className='text-sm text-gray-600'>Updated November 8, 2025</p>
        </header>
        <p className='text-sm text-gray-600'>These terms summarize how EmpowerGrid operates, how milestone escrow works, and what is expected of investors, developers, validators, and community members. A detailed legal document is available in PDF. This page will be expanded as the legal team finalizes the refreshed policy.</p>
      </article>
    </Layout>
  );
}
