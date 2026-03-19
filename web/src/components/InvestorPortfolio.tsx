import React, { useState, useEffect } from 'react';
import { getPortfolio, getReturns, Portfolio, Returns } from '../api';

interface InvestorPortfolioProps {
  wallet: string;
}

const InvestorPortfolio: React.FC<InvestorPortfolioProps> = ({ wallet }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [returnsData, setReturnsData] = useState<Returns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [p, r] = await Promise.all([
          getPortfolio(wallet),
          getReturns(wallet)
        ]);
        setPortfolio(p);
        setReturnsData(r);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [wallet]);

  if (loading) {
    return <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>Loading portfolio...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>;
  }

  const totalSOL = portfolio ? (portfolio.total_invested / 1e9).toFixed(2) : '0';
  const estimatedSOL = returnsData ? (returnsData.estimated / 1e9).toFixed(2) : '0';
  const realizedSOL = returnsData ? (returnsData.realized / 1e9).toFixed(2) : '0';

  return (
    <div style={{ backgroundColor: '#1e1e1e', padding: '32px', borderRadius: '12px', border: '1px solid #333' }}>
      <h3 style={{ margin: '0 0 32px 0', fontSize: '1.8em', color: '#fff' }}>My Portfolio</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <h4 style={{ margin: '0 0 20px 0', color: '#e5e7eb' }}>Funded Projects</h4>
          {portfolio?.projects && portfolio.projects.length > 0 ? (
            portfolio.projects.map((proj) => (
              <div key={proj.project_id} style={{ 
                padding: '16px', 
                marginBottom: '12px', 
                backgroundColor: '#2a2a2a', 
                borderRadius: '8px', 
                borderLeft: `4px solid ${proj.status === 'released' ? '#10b981' : proj.status === 'funded' ? '#3b82f6' : '#f59e0b'}` 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>Project {proj.project_id.slice(-8)}</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>{(proj.amount / 1e9).toFixed(4)} SOL</span>
                </div>
                <span style={{ fontSize: '0.9em', opacity: 0.8, color: proj.status === 'released' ? '#10b981' : '#f59e0b' }}>
                  {proj.status.toUpperCase()}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
              No investments yet. Browse projects and fund them!
            </div>
          )}
        </div>
        <div>
          <h4 style={{ margin: '0 0 20px 0', color: '#e5e7eb' }}>Returns Summary</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
              <span>Total Invested</span>
              <strong style={{ color: '#f59e0b' }}>{totalSOL} SOL</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
              <span>Estimated Returns</span>
              <strong style={{ color: '#10b981' }}>{estimatedSOL} SOL</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
              <span>Realized Returns</span>
              <strong style={{ color: '#3b82f6' }}>{realizedSOL} SOL</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorPortfolio;
