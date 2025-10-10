/**
 * Project Funding Page
 * 
 * WO-75: Core Blockchain Funding Panel with USDC Transaction Workflows
 * 
 * Features:
 * - USDC investment panel
 * - Wallet integration (Phantom, Solflare)
 * - Multi-step confirmation workflow
 * - Transaction status tracking
 * - Form validation
 * - Transaction history
 * - Balance checking
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import Layout from '../../../components/Layout';
import { FundingInterface } from '../../../components/funding';

export default function FundProjectPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<any>(null);
  const [fundingHistory, setFundingHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WO-75: Wallet adapters for Phantom and Solflare
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${id}`);
        const projectData = await projectResponse.json();
        
        if (projectData.success) {
          setProject(projectData.project);
        }

        // Fetch funding progress and history
        const fundingResponse = await fetch(`/api/projects/${id}/funding-progress`);
        const fundingData = await fundingResponse.json();
        
        if (fundingData.success) {
          setFundingHistory(fundingData.contributors || []);
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleFundingComplete = () => {
    // Refresh project data
    router.reload();
  };

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </Layout>
    );
  }

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <Layout>
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Fund Project
              </h1>
              <p className="text-gray-600">{project.title}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Funding Interface */}
              <div className="lg:col-span-2">
                <FundingInterface
                  projectId={project.id}
                  project={project}
                  onFundingComplete={handleFundingComplete}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Project Summary */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Project Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium text-gray-900">{project.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Energy Capacity</span>
                      <span className="font-medium text-gray-900">
                        {project.energyCapacity ? `${project.energyCapacity} kW` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium text-gray-900">{project.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Funders</span>
                      <span className="font-medium text-gray-900">{project.funderCount}</span>
                    </div>
                  </div>
                </div>

                {/* WO-75: Transaction History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Recent Funders</h3>
                  
                  {fundingHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No funders yet. Be the first!
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {fundingHistory.slice(0, 10).map((funding: any) => (
                        <div key={funding.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-gray-900">
                                {funding.funder.username}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(funding.contributedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-green-600">
                              ${funding.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Security Badge */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <span>🔒</span> Secure Escrow
                  </h4>
                  <p className="text-xs text-blue-800">
                    Your funds are held in a Solana smart contract escrow and released only upon verified milestone completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </WalletModalProvider>
    </WalletProvider>
  );
}

