import { useState, useMemo } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import { Search, MessageCircle, BookOpen, Shield, Wallet, TrendingUp, ChevronDown, ChevronUp, Send } from 'lucide-react';

const helpTopics = [
  {
    title: 'Getting started as an investor',
    description: 'Learn how milestone escrow protects your contribution and how to complete your first investment.',
    link: '/help/articles/investor-onboarding',
    icon: TrendingUp,
    category: 'investor',
  },
  {
    title: 'Submitting milestones & evidence',
    description: 'Step-by-step guidance for project developers and validators on verification workflows.',
    link: '/help/articles/milestone-verification',
    icon: BookOpen,
    category: 'developer',
  },
  {
    title: 'Wallet & security tips',
    description: 'Best practices for keeping funds safe, connecting wallets, and recovering access.',
    link: '/help/articles/wallet-security',
    icon: Wallet,
    category: 'security',
  },
  {
    title: 'Governance participation',
    description: 'Understand how to vote on proposals and engage in community decision making.',
    link: '/help/articles/governance-basics',
    icon: Shield,
    category: 'governance',
  },
];

const faqs = [
  {
    id: 'faq-1',
    question: 'How does milestone escrow protect my investment?',
    answer:
      'Milestone escrow ensures your funds are only released to project developers after independent validators confirm that specific project milestones have been completed. Funds remain locked in a smart contract until verification, protecting you from incomplete or failed projects.',
    category: 'investor',
  },
  {
    id: 'faq-2',
    question: 'What happens if a project fails to meet a milestone?',
    answer:
      'If a milestone is not completed by the deadline, validators will review the situation. Depending on the circumstances, funds may be returned to investors, the milestone deadline may be extended, or the project may be marked as at-risk with additional oversight.',
    category: 'investor',
  },
  {
    id: 'faq-3',
    question: 'How do I become a validator?',
    answer:
      'Validators must apply through our verification hub and demonstrate expertise in renewable energy project assessment. We review applications based on technical credentials, past audit experience, and commitment to the platform. Contact us at validators@empowergrid.com to learn more.',
    category: 'developer',
  },
  {
    id: 'faq-4',
    question: 'Can I withdraw my investment before a project completes?',
    answer:
      'Investments are locked in escrow until milestone releases. However, some projects may offer early exit options through secondary markets or governance proposals. Check individual project terms for specific withdrawal policies.',
    category: 'investor',
  },
  {
    id: 'faq-5',
    question: 'What wallets are supported?',
    answer:
      'EmpowerGrid currently supports Phantom, Solflare, and Ledger hardware wallets. We are actively working on expanding wallet support. For custodial wallet options, contact support@empowergrid.com.',
    category: 'security',
  },
  {
    id: 'faq-6',
    question: 'How are impact metrics calculated?',
    answer:
      'Impact metrics (CO₂ offset, households powered, energy generated) are calculated using verified milestone data and industry-standard conversion factors. All calculations are audited by validators and documented in our carbon accounting methodology. View detailed methodology at /impact/carbon-methodology.',
    category: 'investor',
  },
  {
    id: 'faq-7',
    question: 'What fees does EmpowerGrid charge?',
    answer:
      'EmpowerGrid charges a platform fee of 2.5% on successful investments, which supports validator payments, platform maintenance, and governance operations. Transaction fees (Solana network fees) are separate and vary based on network congestion.',
    category: 'investor',
  },
  {
    id: 'faq-8',
    question: 'How do I create a project proposal?',
    answer:
      'Use the Project Creation Wizard (available to verified developers) to submit your renewable energy project. The wizard guides you through project basics, impact metrics, milestone planning, and validator assignment. All proposals are reviewed before going live.',
    category: 'developer',
  },
];

const supportChannels = [
  {
    label: 'Chat with support',
    description: 'Live assistance weekdays 9am–6pm UTC. Average response time under 10 minutes.',
    action: 'Start chat',
    href: 'mailto:support@empowergrid.com',
    icon: MessageCircle,
  },
  {
    label: 'Join a training session',
    description: 'Weekly webinars for new developers and investors. Sessions recorded and shared afterwards.',
    action: 'View schedule',
    href: '/help/training',
    icon: BookOpen,
  },
  {
    label: 'Report a security issue',
    description: 'Responsible disclosure program with 48-hour acknowledgement SLA.',
    action: 'Report issue',
    href: '/help/security',
    icon: Shield,
  },
];

