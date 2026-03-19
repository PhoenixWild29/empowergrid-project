import React, { useState } from 'react';
import ProjectList from './ProjectList';
import InvestorPortfolio from './InvestorPortfolio';

interface DashboardProps {
  walletPublicKey: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ walletPublicKey }) => {
  const [tab, setTab] = useState<'projects' | 'portfolio'>('projects');

  return (
    <div style={{ backgroundColor: '#121212', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setTab('projects')}
          style={{ 
            backgroundColor: tab === 'projects' ? '#1f1f1f' : 'transparent', 
            border: '1px solid #333', 
            color: 'white', 
            padding: '10px 20px', 
            cursor: 'pointer' 
          }}
        >
          Projects
        </button>
        {walletPublicKey && (
          <button 
            onClick={() => setTab('portfolio')}
            style={{ 
              backgroundColor: tab === 'portfolio' ? '#1f1f1f' : 'transparent', 
              border: '1px solid #333', 
              color: 'white', 
              padding: '10px 20px', 
              cursor: 'pointer' 
            }}
          >
            My Portfolio
          </button>
        )}
      </div>
      <div>
        {tab === 'projects' && <ProjectList walletPublicKey={walletPublicKey} />}
        {tab === 'portfolio' && walletPublicKey && <InvestorPortfolio wallet={walletPublicKey} />}
      </div>
    </div>
  );
};

export default Dashboard;
