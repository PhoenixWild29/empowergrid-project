import Layout from '../../components/Layout';

export default function ApiDocsPage() {
  return (
    <Layout>
      <article className='space-y-6'>
        <header className='space-y-2'>
          <p className='text-sm font-semibold uppercase tracking-wide text-emerald-600'>Developer resources</p>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>EmpowerGrid API overview</h1>
          <p className='text-sm text-gray-600'>REST and WebSocket endpoints for escrow, milestones, analytics, and governance.</p>
        </header>
        <p className='text-sm text-gray-600'>An updated OpenAPI specification and SDK examples will be provided here. Until then, explore the existing /api/* endpoints documented in the repository.</p>
      </article>
    </Layout>
  );
}
