import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  transactionHash: string;
  createdAt: string;
  project: {
    id: string;
    title: string;
    status: string;
  };
  funder: {
    id: string;
    username: string;
    email: string | null;
  };
}

/**
 * WO-174: Transaction Management Interface with Filtering and Display
 * 
 * Comprehensive interface for viewing and filtering transaction data
 */
export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchQuery, dateFrom, dateTo]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/transactions?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Project', 'Funder', 'Amount', 'TX Hash'];
    const rows = transactions.map((tx) => [
      new Date(tx.createdAt).toLocaleDateString(),
      tx.id,
      tx.project.title,
      tx.funder.username,
      tx.amount.toString(),
      tx.transactionHash,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="From date"
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="To date"
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={exportToCSV}
              disabled={transactions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              📥 Export to CSV
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button onClick={fetchTransactions} className="mt-2 text-red-600 hover:text-red-800 font-medium">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Transactions Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funder</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TX Hash</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tx.project.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tx.funder.username}</div>
                        <div className="text-xs text-gray-500">{tx.funder.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-green-600">
                          ${tx.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-500">
                          {tx.transactionHash ? `${tx.transactionHash.slice(0, 12)}...` : 'Pending'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} transactions)
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

