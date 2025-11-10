import Link from 'next/link';

import Layout from '../../components/Layout';

const developerBenefits = [
  {
    title: 'Milestone-based escrow',
    description:
      'Secure disbursements tied to verifiable milestones make it easier to earn investor trust and unlock larger raises.',
  },
  {
    title: 'Verification marketplace',
    description:
      'Partner with vetted validators or bring your own. All evidence is stored immutably for compliance and audits.',
  },
  {
    title: 'Community reach',
    description:
      'Tap into an impact-focused investor base that values community ownership and long-term sustainability.',
  },
];

const builderSteps = [
  {
    step: '1',
    title: 'Complete onboarding',
    detail:
      'Verify your organization, connect team wallets, and set up payout preferences. Our team supports you through KYB checks.',
  },
  {
    step: '2',
    title: 'Design your milestone roadmap',
    detail:
      'Use the project creation wizard to define scope, budgets, and measurable outcomes with validator assignments.',
  },
  {
    step: '3',
    title: 'Launch and engage investors',
    detail:
      'Share your campaign page, answer questions, and keep supporters updated with progress posts and data feeds.',
  },
];

export default function DeveloperLandingPage() {
  return (
    <Layout>
      <div className='space-y-12'>
        <header className='flex flex-col gap-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-10 shadow-sm lg:flex-row lg:items-center lg:justify-between'>
          <div className='max-w-2xl space-y-4'>
            <p className='text-sm font-semibold uppercase tracking-wide text-emerald-600'>For Renewable Project Developers</p>
            <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Launch and scale community-owned energy projects with milestone escrow</h1>
            <p className='text-base text-gray-700'>EmpowerGrid handles investor escrow, verification workflows, and governance tooling so you can stay focused on delivering clean power to the communities you serve.</p>
            <div className='flex flex-wrap gap-3 pt-2'>
              <Link
                href='/create-project'
                className='rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700'
              >
                Start a project
              </Link>
              <Link
                href='/projects/create-enhanced'
                className='rounded-full border border-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50'
              >
                Explore the project wizard
              </Link>
            </div>
          </div>
          <div className='grid w-full max-w-sm gap-3 rounded-2xl border border-white/60 bg-white/70 p-6 backdrop-blur lg:max-w-xs'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wide text-emerald-600'>Why developers choose EmpowerGrid</p>
            </div>
            {developerBenefits.map((benefit) => (
              <div key={benefit.title} className='rounded-xl border border-emerald-100 bg-white p-4 shadow-sm'>
                <h2 className='text-sm font-semibold text-gray-900'>{benefit.title}</h2>
                <p className='mt-1 text-sm text-gray-600'>{benefit.description}</p>
              </div>
            ))}
          </div>
        </header>

        <section className='rounded-3xl border border-gray-200 bg-white p-8 shadow-sm'>
          <h2 className='text-xl font-semibold text-gray-900'>How it works</h2>
          <p className='mt-2 text-sm text-gray-600'>Launch in days with guided workflows and validator support.</p>
          <ol className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-3'>
            {builderSteps.map((step) => (
              <li key={step.step} className='flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-6'>
                <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white'>
                  {step.step}
                </span>
                <h3 className='text-lg font-semibold text-gray-900'>{step.title}</h3>
                <p className='text-sm text-gray-600'>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-gray-900'>Tools for every milestone</h2>
            <ul className='mt-4 space-y-3 text-sm text-gray-600'>
              <li>• Drag-and-drop milestone builder with budget validation and validator assignments.</li>
              <li>• Automated evidence collection via Switchboard oracle feeds and document uploads (IPFS).</li>
              <li>• Compliance-ready audit trail exportable to PDF/CSV.</li>
            </ul>
          </article>
          <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-gray-900'>Need tailored support?</h2>
            <p className='mt-2 text-sm text-gray-600'>Our developer success team helps structure complex projects, coordinate validators, and advise on community ownership models.</p>
            <Link
              href='/help'
              className='mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800'
            >
              Contact support →
            </Link>
          </article>
        </section>
      </div>
    </Layout>
  );
}
