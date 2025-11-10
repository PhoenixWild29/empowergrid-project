import { DashboardLayout } from '../../components/layouts/DashboardLayout';

const mockTransactions = [
  {
    id: 'txn-1',
    type: 'Investment',
    project: 'Bronx Community Solar',
    amount: '500 USDC',
    status: 'Confirmed',
    timestamp: '2025-06-02 14:23 UTC',
    hash: '5d31...9ac4',
  },
  {
    id: 'txn-2',
    type: 'Milestone release',
    project: 'Andes Wind Cooperative',
    amount: '120,000 USDC',
    status: 'Pending confirmation',
    timestamp: '2025-06-01 09:41 UTC',
    hash: '3a77...d1b2',
  },
  {
    id: 'txn-3',
    type: 'Impact rewards',
    project: 'Kerala Hydro Modernization',
    amount: '42 GRID tokens',
    status: 'Confirmed',
    timestamp: '2025-05-28 19:05 UTC',
    hash: 'aa12...413f',
  },
];

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className='space-y-8'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl'>Transaction activity</h1>
          <p className='max-w-2xl text-sm text-gray-600'>A transparent ledger of every escrow deposit, milestone release, and reward you have participated in.</p>
        </header>

        <div className='overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th scope='col' className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600'>Type</th>
                <th scope='col' className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600'>Project</th>
                <th scope='col' className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600'>Amount</th>
                <th scope='col' className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600'>Status</th>
                <th scope='col' className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600'>Timestamp</th>
                <th scope='col' className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600'>Network ref</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 bg-white'>
              {mockTransactions.map((transaction) => (
                <tr key={transaction.id} className='hover:bg-emerald-50/60'>
                  <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900'>{transaction.type}</td>
                  <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>{transaction.project}</td>
                  <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>{transaction.amount}</td>
                  <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>{transaction.status}</td>
                  <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>{transaction.timestamp}</td>
                  <td className='whitespace-nowrap px-6 py-4 text-sm font-mono text-emerald-700'>{transaction.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 text-sm text-emerald-800'>
          Looking for full on-chain details? Open any transaction above to view the Solana explorer record or download a CSV report for accounting.
        </div>
      </div>
    </DashboardLayout>
  );
}