export default function HelpCenterPage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      faq => faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // In a real app, this would POST to /api/help/contact
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
      setContactForm({ name: '', email: '', subject: '', message: '', category: 'general' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('[Help] Failed to submit contact form', error);
    } finally {
      setSubmitting(false);
    }
  };

  const LayoutWrapper = isAuthenticated ? DashboardLayout : Layout;

  return (
    <LayoutWrapper>
      <div className='space-y-10'>
        <header className='space-y-3 text-center lg:text-left'>
          <p className='text-xs font-semibold uppercase tracking-wide text-emerald-600'>Help & Support</p>
          <h1 className='text-3xl font-bold text-slate-900 sm:text-4xl'>We're here to help you power the transition to clean energy</h1>
          <p className='mx-auto max-w-3xl text-sm text-slate-600 sm:mx-0'>
            Browse guides, connect with support, or join a live training. Most answers are just a few clicks away.
          </p>
        </header>

        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
            <input
              type='text'
              placeholder='Search help articles and FAQs...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500'
            />
          </div>
        </section>

        <section className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4'>
          {helpTopics.map(topic => {
            const Icon = topic.icon;
            return (
              <Link
                key={topic.title}
                href={topic.link}
                className='group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md'
              >
                <div className='mb-4 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-600 group-hover:bg-emerald-200'>
                  <Icon className='h-5 w-5' />
                </div>
                <h2 className='text-lg font-semibold text-slate-900'>{topic.title}</h2>
                <p className='mt-2 text-sm text-slate-600'>{topic.description}</p>
                <span className='mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 group-hover:text-emerald-800'>
                  Read guide →
                </span>
              </Link>
            );
          })}
        </section>

        <section className='space-y-6'>
          <div>
            <h2 className='text-2xl font-semibold text-slate-900'>Frequently Asked Questions</h2>
            <p className='mt-1 text-sm text-slate-600'>Quick answers to common questions about EmpowerGrid.</p>
          </div>
          <div className='space-y-3'>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map(faq => (
                <div
                  key={faq.id}
                  className='rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md'
                >
                  <button
                    type='button'
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className='flex w-full items-center justify-between p-6 text-left'
                  >
                    <span className='flex-1 font-semibold text-slate-900'>{faq.question}</span>
                    {expandedFaq === faq.id ? (
                      <ChevronUp className='ml-4 h-5 w-5 flex-shrink-0 text-slate-400' />
                    ) : (
                      <ChevronDown className='ml-4 h-5 w-5 flex-shrink-0 text-slate-400' />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className='border-t border-slate-200 px-6 py-4'>
                      <p className='text-sm text-slate-600'>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center'>
                <p className='text-sm text-slate-600'>No FAQs match your search. Try different keywords.</p>
              </div>
            )}
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-2'>
          <div className='rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-8 shadow-sm'>
            <h2 className='text-xl font-semibold text-slate-900'>Support channels</h2>
            <p className='mt-2 text-sm text-slate-600'>Choose the option that fits your question. Our support team is impact-focused and ready to help.</p>
            <div className='mt-6 space-y-4'>
              {supportChannels.map(channel => {
                const Icon = channel.icon;
                return (
                  <div key={channel.label} className='rounded-2xl border border-white/60 bg-white/70 p-6 backdrop-blur'>
                    <div className='mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-600'>
                      <Icon className='h-4 w-4' />
                    </div>
                    <h3 className='text-base font-semibold text-slate-900'>{channel.label}</h3>
                    <p className='mt-2 text-sm text-slate-600'>{channel.description}</p>
                    <Link
                      href={channel.href}
                      className='mt-4 inline-flex items-center rounded-full border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50'
                    >
                      {channel.action}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm'>
            <h2 className='text-xl font-semibold text-slate-900'>Contact us</h2>
            <p className='mt-2 text-sm text-slate-600'>Send us a message and we'll get back to you within 24 hours.</p>
            {submitted ? (
              <div className='mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center'>
                <p className='font-semibold text-emerald-900'>Message sent successfully!</p>
                <p className='mt-1 text-sm text-emerald-700'>We'll respond to your inquiry within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitContact} className='mt-6 space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-slate-900'>Name</label>
                  <input
                    type='text'
                    required
                    value={contactForm.name}
                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                    className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-slate-900'>Email</label>
                  <input
                    type='email'
                    required
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-slate-900'>Category</label>
                  <select
                    value={contactForm.category}
                    onChange={e => setContactForm({ ...contactForm, category: e.target.value })}
                    className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                  >
                    <option value='general'>General Inquiry</option>
                    <option value='technical'>Technical Support</option>
                    <option value='billing'>Billing Question</option>
                    <option value='security'>Security Concern</option>
                    <option value='partnership'>Partnership Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-semibold text-slate-900'>Subject</label>
                  <input
                    type='text'
                    required
                    value={contactForm.subject}
                    onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                    className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-slate-900'>Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                  />
                </div>
                <button
                  type='submit'
                  disabled={submitting}
                  className='inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-emerald-300'
                >
                  <Send className='h-4 w-4' />
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}
