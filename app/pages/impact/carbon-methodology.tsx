import Layout from '../../components/Layout';

export default function CarbonMethodologyPage() {
  return (
    <Layout>
      <article className='space-y-6'>
        <header className='space-y-2'>
          <p className='text-sm font-semibold uppercase tracking-wide text-emerald-600'>Impact methodology</p>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Carbon accounting framework</h1>
          <p className='text-sm text-gray-600'>How EmpowerGrid estimates and verifies CO₂ reductions</p>
        </header>
        <p className='text-sm text-gray-600'>EmpowerGrid follows the Gold Standard and Greenhouse Gas Protocol. Each project specifies expected kWh output and grid emission factors. Validators upload measurement and verification (M&V) reports, which are stored on IPFS. A detailed methodology document will be published here soon.</p>
      </article>
    </Layout>
  );
}
