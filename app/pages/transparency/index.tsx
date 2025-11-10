import Layout from '../../components/Layout';

const transparencyReports = [
  {
    id: 'report-2025-q1',
    title: 'Q1 2025 – Escrow and impact transparency report',
    description: 'Detailed breakdown of funds custodied, milestone releases, validator performance, and CO₂ reporting.',
    link: 'https://ipfs.io/ipfs/placeholder-q1-2025',
  },
  {
    id: 'report-2024-annual',
    title: '2024 Annual accountability report',
    description: 'Yearly summary of platform metrics, audit results, and community governance decisions.',
    link: 'https://ipfs.io/ipfs/placeholder-annual-2024',
  },
];

export default function TransparencyPage() {
  return (
    <Layout>
      <div className='space-y-8'>
        <header className='space-y-2'>
          <p className='text-sm font-semibold uppercase tracking-wide text-emerald-600'>Transparency</p>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Accountability reports & assurance</h1>
          <p className='max-w-2xl text-sm text-gray-600'>Every quarter we publish an immutable record of escrow balances, milestone verifications, and impact measurements. Reports are pinned to IPFS and mirrored for redundancy.</p>
        </header>

        <section className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {transparencyReports.map((report) => (
            <article key={report.id} className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
              <h2 className='text-lg font-semibold text-gray-900'>{report.title}</h2>
              <p className='mt-2 text-sm text-gray-600'>{report.description}</p>
              <a
                href={report.link}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800'
              >
                View IPFS report →
              </a>
            </article>
          ))}
        </section>
      </div>
    </Layout>
  );
}
